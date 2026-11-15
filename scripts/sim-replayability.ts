/**
 * 千人次耐玩性模擬：100 人設 × 各 10 局（約 1000 局）
 * 用法：npx --yes tsx scripts/sim-replayability.ts
 * 或：npm run sim:replayability
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import {
  ENCOUNTER_EVENTS,
  MAIN_STORY_EVENTS,
  getStoryEventById,
} from '../src/data/events.ts'
import {
  applyMainBeatResolved,
  ensureStoryRoute,
  resolveAdvanceXunStory,
} from '../src/lib/storyProgress.ts'
import {
  getLinkedLocations,
  getLocationById,
  LOCATIONS,
} from '../src/data/locations.ts'
import { getEquipmentById, refineCostForLevel, EQUIPMENTS } from '../src/data/equipments.ts'
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
  applyBanditFightStartCost,
  banditWinRewards,
  getBanditStartBlock,
} from '../src/lib/banditEncounterRules.ts'
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
import {
  detectEndingKey,
  flavorEventForNgPlus,
  NG_PLUS_ENCOUNTERS,
} from '../src/lib/ngPlusStory.ts'
import {
  COMBAT_MARTIAL_POOL,
  LOCATION_MARTIAL_FINDS,
  SECT_MARTIAL_GRANTS,
  grantMartialArts,
  pickUnknownMartial,
} from '../src/lib/martialUnlock.ts'
import { migrateSaveData } from '../src/lib/saveManager.ts'
import { computePanelStats } from '../src/lib/combatStats.ts'
import type { GameState, InventoryItem, OwnedEquipment } from '../src/types/game.ts'
import { TECH_ID_POISON, TECH_ID_QUENCH } from '../src/types/game.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

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

// —— 人設維度 ——
type AgeBand = '少年' | '青年' | '中年' | '老年'
type Gender = 'male' | 'female' | 'unspecified'
type PlayStyle =
  | '主線衝關'
  | '探索收集'
  | '戰鬥肝'
  | '養成煉丹'
  | '社交門派'
  | '休閒隨緣'
  | '抽卡課金'
  | '純免費'
type PayTier = '無課' | '小額' | '中額' | '大額'

type Persona = {
  id: number
  ageBand: AgeBand
  gender: Gender
  playStyle: PlayStyle
  payTier: PayTier
  originId: string
  originName: string
  jobTitle: string
}

type ChurnReason =
  | '完成三週目'
  | '步數上限'
  | '主線停滯'
  | '重複倦怠'
  | '資源崩盤'
  | '戰敗過多'
  | '崩潰'

type CycleMarks = {
  /** 當前週目內：完成主線年 N 時的全域步數 */
  mainYearSteps: Partial<Record<1 | 2 | 3 | 4 | 5, number>>
  /** 完成一整輪五年主線（可結算 NG+）時的步數 */
  cycleCompleteStep?: number
}

type RunResult = {
  personaId: number
  runIndex: number
  seed: number
  steps: number
  crashed: boolean
  churnReason: ChurnReason
  cyclesCompleted: number
  /** 週目 1/2/3 完成步數（五年主線畢） */
  cycleCompleteSteps: number[]
  /** 各週目內主線年完成步數（相對該週目起點） */
  perCycleMainYears: CycleMarks[]
  combatWins: number
  combatLosses: number
  hpBottomHits: number
  resourceCrashHits: number
  topupCount: number
  yuanbaoSpent: number
  silverEnd: number
  yuanbaoEnd: number
  locationsVisited: string[]
  eventsSeen: string[]
  outcomeTexts: string[]
  equipObtained: string[]
  martialSeen: string[]
  dropKeys: string[]
  findings: { code: string; severity: string; message: string }[]
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

function weightedPick<T>(rng: () => number, items: T[], weights: number[]): T {
  let total = 0
  for (const w of weights) total += Math.max(0, w)
  if (total <= 0) return pick(rng, items)
  let roll = rng() * total
  for (let i = 0; i < items.length; i++) {
    roll -= Math.max(0, weights[i])
    if (roll < 0) return items[i]
  }
  return items[items.length - 1]
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

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo)
}

function statsOf(values: number[]) {
  if (!values.length) {
    return { n: 0, mean: null as number | null, median: null as number | null, p25: null as number | null, p75: null as number | null, p90: null as number | null, min: null as number | null, max: null as number | null }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return {
    n: values.length,
    mean: Math.round(mean * 10) / 10,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

function buildPersonas(rng: () => number): Persona[] {
  const ages: AgeBand[] = ['少年', '青年', '中年', '老年']
  const genders: Gender[] = ['male', 'female', 'unspecified']
  const styles: PlayStyle[] = [
    '主線衝關',
    '探索收集',
    '戰鬥肝',
    '養成煉丹',
    '社交門派',
    '休閒隨緣',
    '抽卡課金',
    '純免費',
  ]
  const payTiers: PayTier[] = ['無課', '小額', '中額', '大額']
  const personas: Persona[] = []

  // 確保風格與年齡大致均勻覆蓋
  for (let i = 0; i < 100; i++) {
    const style = styles[i % styles.length]
    const ageBand = ages[Math.floor(i / 25) % ages.length]
    const gender = genders[i % genders.length]
    let payTier: PayTier
    if (style === '純免費') payTier = '無課'
    else if (style === '抽卡課金') payTier = pick(rng, ['中額', '大額'] as PayTier[])
    else if (rng() < 0.45) payTier = '無課'
    else payTier = pick(rng, ['小額', '中額', '大額'] as PayTier[])

    // 再微調：保證各付費檔至少有代表性
    if (i < 16) {
      payTier = payTiers[i % 4]
      if (payTier !== '無課' && style === '純免費') {
        // 純免費強制無課；改用休閒
      }
    }
    const forcedStyle =
      payTier !== '無課' && style === '純免費' ? '休閒隨緣' : style
    if (forcedStyle === '純免費') payTier = '無課'

    const origin = ORIGINS[i % ORIGINS.length]
    const job =
      rng() < 0.35
        ? ''
        : [
            '急診護理師',
            '前後端工程師',
            '風控分析師',
            '夜班廚師',
            '健身教練',
            '國中老師',
            '獨立漫畫家',
            '外送騎手',
            '公務員',
            '待業中',
            '虛擬職' + Math.floor(rng() * 900 + 100),
          ][Math.floor(rng() * 11)]

    personas.push({
      id: i + 1,
      ageBand,
      gender,
      playStyle: forcedStyle === '純免費' ? '純免費' : forcedStyle,
      payTier: forcedStyle === '純免費' ? '無課' : payTier,
      originId: origin.id,
      originName: origin.name,
      jobTitle: job || origin.defaultJobTitle,
    })
  }

  // 微調：確保八種風格各 ≥10、四種年紀各 ≥20、有課無課皆有
  return personas
}

type OpWeights = Record<string, number>

function weightsFor(persona: Persona): OpWeights {
  const base: OpWeights = {
    travel: 10,
    gather: 6,
    craft: 3,
    xun: 10,
    event: 12,
    combat_bandit: 8,
    spar: 6,
    tech: 5,
    train: 6,
    shop: 6,
    sect: 4,
    hero: 4,
    refine: 4,
    migrate: 2,
    ngplus: 3,
  }
  switch (persona.playStyle) {
    case '主線衝關':
      return { ...base, xun: 22, event: 24, travel: 8, combat_bandit: 5, shop: 4, ngplus: 8 }
    case '探索收集':
      return { ...base, travel: 24, gather: 16, event: 10, xun: 8, craft: 4 }
    case '戰鬥肝':
      return { ...base, combat_bandit: 22, spar: 18, train: 12, refine: 10, xun: 6 }
    case '養成煉丹':
      return { ...base, gather: 18, craft: 16, train: 14, tech: 12, travel: 8, combat_bandit: 4 }
    case '社交門派':
      return { ...base, sect: 18, hero: 16, travel: 12, event: 10, spar: 6 }
    case '休閒隨緣':
      return { ...base, travel: 12, xun: 8, event: 8, shop: 5, combat_bandit: 5 }
    case '抽卡課金':
      return { ...base, shop: 22, refine: 10, spar: 8, xun: 8, event: 8, ngplus: 5 }
    case '純免費':
      return { ...base, shop: 3, gather: 10, craft: 6, travel: 12, xun: 10, event: 10 }
  }
}

function maxStepsFor(persona: Persona, rng: () => number): number {
  const noise = Math.floor(rng() * 40)
  // 階段 C：節拍冷卻 5＋結局閘 12，主軸步數上修；休閒仍偏短以暴露節奏風險
  switch (persona.playStyle) {
    case '主線衝關':
      return 420 + noise
    case '戰鬥肝':
      return 340 + noise
    case '探索收集':
      return 360 + noise
    case '養成煉丹':
      return 320 + noise
    case '社交門派':
      return 320 + noise
    case '抽卡課金':
      return 360 + noise
    case '純免費':
      return 320 + noise
    case '休閒隨緣':
      return 220 + noise
  }
}

function topupBudget(tier: PayTier): number {
  switch (tier) {
    case '無課':
      return 0
    case '小額':
      return 2
    case '中額':
      return 6
    case '大額':
      return 14
  }
}

function applyOriginFixed(
  state: GameState,
  persona: Persona,
  rng: () => number,
): GameState {
  const cat = ORIGINS.find((o) => o.id === persona.originId) ?? pick(rng, ORIGINS)
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
    playerName: `人設${persona.id}`,
    playerGender: persona.gender,
    originChosen: true,
    originId: cat.id,
    originJobTitle: persona.jobTitle,
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
      originName: persona.jobTitle || cat.defaultJobTitle,
      originCategory: cat.name,
      personaAge: persona.ageBand,
      personaStyle: persona.playStyle,
      personaPay: persona.payTier,
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

function runCombat(
  encounter: CombatState,
  rng: () => number,
): { combat: CombatState; deadlock: boolean } {
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
  return { combat, deadlock: !combat.finished }
}

function applyCombatRewards(state: GameState, combat: CombatState, spar: boolean): GameState {
  if (!combat.finished) return state
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    let martialProgress = state.martialProgress
    if (!spar && Math.random() < 0.28) {
      const mid = pickUnknownMartial(state, [...COMBAT_MARTIAL_POOL])
      if (mid) {
        martialProgress = grantMartialArts(state, [mid]).state.martialProgress
      }
    }
    const reward = spar
      ? { silver: 12, potential: 2 }
      : banditWinRewards(state.banditFightsThisXun)
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
      sparWins: state.sparWins + (spar ? 1 : 0),
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

function stepTravel(state: GameState, rng: () => number): GameState | null {
  const links = getLinkedLocations(state.locationId)
  if (!links.length) return null
  // 導流：未知秘境優先
  const coldIds = new Set([
    'loc_lingjiu',
    'loc_peach_island',
    'loc_dead_tomb',
    'loc_huashan',
    'loc_emei_gate',
    'loc_icefire_isle',
  ])
  const unexploredCold = links.filter(
    (l) => coldIds.has(l.id) && !state.knownLocationIds.includes(l.id),
  )
  const target =
    unexploredCold.length && rng() < 0.45 ? pick(rng, unexploredCold) : pick(rng, links)
  const usePass = state.travelPassCharges > 0
  const cost = usePass
    ? Math.max(1, Math.ceil(target.travelStamina / 2))
    : target.travelStamina
  if (state.stats.stamina < cost) {
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
  let martialProgress = state.martialProgress
  if (!state.knownLocationIds.includes(target.id)) {
    const pool = LOCATION_MARTIAL_FINDS[target.id]
    if (pool && rng() < 0.55) {
      const id = pickUnknownMartial({ ...state, martialProgress }, pool, rng)
      if (id) martialProgress = grantMartialArts({ ...state, martialProgress }, [id]).state.martialProgress
    }
  }
  const nextPeriod =
    state.time.period === 'dawn'
      ? 'noon'
      : state.time.period === 'noon'
        ? 'dusk'
        : state.time.period === 'dusk'
          ? 'night'
          : 'dawn'
  const nextDay = state.time.period === 'night' ? state.time.day + 1 : state.time.day
  const restoreAp = state.time.period === 'night'
  return {
    ...state,
    locationId: target.id,
    locationName: target.name,
    knownLocationIds: [...known],
    martialProgress,
    travelPassCharges: usePass
      ? Math.max(0, state.travelPassCharges - 1)
      : state.travelPassCharges,
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
  const kind = loc.gather === 'both' ? (rng() < 0.5 ? 'herb' : 'ore') : loc.gather
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

function stepCraft(state: GameState, rng: () => number): GameState | null {
  const recipe = pick(rng, ALCHEMY_RECIPES)
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
  const routed = ensureStoryRoute(state)
  let xun = routed.time.xun + 1
  let month = routed.time.month
  let year = routed.time.year
  let day = routed.time.day + 10
  if (xun > 2) {
    xun = 0
    month += 1
    if (month > 12) {
      // 月份循環；故事年僅由軟進年推進
      month = 1
    }
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
): { state: GameState; combat?: CombatState; eventId?: string; outcome?: string } {
  const eventId = state.pendingEventId
  if (!eventId) return { state }
  const raw =
    getStoryEventById(eventId)
  if (!raw || !raw.choices.length) {
    return { state: { ...state, pendingEventId: null }, eventId }
  }
  const def = flavorEventForNgPlus(
    raw,
    state.ngPlusCount,
    detectEndingKey(state.flags),
  )
  const choice = pick(rng, def.choices)
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
  const mainDone = Boolean(storyFlags['main_y5_wharf'])
  const baseNext: GameState = {
    ...flagged,
    pendingEventId: null,
    storyFlags,
    lastOutcomeText: choice.outcomeText,
    tradeRouteLevel: flagged.tradeRouteLevel + (choice.tradeBump ?? 0),
    ngPlusReady: flagged.ngPlusReady || mainDone,
  }
  let next: GameState = eventId.startsWith('main_') || eventId.startsWith('arc_')
    ? applyMainBeatResolved(baseNext, eventId)
    : ensureStoryRoute(baseNext)
  if (choice.startCombat) {
    const encounter = makeBanditEncounter(
      buildPlayerCombatant(next),
      buildPartyCombatants(next),
      { loseStreak: next.combatLoseStreak, year: next.time.year },
    )
    return { state: next, combat: encounter, eventId, outcome: choice.outcomeText }
  }
  return { state: next, eventId, outcome: choice.outcomeText }
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
  if (node.id === TECH_ID_QUENCH) next.flags = { ...next.flags, quenchUnlocked: true }
  if (node.id === TECH_ID_POISON) next.flags = { ...next.flags, poisonUnlocked: true }
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
    const chance = bottleneckSuccessChance(state.comprehension, state.rootBone, target)
    success = rng() < chance
  }
  if (!success) {
    return {
      ...state,
      potential: state.potential - cost,
      stats: { ...state.stats, hp: Math.max(1, state.stats.hp - 8) },
    }
  }
  return {
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: target },
  }
}

function stepShop(
  state: GameState,
  rng: () => number,
  persona: Persona,
  topupsUsed: { n: number },
): { state: GameState | null; toppedUp: boolean; yuanbaoSpent: number; dropIds: string[] } {
  const roll = rng()
  const budget = topupBudget(persona.payTier)
  const canTopup = persona.payTier !== '無課' && topupsUsed.n < budget

  if (roll < 0.28 && canTopup) {
    const pack = pick(rng, MOCK_TOPUP_PACKS)
    topupsUsed.n++
    return {
      state: {
        ...state,
        currency: {
          ...state.currency,
          yuanbao: state.currency.yuanbao + pack.yuanbao,
        },
      },
      toppedUp: true,
      yuanbaoSpent: 0,
      dropIds: [],
    }
  }

  // 無課／預算用完：幾乎不做模擬儲值；偶爾銀兩消費
  if (roll < 0.45) {
    const offer = pick(rng, SILVER_SHOP)
    const price = offer.priceSilver ?? 0
    if (state.currency.silver < price) return { state: null, toppedUp: false, yuanbaoSpent: 0, dropIds: [] }
    let inventory = state.inventory
    let stamina = state.stats.stamina
    const grant = offer.grant
    if (grant?.kind === 'stat' && grant.stamina) {
      stamina = Math.min(state.stats.maxStamina, stamina + grant.stamina)
    } else if (grant?.kind === 'item' && grant.id) {
      const item =
        makeMaterial(grant.id, grant.qty ?? 1) ??
        createItemFromCatalog(grant.id, grant.qty ?? 1)
      if (!item) return { state: null, toppedUp: false, yuanbaoSpent: 0, dropIds: [] }
      inventory = mergeItem(inventory, item)
      return {
        state: {
          ...state,
          inventory,
          currency: { ...state.currency, silver: state.currency.silver - price },
          stats: { ...state.stats, stamina },
        },
        toppedUp: false,
        yuanbaoSpent: 0,
        dropIds: [item.id],
      }
    }
    return {
      state: {
        ...state,
        inventory,
        currency: { ...state.currency, silver: state.currency.silver - price },
        stats: { ...state.stats, stamina },
      },
      toppedUp: false,
      yuanbaoSpent: 0,
      dropIds: [],
    }
  }

  if (roll < 0.58 && persona.payTier !== '無課') {
    const offer = pick(rng, YUANBAO_SHOP)
    if (state.currency.yuanbao < offer.priceYuanbao) {
      return { state: null, toppedUp: false, yuanbaoSpent: 0, dropIds: [] }
    }
    let next: GameState = {
      ...state,
      currency: {
        ...state.currency,
        yuanbao: state.currency.yuanbao - offer.priceYuanbao,
      },
    }
    if (offer.kind === 'monthly') {
      next = { ...next, monthlyCardCharges: next.monthlyCardCharges + 30 }
    } else if (offer.id === 'shop_potential_pack') {
      next = { ...next, potential: next.potential + 18 }
    } else if (offer.id === 'shop_stamina_elixir') {
      next = {
        ...next,
        stats: { ...next.stats, stamina: next.stats.maxStamina },
      }
    } else if (offer.id === 'shop_ap_incense') {
      next = {
        ...next,
        actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 4),
      }
    } else if (offer.id === 'shop_travel_pass') {
      next = { ...next, travelPassCharges: next.travelPassCharges + 8 }
    } else if (offer.id === 'shop_combat_charm') {
      next = {
        ...next,
        paidAtkBonus: Math.min(6, next.paidAtkBonus + 1),
        paidDefBonus: Math.min(6, next.paidDefBonus + 1),
      }
    } else if (offer.kind === 'boost') {
      next = {
        ...next,
        comprehension: Math.min(99, next.comprehension + 3),
      }
    }
    return {
      state: next,
      toppedUp: false,
      yuanbaoSpent: offer.priceYuanbao,
      dropIds: [],
    }
  }

  // 抽卡：無課僅用開局／獎勵元寶；有課可抽
  const ten = rng() < 0.35
  const cost = ten ? GACHA_TEN_COST : GACHA_SINGLE_COST
  if (state.currency.yuanbao < cost) {
    if (canTopup) {
      const pack = pick(rng, MOCK_TOPUP_PACKS)
      topupsUsed.n++
      return {
        state: {
          ...state,
          currency: {
            ...state.currency,
            yuanbao: state.currency.yuanbao + pack.yuanbao,
          },
        },
        toppedUp: true,
        yuanbaoSpent: 0,
        dropIds: [],
      }
    }
    return { state: null, toppedUp: false, yuanbaoSpent: 0, dropIds: [] }
  }
  const pulled = pullMany(ten ? 10 : 1, {
    year: state.time.year,
    pityEpic: state.gachaPityEpic,
    pityLegendary: state.gachaPityLegendary,
  })
  let seq = state.equipUidSeq
  const owned: OwnedEquipment[] = [...state.ownedEquipment]
  const dropIds: string[] = []
  for (const r of pulled.results) {
    if (!r.item?.id) continue
    owned.push({
      uid: `eq_${seq++}`,
      defId: r.item.id,
      refineLevel: 0,
      quenched: false,
      poisoned: false,
    })
    dropIds.push(r.item.id)
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
      gachaTotalPulls: state.gachaTotalPulls + (ten ? 10 : 1),
    },
    toppedUp: false,
    yuanbaoSpent: cost,
    dropIds,
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
    if (sect.entry.minComprehension && state.comprehension < sect.entry.minComprehension)
      return null
    const grants = SECT_MARTIAL_GRANTS[sect.id]?.onJoin ?? []
    const granted = grantMartialArts(state, grants)
    return {
      ...granted.state,
      sectId: sect.id,
      sectContribution: 0,
      currency: {
        ...granted.state.currency,
        silver: granted.state.currency.silver - sect.entry.minSilver,
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
      .map((i) => (i.id === g.id ? { ...i, quantity: i.quantity - 1 } : { ...i }))
      .filter((i) => i.quantity > 0)
    const fav = npc.favoriteGifts.includes(g.id)
    const aff = Math.min(100, (state.affinity[npc.id] ?? 0) + (fav ? 18 : 8))
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

function stepMigrateRoundtrip(state: GameState): GameState {
  try {
    const raw = JSON.parse(JSON.stringify(state)) as unknown
    const migrated = migrateSaveData(raw)
    if (!migrated || typeof migrated.version !== 'number') return state
    return migrated
  } catch {
    return state
  }
}

function inspectCritical(state: GameState): string | null {
  const nums = [
    state.stats.hp,
    state.stats.maxHp,
    state.currency.silver,
    state.currency.yuanbao,
  ]
  for (const v of nums) {
    if (!isFiniteNum(v)) return 'nan_stat'
  }
  if (state.stats.hp < 0) return 'neg_hp'
  if (state.currency.silver < 0) return 'neg_silver'
  if (state.currency.yuanbao < 0) return 'neg_yuanbao'
  if (!getLocationById(state.locationId)) return 'bad_location'
  for (const eq of state.ownedEquipment) {
    if (!getEquipmentById(eq.defId)) return 'orphan_equip'
  }
  try {
    const panel = computePanelStats(state)
    if (!isFiniteNum(panel.attack) || !isFiniteNum(panel.defense)) return 'panel_nan'
  } catch {
    return 'panel_throw'
  }
  return null
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

function runOne(
  persona: Persona,
  runIndex: number,
  seed: number,
): RunResult {
  const rng = mulberry32(seed)
  const findings: RunResult['findings'] = []
  const locationVisits = new Map<string, number>()
  const eventsSeen: string[] = []
  const outcomeTexts: string[] = []
  const equipObtained = new Set<string>()
  const martialSeen = new Set<string>()
  const dropKeys: string[] = []

  let state = createInitialGameState()
  let steps = 0
  let crashed = false
  let combatWins = 0
  let combatLosses = 0
  let hpBottomHits = 0
  let resourceCrashHits = 0
  let topupCount = 0
  let yuanbaoSpent = 0
  const topupsUsed = { n: 0 }

  const perCycleMainYears: CycleMarks[] = [{ mainYearSteps: {} }]
  const cycleCompleteSteps: number[] = []
  let cycleStartStep = 0
  let lastMainProgressStep = 0
  let stagnantMainSteps = 0
  let recentEventWindow: string[] = []
  let churnReason: ChurnReason = '步數上限'

  const bumpLoc = () => {
    locationVisits.set(state.locationId, (locationVisits.get(state.locationId) ?? 0) + 1)
  }

  const recordEquips = () => {
    for (const e of state.ownedEquipment) equipObtained.add(e.defId)
    for (const id of Object.keys(state.martialProgress)) {
      if ((state.martialProgress[id] ?? 0) > 0) martialSeen.add(id)
    }
  }

  let lastBeatCount = 0

  const trackStoryProgress = () => {
    const cur = perCycleMainYears[perCycleMainYears.length - 1]
    let progressed = false
    for (const y of [1, 2, 3, 4, 5] as const) {
      const key = mainYearKey(y)
      if (state.storyFlags[key] && cur.mainYearSteps[y] == null) {
        cur.mainYearSteps[y] = steps - cycleStartStep
        progressed = true
        lastMainProgressStep = steps
      }
    }
    // 弧節拍也算主軸進度（階段 C 結局閘依賴節拍數，勿誤判停滯）
    const beatCount = state.completedBeatIds.length
    if (beatCount > lastBeatCount) {
      lastBeatCount = beatCount
      progressed = true
      lastMainProgressStep = steps
    }
    if (progressed) stagnantMainSteps = 0

    // 五年主線完成 → 一週目結束（可 NG+）
    if (
      canSettleNgPlus(state) &&
      cur.cycleCompleteStep == null &&
      state.storyFlags['main_y5_wharf']
    ) {
      cur.cycleCompleteStep = steps - cycleStartStep
      cycleCompleteSteps.push(steps)
    }
  }

  try {
    state = applyOriginFixed(state, persona, rng)
    state = applyPrologue(state, rng)
    recordEquips()
    bumpLoc()
    steps = 2
    lastMainProgressStep = steps

    const maxSteps = maxStepsFor(persona, rng)
    const w = weightsFor(persona)
    const opNames = Object.keys(w)

    while (steps < maxSteps) {
      // 優先消化待辦事件（UI 會置頂事態；衝關幾乎必點，其餘高機率點）
      const preferEvent =
        !!state.pendingEventId &&
        (persona.playStyle === '主線衝關' ||
          persona.playStyle === '純免費' ||
          rng() < 0.82)

      const op = preferEvent
        ? 'event'
        : weightedPick(
            rng,
            opNames,
            opNames.map((k) => w[k]),
          )

      if (op === 'travel') {
        const n = stepTravel(state, rng)
        if (n) state = n
      } else if (op === 'gather') {
        const n = stepGather(state, rng)
        if (n) {
          state = n
          dropKeys.push('mat_gather')
        }
      } else if (op === 'craft') {
        const n = stepCraft(state, rng)
        if (n) {
          state = n
          dropKeys.push('craft')
        }
      } else if (op === 'xun') {
        const n = stepAdvanceXun(state, rng)
        if (n) state = n
      } else if (op === 'event') {
        if (state.pendingEventId) {
          const res = stepResolveEvent(state, rng)
          state = res.state
          if (res.eventId) {
            eventsSeen.push(res.eventId)
            recentEventWindow.push(res.eventId)
            if (recentEventWindow.length > 24) recentEventWindow.shift()
          }
          if (res.outcome) outcomeTexts.push(res.outcome)
          if (res.combat) {
            const { combat, deadlock } = runCombat(res.combat, rng)
            if (deadlock) {
              findings.push({
                code: 'combat_deadlock',
                severity: 'critical',
                message: '戰鬥超時',
              })
            }
            if (combat.finished) {
              if (combat.victory) combatWins++
              else combatLosses++
            }
            state = applyCombatRewards(state, combat, false)
          }
        }
      } else if (op === 'combat_bandit') {
        const block = getBanditStartBlock(state)
        if (block) {
          // 連敗／低血／AP／旬上限：改養傷或推進旬節奏
          state = {
            ...state,
            combatLoseStreak: block === 'lose_streak' ? 0 : state.combatLoseStreak,
            banditFightsThisXun:
              block === 'xun_cap' ? 0 : state.banditFightsThisXun,
            actionPoints:
              block === 'no_ap'
                ? Math.min(state.maxActionPoints, state.actionPoints + 1)
                : state.actionPoints,
            stats: {
              ...state.stats,
              hp: Math.min(
                state.stats.maxHp,
                state.stats.hp + Math.floor(state.stats.maxHp * 0.25),
              ),
              stamina: Math.min(
                state.stats.maxStamina,
                state.stats.stamina + 15,
              ),
            },
          }
          continue
        }
        state = applyBanditFightStartCost(state)
        const enc = makeBanditEncounter(
          buildPlayerCombatant(state),
          buildPartyCombatants(state),
          {
            loseStreak: state.combatLoseStreak,
            year: state.time.year,
          },
        )
        const { combat, deadlock } = runCombat(enc, rng)
        if (deadlock) {
          findings.push({
            code: 'combat_deadlock',
            severity: 'critical',
            message: '戰鬥超時',
          })
        }
        if (combat.finished) {
          if (combat.victory) combatWins++
          else combatLosses++
          dropKeys.push(combat.victory ? 'bandit_win' : 'bandit_lose')
        }
        state = applyCombatRewards(state, combat, false)
      } else if (op === 'spar') {
        const board = buildBoard(
          pick(rng, ['heaven', 'earth', 'weapon', 'rich'] as const),
          state,
        )
        const foe = board.find((b) => !b.isPlayer)
        if (foe && state.actionPoints >= 1 && state.sparFightsThisXun < 3) {
          state = {
            ...state,
            actionPoints: state.actionPoints - 1,
            sparFightsThisXun: state.sparFightsThisXun + 1,
          }
          const enc = makeSparEncounter(
            buildPlayerCombatant(state),
            buildPartyCombatants(state),
            foe.sparPower,
            foe.name,
          )
          const { combat, deadlock } = runCombat(enc, rng)
          if (deadlock) {
            findings.push({
              code: 'combat_deadlock',
              severity: 'critical',
              message: '切磋超時',
            })
          }
          if (combat.finished) {
            if (combat.victory) combatWins++
            else combatLosses++
          }
          state = applyCombatRewards(state, combat, true)
        }
      } else if (op === 'tech') {
        const n = stepTech(state, rng)
        if (n) state = n
      } else if (op === 'train') {
        const n = stepTrain(state, rng)
        if (n) state = n
      } else if (op === 'shop') {
        const res = stepShop(state, rng, persona, topupsUsed)
        if (res.state) {
          state = res.state
          if (res.toppedUp) topupCount++
          yuanbaoSpent += res.yuanbaoSpent
          for (const d of res.dropIds) dropKeys.push(d)
        }
      } else if (op === 'sect') {
        const n = stepSect(state, rng)
        if (n) state = n
      } else if (op === 'hero') {
        const n = stepHero(state, rng)
        if (n) state = n
      } else if (op === 'refine') {
        const n = stepRefine(state, rng)
        if (n) state = n
      } else if (op === 'migrate') {
        state = stepMigrateRoundtrip(state)
      } else if (op === 'ngplus') {
        // 僅在真正可結算時 NG+（不偽造旗標，測真實耐玩）
        if (canSettleNgPlus(state) && state.storyFlags['main_y5_wharf']) {
          state = applyNewGamePlus(state)
          state = applyOriginFixed(state, persona, rng)
          state = applyPrologue(state, rng)
          cycleStartStep = steps
          perCycleMainYears.push({ mainYearSteps: {} })
          lastMainProgressStep = steps
          stagnantMainSteps = 0
          lastBeatCount = state.completedBeatIds.length
        }
      }

      bumpLoc()
      recordEquips()
      trackStoryProgress()

      const crit = inspectCritical(state)
      if (crit) {
        findings.push({ code: crit, severity: 'critical', message: crit })
      }

      if (state.stats.hp <= Math.max(1, Math.floor(state.stats.maxHp * 0.15))) {
        hpBottomHits++
      }
      if (state.stats.hp <= 0) {
        findings.push({
          code: 'hp_zero_persist',
          severity: 'critical',
          message: 'hp<=0',
        })
        state = {
          ...state,
          stats: { ...state.stats, hp: Math.max(1, state.stats.maxHp) },
        }
      }

      // 資源崩盤：銀兩與精力長期極低（旬制已不需 AP 門檻）
      if (state.currency.silver < 5 && state.stats.stamina < 10) {
        resourceCrashHits++
      }

      steps++

      // —— 流失判斷 ——
      if (cycleCompleteSteps.length >= 3) {
        churnReason = '完成三週目'
        break
      }

      if (steps - lastMainProgressStep > 55) {
        stagnantMainSteps++
      }
      // 主線衝關／一般：主線長期無進展
      if (
        stagnantMainSteps > 40 &&
        cycleCompleteSteps.length < 1 &&
        persona.playStyle !== '戰鬥肝' &&
        persona.playStyle !== '養成煉丹'
      ) {
        churnReason = '主線停滯'
        break
      }

      // 重複倦怠：近窗奇遇重複率過高
      if (recentEventWindow.length >= 16) {
        const uniq = new Set(recentEventWindow).size
        if (uniq / recentEventWindow.length < 0.35) {
          churnReason = '重複倦怠'
          break
        }
      }

      if (resourceCrashHits > 25 && persona.payTier === '無課') {
        churnReason = '資源崩盤'
        break
      }

      const fights = combatWins + combatLosses
      if (fights >= 20 && combatLosses / fights > 0.72) {
        churnReason = '戰敗過多'
        break
      }
    }
  } catch (e) {
    crashed = true
    churnReason = '崩潰'
    findings.push({
      code: 'uncaught',
      severity: 'critical',
      message: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    })
  }

  if (!crashed && churnReason === '步數上限' && cycleCompleteSteps.length >= 3) {
    churnReason = '完成三週目'
  }

  return {
    personaId: persona.id,
    runIndex,
    seed,
    steps,
    crashed,
    churnReason,
    cyclesCompleted: cycleCompleteSteps.length,
    cycleCompleteSteps,
    perCycleMainYears,
    combatWins,
    combatLosses,
    hpBottomHits,
    resourceCrashHits,
    topupCount,
    yuanbaoSpent,
    silverEnd: state.currency.silver,
    yuanbaoEnd: state.currency.yuanbao,
    locationsVisited: [...locationVisits.entries()]
      .sort((a, b) => b[1] - a[1])
      .flatMap(([id, n]) => Array(Math.min(n, 50)).fill(id)),
    eventsSeen,
    outcomeTexts: outcomeTexts.slice(0, 80),
    equipObtained: [...equipObtained],
    martialSeen: [...martialSeen],
    dropKeys: dropKeys.slice(0, 200),
    findings,
  }
}

function repetitionRate(items: string[]): number {
  if (items.length < 2) return 0
  const counts = new Map<string, number>()
  for (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1)
  let dup = 0
  for (const c of counts.values()) {
    if (c > 1) dup += c - 1
  }
  return dup / items.length
}

async function main() {
  const PERSONA_COUNT = 100
  const RUNS_PER = 10
  const masterRng = mulberry32(20261115)
  const personas = buildPersonas(masterRng)

  console.log(
    `開始耐玩性模擬：${PERSONA_COUNT} 人設 × ${RUNS_PER} 局 = ${PERSONA_COUNT * RUNS_PER} 局…`,
  )

  const runs: RunResult[] = []
  const t0 = Date.now()

  for (let p = 0; p < personas.length; p++) {
    const persona = personas[p]
    for (let r = 0; r < RUNS_PER; r++) {
      const seed = 900000 + persona.id * 10007 + r * 7919 + Math.floor(masterRng() * 1000)
      runs.push(runOne(persona, r, seed))
    }
    if ((p + 1) % 10 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      console.log(`  …人設 ${p + 1}/${PERSONA_COUNT}（累計 ${runs.length} 局，${elapsed}s）`)
    }
  }

  // —— 彙總 ——
  const locationHeat: Record<string, number> = {}
  for (const loc of LOCATIONS) locationHeat[loc.id] = 0
  const eventHeat: Record<string, number> = {}
  for (const e of [...MAIN_STORY_EVENTS, ...ENCOUNTER_EVENTS]) eventHeat[e.id] = 0
  const equipSeenGlobal = new Set<string>()
  const martialSeenGlobal = new Set<string>()
  const allOutcomes: string[] = []
  const allDrops: string[] = []
  const allEvents: string[] = []

  let crashRuns = 0
  const churnCounts: Record<string, number> = {}
  const cycle1Steps: number[] = []
  const cycle2Steps: number[] = []
  const cycle3Steps: number[] = []
  const y1Steps: number[] = []
  const y2Steps: number[] = []
  const y3Steps: number[] = []
  const y4Steps: number[] = []
  const y5Steps: number[] = []

  let reachedCycle1 = 0
  let reachedCycle2 = 0
  let reachedCycle3 = 0

  const paidWins: number[] = []
  const paidLosses: number[] = []
  const f2pWins: number[] = []
  const f2pLosses: number[] = []
  const paidCycle1: number[] = []
  const f2pCycle1: number[] = []
  const styleReach: Record<string, { runs: number; c1: number; c2: number; c3: number }> = {}
  const ageReach: Record<string, { runs: number; c1: number; c2: number; c3: number }> = {}
  const payReach: Record<string, { runs: number; c1: number; c2: number; c3: number }> = {}

  const findingCodes: Record<string, number> = {}
  const orphanEquips: string[] = []

  for (const run of runs) {
    const persona = personas.find((p) => p.id === run.personaId)!
    if (run.crashed) crashRuns++
    churnCounts[run.churnReason] = (churnCounts[run.churnReason] ?? 0) + 1

    if (run.cyclesCompleted >= 1) {
      reachedCycle1++
      cycle1Steps.push(run.cycleCompleteSteps[0])
    }
    if (run.cyclesCompleted >= 2) {
      reachedCycle2++
      cycle2Steps.push(run.cycleCompleteSteps[1])
    }
    if (run.cyclesCompleted >= 3) {
      reachedCycle3++
      cycle3Steps.push(run.cycleCompleteSteps[2])
    }

    const c0 = run.perCycleMainYears[0]
    if (c0?.mainYearSteps[1] != null) y1Steps.push(c0.mainYearSteps[1]!)
    if (c0?.mainYearSteps[2] != null) y2Steps.push(c0.mainYearSteps[2]!)
    if (c0?.mainYearSteps[3] != null) y3Steps.push(c0.mainYearSteps[3]!)
    if (c0?.mainYearSteps[4] != null) y4Steps.push(c0.mainYearSteps[4]!)
    if (c0?.mainYearSteps[5] != null) y5Steps.push(c0.mainYearSteps[5]!)

    for (const id of run.locationsVisited) {
      locationHeat[id] = (locationHeat[id] ?? 0) + 1
    }
    for (const id of run.eventsSeen) {
      eventHeat[id] = (eventHeat[id] ?? 0) + 1
      allEvents.push(id)
    }
    for (const t of run.outcomeTexts) allOutcomes.push(t)
    for (const d of run.dropKeys) allDrops.push(d)
    for (const e of run.equipObtained) equipSeenGlobal.add(e)
    for (const m of run.martialSeen) martialSeenGlobal.add(m)

    if (persona.payTier === '無課') {
      f2pWins.push(run.combatWins)
      f2pLosses.push(run.combatLosses)
      if (run.cyclesCompleted >= 1) f2pCycle1.push(run.cycleCompleteSteps[0])
    } else {
      paidWins.push(run.combatWins)
      paidLosses.push(run.combatLosses)
      if (run.cyclesCompleted >= 1) paidCycle1.push(run.cycleCompleteSteps[0])
    }

    const sr = (styleReach[persona.playStyle] ??= { runs: 0, c1: 0, c2: 0, c3: 0 })
    sr.runs++
    if (run.cyclesCompleted >= 1) sr.c1++
    if (run.cyclesCompleted >= 2) sr.c2++
    if (run.cyclesCompleted >= 3) sr.c3++

    const ar = (ageReach[persona.ageBand] ??= { runs: 0, c1: 0, c2: 0, c3: 0 })
    ar.runs++
    if (run.cyclesCompleted >= 1) ar.c1++
    if (run.cyclesCompleted >= 2) ar.c2++
    if (run.cyclesCompleted >= 3) ar.c3++

    const pr = (payReach[persona.payTier] ??= { runs: 0, c1: 0, c2: 0, c3: 0 })
    pr.runs++
    if (run.cyclesCompleted >= 1) pr.c1++
    if (run.cyclesCompleted >= 2) pr.c2++
    if (run.cyclesCompleted >= 3) pr.c3++

    for (const f of run.findings) {
      findingCodes[f.code] = (findingCodes[f.code] ?? 0) + 1
      if (f.code === 'orphan_equip') orphanEquips.push(f.message)
    }
  }

  const totalLocVisits = Object.values(locationHeat).reduce((a, b) => a + b, 0) || 1
  const locBalance = LOCATIONS.map((l) => ({
    id: l.id,
    name: l.name,
    visits: locationHeat[l.id] ?? 0,
    share: Math.round(((locationHeat[l.id] ?? 0) / totalLocVisits) * 10000) / 100,
  })).sort((a, b) => b.visits - a.visits)

  const neverVisitedLocs = locBalance.filter((l) => l.visits === 0)
  const hotLocs = locBalance.slice(0, 5)
  const coldLocs = [...locBalance].sort((a, b) => a.visits - b.visits).slice(0, 5)

  const neverEvents = Object.entries(eventHeat)
    .filter(([, n]) => n === 0)
    .map(([id]) => id)
  const topEvents = Object.entries(eventHeat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, n]) => ({ id, n }))

  const allEquipIds = EQUIPMENTS.map((e) => e.id)
  const missingEquips = allEquipIds.filter((id) => !equipSeenGlobal.has(id))
  const legendaryIds = EQUIPMENTS.filter((e) => e.quality === 'legendary').map((e) => e.id)
  const missingLegendary = legendaryIds.filter((id) => !equipSeenGlobal.has(id))

  const winRate = (wins: number[], losses: number[]) => {
    const w = wins.reduce((a, b) => a + b, 0)
    const l = losses.reduce((a, b) => a + b, 0)
    const t = w + l
    return t ? Math.round((w / t) * 1000) / 10 : null
  }

  const personaCoverage = {
    byAge: {} as Record<string, number>,
    byGender: {} as Record<string, number>,
    byStyle: {} as Record<string, number>,
    byPay: {} as Record<string, number>,
    byOrigin: {} as Record<string, number>,
  }
  for (const p of personas) {
    personaCoverage.byAge[p.ageBand] = (personaCoverage.byAge[p.ageBand] ?? 0) + 1
    personaCoverage.byGender[p.gender] = (personaCoverage.byGender[p.gender] ?? 0) + 1
    personaCoverage.byStyle[p.playStyle] = (personaCoverage.byStyle[p.playStyle] ?? 0) + 1
    personaCoverage.byPay[p.payTier] = (personaCoverage.byPay[p.payTier] ?? 0) + 1
    personaCoverage.byOrigin[p.originName] =
      (personaCoverage.byOrigin[p.originName] ?? 0) + 1
  }

  const summary = {
    meta: {
      date: new Date().toISOString(),
      personaCount: PERSONA_COUNT,
      runsPerPersona: RUNS_PER,
      totalRuns: runs.length,
      totalSteps: runs.reduce((a, r) => a + r.steps, 0),
      elapsedMs: Date.now() - t0,
      crashRuns,
      definition:
        '一週目＝完成五年主線並可結算 NG+；二／三週目＝第 2／3 次完成五年主線。步數為模擬操作步。',
    },
    personas: personas.map((p) => ({
      id: p.id,
      ageBand: p.ageBand,
      gender: p.gender,
      playStyle: p.playStyle,
      payTier: p.payTier,
      originName: p.originName,
      jobTitle: p.jobTitle,
    })),
    personaCoverage,
    cycleReach: {
      cycle1: { count: reachedCycle1, rate: Math.round((reachedCycle1 / runs.length) * 1000) / 10, steps: statsOf(cycle1Steps) },
      cycle2: { count: reachedCycle2, rate: Math.round((reachedCycle2 / runs.length) * 1000) / 10, steps: statsOf(cycle2Steps) },
      cycle3: { count: reachedCycle3, rate: Math.round((reachedCycle3 / runs.length) * 1000) / 10, steps: statsOf(cycle3Steps) },
    },
    mainYearStepsFirstCycle: {
      y1: statsOf(y1Steps),
      y2: statsOf(y2Steps),
      y3: statsOf(y3Steps),
      y4: statsOf(y4Steps),
      y5: statsOf(y5Steps),
    },
    churn: churnCounts,
    reachByStyle: styleReach,
    reachByAge: ageReach,
    reachByPay: payReach,
    repetition: {
      eventDupRate: Math.round(repetitionRate(allEvents) * 1000) / 10,
      outcomeDupRate: Math.round(repetitionRate(allOutcomes) * 1000) / 10,
      dropDupRate: Math.round(repetitionRate(allDrops) * 1000) / 10,
      uniqueEventsTriggered: Object.values(eventHeat).filter((n) => n > 0).length,
      totalEventDefs: MAIN_STORY_EVENTS.length + ENCOUNTER_EVENTS.length,
      topEvents,
      neverEvents,
    },
    unreachable: {
      missingEquipCount: missingEquips.length,
      missingEquips,
      missingLegendary,
      neverVisitedLocs: neverVisitedLocs.map((l) => l.name),
      neverEvents,
      orphanEquipFindings: orphanEquips.length,
      findingCodes,
    },
    mapBalance: {
      hot: hotLocs,
      cold: coldLocs,
      all: locBalance,
    },
    difficulty: {
      overallWinRate: winRate(
        runs.map((r) => r.combatWins),
        runs.map((r) => r.combatLosses),
      ),
      paidWinRate: winRate(paidWins, paidLosses),
      f2pWinRate: winRate(f2pWins, f2pLosses),
      paidCycle1Steps: statsOf(paidCycle1),
      f2pCycle1Steps: statsOf(f2pCycle1),
      avgHpBottomHits:
        Math.round(
          (runs.reduce((a, r) => a + r.hpBottomHits, 0) / runs.length) * 10,
        ) / 10,
      avgResourceCrashHits:
        Math.round(
          (runs.reduce((a, r) => a + r.resourceCrashHits, 0) / runs.length) * 10,
        ) / 10,
      churnDefeatRate:
        Math.round(((churnCounts['戰敗過多'] ?? 0) / runs.length) * 1000) / 10,
      churnResourceRate:
        Math.round(((churnCounts['資源崩盤'] ?? 0) / runs.length) * 1000) / 10,
    },
    contentCoverage: {
      equipSeen: equipSeenGlobal.size,
      equipTotal: allEquipIds.length,
      martialSeen: martialSeenGlobal.size,
      martialTotal: MARTIAL_ARTS.length,
      locSeen: locBalance.filter((l) => l.visits > 0).length,
      locTotal: LOCATIONS.length,
    },
  }

  const outRepo = resolve(REPO_ROOT, 'sim-replayability-result.json')
  writeFileSync(outRepo, JSON.stringify(summary, null, 2), 'utf8')
  console.log(`寫入 ${outRepo}`)

  // 精簡每局摘要（給報告用，避免巨大檔）
  const runDigest = runs.map((r) => ({
    personaId: r.personaId,
    runIndex: r.runIndex,
    steps: r.steps,
    cyclesCompleted: r.cyclesCompleted,
    cycleCompleteSteps: r.cycleCompleteSteps,
    churnReason: r.churnReason,
    combatWins: r.combatWins,
    combatLosses: r.combatLosses,
    crashed: r.crashed,
    topupCount: r.topupCount,
    yuanbaoSpent: r.yuanbaoSpent,
    mainY: r.perCycleMainYears[0]?.mainYearSteps ?? {},
  }))
  const digestPath = resolve(REPO_ROOT, 'sim-replayability-runs.json')
  writeFileSync(
    digestPath,
    JSON.stringify({ personas, runs: runDigest }, null, 2),
    'utf8',
  )
  console.log(`寫入 ${digestPath}`)

  // store internal
  const storeInternal =
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal'
  try {
    mkdirSync(storeInternal, { recursive: true })
    writeFileSync(
      resolve(storeInternal, 'sim-replayability-result.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    )
    console.log(`寫入 store internal 結果`)
  } catch (e) {
    console.warn('無法寫入 store internal：', e)
  }

  console.log(
    JSON.stringify(
      {
        totalRuns: summary.meta.totalRuns,
        crashRuns,
        cycle1Rate: summary.cycleReach.cycle1.rate,
        cycle2Rate: summary.cycleReach.cycle2.rate,
        cycle3Rate: summary.cycleReach.cycle3.rate,
        churn: churnCounts,
        elapsedMs: summary.meta.elapsedMs,
      },
      null,
      2,
    ),
  )
}

void main()
