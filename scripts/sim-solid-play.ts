/**
 * 多路徑紮實操作驗收：每步對應真實按鈕意圖（非純隨機壓力）。
 * 用法：npm run sim:solid-play
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import { createItemFromCatalog } from '../src/data/npcs.ts'
import {
  ALCHEMY_RECIPES,
  makeMaterial,
  MATERIAL_IDS,
} from '../src/data/alchemy.ts'
import {
  getLinkedLocations,
  getLocationById,
} from '../src/data/locations.ts'
import {
  ENCOUNTER_EVENTS,
  MAIN_STORY_EVENTS,
} from '../src/data/events.ts'
import {
  applyMainBeatResolved,
  ensureStoryRoute,
  resolveAdvanceXunStory,
} from '../src/lib/storyProgress.ts'
import { MOCK_TOPUP_PACKS, SILVER_SHOP } from '../src/data/shop.ts'
import { MARTIAL_ARTS, trainPotentialCost } from '../src/data/martialArts.ts'
import { SECTS } from '../src/data/sects.ts'
import { applyRewards } from '../src/lib/applyRewards.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import {
  applyBanditFightStartCost,
  BANDIT_FIGHT_AP_COST,
  BANDIT_FIGHTS_PER_XUN_MAX,
  banditStartBlockLabel,
  banditWinRewards,
  clearCombatLoseStreak,
  getBanditStartBlock,
} from '../src/lib/banditEncounterRules.ts'
import {
  applySparFightStartCost,
  getSparStartBlock,
  SPAR_FIGHT_AP_COST,
  SPAR_FIGHTS_PER_XUN_MAX,
  SPAR_WIN_POTENTIAL,
  SPAR_WIN_SILVER,
  sparStartBlockLabel,
} from '../src/lib/sparEncounterRules.ts'
import { applyNightTravelApRestore } from '../src/lib/travelApRules.ts'
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
import {
  COMBAT_MARTIAL_POOL,
  grantMartialArts,
  pickUnknownMartial,
} from '../src/lib/martialUnlock.ts'
import { pullMany, GACHA_SINGLE_COST, GACHA_TEN_COST } from '../src/lib/gachaEngine.ts'
import {
  detectEndingKey,
  flavorEventForNgPlus,
  NG_PLUS_ENCOUNTERS,
} from '../src/lib/ngPlusStory.ts'
import type { GameState, InventoryItem, StoryEventChoiceDef } from '../src/types/game.ts'

const OUT_JSON =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/solid-play-result.json'

type StepRecord = {
  op: string
  ok: boolean
  note?: string
  silver?: number
  potential?: number
  ap?: number
  stamina?: number
  hp?: number
  loseStreak?: number
  banditXun?: number
  period?: string
  blocked?: string
}

type PathResult = {
  id: string
  title: string
  intent: string
  steps: StepRecord[]
  baseline: ResourceSnap
  final: ResourceSnap
  deltas: ResourceSnap
  flags: {
    stuck: boolean
    infiniteFarm: boolean
    copyMismatch: boolean
    notes: string[]
  }
  metrics: Record<string, number | string | boolean>
}

type ResourceSnap = {
  silver: number
  yuanbao: number
  potential: number
  ap: number
  stamina: number
  hp: number
  loseStreak: number
  banditXun: number
  martialCount: number
  herb: number
  ore: number
  sparWins: number
  year: number
  day: number
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

function consumeItem(
  inventory: InventoryItem[],
  id: string,
  qty: number,
): InventoryItem[] | null {
  const next = inventory.map((i) => ({ ...i }))
  const found = next.find((i) => i.id === id)
  if (!found || found.quantity < qty) return null
  found.quantity -= qty
  return next.filter((i) => i.quantity > 0)
}

function itemQty(state: GameState, id: string): number {
  return state.inventory.find((i) => i.id === id)?.quantity ?? 0
}

function snap(state: GameState): ResourceSnap {
  return {
    silver: state.currency.silver,
    yuanbao: state.currency.yuanbao,
    potential: state.potential,
    ap: state.actionPoints,
    stamina: state.stats.stamina,
    hp: state.stats.hp,
    loseStreak: state.combatLoseStreak,
    banditXun: state.banditFightsThisXun,
    martialCount: Object.values(state.martialProgress).filter((v) => v > 0).length,
    herb: itemQty(state, MATERIAL_IDS.herb),
    ore: itemQty(state, MATERIAL_IDS.ore),
    sparWins: state.sparWins,
    year: state.time.year,
    day: state.time.day,
  }
}

function deltaSnap(a: ResourceSnap, b: ResourceSnap): ResourceSnap {
  return {
    silver: b.silver - a.silver,
    yuanbao: b.yuanbao - a.yuanbao,
    potential: b.potential - a.potential,
    ap: b.ap - a.ap,
    stamina: b.stamina - a.stamina,
    hp: b.hp - a.hp,
    loseStreak: b.loseStreak - a.loseStreak,
    banditXun: b.banditXun - a.banditXun,
    martialCount: b.martialCount - a.martialCount,
    herb: b.herb - a.herb,
    ore: b.ore - a.ore,
    sparWins: b.sparWins - a.sparWins,
    year: b.year - a.year,
    day: b.day - a.day,
  }
}

function applyOrigin(state: GameState, rng: () => number, fixedId?: string): GameState {
  const cat = fixedId
    ? ORIGINS.find((o) => o.id === fixedId) ?? pick(rng, ORIGINS)
    : pick(rng, ORIGINS)
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
    playerName: `操測客${Math.floor(rng() * 9000 + 1000)}`,
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
    flags: {
      ...state.flags,
      originName: cat.defaultJobTitle,
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
  const next: GameState = {
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

function boot(seed: number, originId?: string): { state: GameState; rng: () => number } {
  const rng = mulberry32(seed)
  let state = createInitialGameState()
  state = applyOrigin(state, rng, originId)
  state = applyPrologue(state, rng)
  return { state, rng }
}

function runCombat(
  encounter: CombatState,
  rng: () => number,
  preferLose = false,
): { combat: CombatState; deadlock: boolean } {
  let combat = encounter
  let turns = 0
  while (!combat.finished && turns < 100) {
    turns++
    const act: CombatActionKind = preferLose
      ? 'defend'
      : rng() < 0.6
        ? 'skill'
        : rng() < 0.5
          ? 'attack'
          : 'tactic_flash'
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    combat = performPlayerAction(combat, act, target)
  }
  return { combat, deadlock: !combat.finished }
}

/** 強制連敗：把玩家打到死（降低攻防再開戰） */
function forceLoseBandit(state: GameState, rng: () => number): GameState {
  const weak: GameState = {
    ...state,
    stats: { ...state.stats, attack: 1, defense: 0, hp: 1 },
    partyIds: [],
    partnerId: null,
  }
  const paid = applyBanditFightStartCost(weak)
  const encounter = makeBanditEncounter(
    buildPlayerCombatant(paid),
    [],
    { loseStreak: paid.combatLoseStreak, year: paid.time.year },
  )
  // 灌敵方傷害：連點 defend 直到敗
  const { combat } = runCombat(encounter, rng, true)
  if (combat.victory) {
    // 仍勝則直接套敗北結算
    const streak = state.combatLoseStreak + 1
    const hpRatio = streak >= 3 ? 0.7 : streak === 2 ? 0.55 : 0.4
    return {
      ...paid,
      stats: {
        ...state.stats,
        hp: Math.max(1, Math.floor(state.stats.maxHp * hpRatio)),
        stamina: Math.min(
          state.stats.maxStamina,
          state.stats.stamina + (streak >= 2 ? 12 : 6),
        ),
      },
      combatLoseStreak: streak,
    }
  }
  const streak = state.combatLoseStreak + 1
  const hpRatio = streak >= 3 ? 0.7 : streak === 2 ? 0.55 : 0.4
  return {
    ...paid,
    stats: {
      ...state.stats,
      hp: Math.max(1, Math.floor(state.stats.maxHp * hpRatio)),
      stamina: Math.min(
        state.stats.maxStamina,
        state.stats.stamina + (streak >= 2 ? 12 : 6),
      ),
    },
    combatLoseStreak: streak,
  }
}

function applyBanditEnd(
  state: GameState,
  combat: CombatState,
  rng: () => number,
  isSpar: boolean,
): GameState {
  if (!combat.finished) return state
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    const reward = isSpar
      ? { silver: SPAR_WIN_SILVER, potential: SPAR_WIN_POTENTIAL }
      : banditWinRewards(state.banditFightsThisXun)
    let martialProgress = state.martialProgress
    if (!isSpar && rng() < 0.28) {
      const mid = pickUnknownMartial(state, [...COMBAT_MARTIAL_POOL], rng)
      if (mid) martialProgress = grantMartialArts(state, [mid]).state.martialProgress
    }
    return {
      ...state,
      martialProgress,
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
      sparWins: state.sparWins + (isSpar ? 1 : 0),
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

type ActResult = { state: GameState; ok: boolean; note: string; blocked?: string }

/** 按鈕：路遇戰鬥 */
function actBandit(state: GameState, rng: () => number): ActResult {
  const block = getBanditStartBlock(state)
  if (block) {
    return {
      state,
      ok: false,
      note: `路遇被拒：${banditStartBlockLabel(block)}`,
      blocked: block,
    }
  }
  const paid = applyBanditFightStartCost(state)
  const encounter = makeBanditEncounter(
    buildPlayerCombatant(paid),
    buildPartyCombatants(paid),
    { loseStreak: paid.combatLoseStreak, year: paid.time.year },
  )
  const { combat, deadlock } = runCombat(encounter, rng)
  if (deadlock) {
    return { state: paid, ok: false, note: '路遇戰局死鎖', blocked: 'deadlock' }
  }
  const ended = applyBanditEnd(paid, combat, rng, false)
  return {
    state: ended,
    ok: true,
    note: combat.victory
      ? `路遇勝（本旬 ${paid.banditFightsThisXun}/${BANDIT_FIGHTS_PER_XUN_MAX}）`
      : `路遇敗（連敗 ${ended.combatLoseStreak}）`,
  }
}

/** 按鈕：榜單切磋（1 AP＋同旬上限） */
function actSpar(
  state: GameState,
  rng: () => number,
  sparPower = 40,
): ActResult {
  const block = getSparStartBlock(state)
  if (block) {
    return {
      state,
      ok: false,
      note: `切磋被拒：${sparStartBlockLabel(block)}`,
      blocked: block,
    }
  }
  const paid = applySparFightStartCost(state)
  const encounter = makeSparEncounter(
    buildPlayerCombatant(paid),
    buildPartyCombatants(paid),
    sparPower,
    '榜單對手',
  )
  const { combat, deadlock } = runCombat(encounter, rng)
  if (deadlock) {
    return { state: paid, ok: false, note: '切磋死鎖', blocked: 'deadlock' }
  }
  const ended = applyBanditEnd(paid, combat, rng, true)
  return {
    state: ended,
    ok: true,
    note: combat.victory
      ? `切磋勝（本旬 ${paid.sparFightsThisXun}/${SPAR_FIGHTS_PER_XUN_MAX}｜-${SPAR_FIGHT_AP_COST} AP）`
      : `切磋敗（本旬 ${paid.sparFightsThisXun}/${SPAR_FIGHTS_PER_XUN_MAX}）`,
  }
}

/** 按鈕：推進一旬 */
function actAdvanceXun(state: GameState, rng: () => number): ActResult {
  if (!state.prologueDone) {
    return { state, ok: false, note: '序章未了', blocked: 'prologue' }
  }
  const routed = ensureStoryRoute(state)
  let xun = routed.time.xun + 1
  let month = routed.time.month
  let year = routed.time.year
  let day = routed.time.day + 10
  if (xun > 2) {
    xun = 0
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  const tradeSilver = 5 + routed.tradeRouteLevel * 8
  const story = resolveAdvanceXunStory(
    routed,
    { year, month, day, period: 'noon', xun },
    routed.pendingEventId,
    rng(),
  )
  const apBefore = routed.actionPoints
  const apAfter = Math.min(routed.maxActionPoints, apBefore + 1)
  return {
    state: {
      ...routed,
      actionPoints: apAfter,
      time: story.time,
      currency: {
        ...routed.currency,
        silver: routed.currency.silver + tradeSilver,
      },
      rumors: story.rumors,
      pendingEventId: story.pendingEventId,
      unlockedArcIds: story.unlockedArcIds,
      xunsSinceLastBeat: story.xunsSinceLastBeat,
      lastOutcomeText: null,
      combatLoseStreak: 0,
      banditFightsThisXun: 0,
      sparFightsThisXun: 0,
    },
    ok: true,
    note: `推進一旬（AP ${apBefore}→${apAfter}｜+${tradeSilver} 銀｜路遇／切磋重置｜連敗清零）`,
  }
}

/** 按鈕：移動至鄰近 */
function actTravel(state: GameState, locationId: string): ActResult {
  if (!state.prologueDone) {
    return { state, ok: false, note: '序章未了', blocked: 'prologue' }
  }
  const current = getLocationById(state.locationId)
  const target = getLocationById(locationId)
  if (!current || !target) {
    return { state, ok: false, note: '未知地點', blocked: 'bad_loc' }
  }
  if (!current.links.includes(locationId)) {
    return { state, ok: false, note: '無法直達', blocked: 'no_link' }
  }
  const usePass = state.travelPassCharges > 0
  const cost = usePass
    ? Math.max(1, Math.ceil(target.travelStamina / 2))
    : target.travelStamina
  if (state.stats.stamina < cost) {
    return {
      state,
      ok: false,
      note: `精力不足（需 ${cost}）`,
      blocked: 'no_stamina',
    }
  }
  const known = new Set(state.knownLocationIds)
  known.add(locationId)
  for (const link of target.links) known.add(link)
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
  const cleared =
    state.combatLoseStreak > 0 ? clearCombatLoseStreak(state) : state
  return {
    state: {
      ...cleared,
      locationId: target.id,
      locationName: target.name,
      knownLocationIds: [...known],
      travelPassCharges: usePass
        ? Math.max(0, cleared.travelPassCharges - 1)
        : cleared.travelPassCharges,
      stats: {
        ...cleared.stats,
        stamina: cleared.stats.stamina - cost,
      },
      time: {
        ...cleared.time,
        period: nextPeriod,
        day: nextDay,
      },
      actionPoints: restoreAp
        ? applyNightTravelApRestore(
            cleared.actionPoints,
            cleared.maxActionPoints,
          )
        : cleared.actionPoints,
      lastOutcomeText: null,
      lastCombatResult: null,
    },
    ok: true,
    note: `移動→${target.name}（-${cost} 精力${restoreAp ? '｜破曉 AP +1（上限內）' : ''}）`,
  }
}

/** 按鈕：採集 */
function actGather(state: GameState, kind: 'herb' | 'ore'): ActResult {
  if (!state.prologueDone) {
    return { state, ok: false, note: '序章未了', blocked: 'prologue' }
  }
  if (state.actionPoints < 1) {
    return { state, ok: false, note: 'AP 不足', blocked: 'no_ap' }
  }
  const loc = getLocationById(state.locationId)
  if (!loc || loc.gather === 'none') {
    return { state, ok: false, note: '此地無可採', blocked: 'no_gather' }
  }
  if (kind === 'herb' && loc.gather !== 'herb' && loc.gather !== 'both') {
    return { state, ok: false, note: '無草藥', blocked: 'wrong_kind' }
  }
  if (kind === 'ore' && loc.gather !== 'ore' && loc.gather !== 'both') {
    return { state, ok: false, note: '無礦石', blocked: 'wrong_kind' }
  }
  const matId = kind === 'herb' ? MATERIAL_IDS.herb : MATERIAL_IDS.ore
  const mat = makeMaterial(matId, 1)
  if (!mat) return { state, ok: false, note: '材料缺失', blocked: 'data' }
  return {
    state: {
      ...state,
      actionPoints: state.actionPoints - 1,
      inventory: mergeItem(state.inventory, mat),
      potential: state.potential + 1,
    },
    ok: true,
    note: `採集 ${mat.name}（-1 AP｜潛能 +1）`,
  }
}

/** 按鈕：煉丹 */
function actCraft(state: GameState, recipeId: string): ActResult {
  const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId)
  if (!recipe) return { state, ok: false, note: '無配方', blocked: 'data' }
  let inv = state.inventory.map((i) => ({ ...i }))
  for (const [id, qty] of Object.entries(recipe.costs)) {
    const next = consumeItem(inv, id, qty)
    if (!next) {
      return { state, ok: false, note: `材料不足：${id}`, blocked: 'no_mat' }
    }
    inv = next
  }
  const result = makeMaterial(recipe.resultId, recipe.resultQty)
  if (!result) return { state, ok: false, note: '產物缺失', blocked: 'data' }
  inv = mergeItem(inv, result)
  return {
    state: { ...state, inventory: inv },
    ok: true,
    note: `${recipe.name}成功（無 AP）`,
  }
}

/** 按鈕：修練已知武學一重 */
function actTrain(state: GameState, rng: () => number): ActResult {
  const known = MARTIAL_ARTS.filter((m) => (state.martialProgress[m.id] ?? 0) > 0)
  if (!known.length) return { state, ok: false, note: '無已知武學', blocked: 'none' }
  const art = pick(rng, known)
  const level = state.martialProgress[art.id] ?? 0
  if (level >= 10) return { state, ok: false, note: '已圓滿', blocked: 'max' }
  const cost = trainPotentialCost(level)
  if (state.potential < cost) {
    return {
      state,
      ok: false,
      note: `潛能不足（需 ${cost}）`,
      blocked: 'no_potential',
    }
  }
  return {
    state: {
      ...state,
      potential: state.potential - cost,
      martialProgress: { ...state.martialProgress, [art.id]: level + 1 },
    },
    ok: true,
    note: `修練「${art.name}」→${level + 1}（-${cost} 潛能）`,
  }
}

/** 按鈕：服回血丹 */
function actUseHpPill(state: GameState): ActResult {
  const inv = consumeItem(state.inventory, MATERIAL_IDS.hpPill, 1)
  if (!inv) return { state, ok: false, note: '無回血丹', blocked: 'no_item' }
  const cleared = clearCombatLoseStreak(state)
  return {
    state: {
      ...cleared,
      inventory: inv,
      stats: {
        ...cleared.stats,
        hp: Math.min(cleared.stats.maxHp, cleared.stats.hp + 40),
      },
    },
    ok: true,
    note: '服回血丹（連敗清零）',
  }
}

/** 按鈕：銀兩買回氣湯 */
function actBuyStaminaSoup(state: GameState): ActResult {
  const offer = SILVER_SHOP.find((o) => o.id === 'shop_stamina_soup')!
  const price = offer.priceSilver ?? 30
  if (state.currency.silver < price) {
    return { state, ok: false, note: '銀兩不足', blocked: 'no_silver' }
  }
  return {
    state: {
      ...state,
      currency: {
        ...state.currency,
        silver: state.currency.silver - price,
      },
      stats: {
        ...state.stats,
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 25),
      },
    },
    ok: true,
    note: `買回氣湯（-${price} 銀｜精力 +25）`,
  }
}

/** 按鈕：模擬儲值 */
function actTopUp(state: GameState, packId: string): ActResult {
  const pack = MOCK_TOPUP_PACKS.find((p) => p.id === packId)
  if (!pack) return { state, ok: false, note: '無方案', blocked: 'data' }
  return {
    state: {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao + pack.yuanbao,
      },
      flags: { ...state.flags, usedMockTopUp: true },
    },
    ok: true,
    note: `模擬儲值 ${pack.label}（+${pack.yuanbao} 元寶）`,
  }
}

/** 按鈕：抽卡 */
function actGacha(state: GameState, count: 1 | 10): ActResult {
  const cost = count === 1 ? GACHA_SINGLE_COST : GACHA_TEN_COST
  if (state.currency.yuanbao < cost) {
    return { state, ok: false, note: `元寶不足（需 ${cost}）`, blocked: 'no_yuanbao' }
  }
  const pulled = pullMany(count, {
    year: state.time.year,
    pityEpic: state.gachaPityEpic,
    pityLegendary: state.gachaPityLegendary,
  })
  let owned = state.ownedEquipment.map((e) => ({ ...e }))
  let seq = state.equipUidSeq
  for (const p of pulled.results) {
    owned.push({
      uid: `eq_${seq++}`,
      defId: p.item.id,
      refineLevel: 0,
      quenched: false,
      poisoned: false,
    })
  }
  return {
    state: {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao - cost,
      },
      ownedEquipment: owned,
      equipUidSeq: seq,
      gachaPityEpic: pulled.pityEpic,
      gachaPityLegendary: pulled.pityLegendary,
      gachaTotalPulls: state.gachaTotalPulls + count,
    },
    ok: true,
    note: `抽卡 ×${count}（-${cost} 元寶｜得 ${pulled.results.length} 件）`,
  }
}

/** 按鈕：了結待辦事件（避開開戰選項優先） */
function actResolvePending(
  state: GameState,
  rng: () => number,
  preferNoCombat = true,
): ActResult {
  const eventId = state.pendingEventId
  if (!eventId) return { state, ok: false, note: '無待辦事件', blocked: 'none' }
  const raw =
    MAIN_STORY_EVENTS.find((e) => e.id === eventId) ??
    ENCOUNTER_EVENTS.find((e) => e.id === eventId) ??
    NG_PLUS_ENCOUNTERS.find((e) => e.id === eventId)
  if (!raw) return { state, ok: false, note: '事件缺失', blocked: 'data' }
  const def = flavorEventForNgPlus(
    raw,
    state.ngPlusCount,
    detectEndingKey(state.flags),
  )
  let choice: StoryEventChoiceDef = pick(rng, def.choices)
  if (preferNoCombat) {
    const safe = def.choices.filter((c) => !c.startCombat)
    if (safe.length) choice = pick(rng, safe)
  }
  const { state: rewarded } = applyRewards(state, choice.rewards)
  let flagged = rewarded
  if (eventId === 'main_y5_wharf') {
    const endingNow = detectEndingKey(rewarded.flags)
    if (endingNow) {
      flagged = {
        ...rewarded,
        flags: { ...rewarded.flags, lastEnding: endingNow },
      }
    }
  }
  const storyFlags = { ...flagged.storyFlags, [eventId]: true }
  const mainDone = [
    'main_y1_xiangyang',
    'main_y2_huashan',
    'main_y3_tomb',
    'main_y4_xuanmu',
    'main_y5_wharf',
  ].every((k) => storyFlags[k])
  const baseNext = {
    ...flagged,
    pendingEventId: null,
    storyFlags,
    lastOutcomeText: choice.outcomeText,
    tradeRouteLevel: flagged.tradeRouteLevel + (choice.tradeBump ?? 0),
    ngPlusReady: flagged.ngPlusReady || mainDone,
  }
  const progressed = eventId.startsWith('main_')
    ? applyMainBeatResolved(baseNext, eventId)
    : ensureStoryRoute(baseNext)
  return {
    state: progressed,
    ok: true,
    note: `了結事件 ${eventId}｜${choice.label}`,
  }
}

/** 按鈕：加入門派＋貢獻一次 */
function actSectOnce(state: GameState): ActResult {
  const sect = SECTS[0]
  if (!sect) return { state, ok: false, note: '無門派', blocked: 'data' }
  let next = state
  if (!next.sectId) {
    next = { ...next, sectId: sect.id, sectContribution: 0 }
  }
  const cost = 20
  if (next.currency.silver < cost) {
    return { state: next, ok: false, note: '銀兩不足貢獻', blocked: 'no_silver' }
  }
  return {
    state: {
      ...next,
      sectContribution: next.sectContribution + 15,
      currency: {
        ...next.currency,
        silver: next.currency.silver - cost,
      },
    },
    ok: true,
    note: `門派貢獻（-${cost} 銀｜貢獻 +15）`,
  }
}

function record(
  steps: StepRecord[],
  op: string,
  before: GameState,
  result: ActResult,
): GameState {
  const s = result.state
  steps.push({
    op,
    ok: result.ok,
    note: result.note,
    blocked: result.blocked,
    silver: s.currency.silver,
    potential: s.potential,
    ap: s.actionPoints,
    stamina: s.stats.stamina,
    hp: s.stats.hp,
    loseStreak: s.combatLoseStreak,
    banditXun: s.banditFightsThisXun,
    period: s.time.period,
  })
  return result.state
}

function finishPath(
  id: string,
  title: string,
  intent: string,
  baseline: ResourceSnap,
  state: GameState,
  steps: StepRecord[],
  flags: PathResult['flags'],
  metrics: PathResult['metrics'],
): PathResult {
  const final = snap(state)
  return {
    id,
    title,
    intent,
    steps,
    baseline,
    final,
    deltas: deltaSnap(baseline, final),
    flags,
    metrics,
  }
}

// —— 路徑劇本 ——

/** A：開場狂點路遇 */
function pathSpamBandit(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  let wins = 0
  let blocks = 0
  for (let i = 0; i < 40; i++) {
    const r = actBandit(state, rng)
    state = record(steps, '路遇', state, r)
    if (r.ok && r.note.includes('勝')) wins++
    if (!r.ok) {
      blocks++
      if (blocks >= 3) break
    } else {
      blocks = 0
    }
  }
  const fought = steps.filter((s) => s.ok && s.op === '路遇').length
  const infiniteFarm = fought >= 10 && state.actionPoints >= baseline.ap
  const notes: string[] = []
  if (fought <= BANDIT_FIGHTS_PER_XUN_MAX) {
    notes.push(`同旬上限生效：成功開戰 ${fought} 場（上限 ${BANDIT_FIGHTS_PER_XUN_MAX}）`)
  } else {
    notes.push(`異常：同旬成功開戰 ${fought} 場超過上限`)
  }
  if (baseline.ap - state.actionPoints < fought * BANDIT_FIGHT_AP_COST) {
    notes.push('異常：AP 扣減少於開戰場次')
  }
  return finishPath(
    'spam-bandit',
    '開場狂點路遇',
    '序章後連點路遇按鈕，檢防刷是否擋住無成本連刷',
    baseline,
    state,
    steps,
    {
      stuck: !steps.some((s) => s.ok),
      infiniteFarm,
      copyMismatch: false,
      notes,
    },
    {
      fightsOk: fought,
      wins,
      deltaSilver: state.currency.silver - baseline.silver,
      deltaPotential: state.potential - baseline.potential,
      deltaAp: state.actionPoints - baseline.ap,
      stopBlock: steps.find((s) => !s.ok)?.blocked ?? '',
    },
  )
}

/** B：推旬回 AP 再刷路遇循環 */
function pathXunBanditLoop(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  let cycles = 0
  let fights = 0
  for (let c = 0; c < 8; c++) {
    let foughtThis = 0
    for (let i = 0; i < 5; i++) {
      const r = actBandit(state, rng)
      state = record(steps, '路遇', state, r)
      if (!r.ok) break
      foughtThis++
      fights++
    }
    const x = actAdvanceXun(state, rng)
    state = record(steps, '推進一旬', state, x)
    if (state.pendingEventId) {
      const ev = actResolvePending(state, rng, true)
      state = record(steps, '了結事件', state, ev)
    }
    cycles++
    if (foughtThis === 0 && state.actionPoints <= 0) break
  }
  const silverPerFight = fights > 0 ? (state.currency.silver - baseline.silver) / fights : 0
  const apNet = state.actionPoints - baseline.ap
  const notes = [
    `循環 ${cycles} 旬、路遇 ${fights} 場`,
    `場均銀約 ${silverPerFight.toFixed(1)}；淨 AP ${apNet}`,
    apNet >= 0 && fights > 6
      ? '警告：循環後 AP 未淨耗，效率偏高'
      : 'AP 淨耗或持平可接受（旬制 +1 抵部分消耗）',
  ]
  return finishPath(
    'xun-bandit-loop',
    '推旬回 AP 再刷路遇',
    '路遇打滿 → 推進旬 → 再打，量化循環效率',
    baseline,
    state,
    steps,
    {
      stuck: fights === 0,
      infiniteFarm: apNet > 0 && fights >= 12,
      copyMismatch: false,
      notes,
    },
    {
      cycles,
      fights,
      silverPerFight: Number(silverPerFight.toFixed(2)),
      apNet,
      silverNet: state.currency.silver - baseline.silver,
      potentialNet: state.potential - baseline.potential,
    },
  )
}

/** C：滿 AP／0 AP 邊界＋連敗鎖定解鎖 */
function pathApAndLoseLock(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  const notes: string[] = []

  // 花光 AP
  while (state.actionPoints > 0) {
    const loc = getLocationById(state.locationId)
    if (loc && loc.gather !== 'none') {
      const g = actGather(state, loc.gather === 'ore' ? 'ore' : 'herb')
      state = record(steps, '採集耗AP', state, g)
      if (!g.ok) break
    } else {
      const b = actBandit(state, rng)
      state = record(steps, '路遇耗AP', state, b)
      if (!b.ok) break
    }
  }
  const zeroApBlock = actBandit(state, rng)
  state = record(steps, '0AP再路遇', state, zeroApBlock)
  const zeroOk = zeroApBlock.blocked === 'no_ap'
  notes.push(zeroOk ? '0 AP 路遇正確阻擋' : `異常：0 AP 阻擋碼=${zeroApBlock.blocked}`)

  // 推旬回 1 AP
  const x = actAdvanceXun(state, rng)
  state = record(steps, '推進一旬回AP', state, x)
  const apAfterXun = state.actionPoints
  notes.push(`推旬後 AP=${apAfterXun}（期望 ≥1）`)

  // 滿 AP：灌滿再推旬應不增
  state = { ...state, actionPoints: state.maxActionPoints }
  steps.push({
    op: '作弊灌滿AP',
    ok: true,
    note: '測試邊界：手動灌滿',
    ap: state.actionPoints,
  })
  const fullBefore = state.actionPoints
  const x2 = actAdvanceXun(state, rng)
  state = record(steps, '滿AP推進旬', state, x2)
  const fullNoGain = state.actionPoints === fullBefore
  notes.push(fullNoGain ? '滿 AP 推進旬不增加：正確' : '異常：滿 AP 仍增加')

  // 連敗鎖定
  state = { ...state, actionPoints: state.maxActionPoints, banditFightsThisXun: 0 }
  for (let i = 0; i < 3; i++) {
    state = forceLoseBandit(state, rng)
    steps.push({
      op: '強制連敗',
      ok: true,
      note: `連敗→${state.combatLoseStreak}`,
      loseStreak: state.combatLoseStreak,
      ap: state.actionPoints,
      hp: state.stats.hp,
      banditXun: state.banditFightsThisXun,
    })
  }
  const locked = actBandit(state, rng)
  state = record(steps, '連敗後路遇', state, locked)
  const lockOk = locked.blocked === 'lose_streak'
  notes.push(lockOk ? '連敗 3 鎖定有效' : `異常：鎖定碼=${locked.blocked}`)

  // 文案：推進旬解鎖
  const unlockXun = actAdvanceXun(state, rng)
  state = record(steps, '旬制解鎖連敗', state, unlockXun)
  const unlockedByXun = state.combatLoseStreak === 0
  notes.push(unlockedByXun ? '推進旬清連敗：與文案一致' : '文案不符：推旬未清連敗')

  // 再鎖一次，服丹解鎖
  state = { ...state, actionPoints: state.maxActionPoints, banditFightsThisXun: 0 }
  for (let i = 0; i < 3; i++) state = forceLoseBandit(state, rng)
  // 塞一顆回血丹
  state = {
    ...state,
    inventory: mergeItem(
      state.inventory,
      makeMaterial(MATERIAL_IDS.hpPill, 1)!,
    ),
  }
  const pill = actUseHpPill(state)
  state = record(steps, '服丹解鎖連敗', state, pill)
  notes.push(
    state.combatLoseStreak === 0
      ? '服丹清連敗：與文案一致'
      : '文案不符：服丹未清連敗',
  )

  // 再鎖，遠行解鎖
  state = {
    ...state,
    actionPoints: state.maxActionPoints,
    banditFightsThisXun: 0,
    combatLoseStreak: 3,
    stats: { ...state.stats, stamina: 80, hp: state.stats.maxHp },
  }
  const links = getLinkedLocations(state.locationId)
  if (links[0]) {
    const tr = actTravel(state, links[0].id)
    state = record(steps, '遠行解鎖連敗', state, tr)
    notes.push(
      state.combatLoseStreak === 0
        ? '遠行清連敗：與文案一致'
        : '文案不符：遠行未清連敗',
    )
  }

  const copyMismatch = notes.some((n) => n.includes('文案不符') || n.includes('異常'))
  return finishPath(
    'ap-lose-lock',
    '滿AP／0AP 與連敗鎖定',
    '驗證 AP 邊界與連敗鎖定／解鎖是否真生效',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: false,
      copyMismatch,
      notes,
    },
    {
      zeroApBlocked: zeroOk,
      fullApNoGain: fullNoGain,
      loseLockWorks: lockOk,
      unlockByXun: unlockedByXun,
    },
  )
}

/** D：無課肝經濟（採集煉丹修練＋旬制，不儲值） */
function pathF2P(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed, 'cat_medical')
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  for (let i = 0; i < 60; i++) {
    if (state.pendingEventId) {
      state = record(steps, '了結事件', state, actResolvePending(state, rng, true))
      continue
    }
    const loc = getLocationById(state.locationId)
    if (state.actionPoints > 0 && loc && loc.gather !== 'none') {
      state = record(
        steps,
        '採集',
        state,
        actGather(state, loc.gather === 'ore' ? 'ore' : 'herb'),
      )
      continue
    }
    if (itemQty(state, MATERIAL_IDS.herb) >= 3) {
      state = record(steps, '煉丹', state, actCraft(state, 'recipe_hp'))
      continue
    }
    if (state.potential >= 2) {
      const t = actTrain(state, rng)
      if (t.ok) {
        state = record(steps, '修練', state, t)
        continue
      }
    }
    if (state.actionPoints > 0) {
      const b = actBandit(state, rng)
      if (b.ok) {
        state = record(steps, '路遇', state, b)
        continue
      }
    }
    state = record(steps, '推進一旬', state, actAdvanceXun(state, rng))
  }
  const usedTopUp = !!state.flags.usedMockTopUp
  const notes = [
    usedTopUp ? '異常：無課路徑動到儲值' : '全程無儲值',
    `銀 ${baseline.silver}→${state.currency.silver}｜潛能 ${baseline.potential}→${state.potential}`,
    `煉丹無 AP：屬材料轉換，成本在採集 AP`,
  ]
  return finishPath(
    'f2p-economy',
    '無課肝經濟',
    '不儲值：採集／煉丹／修練／旬制／路遇循環',
    baseline,
    state,
    steps,
    {
      stuck: state.currency.silver < 0 || state.potential < 0,
      infiniteFarm: false,
      copyMismatch: usedTopUp,
      notes,
    },
    {
      silverNet: state.currency.silver - baseline.silver,
      potentialNet: state.potential - baseline.potential,
      crafts: steps.filter((s) => s.op === '煉丹' && s.ok).length,
      gathers: steps.filter((s) => s.op === '採集' && s.ok).length,
      trains: steps.filter((s) => s.op === '修練' && s.ok).length,
      yuanbao: state.currency.yuanbao,
    },
  )
}

/** E：有課抽卡經濟 */
function pathP2W(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  const pack = MOCK_TOPUP_PACKS.find((p) => p.yuanbao >= 600) ?? MOCK_TOPUP_PACKS[0]
  state = record(steps, '模擬儲值', state, actTopUp(state, pack.id))
  let pulls = 0
  while (state.currency.yuanbao >= GACHA_SINGLE_COST && pulls < 30) {
    const ten = state.currency.yuanbao >= GACHA_TEN_COST && pulls % 3 === 0
    const r = actGacha(state, ten ? 10 : 1)
    state = record(steps, ten ? '十連' : '單抽', state, r)
    pulls += ten ? 10 : 1
  }
  // 順便買回氣／香篆若有元寶店邏輯已在 topup 後抽光；補銀兩店
  state = record(steps, '買回氣湯', state, actBuyStaminaSoup(state))
  return finishPath(
    'p2w-gacha',
    '有課抽卡經濟',
    '模擬儲值後連續抽卡，觀察裝備／元寶曲線',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: false,
      copyMismatch: false,
      notes: [
        `儲值方案 ${pack.label}`,
        `抽數 ${pulls}｜裝備 +${state.ownedEquipment.length - baseline.martialCount}`,
        '模擬儲值不會扣款（體驗用）',
      ],
    },
    {
      pulls,
      equipCount: state.ownedEquipment.length,
      yuanbaoLeft: state.currency.yuanbao,
      yuanbaoSpent: baseline.yuanbao + pack.yuanbao - state.currency.yuanbao,
    },
  )
}

/** F：主線速通 */
function pathMainRush(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  let guard = 0
  while (!state.ngPlusReady && guard < 120) {
    guard++
    if (state.pendingEventId) {
      state = record(steps, '了結事件', state, actResolvePending(state, rng, true))
      continue
    }
    state = record(steps, '推進一旬', state, actAdvanceXun(state, rng))
  }
  return finishPath(
    'main-rush',
    '主線速通',
    '只推旬＋了結主線／奇遇，衝五年 NG+ 就緒',
    baseline,
    state,
    steps,
    {
      stuck: !state.ngPlusReady,
      infiniteFarm: false,
      copyMismatch: false,
      notes: [
        state.ngPlusReady
          ? `NG+ 就緒，步數 ${steps.length}`
          : `未就緒，停於年 ${state.time.year}`,
      ],
    },
    {
      steps: steps.length,
      year: state.time.year,
      ngPlusReady: state.ngPlusReady,
      silverNet: state.currency.silver - baseline.silver,
    },
  )
}

/** G：探索收集 */
function pathExplore(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  const baseline = snap(bootState)
  let state = bootState
  const steps: StepRecord[] = []
  for (let i = 0; i < 50; i++) {
    const links = getLinkedLocations(state.locationId)
    const unknown = links.filter((l) => !state.knownLocationIds.includes(l.id))
    const target = unknown.length ? pick(rng, unknown) : pick(rng, links)
    if (!target) break
    let r = actTravel(state, target.id)
    if (!r.ok && r.blocked === 'no_stamina') {
      const soup = actBuyStaminaSoup(state)
      state = record(steps, '買回氣湯', state, soup)
      if (!soup.ok) {
        state = record(steps, '推進一旬', state, actAdvanceXun(state, rng))
      }
      continue
    }
    state = record(steps, '移動', state, r)
    const loc = getLocationById(state.locationId)
    if (loc && loc.gather !== 'none' && state.actionPoints > 0) {
      state = record(
        steps,
        '採集',
        state,
        actGather(state, loc.gather === 'ore' ? 'ore' : 'herb'),
      )
    }
  }
  return finishPath(
    'explore-collect',
    '探索收集',
    '優先未知地點移動＋採集',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: false,
      copyMismatch: false,
      notes: [
        `已知地點 ${state.knownLocationIds.length}`,
        `草藥 ${itemQty(state, MATERIAL_IDS.herb)}｜礦 ${itemQty(state, MATERIAL_IDS.ore)}`,
      ],
    },
    {
      knownLocations: state.knownLocationIds.length,
      travels: steps.filter((s) => s.op === '移動' && s.ok).length,
      gathers: steps.filter((s) => s.op === '採集' && s.ok).length,
    },
  )
}

/** H：採集／煉丹／修練漏洞探測 */
function pathGatherCraftTrain(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  // 移到可採點
  let state = bootState
  const steps: StepRecord[] = []
  const baseline = snap(state)
  if (getLocationById(state.locationId)?.gather === 'none') {
    const herbLoc = getLinkedLocations(state.locationId).find(
      (l) => getLocationById(l.id)?.gather === 'herb' || getLocationById(l.id)?.gather === 'both',
    )
    if (herbLoc) {
      state = record(steps, '移動至採集點', state, actTravel(state, herbLoc.id))
    }
  }
  const apStart = state.actionPoints
  let gathers = 0
  while (state.actionPoints > 0) {
    const g = actGather(state, 'herb')
    state = record(steps, '採集', state, g)
    if (!g.ok) break
    gathers++
  }
  // 0 AP 再採
  const blocked = actGather(state, 'herb')
  state = record(steps, '0AP採集', state, blocked)
  // 煉丹連點（無 AP）
  let crafts = 0
  while (itemQty(state, MATERIAL_IDS.herb) >= 3 && crafts < 20) {
    const c = actCraft(state, 'recipe_hp')
    state = record(steps, '煉丹', state, c)
    if (!c.ok) break
    crafts++
  }
  let trains = 0
  for (let i = 0; i < 10; i++) {
    const t = actTrain(state, rng)
    state = record(steps, '修練', state, t)
    if (!t.ok) break
    trains++
  }
  const potFromGather = gathers // 每採 +1
  const freeCraft = crafts > 0 // 煉丹本身不耗 AP——預期，但材料有成本
  const notes = [
    `採集 ${gathers} 次耗 AP ${apStart}→${state.actionPoints}，潛能約 +${potFromGather}`,
    blocked.blocked === 'no_ap' ? '0 AP 無法採集：正確' : '異常：0 AP 仍可採',
    freeCraft
      ? '煉丹不耗 AP（材料轉換）；若材料可無成本取得才是洞'
      : '未能煉丹',
    trains > 0 ? `修練 ${trains} 次耗潛能` : '潛能不足無法修練',
  ]
  const infinite =
    gathers > apStart || (blocked.ok && state.actionPoints <= 0)
  return finishPath(
    'gather-craft-train',
    '採集煉丹修練探測',
    '檢查採集／煉丹／修練是否另有無成本漏洞',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: infinite,
      copyMismatch: blocked.blocked !== 'no_ap',
      notes,
    },
    {
      gathers,
      crafts,
      trains,
      pills: itemQty(state, MATERIAL_IDS.hpPill),
      apSpent: apStart - state.actionPoints,
      potentialNet: state.potential - baseline.potential,
    },
  )
}

/** I：移動耗精力 vs 夜間回滿 AP 濫用 */
function pathNightApAbuse(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  let state = bootState
  const steps: StepRecord[] = []
  const baseline = snap(state)

  // 把 AP 花光（採集或路遇）
  while (state.actionPoints > 0) {
    const loc = getLocationById(state.locationId)
    if (loc && loc.gather !== 'none') {
      const g = actGather(state, loc.gather === 'ore' ? 'ore' : 'herb')
      state = record(steps, '耗AP採集', state, g)
      if (!g.ok) break
    } else {
      const b = actBandit(state, rng)
      state = record(steps, '耗AP路遇', state, b)
      if (!b.ok) break
    }
  }
  const apAfterSpend = state.actionPoints
  let nightRestores = 0
  let staminaSpent = 0
  let cycles = 0
  const staminaStart = state.stats.stamina

  // 盡量用短距來回刷夜間回 AP
  for (let c = 0; c < 12; c++) {
    // 走到 night 需要從當前 period 推進
    let moved = 0
    for (let m = 0; m < 8; m++) {
      const links = getLinkedLocations(state.locationId)
      // 偏短耗
      const sorted = [...links].sort((a, b) => a.travelStamina - b.travelStamina)
      const target = sorted[0]
      if (!target) break
      const beforeStamina = state.stats.stamina
      const beforePeriod = state.time.period
      const beforeAp = state.actionPoints
      let r = actTravel(state, target.id)
      if (!r.ok && r.blocked === 'no_stamina') {
        const soup = actBuyStaminaSoup(state)
        state = record(steps, '買回氣湯續航', state, soup)
        if (!soup.ok) break
        continue
      }
      state = record(steps, '移動刷時段', state, r)
      if (!r.ok) break
      moved++
      staminaSpent += beforeStamina - state.stats.stamina
      if (beforePeriod === 'night' && r.ok) {
        nightRestores++
        // 夜間回滿後把 AP 再花掉
        while (state.actionPoints > 0) {
          const loc = getLocationById(state.locationId)
          if (loc && loc.gather !== 'none') {
            const g = actGather(state, loc.gather === 'ore' ? 'ore' : 'herb')
            state = record(steps, '夜間回AP後採集', state, g)
            if (!g.ok) break
          } else break
        }
      }
      if (beforeAp === 0 && state.actionPoints === state.maxActionPoints) {
        // 剛回滿
      }
    }
    cycles++
    if (moved === 0) break
    if (state.stats.stamina < 5 && state.currency.silver < 30) break
  }

  const potGain = state.potential - baseline.potential
  const silverSpentOnSoup = steps.filter((s) => s.op.includes('回氣湯') && s.ok).length * 30
  const abuse =
    nightRestores >= 2 &&
    potGain >= 16 &&
    staminaStart - state.stats.stamina + (silverSpentOnSoup / 30) * 25 < 200
  const notes = [
    `破曉 AP 回復次數 ${nightRestores}`,
    `潛能淨得 ${potGain}｜銀花在湯約 ${silverSpentOnSoup}`,
    `精力 ${staminaStart}→${state.stats.stamina}`,
    abuse
      ? '仍可高速刷採集潛能（需再收）'
      : '破曉僅 +1 AP：短距刷夜不再回滿，未達無腦破經濟',
  ]
  return finishPath(
    'night-ap-abuse',
    '移動夜間回 AP 濫用',
    '花光 AP → 短距推時段至夜間回滿 → 再花 AP',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: abuse,
      copyMismatch: false,
      notes,
    },
    {
      nightRestores,
      potentialNet: potGain,
      soupBuys: steps.filter((s) => s.op.includes('回氣湯') && s.ok).length,
      staminaEnd: state.stats.stamina,
      cycles,
      apAfterFirstSpend: apAfterSpend,
    },
  )
}

/** J：榜單切磋連點 */
function pathSparSpam(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  let state = bootState
  const steps: StepRecord[] = []
  const baseline = snap(state)
  let wins = 0
  for (let i = 0; i < 40; i++) {
    const r = actSpar(state, rng, 35)
    state = record(steps, '切磋', state, r)
    if (!r.ok) break
    if (r.note.includes('勝')) wins++
  }
  const fights = steps.filter((s) => s.ok).length
  const apDelta = state.actionPoints - baseline.ap
  const infiniteFarm = fights >= 20 && apDelta === 0
  const notes = [
    `連點切磋成功 ${fights} 場（勝 ${wins}｜上限期望 ≤${SPAR_FIGHTS_PER_XUN_MAX}）`,
    `AP 變化 ${apDelta}｜銀 +${state.currency.silver - baseline.silver}｜潛能 +${state.potential - baseline.potential}`,
    infiniteFarm
      ? '仍可無成本連刷切磋'
      : `切磋防刷生效（AP／旬上限；成功 ${fights} 場）`,
  ]
  return finishPath(
    'spar-spam',
    '榜單切磋連點',
    '連點切磋按鈕，檢查是否無成本刷獎',
    baseline,
    state,
    steps,
    {
      stuck: fights === 0,
      infiniteFarm,
      copyMismatch: false,
      notes,
    },
    {
      fights,
      wins,
      apDelta,
      silverNet: state.currency.silver - baseline.silver,
      potentialNet: state.potential - baseline.potential,
      sparWins: state.sparWins,
    },
  )
}

/** K：門派貢獻路徑 */
function pathSect(seed: number): PathResult {
  const { state: bootState, rng } = boot(seed)
  let state = bootState
  const steps: StepRecord[] = []
  const baseline = snap(state)
  for (let i = 0; i < 5; i++) {
    // 賺點銀：推旬
    state = record(steps, '推進一旬', state, actAdvanceXun(state, rng))
    if (state.pendingEventId) {
      state = record(steps, '了結事件', state, actResolvePending(state, rng, true))
    }
    state = record(steps, '門派貢獻', state, actSectOnce(state))
  }
  return finishPath(
    'sect-loop',
    '門派貢獻',
    '推旬賺銀後門派貢獻',
    baseline,
    state,
    steps,
    {
      stuck: false,
      infiniteFarm: false,
      copyMismatch: false,
      notes: [`貢獻值 ${state.sectContribution}｜門派 ${state.sectId}`],
    },
    {
      contribution: state.sectContribution,
      silverNet: state.currency.silver - baseline.silver,
    },
  )
}

function main() {
  const paths: PathResult[] = [
    pathSpamBandit(101),
    pathXunBanditLoop(202),
    pathApAndLoseLock(303),
    pathF2P(404),
    pathP2W(505),
    pathMainRush(606),
    pathExplore(707),
    pathGatherCraftTrain(808),
    pathNightApAbuse(909),
    pathSparSpam(1010),
    pathSect(1111),
  ]

  const p0: string[] = []
  const p1: string[] = []
  const ok: string[] = []
  for (const p of paths) {
    if (p.flags.infiniteFarm) p0.push(`${p.id}: ${p.flags.notes.join('；')}`)
    else if (p.flags.copyMismatch || p.flags.stuck) p1.push(`${p.id}: ${p.flags.notes.join('；')}`)
    else ok.push(`${p.id}: 通過`)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    commitHint: 'solid-play multi-path',
    summary: {
      pathCount: paths.length,
      p0Count: p0.length,
      p1Count: p1.length,
      p0,
      p1,
      ok,
    },
    paths: paths.map((p) => ({
      ...p,
      // 步驟可能很長：保留完整供分析
      stepCount: p.steps.length,
    })),
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8')

  console.log('=== 多路徑紮實操作驗收 ===')
  console.log(`路徑數: ${paths.length}`)
  console.log('P0:')
  for (const line of p0) console.log(' -', line)
  if (!p0.length) console.log(' - （無）')
  console.log('P1:')
  for (const line of p1) console.log(' -', line)
  if (!p1.length) console.log(' - （無）')
  console.log('通過:')
  for (const line of ok) console.log(' -', line)
  console.log('寫入', OUT_JSON)
}

main()
