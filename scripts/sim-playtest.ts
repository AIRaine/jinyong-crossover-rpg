/**
 * 百人百次無頭模擬試玩
 * 用法：npx --yes tsx scripts/sim-playtest.ts
 */
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
import { getEquipmentById, refineCostForLevel } from '../src/data/equipments.ts'
import {
  bottleneckSuccessChance,
  trainPotentialCost,
  MARTIAL_ARTS,
} from '../src/data/martialArts.ts'
import { TECH_NODES } from '../src/data/origins.ts'
import { ALCHEMY_RECIPES, makeMaterial, MATERIAL_IDS } from '../src/data/alchemy.ts'
import { SILVER_SHOP, MOCK_TOPUP_PACKS, YUANBAO_SHOP } from '../src/data/shop.ts'
import { SECTS } from '../src/data/sects.ts'
import { NPCS, createItemFromCatalog } from '../src/data/npcs.ts'
import { applyRewards } from '../src/lib/applyRewards.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import {
  makeBanditEncounter,
  makeSparEncounter,
  performPlayerAction,
  type CombatActionKind,
  type CombatState,
} from '../src/lib/combatEngine.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import { pullMany, GACHA_SINGLE_COST, GACHA_TEN_COST } from '../src/lib/gachaEngine.ts'
import { buildBoard } from '../src/data/leaderboard.ts'
import { applyNewGamePlus, canSettleNgPlus } from '../src/lib/ngPlus.ts'
import { migrateSaveData } from '../src/lib/saveManager.ts'
import { computePanelStats } from '../src/lib/combatStats.ts'
import type { GameState, InventoryItem, OwnedEquipment } from '../src/types/game.ts'
import { TECH_ID_POISON, TECH_ID_QUENCH } from '../src/types/game.ts'

// —— localStorage stub（migrate／存檔路徑）——
const mem = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v))
  },
  removeItem: (k) => {
    mem.delete(k)
  },
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}

type Severity = 'critical' | 'major' | 'minor'
type Finding = {
  severity: Severity
  code: string
  message: string
  runId?: number
  step?: number
}

type Coverage = Record<string, number>

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

function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function inspectState(
  state: GameState,
  findings: Finding[],
  runId: number,
  step: number,
): void {
  const push = (severity: Severity, code: string, message: string) => {
    findings.push({ severity, code, message, runId, step })
  }

  const nums: [string, number][] = [
    ['hp', state.stats.hp],
    ['maxHp', state.stats.maxHp],
    ['stamina', state.stats.stamina],
    ['maxStamina', state.stats.maxStamina],
    ['attack', state.stats.attack],
    ['defense', state.stats.defense],
    ['silver', state.currency.silver],
    ['yuanbao', state.currency.yuanbao],
    ['inspiration', state.inspiration],
    ['potential', state.potential],
    ['actionPoints', state.actionPoints],
    ['comprehension', state.comprehension],
    ['rootBone', state.rootBone],
  ]
  for (const [k, v] of nums) {
    if (!isFiniteNum(v)) push('critical', 'nan_stat', `${k}=${String(v)}`)
  }
  if (state.stats.hp < 0) push('critical', 'neg_hp', `hp=${state.stats.hp}`)
  if (state.stats.maxHp <= 0)
    push('critical', 'bad_max_hp', `maxHp=${state.stats.maxHp}`)
  if (state.currency.silver < 0)
    push('critical', 'neg_silver', `silver=${state.currency.silver}`)
  if (state.currency.yuanbao < 0)
    push('critical', 'neg_yuanbao', `yuanbao=${state.currency.yuanbao}`)
  if (state.stats.hp > state.stats.maxHp + 1)
    push('major', 'hp_over_max', `hp ${state.stats.hp}/${state.stats.maxHp}`)
  if (state.inspiration < 0)
    push('major', 'neg_inspiration', `inspiration=${state.inspiration}`)
  if (state.potential < 0)
    push('major', 'neg_potential', `potential=${state.potential}`)
  if (state.actionPoints < 0)
    push('major', 'neg_ap', `ap=${state.actionPoints}`)

  if (!getLocationById(state.locationId)) {
    push('critical', 'bad_location', `locationId=${state.locationId}`)
  }
  if (state.originChosen) {
    if (!ORIGINS.some((o) => o.id === state.originId)) {
      // may still be legacy before migrate — major
      if (state.originId && !String(state.originId).startsWith('cat_')) {
        push('major', 'legacy_origin_id', `originId=${state.originId}`)
      } else if (!state.originId) {
        push('critical', 'missing_origin', 'originChosen but no originId')
      }
    }
  }

  for (const eq of state.ownedEquipment) {
    if (!getEquipmentById(eq.defId)) {
      push('critical', 'orphan_equip', `defId=${eq.defId}`)
    }
    if (eq.refineLevel < 0 || eq.refineLevel > 15) {
      push('major', 'bad_refine', `refine=${eq.refineLevel}`)
    }
  }

  try {
    const panel = computePanelStats(state)
    if (!isFiniteNum(panel.attack) || !isFiniteNum(panel.defense)) {
      push('critical', 'panel_nan', 'computePanelStats NaN')
    }
  } catch (e) {
    push('critical', 'panel_throw', String(e))
  }

  for (const [id, v] of Object.entries(state.affinity)) {
    if (!isFiniteNum(v)) push('critical', 'affinity_nan', `${id}=${String(v)}`)
    else if (v < 0 || v > 100)
      push('major', 'affinity_oob', `${id}=${v}（應在 0–100）`)
  }
}

function applyOrigin(
  state: GameState,
  rng: () => number,
): GameState {
  const cat = pick(rng, ORIGINS)
  const job =
    rng() < 0.55
      ? ''
      : `虛擬職${Math.floor(rng() * 900 + 100)}`
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
  const genders = ['male', 'female', 'unspecified'] as const
  return {
    ...state,
    playerName: `試玩客${Math.floor(rng() * 9000 + 1000)}`,
    playerGender: pick(rng, [...genders]),
    originChosen: true,
    originId: cat.id,
    originJobTitle: job,
    stats,
    techTree,
    inventory,
    inspiration: state.inspiration + (bonuses.inspiration ?? 0),
    currency: {
      ...state.currency,
      silver: state.currency.silver + (bonuses.silver ?? 0),
    },
    comprehension: Math.min(
      99,
      state.comprehension + (cat.comprehensionBonus ?? 0),
    ),
    rootBone: Math.min(99, state.rootBone + (cat.rootBoneBonus ?? 0)),
    activeEventId: 'event_prologue_rain_temple',
    flags: {
      ...state.flags,
      originName: job || cat.defaultJobTitle,
      originCategory: cat.name,
    },
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
  let next: GameState = {
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
  }
  return grantStarterGear(next)
}

function runCombat(
  encounter: CombatState,
  rng: () => number,
  findings: Finding[],
  runId: number,
  step: number,
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
    const act = pick(rng, actions)
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    combat = performPlayerAction(combat, act, target)
  }
  if (!combat.finished) {
    findings.push({
      severity: 'critical',
      code: 'combat_deadlock',
      message: `戰鬥超過 80 回合未結束 turn=${combat.turn}`,
      runId,
      step,
    })
  }
  return combat
}

function applyCombatRewards(state: GameState, combat: CombatState, spar: boolean): GameState {
  if (!combat.finished) return state
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    return {
      ...state,
      stats: {
        ...state.stats,
        hp: Math.max(1, Math.min(state.stats.maxHp, hp)),
      },
      currency: {
        ...state.currency,
        silver: state.currency.silver + (spar ? 12 : 20),
      },
      potential: state.potential + (spar ? 2 : 2),
      sparWins: state.sparWins + (spar ? 1 : 0),
    }
  }
  return {
    ...state,
    stats: {
      ...state.stats,
      hp: Math.max(1, Math.floor(state.stats.maxHp * 0.3)),
    },
  }
}

function stepTravel(state: GameState, rng: () => number): GameState | null {
  const links = getLinkedLocations(state.locationId)
  if (!links.length) return null
  const target = pick(rng, links)
  const cost = target.travelStamina
  if (state.stats.stamina < cost) {
    // 回復一點再試
    return {
      ...state,
      stats: {
        ...state.stats,
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 20),
      },
    }
  }
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
  const nextDay =
    state.time.period === 'night' ? state.time.day + 1 : state.time.day
  const restoreAp = state.time.period === 'night'
  return {
    ...state,
    locationId: target.id,
    locationName: target.name,
    knownLocationIds: [...known],
    stats: { ...state.stats, stamina: state.stats.stamina - cost },
    time: { ...state.time, period: nextPeriod, day: nextDay },
    actionPoints: restoreAp
      ? Math.min(state.maxActionPoints, state.actionPoints + 1)
      : state.actionPoints,
  }
}

function stepGather(state: GameState, rng: () => number): GameState | null {
  const loc = getLocationById(state.locationId)
  if (!loc || loc.gather === 'none' || state.actionPoints < 1) return null
  const kind =
    loc.gather === 'both' ? (rng() < 0.5 ? 'herb' : 'ore') : loc.gather
  const mat = makeMaterial(
    kind === 'herb' ? MATERIAL_IDS.herb : MATERIAL_IDS.ore,
    1 + Math.floor(rng() * 2),
  )
  if (!mat) return null
  return {
    ...state,
    actionPoints: state.actionPoints - 1,
    inventory: mergeItem(state.inventory, mat),
  }
}

function stepCraft(state: GameState): GameState | null {
  const recipe = ALCHEMY_RECIPES[0]
  let inv = state.inventory.map((i) => ({ ...i }))
  for (const [id, qty] of Object.entries(recipe.costs)) {
    const found = inv.find((i) => i.id === id)
    if (!found || found.quantity < qty) return null
    found.quantity -= qty
  }
  inv = inv.filter((i) => i.quantity > 0)
  const result = makeMaterial(recipe.resultId, recipe.resultQty)
  if (!result) return null
  return { ...state, inventory: mergeItem(inv, result) }
}

function stepAdvanceXun(state: GameState, rng: () => number): GameState | null {
  if (!state.prologueDone) return null
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
  } else if (!pendingEventId && rng() < 0.55) {
    pendingEventId = pickEncounter(
      year * 30 + month * 3 + xun,
      state.knownLocationIds,
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
  }
}

function stepResolveEvent(
  state: GameState,
  rng: () => number,
  findings: Finding[],
  runId: number,
  step: number,
  cov: Coverage,
): { state: GameState; combat?: CombatState } {
  const eventId = state.pendingEventId
  if (!eventId) return { state }
  const def =
    MAIN_STORY_EVENTS.find((e) => e.id === eventId) ??
    ENCOUNTER_EVENTS.find((e) => e.id === eventId)
  if (!def || !def.choices.length) {
    findings.push({
      severity: 'critical',
      code: 'event_no_choices',
      message: `事件 ${eventId} 無選項`,
      runId,
      step,
    })
    return { state: { ...state, pendingEventId: null } }
  }
  cov[`event:${eventId}`] = (cov[`event:${eventId}`] ?? 0) + 1
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
  if (
    eventId.startsWith('main_y') &&
    !eventId.startsWith('main_y5') &&
    time.year < 5
  ) {
    time = {
      ...time,
      year: Math.min(5, time.year + 1),
      month: 1,
      xun: 0,
    }
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
    const encounter = makeBanditEncounter(
      buildPlayerCombatant(next),
      buildPartyCombatants(next),
    )
    return { state: next, combat: encounter }
  }
  return { state: next }
}

function stepTech(state: GameState, rng: () => number): GameState | null {
  const candidates = TECH_NODES.filter((n) => {
    if ((state.techTree[n.id] ?? 0) > 0) return false
    if (state.inspiration < n.inspirationCost) return false
    return n.requires.every((r) => (state.techTree[r] ?? 0) > 0)
  })
  if (!candidates.length) return null
  const node = pick(rng, candidates)
  const next: GameState = {
    ...state,
    inspiration: state.inspiration - node.inspirationCost,
    techTree: { ...state.techTree, [node.id]: 1 },
  }
  if (node.id === TECH_ID_QUENCH)
    next.flags = { ...next.flags, quenchUnlocked: true }
  if (node.id === TECH_ID_POISON)
    next.flags = { ...next.flags, poisonUnlocked: true }
  return next
}

function stepTrain(state: GameState, rng: () => number): GameState | null {
  const known = MARTIAL_ARTS.filter((m) => (state.martialProgress[m.id] ?? 0) > 0)
  if (!known.length || state.potential < 2) return null
  const art = pick(rng, known)
  const lv = state.martialProgress[art.id] ?? 1
  if (lv >= 10) return null
  const cost = trainPotentialCost(lv)
  if (state.potential < cost) return null
  const target = lv + 1
  const isBottle = target === 5 || target === 10
  let success = true
  if (isBottle) {
    const chance = bottleneckSuccessChance(
      state.comprehension,
      state.rootBone,
      target,
    )
    success = rng() < chance
  }
  if (!success) {
    return {
      ...state,
      potential: state.potential - cost,
      stats: {
        ...state.stats,
        hp: Math.max(1, state.stats.hp - 8),
      },
    }
  }
  return {
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: target },
  }
}

function stepShop(state: GameState, rng: () => number): GameState | null {
  const roll = rng()
  if (roll < 0.35) {
    const pack = pick(rng, MOCK_TOPUP_PACKS)
    return {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao + pack.yuanbao,
      },
    }
  }
  if (roll < 0.55) {
    const offer = pick(rng, SILVER_SHOP)
    const price = offer.priceSilver ?? 0
    if (state.currency.silver < price) return null
    let inventory = state.inventory
    let stamina = state.stats.stamina
    const grant = offer.grant
    if (grant?.kind === 'stat' && grant.stamina) {
      stamina = Math.min(state.stats.maxStamina, stamina + grant.stamina)
    } else if (grant?.kind === 'item' && grant.id) {
      const item =
        makeMaterial(grant.id, grant.qty ?? 1) ??
        createItemFromCatalog(grant.id, grant.qty ?? 1)
      if (!item) return null
      inventory = mergeItem(inventory, item)
    }
    return {
      ...state,
      inventory,
      currency: {
        ...state.currency,
        silver: state.currency.silver - price,
      },
      stats: { ...state.stats, stamina },
    }
  }
  if (roll < 0.7) {
    const offer = pick(rng, YUANBAO_SHOP)
    if (state.currency.yuanbao < offer.priceYuanbao) return null
    let next: GameState = {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao - offer.priceYuanbao,
      },
    }
    if (offer.kind === 'monthly') {
      next = {
        ...next,
        monthlyCardCharges: next.monthlyCardCharges + 30,
      }
    }
    return next
  }
  // gacha
  const ten = rng() < 0.4
  const cost = ten ? GACHA_TEN_COST : GACHA_SINGLE_COST
  if (state.currency.yuanbao < cost) {
    return {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao + 600,
      },
    }
  }
  const pulled = pullMany(ten ? 10 : 1, {
    year: state.time.year,
    pityEpic: state.gachaPityEpic,
    pityLegendary: state.gachaPityLegendary,
  })
  let seq = state.equipUidSeq
  const owned: OwnedEquipment[] = [...state.ownedEquipment]
  for (const r of pulled.results) {
    if (!r.item?.id) return null
    owned.push({
      uid: `eq_${seq++}`,
      defId: r.item.id,
      refineLevel: 0,
      quenched: false,
      poisoned: false,
    })
  }
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

function stepSect(state: GameState, rng: () => number): GameState | null {
  if (!state.sectId) {
    const knownSects = SECTS.filter((s) =>
      state.knownLocationIds.includes(s.homeLocationId),
    )
    if (!knownSects.length) return null
    const sect = pick(rng, knownSects)
    if (state.stats.level < sect.entry.minLevel) return null
    if (state.currency.silver < sect.entry.minSilver) return null
    if (
      sect.entry.minComprehension &&
      state.comprehension < sect.entry.minComprehension
    )
      return null
    return {
      ...state,
      sectId: sect.id,
      sectContribution: 0,
      currency: {
        ...state.currency,
        silver: state.currency.silver - sect.entry.minSilver,
      },
    }
  }
  if (state.currency.silver < 20) return null
  return {
    ...state,
    sectContribution: state.sectContribution + 15,
    currency: {
      ...state.currency,
      silver: state.currency.silver - 20,
    },
  }
}

function stepHero(state: GameState, rng: () => number): GameState | null {
  const npc = pick(rng, NPCS)
  const gifts = state.inventory.filter((i) => i.kind === 'gift' && i.quantity > 0)
  if (gifts.length && rng() < 0.6) {
    const g = pick(rng, gifts)
    const inv = state.inventory
      .map((i) =>
        i.id === g.id ? { ...i, quantity: i.quantity - 1 } : { ...i },
      )
      .filter((i) => i.quantity > 0)
    const fav = npc.favoriteGifts.includes(g.id)
    const aff = Math.min(
      100,
      (state.affinity[npc.id] ?? 0) + (fav ? 18 : 8),
    )
    return {
      ...state,
      inventory: inv,
      affinity: { ...state.affinity, [npc.id]: aff },
    }
  }
  if (
    state.partyIds.length < 2 &&
    !state.partyIds.includes(npc.id) &&
    (state.affinity[npc.id] ?? 0) >= 30
  ) {
    return { ...state, partyIds: [...state.partyIds, npc.id] }
  }
  if (
    npc.romanceable &&
    (state.affinity[npc.id] ?? 0) >= 100 &&
    state.partnerId !== npc.id &&
    rng() < 0.3
  ) {
    return { ...state, partnerId: npc.id }
  }
  return null
}

function stepRefine(state: GameState, rng: () => number): GameState | null {
  if (!state.ownedEquipment.length) return null
  const owned = pick(rng, state.ownedEquipment)
  if (owned.refineLevel >= 15) return null
  const def = getEquipmentById(owned.defId)
  if (!def) return null
  const cost = refineCostForLevel(def.baseRefineCost, owned.refineLevel)
  if (!Number.isFinite(cost) || state.currency.silver < cost) return null
  return {
    ...state,
    currency: {
      ...state.currency,
      silver: state.currency.silver - cost,
    },
    ownedEquipment: state.ownedEquipment.map((e) =>
      e.uid === owned.uid ? { ...e, refineLevel: e.refineLevel + 1 } : e,
    ),
  }
}

function stepMigrateRoundtrip(
  state: GameState,
  findings: Finding[],
  runId: number,
  step: number,
): GameState {
  try {
    const raw = JSON.parse(JSON.stringify(state)) as unknown
    // 假裝舊細職 id
    if (runId % 17 === 0) {
      ;(raw as GameState).originId = 'origin_er_doctor'
      ;(raw as GameState).version = 5
    }
    const migrated = migrateSaveData(raw)
    if (!migrated || typeof migrated.version !== 'number') {
      findings.push({
        severity: 'critical',
        code: 'migrate_null',
        message: 'migrateSaveData 回傳異常',
        runId,
        step,
      })
      return state
    }
    if (
      String(migrated.originId ?? '').startsWith('origin_') &&
      migrated.originChosen
    ) {
      findings.push({
        severity: 'major',
        code: 'migrate_origin_unmap',
        message: `遷移後仍為細職 id ${migrated.originId}`,
        runId,
        step,
      })
    }
    return migrated
  } catch (e) {
    findings.push({
      severity: 'critical',
      code: 'migrate_throw',
      message: String(e),
      runId,
      step,
    })
    return state
  }
}

function runOne(runId: number): {
  findings: Finding[]
  steps: number
  coverage: Coverage
  crashed: boolean
} {
  const findings: Finding[] = []
  const cov: Coverage = {}
  const rng = mulberry32(1000 + runId * 997)
  let state = createInitialGameState()
  let steps = 0
  let crashed = false

  const mark = (k: string) => {
    cov[k] = (cov[k] ?? 0) + 1
  }

  try {
    state = applyOrigin(state, rng)
    mark('origin')
    inspectState(state, findings, runId, steps++)

    state = applyPrologue(state, rng)
    mark('prologue')
    inspectState(state, findings, runId, steps++)

    const maxSteps = 120 + Math.floor(rng() * 80)
    while (steps < maxSteps) {
      const ops: Array<() => void> = []

      ops.push(() => {
        const n = stepTravel(state, rng)
        if (n) {
          state = n
          mark('travel')
        }
      })
      ops.push(() => {
        const n = stepGather(state, rng)
        if (n) {
          state = n
          mark('gather')
        }
      })
      ops.push(() => {
        const n = stepCraft(state)
        if (n) {
          state = n
          mark('craft')
        }
      })
      ops.push(() => {
        const n = stepAdvanceXun(state, rng)
        if (n) {
          state = n
          mark('xun')
        }
      })
      ops.push(() => {
        if (!state.pendingEventId) return
        const res = stepResolveEvent(
          state,
          rng,
          findings,
          runId,
          steps,
          cov,
        )
        state = res.state
        mark('event')
        if (res.combat) {
          mark('combat_event')
          const done = runCombat(res.combat, rng, findings, runId, steps)
          state = applyCombatRewards(state, done, false)
        }
      })
      ops.push(() => {
        mark('combat_bandit')
        const enc = makeBanditEncounter(
          buildPlayerCombatant(state),
          buildPartyCombatants(state),
        )
        const done = runCombat(enc, rng, findings, runId, steps)
        state = applyCombatRewards(state, done, false)
      })
      ops.push(() => {
        const board = buildBoard(
          pick(rng, ['heaven', 'earth', 'weapon', 'rich'] as const),
          state,
        )
        const foe = board.find((b) => !b.isPlayer)
        if (!foe) return
        mark('spar')
        const enc = makeSparEncounter(
          buildPlayerCombatant(state),
          buildPartyCombatants(state),
          foe.sparPower,
          foe.name,
        )
        const done = runCombat(enc, rng, findings, runId, steps)
        state = applyCombatRewards(state, done, true)
      })
      ops.push(() => {
        const n = stepTech(state, rng)
        if (n) {
          state = n
          mark('tech')
        }
      })
      ops.push(() => {
        const n = stepTrain(state, rng)
        if (n) {
          state = n
          mark('train')
        }
      })
      ops.push(() => {
        const n = stepShop(state, rng)
        if (n) {
          state = n
          mark('shop')
        }
      })
      ops.push(() => {
        const n = stepSect(state, rng)
        if (n) {
          state = n
          mark('sect')
        }
      })
      ops.push(() => {
        const n = stepHero(state, rng)
        if (n) {
          state = n
          mark('hero')
        }
      })
      ops.push(() => {
        const n = stepRefine(state, rng)
        if (n) {
          state = n
          mark('refine')
        }
      })
      ops.push(() => {
        mark('migrate')
        state = stepMigrateRoundtrip(state, findings, runId, steps)
      })
      ops.push(() => {
        if (!canSettleNgPlus(state) && rng() > 0.02) return
        // 強制標記可結算做壓力
        if (rng() < 0.05) {
          state = {
            ...state,
            ngPlusReady: true,
            storyFlags: {
              ...state.storyFlags,
              main_y1_xiangyang: true,
              main_y2_huashan: true,
              main_y3_tomb: true,
              main_y4_xuanmu: true,
              main_y5_wharf: true,
            },
          }
        }
        if (canSettleNgPlus(state)) {
          mark('ngplus')
          state = applyNewGamePlus(state)
          // NG+ 後需重選職業才能遊玩——模擬立刻再選
          state = applyOrigin(state, rng)
          state = applyPrologue(state, rng)
        }
      })

      pick(rng, ops)()
      inspectState(state, findings, runId, steps)
      steps++

      // 瀕死回血以免卡死
      if (state.stats.hp <= 0) {
        findings.push({
          severity: 'critical',
          code: 'hp_zero_persist',
          message: '狀態停留在 hp<=0',
          runId,
          step: steps,
        })
        state = {
          ...state,
          stats: { ...state.stats, hp: Math.max(1, state.stats.maxHp) },
        }
      }
    }
  } catch (e) {
    crashed = true
    findings.push({
      severity: 'critical',
      code: 'uncaught',
      message: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      runId,
      step: steps,
    })
  }

  return { findings, steps, coverage: cov, crashed }
}

async function main() {
  const RUNS = 100
  const all: Finding[] = []
  const covTotal: Coverage = {}
  let crashRuns = 0
  let totalSteps = 0

  console.log(`開始模擬：${RUNS} 名虛擬玩家…`)
  for (let i = 0; i < RUNS; i++) {
    const r = runOne(i)
    totalSteps += r.steps
    if (r.crashed) crashRuns++
    for (const f of r.findings) all.push(f)
    for (const [k, v] of Object.entries(r.coverage)) {
      covTotal[k] = (covTotal[k] ?? 0) + v
    }
    if ((i + 1) % 20 === 0) {
      console.log(`  …已完成 ${i + 1}/${RUNS}`)
    }
  }

  const byCode = new Map<string, Finding[]>()
  for (const f of all) {
    const list = byCode.get(f.code) ?? []
    list.push(f)
    byCode.set(f.code, list)
  }

  const summary = {
    runs: RUNS,
    totalSteps,
    crashRuns,
    findingCount: all.length,
    bySeverity: {
      critical: all.filter((f) => f.severity === 'critical').length,
      major: all.filter((f) => f.severity === 'major').length,
      minor: all.filter((f) => f.severity === 'minor').length,
    },
    uniqueCodes: [...byCode.entries()]
      .map(([code, list]) => ({
        code,
        severity: list[0].severity,
        count: list.length,
        sample: list[0].message,
      }))
      .sort((a, b) => b.count - a.count),
    coverage: Object.fromEntries(
      Object.entries(covTotal).sort((a, b) => b[1] - a[1]),
    ),
  }

  const { writeFileSync } = await import('node:fs')
  const outPath = new URL('../sim-playtest-result.json', import.meta.url)
  writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`寫入 ${outPath.pathname}`)
}

void main()
