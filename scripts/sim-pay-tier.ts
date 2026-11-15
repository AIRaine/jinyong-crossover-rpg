/**
 * 四檔課金難易度平衡模擬（無課／小／中／大）
 * - 控制變因：同一玩法風格（主線＋適度探索）
 * - 預算以「模擬儲值元寶上限」定義（並記錄約當 NT$）
 * - 有課採「便利優先」消費（月卡／香篆／通票／仙露／外觀 → 再抽卡）
 * - 指標：週目到達、步數、勝率、操作負擔、跳過操作比例、決策步
 *
 * 用法：npm run sim:pay-tier
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import {
  ENCOUNTER_EVENTS,
  MAIN_STORY_EVENTS,
  getMainEventForYear,
  getUnfinishedMainForYear,
  pickEncounter,
  pickRumors,
} from '../src/data/events.ts'
import {
  getLinkedLocations,
  getLocationById,
} from '../src/data/locations.ts'
import {
  MOCK_TOPUP_PACKS,
  MONTHLY_DAILY_AP,
  MONTHLY_DAILY_POTENTIAL,
  MONTHLY_DAILY_SILVER,
  MONTHLY_DAILY_YUANBAO,
  SILVER_SHOP,
  YUANBAO_SHOP,
} from '../src/data/shop.ts'
import { makeMaterial, MATERIAL_IDS } from '../src/data/alchemy.ts'
import { createItemFromCatalog } from '../src/data/npcs.ts'
import { MARTIAL_ARTS, trainPotentialCost } from '../src/data/martialArts.ts'
import { applyRewards } from '../src/lib/applyRewards.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import {
  applyBanditFightStartCost,
  banditWinRewards,
  getBanditStartBlock,
} from '../src/lib/banditEncounterRules.ts'
import {
  makeBanditEncounter,
  performPlayerAction,
  type CombatActionKind,
  type CombatState,
} from '../src/lib/combatEngine.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import { pullMany, GACHA_SINGLE_COST, GACHA_TEN_COST } from '../src/lib/gachaEngine.ts'
import { applyNewGamePlus, canSettleNgPlus } from '../src/lib/ngPlus.ts'
import { flavorEventForNgPlus, NG_PLUS_ENCOUNTERS } from '../src/lib/ngPlusStory.ts'
import { applyNightTravelApRestore } from '../src/lib/travelApRules.ts'
import type { GameState, InventoryItem, OwnedEquipment } from '../src/types/game.ts'

const OUT_JSON =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/pay-tier-sim-result.json'

type PayTier = '無課' | '小額' | '中額' | '大額'

/** 預算定義（儲值元寶上限；約當標示價加總，不扣款） */
const TIER_BUDGET: Record<
  PayTier,
  { yuanbaoCap: number; approxTwd: number; note: string }
> = {
  無課: { yuanbaoCap: 0, approxTwd: 0, note: '不模擬儲值；僅開局／獎勵元寶' },
  小額: {
    yuanbaoCap: 300,
    approxTwd: 150,
    note: '≈1×一匣元寶（NT$150）',
  },
  中額: {
    yuanbaoCap: 980,
    approxTwd: 470,
    note: '≈1×體驗月卡包 + 1×一匣（NT$320+150）',
  },
  大額: {
    yuanbaoCap: 2720,
    approxTwd: 1260,
    note: '≈3×月卡包 + 2×一匣（NT$320×3+150×2）',
  },
}

const RUNS_PER_TIER = 48
const MAX_STEPS = 360
const ORIGIN_ID = 'cat_tech'

type OpKind =
  | 'grind' // 肝：採集、推旬回 AP、銀兩回氣等
  | 'skip' // 課金跳過：香篆／仙露／通票／月卡領取等
  | 'decision' // 仍需決策：事件選項、戰鬥、結算 NG+、門派等
  | 'other'

type Counters = {
  grind: number
  skip: number
  decision: number
  other: number
  topupYuanbao: number
  yuanbaoSpent: number
  combatWins: number
  combatLosses: number
  eventChoices: number
  monthlyClaims: number
  gachaPulls: number
  convenienceBuys: number
  cosmeticBuys: number
  charmBuys: number
  travelPassUses: number
}

type RunResult = {
  tier: PayTier
  seed: number
  steps: number
  cyclesCompleted: number
  cycleSteps: number[]
  combatWinRate: number | null
  grind: number
  skip: number
  decision: number
  skipRatio: number
  decisionShare: number
  topupYuanbao: number
  yuanbaoSpent: number
  eventChoices: number
  monthlyClaims: number
  gachaPulls: number
  convenienceBuys: number
  cosmeticBuys: number
  charmBuys: number
  paidAtkEnd: number
  stillNeedsDecisions: boolean
  canInstantClear: boolean
  crashed: boolean
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

function mergeItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const next = inventory.map((i) => ({ ...i }))
  const found = next.find((i) => i.id === item.id)
  if (found) found.quantity += item.quantity
  else next.push(item)
  return next
}

function emptyCounters(): Counters {
  return {
    grind: 0,
    skip: 0,
    decision: 0,
    other: 0,
    topupYuanbao: 0,
    yuanbaoSpent: 0,
    combatWins: 0,
    combatLosses: 0,
    eventChoices: 0,
    monthlyClaims: 0,
    gachaPulls: 0,
    convenienceBuys: 0,
    cosmeticBuys: 0,
    charmBuys: 0,
    travelPassUses: 0,
  }
}

function bump(c: Counters, kind: OpKind) {
  c[kind]++
}

function applyOrigin(state: GameState): GameState {
  const cat = ORIGINS.find((o) => o.id === ORIGIN_ID) ?? ORIGINS[0]
  const bonuses = cat.bonuses
  const stats = { ...state.stats }
  if (bonuses.maxHp) {
    stats.maxHp += bonuses.maxHp
    stats.hp += bonuses.maxHp
  }
  if (bonuses.maxStamina) {
    stats.maxStamina += bonuses.maxStamina
    stats.stamina = Math.min(
      stats.maxStamina,
      stats.stamina + Math.floor(bonuses.maxStamina / 2),
    )
  }
  if (bonuses.attack) stats.attack += bonuses.attack
  if (bonuses.defense) stats.defense += bonuses.defense
  if (bonuses.maxInternalForce) {
    stats.maxInternalForce += bonuses.maxInternalForce
    stats.internalForce += Math.floor(bonuses.maxInternalForce / 2)
  }
  const techTree = { ...state.techTree }
  for (const t of cat.startingTechIds) techTree[t] = 1
  let inventory = state.inventory.map((i) => ({ ...i }))
  for (const id of cat.startingItemIds) {
    const item = createItemFromCatalog(id, 1)
    if (item) inventory = mergeItem(inventory, item)
  }
  return {
    ...state,
    playerName: '課金測',
    playerGender: 'unspecified',
    originChosen: true,
    originId: cat.id,
    originJobTitle: cat.defaultJobTitle,
    stats,
    techTree,
    inventory,
    inspiration: state.inspiration + (bonuses.inspiration ?? 0),
    currency: {
      ...state.currency,
      silver: state.currency.silver + (bonuses.silver ?? 0),
    },
    comprehension: Math.min(99, state.comprehension + (cat.comprehensionBonus ?? 0)),
    rootBone: Math.min(99, state.rootBone + (cat.rootBoneBonus ?? 0)),
    activeEventId: 'event_prologue_rain_temple',
  }
}

function applyPrologue(state: GameState, rng: () => number): GameState {
  const prologue = getPrologueEvent()
  const choice = pick(rng, prologue.choices)
  const { state: rewarded } = applyRewards(state, {
    ...choice.rewards,
    inspiration: (choice.rewards.inspiration ?? 0) + 4,
    potential: (choice.rewards.potential ?? 0) + 8,
  })
  const known = new Set([
    ...rewarded.knownLocationIds,
    'loc_broken_temple',
    'loc_xiangyang',
  ])
  return grantStarterGear({
    ...rewarded,
    prologueDone: true,
    activeEventId: null,
    completedEvents: rewarded.completedEvents.includes(prologue.id)
      ? rewarded.completedEvents
      : [...rewarded.completedEvents, prologue.id],
    lastOutcomeText: choice.outcomeText,
    locationId: 'loc_broken_temple',
    locationName: '雨夜破廟',
    knownLocationIds: [...known],
    time: { ...rewarded.time, period: 'dawn' },
  })
}

function runCombat(
  encounter: CombatState,
  rng: () => number,
): CombatState {
  let combat = encounter
  const actions: CombatActionKind[] = [
    'attack',
    'skill',
    'tactic_flash',
    'tactic_aid',
    'defend',
  ]
  let guard = 0
  while (!combat.finished && guard < 80) {
    guard++
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    combat = performPlayerAction(combat, pick(rng, actions), target)
  }
  return combat
}

function applyCombatRewards(state: GameState, combat: CombatState): GameState {
  if (!combat.finished) return state
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    const reward = banditWinRewards(state.banditFightsThisXun)
    return {
      ...state,
      combatLoseStreak: 0,
      stats: {
        ...state.stats,
        hp: Math.max(1, Math.min(state.stats.maxHp, hp)),
      },
      currency: {
        ...state.currency,
        silver: state.currency.silver + reward.silver,
      },
      potential: state.potential + reward.potential,
    }
  }
  const streak = state.combatLoseStreak + 1
  const hpRatio = streak >= 3 ? 0.7 : streak === 2 ? 0.55 : 0.4
  return {
    ...state,
    combatLoseStreak: streak,
    stats: {
      ...state.stats,
      hp: Math.max(1, Math.floor(state.stats.maxHp * hpRatio)),
      stamina: Math.min(
        state.stats.maxStamina,
        state.stats.stamina + (streak >= 2 ? 12 : 6),
      ),
    },
  }
}

function stepTravel(state: GameState, rng: () => number, c: Counters): GameState {
  const links = getLinkedLocations(state.locationId)
  if (!links.length) {
    bump(c, 'other')
    return state
  }
  const target = pick(rng, links)
  const usePass = state.travelPassCharges > 0
  const cost = usePass
    ? Math.max(1, Math.ceil(target.travelStamina / 2))
    : target.travelStamina
  if (state.stats.stamina < cost) {
    bump(c, 'grind')
    return {
      ...state,
      stats: {
        ...state.stats,
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 20),
      },
    }
  }
  if (usePass) {
    c.travelPassUses++
    bump(c, 'skip')
  } else bump(c, 'grind')
  const known = new Set(state.knownLocationIds)
  known.add(target.id)
  for (const l of target.links) known.add(l)
  const nextPeriod =
    state.time.period === 'dawn'
      ? 'noon'
      : state.time.period === 'noon'
        ? 'dusk'
        : state.time.period === 'dusk'
          ? 'night'
          : 'dawn'
  const nextDay = state.time.period === 'night' ? state.time.day + 1 : state.time.day
  const fromNight = state.time.period === 'night'
  return {
    ...state,
    locationId: target.id,
    locationName: target.name,
    knownLocationIds: [...known],
    travelPassCharges: usePass
      ? Math.max(0, state.travelPassCharges - 1)
      : state.travelPassCharges,
    stats: { ...state.stats, stamina: state.stats.stamina - cost },
    time: { ...state.time, period: nextPeriod, day: nextDay },
    actionPoints: fromNight
      ? applyNightTravelApRestore(state.actionPoints, state.maxActionPoints)
      : state.actionPoints,
  }
}

function stepGather(state: GameState, rng: () => number, c: Counters): GameState {
  const loc = getLocationById(state.locationId)
  if (!loc || loc.gather === 'none' || state.actionPoints < 1) {
    bump(c, 'other')
    return state
  }
  bump(c, 'grind')
  const kind = loc.gather === 'both' ? (rng() < 0.5 ? 'herb' : 'ore') : loc.gather
  const mat = makeMaterial(
    kind === 'herb' ? MATERIAL_IDS.herb : MATERIAL_IDS.ore,
    1 + Math.floor(rng() * 2),
  )
  if (!mat) return state
  return {
    ...state,
    actionPoints: state.actionPoints - 1,
    inventory: mergeItem(state.inventory, mat),
  }
}

function stepAdvanceXun(state: GameState, rng: () => number, c: Counters): GameState {
  bump(c, 'grind')
  let xun = state.time.xun + 1
  let month = state.time.month
  let year = state.time.year
  let day = state.time.day + 10
  if (xun > 2) {
    xun = 0
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  const tradeSilver = 5 + state.tradeRouteLevel * 8
  let pendingEventId = state.pendingEventId
  const storyFlags = { ...state.storyFlags }
  const yearMain = getMainEventForYear(year)
  if (
    year < 5 &&
    yearMain &&
    storyFlags[yearMain.id] &&
    !getUnfinishedMainForYear(year, storyFlags)
  ) {
    year += 1
    month = 1
    xun = 0
    day = Math.max(day, (year - 1) * 360 + 1)
  }
  const unfinishedMain = getUnfinishedMainForYear(year, storyFlags)
  if (unfinishedMain && !pendingEventId) {
    pendingEventId = unfinishedMain.id
  } else if (!pendingEventId && rng() < 0.5) {
    pendingEventId = pickEncounter(
      year * 30 + month * 3 + xun + state.ngPlusCount * 17,
      state.knownLocationIds,
      {
        currentLocationId: state.locationId,
        ngPlusCount: state.ngPlusCount,
      },
    ).id
  }
  return {
    ...state,
    actionPoints: Math.min(state.maxActionPoints, state.actionPoints + 1),
    time: { ...state.time, xun, month, year, day, period: 'noon' },
    currency: {
      ...state.currency,
      silver: state.currency.silver + tradeSilver,
    },
    rumors: pickRumors(year * 100 + month * 10 + xun, 3),
    pendingEventId,
    storyFlags,
    combatLoseStreak: 0,
    banditFightsThisXun: 0,
    sparFightsThisXun: 0,
  }
}

function stepResolveEvent(
  state: GameState,
  rng: () => number,
  c: Counters,
): GameState {
  const eventId = state.pendingEventId
  if (!eventId) {
    bump(c, 'other')
    return state
  }
  const raw =
    MAIN_STORY_EVENTS.find((e) => e.id === eventId) ??
    ENCOUNTER_EVENTS.find((e) => e.id === eventId) ??
    NG_PLUS_ENCOUNTERS.find((e) => e.id === eventId)
  if (!raw || !raw.choices.length) {
    bump(c, 'decision')
    return { ...state, pendingEventId: null }
  }
  bump(c, 'decision')
  c.eventChoices++
  const def = flavorEventForNgPlus(raw, state.ngPlusCount)
  const choice = pick(rng, def.choices)
  const { state: rewarded } = applyRewards(state, choice.rewards)
  const storyFlags = { ...rewarded.storyFlags, [eventId]: true }
  const mainDone = [
    'main_y1_xiangyang',
    'main_y2_huashan',
    'main_y3_tomb',
    'main_y4_xuanmu',
    'main_y5_wharf',
  ].every((k) => storyFlags[k])
  let time = { ...rewarded.time }
  if (eventId.startsWith('main_y') && !eventId.startsWith('main_y5') && time.year < 5) {
    time = { ...time, year: Math.min(5, time.year + 1), month: 1, xun: 0 }
  }
  let next: GameState = {
    ...rewarded,
    time,
    pendingEventId: null,
    storyFlags,
    lastOutcomeText: choice.outcomeText,
    tradeRouteLevel: rewarded.tradeRouteLevel + (choice.tradeBump ?? 0),
    ngPlusReady: rewarded.ngPlusReady || mainDone,
  }
  if (choice.startCombat) {
    const enc = makeBanditEncounter(
      buildPlayerCombatant(next),
      buildPartyCombatants(next),
      { loseStreak: next.combatLoseStreak, year: next.time.year },
    )
    const combat = runCombat(enc, rng)
    if (combat.finished) {
      if (combat.victory) c.combatWins++
      else c.combatLosses++
    }
    next = applyCombatRewards(next, combat)
  }
  return next
}

function stepBandit(state: GameState, rng: () => number, c: Counters): GameState {
  const block = getBanditStartBlock(state)
  if (block) {
    bump(c, 'grind')
    return {
      ...state,
      combatLoseStreak: block === 'lose_streak' ? 0 : state.combatLoseStreak,
      actionPoints:
        block === 'no_ap'
          ? Math.min(state.maxActionPoints, state.actionPoints + 1)
          : state.actionPoints,
      stats: {
        ...state.stats,
        hp: Math.min(state.stats.maxHp, state.stats.hp + Math.floor(state.stats.maxHp * 0.2)),
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 12),
      },
    }
  }
  bump(c, 'decision')
  let next = applyBanditFightStartCost(state)
  const enc = makeBanditEncounter(
    buildPlayerCombatant(next),
    buildPartyCombatants(next),
    { loseStreak: next.combatLoseStreak, year: next.time.year },
  )
  const combat = runCombat(enc, rng)
  if (combat.finished) {
    if (combat.victory) c.combatWins++
    else c.combatLosses++
  }
  return applyCombatRewards(next, combat)
}

function stepTrain(state: GameState, rng: () => number, c: Counters): GameState {
  const known = MARTIAL_ARTS.filter((m) => (state.martialProgress[m.id] ?? 0) > 0)
  if (!known.length || state.potential < 2) {
    bump(c, 'other')
    return state
  }
  const art = pick(rng, known)
  const lv = state.martialProgress[art.id] ?? 1
  if (lv >= 10) {
    bump(c, 'other')
    return state
  }
  const cost = trainPotentialCost(lv)
  if (state.potential < cost) {
    bump(c, 'other')
    return state
  }
  bump(c, 'grind')
  return {
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: lv + 1 },
  }
}

function tryTopUp(
  state: GameState,
  tier: PayTier,
  c: Counters,
  preferMonthPack: boolean,
): GameState {
  const cap = TIER_BUDGET[tier].yuanbaoCap
  const remain = cap - c.topupYuanbao
  if (remain <= 0) return state
  const packs = [...MOCK_TOPUP_PACKS].sort((a, b) => b.yuanbao - a.yuanbao)
  let pack = packs.find((p) => p.yuanbao <= remain)
  if (preferMonthPack) {
    const month = MOCK_TOPUP_PACKS.find((p) => p.id === 'topup_month')
    if (month && month.yuanbao <= remain) pack = month
  }
  if (!pack) {
    const tiny = MOCK_TOPUP_PACKS.find((p) => p.id === 'topup_tiny')
    if (tiny && tiny.yuanbao <= remain) pack = tiny
  }
  if (!pack) return state
  c.topupYuanbao += pack.yuanbao
  bump(c, 'other')
  return {
    ...state,
    currency: {
      ...state.currency,
      yuanbao: state.currency.yuanbao + pack.yuanbao,
    },
    flags: { ...state.flags, usedMockTopUp: true },
  }
}

function claimMonthlyIfDue(state: GameState, c: Counters): GameState {
  if (state.monthlyCardCharges <= 0) return state
  const key = `${state.time.year}-${state.time.month}-${state.time.xun}`
  if (state.monthlyClaimedXunKey === key) return state
  // 月卡例行領取：計入 skip 但不納入「跳過肝」比例（見 summarize）
  bump(c, 'skip')
  c.monthlyClaims++
  return {
    ...state,
    monthlyCardCharges: state.monthlyCardCharges - 1,
    monthlyClaimedXunKey: key,
    potential: state.potential + MONTHLY_DAILY_POTENTIAL,
    actionPoints: Math.min(
      state.maxActionPoints,
      state.actionPoints + MONTHLY_DAILY_AP,
    ),
    currency: {
      silver: state.currency.silver + MONTHLY_DAILY_SILVER,
      yuanbao: state.currency.yuanbao + MONTHLY_DAILY_YUANBAO,
    },
  }
}

function buyOffer(
  state: GameState,
  offerId: string,
  c: Counters,
): GameState | null {
  const offer = YUANBAO_SHOP.find((o) => o.id === offerId)
  if (!offer || state.currency.yuanbao < offer.priceYuanbao) return null
  let next: GameState = {
    ...state,
    currency: {
      ...state.currency,
      yuanbao: state.currency.yuanbao - offer.priceYuanbao,
    },
  }
  c.yuanbaoSpent += offer.priceYuanbao
  if (offer.kind === 'monthly') {
    next = { ...next, monthlyCardCharges: next.monthlyCardCharges + 30 }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_convenience_kit') {
    const half = Math.max(1, Math.floor(next.stats.maxStamina / 2))
    next = {
      ...next,
      actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 3),
      travelPassCharges: next.travelPassCharges + 2,
      stats: {
        ...next.stats,
        stamina: Math.min(next.stats.maxStamina, next.stats.stamina + half),
      },
    }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_potential_pack') {
    next = { ...next, potential: next.potential + 18 }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_stamina_elixir') {
    next = { ...next, stats: { ...next.stats, stamina: next.stats.maxStamina } }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_ap_incense') {
    next = {
      ...next,
      actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 4),
    }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_travel_pass') {
    next = { ...next, travelPassCharges: next.travelPassCharges + 8 }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.id === 'shop_combat_charm') {
    if (next.paidAtkBonus >= 6 && next.paidDefBonus >= 6) return null
    next = {
      ...next,
      paidAtkBonus: Math.min(6, next.paidAtkBonus + 1),
      paidDefBonus: Math.min(6, next.paidDefBonus + 1),
    }
    bump(c, 'other')
    c.charmBuys++
  } else if (offer.id === 'shop_exp_charm') {
    next = {
      ...next,
      comprehension: Math.min(99, next.comprehension + 3),
    }
    bump(c, 'skip')
    c.convenienceBuys++
  } else if (offer.kind === 'cosmetic') {
    const id = 'cosmetic_rain_temple'
    next = {
      ...next,
      cosmetics: next.cosmetics.includes(id)
        ? next.cosmetics
        : [...next.cosmetics, id],
    }
    bump(c, 'other')
    c.cosmeticBuys++
  } else {
    bump(c, 'other')
  }
  return next
}

function doGacha(state: GameState, ten: boolean, c: Counters): GameState | null {
  const cost = ten ? GACHA_TEN_COST : GACHA_SINGLE_COST
  if (state.currency.yuanbao < cost) return null
  const pulled = pullMany(ten ? 10 : 1, {
    year: state.time.year,
    pityEpic: state.gachaPityEpic,
    pityLegendary: state.gachaPityLegendary,
  })
  let seq = state.equipUidSeq
  const owned: OwnedEquipment[] = [...state.ownedEquipment]
  for (const r of pulled.results) {
    if (!r.item?.id) continue
    owned.push({
      uid: `eq_${seq++}`,
      defId: r.item.id,
      refineLevel: 0,
      quenched: false,
      poisoned: false,
    })
  }
  bump(c, 'other')
  c.gachaPulls += ten ? 10 : 1
  c.yuanbaoSpent += cost
  return {
    ...state,
    currency: {
      ...state.currency,
      yuanbao: state.currency.yuanbao - cost,
    },
    ownedEquipment: owned,
    equipUidSeq: seq,
    gachaPityEpic: pulled.pityEpic,
    gachaPityLegendary: pulled.pityLegendary,
    gachaTotalPulls: state.gachaTotalPulls + (ten ? 10 : 1),
  }
}

/** 便利優先的課金消費節奏（依檔位） */
function stepPaidEconomy(
  state: GameState,
  tier: PayTier,
  rng: () => number,
  c: Counters,
): GameState {
  let s = state

  // 先領月卡（若有）
  s = claimMonthlyIfDue(s, c)

  // 補儲值至預算
  if (c.topupYuanbao < TIER_BUDGET[tier].yuanbaoCap) {
    const needMonth =
      tier !== '無課' &&
      s.monthlyCardCharges < 5 &&
      (tier === '中額' || tier === '大額')
    s = tryTopUp(s, tier, c, needMonth)
    return s
  }

  // 小額：外觀 → 便利錦囊 → 香篆／仙露
  if (tier === '小額') {
    if (!s.cosmetics.includes('cosmetic_rain_temple')) {
      const n = buyOffer(s, 'shop_title_frame', c)
      if (n) return n
    }
    if (c.convenienceBuys < 2) {
      const n = buyOffer(s, 'shop_convenience_kit', c)
      if (n) return n
    }
    if (s.actionPoints <= 2) {
      const n = buyOffer(s, 'shop_ap_incense', c)
      if (n) return n
    }
    if (s.stats.stamina < 20) {
      const n = buyOffer(s, 'shop_stamina_elixir', c)
      if (n) return n
    }
    // 餘額偶發單抽（體感保底進度）
    if (s.currency.yuanbao >= GACHA_SINGLE_COST && rng() < 0.2) {
      const n = doGacha(s, false, c)
      if (n) return n
    }
    bump(c, 'other')
    return s
  }

  // 中額：月卡 → 錦囊／便利 → 少量抽卡
  if (tier === '中額') {
    if (s.monthlyCardCharges < 10) {
      const n = buyOffer(s, 'shop_monthly_pass', c)
      if (n) return n
    }
    if (!s.cosmetics.includes('cosmetic_rain_temple')) {
      const n = buyOffer(s, 'shop_title_frame', c)
      if (n) return n
    }
    if (c.convenienceBuys < 3) {
      const n = buyOffer(s, 'shop_convenience_kit', c)
      if (n) return n
    }
    if (s.actionPoints <= 3) {
      const n = buyOffer(s, 'shop_ap_incense', c)
      if (n) return n
    }
    if (s.stats.stamina < 25) {
      const n = buyOffer(s, 'shop_stamina_elixir', c)
      if (n) return n
    }
    if (s.travelPassCharges < 3) {
      const n = buyOffer(s, 'shop_travel_pass', c)
      if (n) return n
    }
    if (s.potential < 10 && rng() < 0.35) {
      const n = buyOffer(s, 'shop_potential_pack', c)
      if (n) return n
    }
    if (s.currency.yuanbao >= GACHA_TEN_COST && rng() < 0.28) {
      const n = doGacha(s, true, c)
      if (n) return n
    }
    if (s.currency.yuanbao >= GACHA_SINGLE_COST && rng() < 0.3) {
      const n = doGacha(s, false, c)
      if (n) return n
    }
    bump(c, 'other')
    return s
  }

  // 大額：月卡堆叠 → 便利拉滿 → 護身符至軟上限 → 抽卡體感；不跳過主線決策
  if (s.monthlyCardCharges < 25) {
    const n = buyOffer(s, 'shop_monthly_pass', c)
    if (n) return n
  }
  if (!s.cosmetics.includes('cosmetic_rain_temple')) {
    const n = buyOffer(s, 'shop_title_frame', c)
    if (n) return n
  }
  if (c.convenienceBuys < 5) {
    const n = buyOffer(s, 'shop_convenience_kit', c)
    if (n) return n
  }
  if (s.actionPoints < s.maxActionPoints - 1) {
    const n = buyOffer(s, 'shop_ap_incense', c)
    if (n) return n
  }
  if (s.stats.stamina < s.stats.maxStamina * 0.6) {
    const n = buyOffer(s, 'shop_stamina_elixir', c)
    if (n) return n
  }
  if (s.travelPassCharges < 8) {
    const n = buyOffer(s, 'shop_travel_pass', c)
    if (n) return n
  }
  if (s.paidAtkBonus < 6 && rng() < 0.45) {
    const n = buyOffer(s, 'shop_combat_charm', c)
    if (n) return n
  }
  if (s.potential < 20 && rng() < 0.5) {
    const n = buyOffer(s, 'shop_potential_pack', c)
    if (n) return n
  }
  if (s.comprehension < 40 && rng() < 0.35) {
    const n = buyOffer(s, 'shop_exp_charm', c)
    if (n) return n
  }
  if (s.currency.yuanbao >= GACHA_TEN_COST) {
    const n = doGacha(s, true, c)
    if (n) return n
  }
  if (s.currency.yuanbao >= GACHA_SINGLE_COST) {
    const n = doGacha(s, false, c)
    if (n) return n
  }
  bump(c, 'other')
  return s
}

function stepSilverSoup(state: GameState, c: Counters): GameState {
  const offer = SILVER_SHOP.find((o) => o.id === 'shop_stamina_soup')
  if (!offer) return state
  const price = offer.priceSilver ?? 30
  if (state.currency.silver < price) {
    bump(c, 'other')
    return state
  }
  bump(c, 'grind')
  return {
    ...state,
    currency: {
      ...state.currency,
      silver: state.currency.silver - price,
    },
    stats: {
      ...state.stats,
      stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 25),
    },
  }
}

function mainYearKey(year: 1 | 2 | 3 | 4 | 5): string {
  return (
    {
      1: 'main_y1_xiangyang',
      2: 'main_y2_huashan',
      3: 'main_y3_tomb',
      4: 'main_y4_xuanmu',
      5: 'main_y5_wharf',
    } as const
  )[year]
}

function runOne(tier: PayTier, seed: number): RunResult {
  const rng = mulberry32(seed)
  const c = emptyCounters()
  let state = applyPrologue(applyOrigin(createInitialGameState()), rng)
  let steps = 0
  let crashed = false
  const cycleSteps: number[] = []
  let cyclesCompleted = 0
  let cycleStart = 0

  try {
    // 開局前載入預算內便利（避免購物步數排擠主線造成「課金更慢」假象）
    if (tier !== '無課') {
      for (let i = 0; i < 16; i++) {
        const before = c.topupYuanbao + c.yuanbaoSpent + c.convenienceBuys
        state = stepPaidEconomy(state, tier, rng, c)
        const after = c.topupYuanbao + c.yuanbaoSpent + c.convenienceBuys
        if (after === before && c.topupYuanbao >= TIER_BUDGET[tier].yuanbaoCap) break
      }
    }

    while (steps < MAX_STEPS && cyclesCompleted < 3) {
      steps++
      // 有課：低頻補便利（大額略勤，但不淹沒主線）
      const economyChance =
        tier === '無課' ? 0 : tier === '小額' ? 0.06 : tier === '中額' ? 0.1 : 0.14
      if (tier !== '無課' && rng() < economyChance) {
        state = stepPaidEconomy(state, tier, rng, c)
      } else if (state.pendingEventId) {
        state = stepResolveEvent(state, rng, c)
      } else if (canSettleNgPlus(state) && state.storyFlags['main_y5_wharf']) {
        bump(c, 'decision')
        cycleSteps.push(steps - cycleStart)
        cyclesCompleted++
        if (cyclesCompleted >= 3) break
        state = applyNewGamePlus(state)
        cycleStart = steps
      } else {
        // 主線節奏：優先推旬／旅行；間雜採集與少量戰鬥
        const roll = rng()
        if (roll < 0.42) state = stepAdvanceXun(state, rng, c)
        else if (roll < 0.62) state = stepTravel(state, rng, c)
        else if (roll < 0.74) state = stepGather(state, rng, c)
        else if (roll < 0.84) state = stepBandit(state, rng, c)
        else if (roll < 0.9) state = stepTrain(state, rng, c)
        else if (roll < 0.95 && state.stats.stamina < 30) state = stepSilverSoup(state, c)
        else if (tier !== '無課') state = stepPaidEconomy(state, tier, rng, c)
        else {
          bump(c, 'grind')
          state = stepAdvanceXun(state, rng, c)
        }
      }

      // 中／大額：推旬後嘗試領月卡
      if (tier === '中額' || tier === '大額') {
        state = claimMonthlyIfDue(state, c)
      }

      if (state.stats.hp <= 0) {
        state = {
          ...state,
          stats: { ...state.stats, hp: Math.max(1, Math.floor(state.stats.maxHp * 0.4)) },
        }
      }
    }
  } catch {
    crashed = true
  }

  const fights = c.combatWins + c.combatLosses
  const totalOps = c.grind + c.skip + c.decision + c.other || 1
  // 跳過肝比例：扣除月卡例行領取（那是登入獎勵，不是「跳過玩法」）
  const convenienceSkip = Math.max(0, c.skip - c.monthlyClaims)
  const skipDenom = c.grind + convenienceSkip || 1
  return {
    tier,
    seed,
    steps,
    cyclesCompleted,
    cycleSteps,
    combatWinRate: fights ? Math.round((c.combatWins / fights) * 1000) / 10 : null,
    grind: c.grind,
    skip: c.skip,
    decision: c.decision,
    skipRatio: Math.round((convenienceSkip / skipDenom) * 1000) / 10,
    decisionShare: Math.round((c.decision / totalOps) * 1000) / 10,
    topupYuanbao: c.topupYuanbao,
    yuanbaoSpent: c.yuanbaoSpent,
    eventChoices: c.eventChoices,
    monthlyClaims: c.monthlyClaims,
    gachaPulls: c.gachaPulls,
    convenienceBuys: c.convenienceBuys,
    cosmeticBuys: c.cosmeticBuys,
    charmBuys: c.charmBuys,
    paidAtkEnd: state.paidAtkBonus,
    stillNeedsDecisions: c.eventChoices >= 5 && c.decision >= 8,
    canInstantClear: cyclesCompleted >= 1 && steps <= 15 && c.decision < 5,
    crashed,
  }
}

/** 刻意刁難／操作劇本：驗證大課不能秒破、無課可通關 */
function scriptedPath(tier: PayTier): Record<string, number | boolean | string> {
  const rng = mulberry32(tier === '無課' ? 11 : tier === '小額' ? 22 : tier === '中額' ? 33 : 44)
  const c = emptyCounters()
  let state = applyPrologue(applyOrigin(createInitialGameState()), rng)
  const log: string[] = []
  const act = (name: string, fn: () => void) => {
    fn()
    log.push(name)
  }

  // 開場儲值至預算
  while (c.topupYuanbao < TIER_BUDGET[tier].yuanbaoCap) {
    act('topup', () => {
      state = tryTopUp(state, tier, c, tier === '中額' || tier === '大額')
    })
    if (log.filter((x) => x === 'topup').length > 12) break
  }

  if (tier !== '無課') {
    if (tier === '小額' || tier === '中額' || tier === '大額') {
      act('cosmetic', () => {
        const n = buyOffer(state, 'shop_title_frame', c)
        if (n) state = n
      })
      act('kit', () => {
        const n = buyOffer(state, 'shop_convenience_kit', c)
        if (n) state = n
      })
    }
    if (tier === '中額' || tier === '大額') {
      act('monthly', () => {
        const n = buyOffer(state, 'shop_monthly_pass', c)
        if (n) state = n
      })
    }
    if (tier === '大額') {
      for (let i = 0; i < 6; i++) {
        act('charm', () => {
          const n = buyOffer(state, 'shop_combat_charm', c)
          if (n) state = n
        })
      }
      for (let i = 0; i < 4; i++) {
        act('ap', () => {
          const n = buyOffer(state, 'shop_ap_incense', c)
          if (n) state = n
        })
      }
      act('pass', () => {
        const n = buyOffer(state, 'shop_travel_pass', c)
        if (n) state = n
      })
      // 狂抽仍受年份封印
      for (let i = 0; i < 8; i++) {
        act('gacha10', () => {
          const n = doGacha(state, true, c)
          if (n) state = n
        })
      }
    }
  }

  // 主線：必須推旬＋解事件，無法用元寶跳過選項
  let guard = 0
  while (!state.storyFlags['main_y5_wharf'] && guard < 200) {
    guard++
    if (state.pendingEventId) {
      act('event', () => {
        state = stepResolveEvent(state, rng, c)
      })
    } else {
      act('xun', () => {
        state = stepAdvanceXun(state, rng, c)
      })
      if (tier === '中額' || tier === '大額') {
        state = claimMonthlyIfDue(state, c)
      }
    }
  }

  const fights = c.combatWins + c.combatLosses
  return {
    tier,
    ops: log.length,
    reachedEnding: !!state.storyFlags['main_y5_wharf'],
    ngPlusReady: canSettleNgPlus(state),
    eventChoices: c.eventChoices,
    decisionOps: c.decision,
    skipOps: c.skip,
    grindOps: c.grind,
    paidAtk: state.paidAtkBonus,
    gachaPulls: c.gachaPulls,
    topupYuanbao: c.topupYuanbao,
    combatWinRate: fights ? Math.round((c.combatWins / fights) * 1000) / 10 : null,
    // 大課秒破判定：結局到達且決策步極少
    instantClear: !!state.storyFlags['main_y5_wharf'] && c.eventChoices < 5,
    stillNeedsDecisions: c.eventChoices >= 5,
  }
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function median(nums: number[]): number | null {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10
}

function summarize(runs: RunResult[]) {
  const byTier: Record<string, unknown> = {}
  for (const tier of Object.keys(TIER_BUDGET) as PayTier[]) {
    const rs = runs.filter((r) => r.tier === tier)
    const c1 = rs.filter((r) => r.cyclesCompleted >= 1)
    const c2 = rs.filter((r) => r.cyclesCompleted >= 2)
    const c3 = rs.filter((r) => r.cyclesCompleted >= 3)
    byTier[tier] = {
      budget: TIER_BUDGET[tier],
      runs: rs.length,
      crash: rs.filter((r) => r.crashed).length,
      reach: {
        c1: Math.round((c1.length / rs.length) * 1000) / 10,
        c2: Math.round((c2.length / rs.length) * 1000) / 10,
        c3: Math.round((c3.length / rs.length) * 1000) / 10,
      },
      stepsToC1: {
        median: median(c1.map((r) => r.cycleSteps[0]).filter(Boolean)),
        avg: avg(c1.map((r) => r.cycleSteps[0]).filter(Boolean)),
      },
      stepsToC2: {
        median: median(c2.map((r) => r.cycleSteps[1]).filter(Boolean)),
        avg: avg(c2.map((r) => r.cycleSteps[1]).filter(Boolean)),
      },
      stepsToC3: {
        median: median(c3.map((r) => r.cycleSteps[2]).filter(Boolean)),
        avg: avg(c3.map((r) => r.cycleSteps[2]).filter(Boolean)),
      },
      combatWinRateAvg: avg(
        rs.map((r) => r.combatWinRate).filter((x): x is number => x != null),
      ),
      grindAvg: avg(rs.map((r) => r.grind)),
      skipAvg: avg(rs.map((r) => r.skip)),
      decisionAvg: avg(rs.map((r) => r.decision)),
      skipRatioAvg: avg(rs.map((r) => r.skipRatio)),
      decisionShareAvg: avg(rs.map((r) => r.decisionShare)),
      topupYuanbaoAvg: avg(rs.map((r) => r.topupYuanbao)),
      yuanbaoSpentAvg: avg(rs.map((r) => r.yuanbaoSpent)),
      eventChoicesAvg: avg(rs.map((r) => r.eventChoices)),
      monthlyClaimsAvg: avg(rs.map((r) => r.monthlyClaims)),
      gachaPullsAvg: avg(rs.map((r) => r.gachaPulls)),
      convenienceBuysAvg: avg(rs.map((r) => r.convenienceBuys)),
      cosmeticBuysAvg: avg(rs.map((r) => r.cosmeticBuys)),
      charmBuysAvg: avg(rs.map((r) => r.charmBuys)),
      paidAtkEndAvg: avg(rs.map((r) => r.paidAtkEnd)),
      stillNeedsDecisionsRate:
        Math.round(
          (rs.filter((r) => r.stillNeedsDecisions).length / rs.length) * 1000,
        ) / 10,
      instantClearRate:
        Math.round(
          (rs.filter((r) => r.canInstantClear).length / rs.length) * 1000,
        ) / 10,
    }
  }
  return byTier
}

function main() {
  const t0 = Date.now()
  const runs: RunResult[] = []
  const tiers = Object.keys(TIER_BUDGET) as PayTier[]
  for (const tier of tiers) {
    for (let i = 0; i < RUNS_PER_TIER; i++) {
      runs.push(runOne(tier, 1000 + tiers.indexOf(tier) * 1000 + i * 17))
    }
  }
  const scripted = tiers.map((t) => scriptedPath(t))
  const byTier = summarize(runs)

  // 平衡判定（對照設計目標）
  const f2p = byTier['無課'] as Record<string, any>
  const small = byTier['小額'] as Record<string, any>
  const mid = byTier['中額'] as Record<string, any>
  const large = byTier['大額'] as Record<string, any>

  const findings: { code: string; severity: 'ok' | 'warn' | 'fail'; msg: string }[] =
    []

  if ((f2p.reach?.c1 ?? 0) < 90) {
    findings.push({
      code: 'f2p_clear',
      severity: 'fail',
      msg: `無課一週目到達率 ${f2p.reach?.c1}% < 90%`,
    })
  } else {
    findings.push({
      code: 'f2p_clear',
      severity: 'ok',
      msg: `無課一週目到達率 ${f2p.reach?.c1}%（可通關）`,
    })
  }

  const f2pSteps = f2p.stepsToC1?.median ?? 0
  const largeSteps = large.stepsToC1?.median ?? 0
  const f2pGrind = f2p.grindAvg ?? 0
  const smallGrind = small.grindAvg ?? 0
  const midGrind = mid.grindAvg ?? 0
  const largeGrind = large.grindAvg ?? 0

  // 價值梯度看「肝操作」下降，而非總步數（購物／抽卡本身也是操作）
  if (f2pGrind > 0 && largeGrind > f2pGrind * 1.05) {
    findings.push({
      code: 'value_ladder_grind',
      severity: 'warn',
      msg: `大課肝操作 ${largeGrind} 反高於無課 ${f2pGrind}（便利未落地）`,
    })
  } else if (f2pGrind > 0 && largeGrind < f2pGrind * 0.4) {
    findings.push({
      code: 'value_ladder_grind',
      severity: 'fail',
      msg: `大課肝操作 ${largeGrind} < 無課 40%（過閒／偏無聊風險）`,
    })
  } else {
    findings.push({
      code: 'value_ladder_grind',
      severity: 'ok',
      msg: `肝操作 無 ${f2pGrind} → 小 ${smallGrind} → 中 ${midGrind} → 大 ${largeGrind}；一週目中位步 無 ${f2pSteps}／大 ${largeSteps}`,
    })
  }

  const skipL = large.skipRatioAvg ?? 0
  if (skipL > 50) {
    findings.push({
      code: 'skip_ratio',
      severity: 'fail',
      msg: `大課便利跳過肝比例 ${skipL}% 過高（肝太少／偏無聊）`,
    })
  } else if (skipL < 5 && (mid.skipRatioAvg ?? 0) < 3) {
    findings.push({
      code: 'skip_ratio',
      severity: 'warn',
      msg: `中／大課便利跳過比例過低（課金便利體感不足）`,
    })
  } else {
    findings.push({
      code: 'skip_ratio',
      severity: 'ok',
      msg: `便利跳過肝比例 無 ${f2p.skipRatioAvg}%／小 ${small.skipRatioAvg}%／中 ${mid.skipRatioAvg}%／大 ${skipL}%（已扣除月卡例行領取）`,
    })
  }

  if ((large.stillNeedsDecisionsRate ?? 0) < 85) {
    findings.push({
      code: 'decisions',
      severity: 'fail',
      msg: `大課仍需決策率 ${large.stillNeedsDecisionsRate}% 偏低`,
    })
  } else {
    findings.push({
      code: 'decisions',
      severity: 'ok',
      msg: `大課仍需決策率 ${large.stillNeedsDecisionsRate}%；秒破率 ${large.instantClearRate}%`,
    })
  }

  if ((large.instantClearRate ?? 0) > 5 || scripted.some((s) => s.instantClear === true)) {
    findings.push({
      code: 'no_instant',
      severity: 'fail',
      msg: '出現大課秒破結局（不應發生）',
    })
  } else {
    findings.push({
      code: 'no_instant',
      severity: 'ok',
      msg: '操作劇本與蒙特卡均無大課秒破',
    })
  }

  // 檔位差異：小 < 中 < 大 的便利跳過或月卡領取
  if (
    (small.skipRatioAvg ?? 0) >= (mid.skipRatioAvg ?? 0) &&
    (mid.monthlyClaimsAvg ?? 0) <= (small.monthlyClaimsAvg ?? 0)
  ) {
    findings.push({
      code: 'tier_diff',
      severity: 'warn',
      msg: '小／中檔便利差異不明顯',
    })
  } else {
    findings.push({
      code: 'tier_diff',
      severity: 'ok',
      msg: `月卡領取均次 小 ${small.monthlyClaimsAvg}／中 ${mid.monthlyClaimsAvg}／大 ${large.monthlyClaimsAvg}`,
    })
  }

  const fail = findings.filter((f) => f.severity === 'fail').length
  const warn = findings.filter((f) => f.severity === 'warn').length
  const verdict =
    fail > 0 ? 'imbalanced_fail' : warn > 0 ? 'imbalanced_warn' : 'balanced'

  const out = {
    meta: {
      date: new Date().toISOString(),
      runsPerTier: RUNS_PER_TIER,
      totalRuns: runs.length,
      elapsedMs: Date.now() - t0,
      style: '主線衝關＋適度探索（四檔相同）',
      originId: ORIGIN_ID,
      budgets: TIER_BUDGET,
      note:
        '便利跳過肝比例 = (skip−月卡領取)/(grind+該便利跳過)；決策占比 = decision/全部操作。月卡例行領取另列 monthlyClaims。',
    },
    verdict,
    findings,
    byTier,
    scripted,
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ verdict, findings, byTier, scripted }, null, 2))
  console.log(`\nWrote ${OUT_JSON}`)
}

main()
