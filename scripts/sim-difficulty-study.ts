/**
 * 困難度與「認真研究感」多樣本模擬
 * - 付費檔：白嫖認真肝／白嫖隨便／小／中／大額
 * - 風格：猛刷路遇、只推主線、亂點支線、卡在探索、無視經濟、戰鬥智／愚
 * - 每風格 ≥30 局；另跑戰鬥策略對照
 *
 * 用法：npm run sim:difficulty
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import { getStoryEventById } from '../src/data/events.ts'
import {
  applyMainBeatResolved,
  resolveAdvanceXunStory,
  ensureStoryRoute,
} from '../src/lib/storyProgress.ts'
import {
  countCompletedBeats,
  FINALE_MIN_BEATS,
} from '../src/data/storyArcs.ts'
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
  EVENT_COMBAT_WIN_POTENTIAL,
  EVENT_COMBAT_WIN_SILVER,
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
import { flavorEventForNgPlus } from '../src/lib/ngPlusStory.ts'
import { applyNightTravelApRestore } from '../src/lib/travelApRules.ts'
import { computePanelStats } from '../src/lib/combatStats.ts'
import type { GameState, InventoryItem, OwnedEquipment } from '../src/types/game.ts'

const OUT_JSON =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/difficulty-study-result.json'

type PayTier = '無課' | '小額' | '中額' | '大額'
type CombatPolicy = 'random' | 'attack_only' | 'skill_spam' | 'smart'

type StyleId =
  | 'f2p_serious'
  | 'f2p_casual'
  | 'f2p_main_only'
  | 'f2p_farm_bandit'
  | 'f2p_side_chaos'
  | 'f2p_explore_stuck'
  | 'f2p_ignore_econ'
  | 'small_main'
  | 'mid_main'
  | 'large_main'
  | 'combat_dumb'
  | 'combat_smart'
  | 'no_martial_train'
  | 'mindless_first_choice'

type StyleDef = {
  id: StyleId
  title: string
  pay: PayTier
  combat: CombatPolicy
  /** 權重：xun / travel / gather / bandit / train / soup / side-ish */
  weights: {
    xun: number
    travel: number
    gather: number
    bandit: number
    train: number
    soup: number
  }
  alwaysFirstChoice?: boolean
  skipTrain?: boolean
  skipGather?: boolean
  skipSoup?: boolean
  maxSteps: number
}

const TIER_BUDGET: Record<
  PayTier,
  { yuanbaoCap: number; approxTwd: number }
> = {
  無課: { yuanbaoCap: 0, approxTwd: 0 },
  小額: { yuanbaoCap: 300, approxTwd: 150 },
  中額: { yuanbaoCap: 980, approxTwd: 470 },
  大額: { yuanbaoCap: 2720, approxTwd: 1260 },
}

const RUNS_PER_STYLE = 36
const ORIGIN_ID = 'cat_tech'
const COMBAT_BENCH_FIGHTS = 120

const STYLES: StyleDef[] = [
  {
    id: 'f2p_serious',
    title: '白嫖認真肝',
    pay: '無課',
    combat: 'smart',
    weights: { xun: 28, travel: 14, gather: 18, bandit: 16, train: 16, soup: 8 },
    maxSteps: 420,
  },
  {
    id: 'f2p_casual',
    title: '白嫖隨便玩',
    pay: '無課',
    combat: 'random',
    weights: { xun: 18, travel: 22, gather: 12, bandit: 18, train: 8, soup: 8 },
    maxSteps: 360,
  },
  {
    id: 'f2p_main_only',
    title: '白嫖只推主線',
    pay: '無課',
    combat: 'random',
    weights: { xun: 85, travel: 5, gather: 2, bandit: 2, train: 2, soup: 4 },
    maxSteps: 280,
  },
  {
    id: 'f2p_farm_bandit',
    title: '白嫖猛刷路遇',
    pay: '無課',
    combat: 'skill_spam',
    weights: { xun: 35, travel: 5, gather: 5, bandit: 45, train: 5, soup: 5 },
    maxSteps: 360,
  },
  {
    id: 'f2p_side_chaos',
    title: '白嫖亂點支線',
    pay: '無課',
    combat: 'random',
    weights: { xun: 12, travel: 30, gather: 20, bandit: 20, train: 8, soup: 10 },
    maxSteps: 400,
  },
  {
    id: 'f2p_explore_stuck',
    title: '白嫖卡在探索',
    pay: '無課',
    combat: 'random',
    weights: { xun: 4, travel: 55, gather: 20, bandit: 10, train: 5, soup: 6 },
    maxSteps: 320,
  },
  {
    id: 'f2p_ignore_econ',
    title: '白嫖無視經濟',
    pay: '無課',
    combat: 'attack_only',
    weights: { xun: 40, travel: 25, gather: 0, bandit: 25, train: 0, soup: 0 },
    skipTrain: true,
    skipGather: true,
    skipSoup: true,
    maxSteps: 360,
  },
  {
    id: 'small_main',
    title: '小額主線節奏',
    pay: '小額',
    combat: 'random',
    weights: { xun: 40, travel: 18, gather: 10, bandit: 12, train: 10, soup: 10 },
    maxSteps: 360,
  },
  {
    id: 'mid_main',
    title: '中額主線節奏',
    pay: '中額',
    combat: 'random',
    weights: { xun: 38, travel: 18, gather: 10, bandit: 12, train: 10, soup: 12 },
    maxSteps: 360,
  },
  {
    id: 'large_main',
    title: '大額主線節奏',
    pay: '大額',
    combat: 'smart',
    weights: { xun: 36, travel: 16, gather: 8, bandit: 14, train: 12, soup: 14 },
    maxSteps: 360,
  },
  {
    id: 'combat_dumb',
    title: '戰鬥無腦普攻',
    pay: '無課',
    combat: 'attack_only',
    weights: { xun: 30, travel: 10, gather: 10, bandit: 35, train: 5, soup: 10 },
    maxSteps: 360,
  },
  {
    id: 'combat_smart',
    title: '戰鬥會讀招式',
    pay: '無課',
    combat: 'smart',
    weights: { xun: 30, travel: 10, gather: 10, bandit: 35, train: 5, soup: 10 },
    maxSteps: 360,
  },
  {
    id: 'no_martial_train',
    title: '從不修練武學',
    pay: '無課',
    combat: 'random',
    weights: { xun: 45, travel: 15, gather: 10, bandit: 20, train: 0, soup: 10 },
    skipTrain: true,
    maxSteps: 360,
  },
  {
    id: 'mindless_first_choice',
    title: '無腦連點（首選＋普攻）',
    pay: '無課',
    combat: 'attack_only',
    weights: { xun: 70, travel: 8, gather: 0, bandit: 12, train: 0, soup: 10 },
    alwaysFirstChoice: true,
    skipTrain: true,
    skipGather: true,
    maxSteps: 280,
  },
]

type Counters = {
  grind: number
  skip: number
  decision: number
  other: number
  combatWins: number
  combatLosses: number
  eventChoices: number
  apBlocks: number
  hpBottomHits: number
  softLockHits: number
  xunAdvanced: number
  trainSteps: number
  skillActions: number
  attackActions: number
  healActions: number
  topupYuanbao: number
  yuanbaoSpent: number
  monthlyClaims: number
  gachaPulls: number
  convenienceBuys: number
  charmBuys: number
  storyCombatWins: number
  storyCombatLosses: number
}

type RunResult = {
  style: StyleId
  seed: number
  steps: number
  cleared: boolean
  cyclesCompleted: number
  storyYear: number
  calendarXunProxy: number
  beatsDone: number
  finaleEligible: boolean
  combatWinRate: number | null
  storyCombatWinRate: number | null
  deathsProxy: number
  softLocked: boolean
  cannotProgress: boolean
  apStarveRate: number
  mindlessClear: boolean
  eventChoices: number
  decisionOps: number
  trainSteps: number
  skillShare: number | null
  paidAtk: number
  panelAtkEnd: number
  locationsKnown: number
  crashed: boolean
  stallBeats: number
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

function weightedKey(
  rng: () => number,
  weights: Record<string, number>,
): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  let total = 0
  for (const [, w] of entries) total += w
  let roll = rng() * total
  for (const [k, w] of entries) {
    roll -= w
    if (roll < 0) return k
  }
  return entries[entries.length - 1]?.[0] ?? 'xun'
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
    combatWins: 0,
    combatLosses: 0,
    eventChoices: 0,
    apBlocks: 0,
    hpBottomHits: 0,
    softLockHits: 0,
    xunAdvanced: 0,
    trainSteps: 0,
    skillActions: 0,
    attackActions: 0,
    healActions: 0,
    topupYuanbao: 0,
    yuanbaoSpent: 0,
    monthlyClaims: 0,
    gachaPulls: 0,
    convenienceBuys: 0,
    charmBuys: 0,
    storyCombatWins: 0,
    storyCombatLosses: 0,
  }
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
    playerName: '難度測',
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

function applyPrologue(state: GameState, rng: () => number, firstOnly: boolean): GameState {
  const prologue = getPrologueEvent()
  const choice = firstOnly ? prologue.choices[0] : pick(rng, prologue.choices)
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

function chooseCombatAction(
  combat: CombatState,
  policy: CombatPolicy,
  rng: () => number,
  c: Counters,
): CombatActionKind {
  const player = combat.allies.find((a) => a.isPlayer)
  if (policy === 'attack_only') {
    c.attackActions++
    return 'attack'
  }
  if (policy === 'skill_spam') {
    c.skillActions++
    return 'skill'
  }
  if (policy === 'smart') {
    if (player && player.hp < player.maxHp * 0.42) {
      c.healActions++
      return 'tactic_aid'
    }
    if (player && player.hp < player.maxHp * 0.55 && rng() < 0.35) {
      c.healActions++
      return 'defend'
    }
    if (rng() < 0.72) {
      c.skillActions++
      return 'skill'
    }
    if (rng() < 0.5) {
      c.attackActions++
      return 'attack'
    }
    c.skillActions++
    return 'tactic_flash'
  }
  const actions: CombatActionKind[] = [
    'attack',
    'skill',
    'tactic_flash',
    'tactic_aid',
    'defend',
  ]
  const a = pick(rng, actions)
  if (a === 'skill') c.skillActions++
  else if (a === 'attack') c.attackActions++
  else if (a === 'tactic_aid') c.healActions++
  return a
}

function runCombat(
  encounter: CombatState,
  rng: () => number,
  policy: CombatPolicy,
  c: Counters,
): CombatState {
  let combat = encounter
  let guard = 0
  while (!combat.finished && guard < 90) {
    guard++
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    combat = performPlayerAction(
      combat,
      chooseCombatAction(combat, policy, rng, c),
      target,
    )
  }
  return combat
}

function applyCombatRewards(
  state: GameState,
  combat: CombatState,
  kind: 'bandit' | 'event' = 'bandit',
): GameState {
  if (!combat.finished) return state
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    const reward =
      kind === 'event'
        ? {
            silver: EVENT_COMBAT_WIN_SILVER,
            potential: EVENT_COMBAT_WIN_POTENTIAL,
          }
        : banditWinRewards(state.banditFightsThisXun)
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
    c.other++
    return state
  }
  const target = pick(rng, links)
  const usePass = state.travelPassCharges > 0
  const cost = usePass
    ? Math.max(1, Math.ceil(target.travelStamina / 2))
    : target.travelStamina
  if (state.stats.stamina < cost) {
    c.grind++
    return {
      ...state,
      stats: {
        ...state.stats,
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 20),
      },
    }
  }
  if (usePass) c.skip++
  else c.grind++
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
    if (state.actionPoints < 1) c.apBlocks++
    c.other++
    return state
  }
  c.grind++
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
  c.grind++
  c.xunAdvanced++
  const routed = ensureStoryRoute(state)
  let xun = routed.time.xun + 1
  let month = routed.time.month
  let year = routed.time.year
  let day = routed.time.day + 10
  if (xun > 2) {
    xun = 0
    month += 1
    if (month > 12) month = 1
  }
  const tradeSilver = 5 + routed.tradeRouteLevel * 8
  const story = resolveAdvanceXunStory(
    routed,
    { year, month, day, period: 'noon', xun },
    routed.pendingEventId,
    rng(),
  )
  return {
    ...routed,
    actionPoints: Math.min(routed.maxActionPoints, routed.actionPoints + 1),
    time: story.time,
    currency: {
      ...routed.currency,
      silver: routed.currency.silver + tradeSilver,
    },
    rumors: story.rumors,
    pendingEventId: story.pendingEventId,
    unlockedArcIds: story.unlockedArcIds,
    xunsSinceLastBeat: story.xunsSinceLastBeat,
    combatLoseStreak: 0,
    banditFightsThisXun: 0,
    sparFightsThisXun: 0,
  }
}

function stepResolveEvent(
  state: GameState,
  rng: () => number,
  c: Counters,
  style: StyleDef,
): GameState {
  const eventId = state.pendingEventId
  if (!eventId) {
    c.other++
    return state
  }
  const raw = getStoryEventById(eventId)
  if (!raw || !raw.choices.length) {
    c.decision++
    return { ...state, pendingEventId: null }
  }
  c.decision++
  c.eventChoices++
  const def = flavorEventForNgPlus(raw, state.ngPlusCount)
  const choice = style.alwaysFirstChoice
    ? def.choices[0]
    : pick(rng, def.choices)
  const { state: rewarded } = applyRewards(state, choice.rewards)
  const storyFlags = { ...rewarded.storyFlags, [eventId]: true }
  const mainDone = Boolean(storyFlags['main_y5_wharf'])
  const baseNext: GameState = {
    ...rewarded,
    pendingEventId: null,
    storyFlags,
    lastOutcomeText: choice.outcomeText,
    tradeRouteLevel: rewarded.tradeRouteLevel + (choice.tradeBump ?? 0),
    ngPlusReady: rewarded.ngPlusReady || mainDone,
  }
  let next: GameState =
    eventId.startsWith('main_') || eventId.startsWith('arc_')
      ? applyMainBeatResolved(baseNext, eventId)
      : ensureStoryRoute(baseNext)
  if (choice.startCombat) {
    const enc = makeBanditEncounter(
      buildPlayerCombatant(next),
      buildPartyCombatants(next),
      { loseStreak: next.combatLoseStreak, year: next.time.year },
    )
    const combat = runCombat(enc, rng, style.combat, c)
    if (combat.finished) {
      if (combat.victory) {
        c.combatWins++
        c.storyCombatWins++
      } else {
        c.combatLosses++
        c.storyCombatLosses++
        c.hpBottomHits++
      }
    }
    next = applyCombatRewards(next, combat, 'event')
  }
  return next
}

function stepBandit(
  state: GameState,
  rng: () => number,
  c: Counters,
  style: StyleDef,
): GameState {
  const block = getBanditStartBlock(state)
  if (block) {
    c.grind++
    if (block === 'no_ap') c.apBlocks++
    if (block === 'xun_cap') {
      return stepAdvanceXun(state, rng, c)
    }
    return {
      ...state,
      combatLoseStreak: block === 'lose_streak' ? 0 : state.combatLoseStreak,
      actionPoints:
        block === 'no_ap'
          ? Math.min(state.maxActionPoints, state.actionPoints + 1)
          : state.actionPoints,
      stats: {
        ...state.stats,
        hp: Math.min(
          state.stats.maxHp,
          state.stats.hp + Math.floor(state.stats.maxHp * 0.2),
        ),
        stamina: Math.min(state.stats.maxStamina, state.stats.stamina + 12),
      },
    }
  }
  c.decision++
  let next = applyBanditFightStartCost(state)
  const enc = makeBanditEncounter(
    buildPlayerCombatant(next),
    buildPartyCombatants(next),
    { loseStreak: next.combatLoseStreak, year: next.time.year },
  )
  const combat = runCombat(enc, rng, style.combat, c)
  if (combat.finished) {
    if (combat.victory) c.combatWins++
    else {
      c.combatLosses++
      c.hpBottomHits++
    }
  }
  return applyCombatRewards(next, combat)
}

function stepTrain(state: GameState, c: Counters): GameState {
  const known = MARTIAL_ARTS.filter((m) => (state.martialProgress[m.id] ?? 0) > 0)
  if (!known.length || state.potential < 2) {
    c.other++
    return state
  }
  const art = known[0]
  const lv = state.martialProgress[art.id] ?? 1
  if (lv >= 10) {
    c.other++
    return state
  }
  const cost = trainPotentialCost(lv)
  if (state.potential < cost) {
    c.other++
    return state
  }
  c.grind++
  c.trainSteps++
  return {
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: lv + 1 },
  }
}

function stepSilverSoup(state: GameState, c: Counters): GameState {
  const offer = SILVER_SHOP.find((o) => o.id === 'shop_stamina_soup')
  if (!offer) return state
  const price = offer.priceSilver ?? 30
  if (state.currency.silver < price) {
    c.other++
    return state
  }
  c.grind++
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
  c.other++
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
  c.skip++
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
    c.skip++
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
    c.skip++
    c.convenienceBuys++
  } else if (offer.id === 'shop_potential_pack') {
    next = { ...next, potential: next.potential + 18 }
    c.skip++
    c.convenienceBuys++
  } else if (offer.id === 'shop_stamina_elixir') {
    next = { ...next, stats: { ...next.stats, stamina: next.stats.maxStamina } }
    c.skip++
    c.convenienceBuys++
  } else if (offer.id === 'shop_ap_incense') {
    next = {
      ...next,
      actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 4),
    }
    c.skip++
    c.convenienceBuys++
  } else if (offer.id === 'shop_travel_pass') {
    next = { ...next, travelPassCharges: next.travelPassCharges + 8 }
    c.skip++
    c.convenienceBuys++
  } else if (offer.id === 'shop_combat_charm') {
    if (next.paidAtkBonus >= 6 && next.paidDefBonus >= 6) return null
    next = {
      ...next,
      paidAtkBonus: Math.min(6, next.paidAtkBonus + 1),
      paidDefBonus: Math.min(6, next.paidDefBonus + 1),
    }
    c.other++
    c.charmBuys++
  } else if (offer.kind === 'cosmetic') {
    const id = 'cosmetic_rain_temple'
    next = {
      ...next,
      cosmetics: next.cosmetics.includes(id)
        ? next.cosmetics
        : [...next.cosmetics, id],
    }
    c.other++
  } else {
    c.other++
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
  c.other++
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

function stepPaidEconomy(
  state: GameState,
  tier: PayTier,
  rng: () => number,
  c: Counters,
): GameState {
  let s = claimMonthlyIfDue(state, c)
  if (c.topupYuanbao < TIER_BUDGET[tier].yuanbaoCap) {
    const needMonth = tier === '中額' || tier === '大額'
    return tryTopUp(s, tier, c, needMonth)
  }
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
    if (s.currency.yuanbao >= GACHA_SINGLE_COST && rng() < 0.2) {
      const n = doGacha(s, false, c)
      if (n) return n
    }
    c.other++
    return s
  }
  if (tier === '中額') {
    if (s.monthlyCardCharges < 10) {
      const n = buyOffer(s, 'shop_monthly_pass', c)
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
    if (s.currency.yuanbao >= GACHA_TEN_COST && rng() < 0.25) {
      const n = doGacha(s, true, c)
      if (n) return n
    }
    c.other++
    return s
  }
  if (s.monthlyCardCharges < 25) {
    const n = buyOffer(s, 'shop_monthly_pass', c)
    if (n) return n
  }
  if (c.convenienceBuys < 5) {
    const n = buyOffer(s, 'shop_convenience_kit', c)
    if (n) return n
  }
  if (s.paidAtkBonus < 6 && rng() < 0.4) {
    const n = buyOffer(s, 'shop_combat_charm', c)
    if (n) return n
  }
  if (s.currency.yuanbao >= GACHA_TEN_COST) {
    const n = doGacha(s, true, c)
    if (n) return n
  }
  c.other++
  return s
}

function runOne(style: StyleDef, seed: number): RunResult {
  const rng = mulberry32(seed)
  const c = emptyCounters()
  let state = applyPrologue(
    applyOrigin(createInitialGameState()),
    rng,
    !!style.alwaysFirstChoice,
  )
  let steps = 0
  let crashed = false
  let cyclesCompleted = 0
  let lastBeats = 0
  let stallBeats = 0
  let softLocked = false
  let cannotProgress = false

  try {
    if (style.pay !== '無課') {
      for (let i = 0; i < 16; i++) {
        const before = c.topupYuanbao + c.yuanbaoSpent + c.convenienceBuys
        state = stepPaidEconomy(state, style.pay, rng, c)
        const after = c.topupYuanbao + c.yuanbaoSpent + c.convenienceBuys
        if (after === before && c.topupYuanbao >= TIER_BUDGET[style.pay].yuanbaoCap)
          break
      }
    }

    while (steps < style.maxSteps && cyclesCompleted < 1) {
      steps++
      const beatsBefore = countCompletedBeats(state)
      const economyChance =
        style.pay === '無課'
          ? 0
          : style.pay === '小額'
            ? 0.06
            : style.pay === '中額'
              ? 0.1
              : 0.14

      if (style.pay !== '無課' && rng() < economyChance) {
        state = stepPaidEconomy(state, style.pay, rng, c)
      } else if (state.pendingEventId) {
        state = stepResolveEvent(state, rng, c, style)
      } else if (canSettleNgPlus(state) && state.storyFlags['main_y5_wharf']) {
        c.decision++
        cyclesCompleted++
        break
      } else {
        const w = { ...style.weights }
        if (style.skipGather) w.gather = 0
        if (style.skipTrain) w.train = 0
        if (style.skipSoup) w.soup = 0
        const act = weightedKey(rng, w)
        if (act === 'xun') state = stepAdvanceXun(state, rng, c)
        else if (act === 'travel') state = stepTravel(state, rng, c)
        else if (act === 'gather') state = stepGather(state, rng, c)
        else if (act === 'bandit') state = stepBandit(state, rng, c, style)
        else if (act === 'train') state = stepTrain(state, c)
        else if (act === 'soup') state = stepSilverSoup(state, c)
        else state = stepAdvanceXun(state, rng, c)
      }

      if (style.pay === '中額' || style.pay === '大額') {
        state = claimMonthlyIfDue(state, c)
      }

      if (state.stats.hp <= 0) {
        c.hpBottomHits++
        state = {
          ...state,
          stats: {
            ...state.stats,
            hp: Math.max(1, Math.floor(state.stats.maxHp * 0.4)),
          },
        }
      }

      const beatsNow = countCompletedBeats(state)
      if (beatsNow === lastBeats) stallBeats++
      else {
        lastBeats = beatsNow
        stallBeats = 0
      }
      if (stallBeats > 90 && beatsNow < FINALE_MIN_BEATS) {
        c.softLockHits++
        softLocked = true
      }
      if (softLocked && stallBeats > 140) {
        cannotProgress = true
        break
      }

      // 探索卡死偵測：幾乎不推旬導致節拍不長
      if (
        style.id === 'f2p_explore_stuck' &&
        steps > 200 &&
        beatsNow < 3 &&
        c.xunAdvanced < 15
      ) {
        softLocked = true
        cannotProgress = true
        break
      }
    }
  } catch {
    crashed = true
  }

  const fights = c.combatWins + c.combatLosses
  const storyFights = c.storyCombatWins + c.storyCombatLosses
  const actionTotal = c.skillActions + c.attackActions + c.healActions
  const cleared = cyclesCompleted >= 1 || !!state.storyFlags['main_y5_wharf']
  const mindlessClear =
    cleared &&
    !!style.alwaysFirstChoice &&
    style.combat === 'attack_only' &&
    c.trainSteps === 0

  const panel = computePanelStats(state)
  return {
    style: style.id,
    seed,
    steps,
    cleared,
    cyclesCompleted,
    storyYear: state.time.year,
    calendarXunProxy: c.xunAdvanced,
    beatsDone: countCompletedBeats(state),
    finaleEligible: countCompletedBeats(state) >= FINALE_MIN_BEATS,
    combatWinRate: fights
      ? Math.round((c.combatWins / fights) * 1000) / 10
      : null,
    storyCombatWinRate: storyFights
      ? Math.round((c.storyCombatWins / storyFights) * 1000) / 10
      : null,
    deathsProxy: c.hpBottomHits,
    softLocked,
    cannotProgress,
    apStarveRate: steps
      ? Math.round((c.apBlocks / steps) * 1000) / 10
      : 0,
    mindlessClear,
    eventChoices: c.eventChoices,
    decisionOps: c.decision,
    trainSteps: c.trainSteps,
    skillShare: actionTotal
      ? Math.round((c.skillActions / actionTotal) * 1000) / 10
      : null,
    paidAtk: state.paidAtkBonus,
    panelAtkEnd: panel.attack,
    locationsKnown: state.knownLocationIds.length,
    crashed,
    stallBeats,
  }
}

/** 戰鬥策略微基準：同面板、同年分，只改操作 */
function combatBench(): Record<string, unknown> {
  const policies: CombatPolicy[] = [
    'attack_only',
    'skill_spam',
    'smart',
    'random',
  ]
  const years = [1, 3, 5]
  const out: Record<string, unknown> = {}
  for (const year of years) {
    const row: Record<string, unknown> = {}
    for (const policy of policies) {
      let wins = 0
      let losses = 0
      let turns = 0
      for (let i = 0; i < COMBAT_BENCH_FIGHTS; i++) {
        const rng = mulberry32(9000 + year * 1000 + policies.indexOf(policy) * 200 + i)
        const c = emptyCounters()
        const base = applyPrologue(
          applyOrigin(createInitialGameState()),
          rng,
          false,
        )
        // 輕推年分面板感：略加攻擊模擬進度
        const progressed: GameState = {
          ...base,
          time: { ...base.time, year },
          stats: {
            ...base.stats,
            attack: base.stats.attack + (year - 1) * 2,
            defense: base.stats.defense + (year - 1),
            maxHp: base.stats.maxHp + (year - 1) * 8,
            hp: base.stats.maxHp + (year - 1) * 8,
          },
          potential: base.potential + (year - 1) * 12,
        }
        let trained = progressed
        if (policy === 'smart' || policy === 'skill_spam') {
          for (let t = 0; t < 4 + year; t++) trained = stepTrain(trained, c)
        }
        const enc = makeBanditEncounter(
          buildPlayerCombatant(trained),
          buildPartyCombatants(trained),
          { loseStreak: 0, year },
        )
        const combat = runCombat(enc, rng, policy, c)
        turns += combat.turn
        if (combat.victory) wins++
        else losses++
      }
      const total = wins + losses || 1
      row[policy] = {
        wins,
        losses,
        winRate: Math.round((wins / total) * 1000) / 10,
        avgTurns: Math.round((turns / total) * 10) / 10,
      }
    }
    out[`year${year}`] = row
  }
  return out
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

function summarizeStyle(style: StyleDef, runs: RunResult[]) {
  const cleared = runs.filter((r) => r.cleared)
  const soft = runs.filter((r) => r.softLocked).length
  const stuck = runs.filter((r) => r.cannotProgress).length
  const crash = runs.filter((r) => r.crashed).length
  const mindless = runs.filter((r) => r.mindlessClear).length
  const winRates = runs
    .map((r) => r.combatWinRate)
    .filter((n): n is number => n != null)
  const storyWin = runs
    .map((r) => r.storyCombatWinRate)
    .filter((n): n is number => n != null)
  const stepsCleared = cleared.map((r) => r.steps)
  const xunCleared = cleared.map((r) => r.calendarXunProxy)
  const deaths = runs.map((r) => r.deathsProxy)
  const ap = runs.map((r) => r.apStarveRate)
  const beats = runs.map((r) => r.beatsDone)
  return {
    id: style.id,
    title: style.title,
    pay: style.pay,
    combat: style.combat,
    n: runs.length,
    clearRate: Math.round((cleared.length / runs.length) * 1000) / 10,
    softLockRate: Math.round((soft / runs.length) * 1000) / 10,
    cannotProgressRate: Math.round((stuck / runs.length) * 1000) / 10,
    crashRate: Math.round((crash / runs.length) * 1000) / 10,
    mindlessClearRate: Math.round((mindless / runs.length) * 1000) / 10,
    medianStepsToClear: median(stepsCleared),
    avgStepsToClear: avg(stepsCleared),
    medianXunToClear: median(xunCleared),
    avgXunToClear: avg(xunCleared),
    avgCombatWinRate: avg(winRates),
    avgStoryCombatWinRate: avg(storyWin),
    avgDeathsProxy: avg(deaths),
    avgApStarveRate: avg(ap),
    avgBeatsDone: avg(beats),
    avgEventChoices: avg(runs.map((r) => r.eventChoices)),
    avgTrainSteps: avg(runs.map((r) => r.trainSteps)),
    avgPanelAtk: avg(runs.map((r) => r.panelAtkEnd)),
    avgLocations: avg(runs.map((r) => r.locationsKnown)),
  }
}

function main() {
  const allRuns: RunResult[] = []
  const byStyle: Record<string, ReturnType<typeof summarizeStyle>> = {}

  for (const style of STYLES) {
    const runs: RunResult[] = []
    for (let i = 0; i < RUNS_PER_STYLE; i++) {
      const seed = 41000 + STYLES.indexOf(style) * 1000 + i
      runs.push(runOne(style, seed))
    }
    allRuns.push(...runs)
    byStyle[style.id] = summarizeStyle(style, runs)
    const s = byStyle[style.id]
    console.log(
      `${style.id}: clear ${s.clearRate}% soft ${s.softLockRate}% win ${s.avgCombatWinRate}% xunMed ${s.medianXunToClear}`,
    )
  }

  const bench = combatBench()
  console.log('combatBench', JSON.stringify(bench))

  // 核心問題判讀
  const mindless = byStyle.mindless_first_choice
  const mainOnly = byStyle.f2p_main_only
  const explore = byStyle.f2p_explore_stuck
  const dumb = byStyle.combat_dumb
  const smart = byStyle.combat_smart
  const large = byStyle.large_main
  const serious = byStyle.f2p_serious

  const year1 = (bench as { year1: Record<string, { winRate: number }> }).year1
  const year5 = (bench as { year5: Record<string, { winRate: number }> }).year5
  const runCombatDelta = Math.round(
    ((smart.avgCombatWinRate ?? 0) - (dumb.avgCombatWinRate ?? 0)) * 10,
  ) / 10
  const benchDeltaY5 = Math.round(
    (year5.skill_spam.winRate - year5.attack_only.winRate) * 10,
  ) / 10

  const answers = {
    A_difficulty: {
      verdict: '',
      evidence: [] as string[],
    },
    B_study_feel: {
      verdict: '',
      evidence: [] as string[],
    },
  }

  // A
  const aEv: string[] = []
  if (mindless.clearRate >= 90) {
    aEv.push(
      `無腦連點通關率 ${mindless.clearRate}%（中位 ${mindless.medianStepsToClear} 步／${mindless.medianXunToClear} 旬）→ 主線結局門檻偏易`,
    )
  }
  if (mainOnly.clearRate >= 95) {
    aEv.push(
      `只推主線通關率 ${mainOnly.clearRate}% → 不需支線／經濟即可破關`,
    )
  }
  if (explore.cannotProgressRate >= 50) {
    aEv.push(
      `卡在探索無法推進 ${explore.cannotProgressRate}% → 探索向易「節奏軟鎖」（少推旬），非崩潰`,
    )
  }
  aEv.push(
    `大額通關 ${large.clearRate}%、戰鬥勝率 ${large.avgCombatWinRate}%；課金不跳事件決策`,
  )
  if (Math.abs(runCombatDelta) >= 15) {
    aEv.push(
      `戰鬥愚／智勝率差 ${runCombatDelta}pt → 戰鬥有理解門檻，但通關率皆 ${dumb.clearRate}%／${smart.clearRate}%`,
    )
  }
  answers.A_difficulty.evidence = aEv
  answers.A_difficulty.verdict =
    mindless.clearRate >= 90 && mainOnly.clearRate >= 95
      ? '主線難度偏易（推旬＋事件即可過）；戰鬥／探索有摩擦但不擋結局。課金買便利非買跳關。無 P0 崩潰；探索少推旬會卡節奏。'
      : '混合：部分風格受阻，需看分風格表。'

  // B
  const bEv: string[] = []
  bEv.push(
    `路遇基準年1：普攻 ${year1.attack_only.winRate}%／絕招 ${year1.skill_spam.winRate}%；年5：普攻 ${year5.attack_only.winRate}%／絕招 ${year5.skill_spam.winRate}%（Δ ${benchDeltaY5}pt）`,
  )
  bEv.push(
    `長局戰鬥愚／智：勝率 ${dumb.avgCombatWinRate}% / ${smart.avgCombatWinRate}%（Δ ${runCombatDelta}pt）；通關皆 ${dumb.clearRate}%`,
  )
  bEv.push(
    `無腦首選通關 ${mindless.clearRate}% → 選項文案研究非通關必要`,
  )
  bEv.push(
    `認真肝通關 ${serious.clearRate}%（中位 ${serious.medianXunToClear} 旬）vs 隨便玩 ${byStyle.f2p_casual.clearRate}%`,
  )
  bEv.push(
    `從不修練仍通關 ${byStyle.no_martial_train.clearRate}%（勝率 ${byStyle.no_martial_train.avgCombatWinRate}%）→ 武學研究回報在戰績／資源，非結局鎖`,
  )
  if (runCombatDelta >= 12 || benchDeltaY5 >= 8) {
    bEv.push('戰鬥招式／急救／武學配置有可感回報（研究有用）')
  } else {
    bEv.push('戰鬥招式選擇回報仍偏弱')
  }
  answers.B_study_feel.evidence = bEv
  answers.B_study_feel.verdict =
    mindless.clearRate >= 90
      ? runCombatDelta >= 12 || benchDeltaY5 >= 8
        ? '通關不需認真研究（連點可過）；研究回報在戰鬥勝率、少連敗鎖定、事件戰勝場加碼與武學絕招倍率，而非結局門檻。'
        : '通關不需認真研究；戰鬥差異偏小，研究回報不足。'
      : '通關需要一定路線理解。'

  const payload = {
    generatedAt: new Date().toISOString(),
    commitHint: 'difficulty-study',
    meta: {
      runsPerStyle: RUNS_PER_STYLE,
      styles: STYLES.length,
      totalRuns: allRuns.length,
      combatBenchFightsPerCell: COMBAT_BENCH_FIGHTS,
      originId: ORIGIN_ID,
      finaleMinBeats: FINALE_MIN_BEATS,
    },
    answers,
    byStyle,
    combatBench: bench,
    runs: allRuns,
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2))
  console.log('wrote', OUT_JSON)
  console.log(JSON.stringify(answers, null, 2))
}

main()
