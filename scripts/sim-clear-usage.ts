/**
 * 多人格通關使用率＋穩贏組合探測
 * - 記錄通關時／過程中實際用到的武學、裝備、門派、隊友、路線
 * - 對照內容池產出「幾乎用不到」與「過強組合」
 *
 * 用法：npm run sim:clear-usage
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
import { getLinkedLocations, getLocationById } from '../src/data/locations.ts'
import { EQUIPMENTS, getEquipmentById } from '../src/data/equipments.ts'
import { MARTIAL_ARTS, trainPotentialCost } from '../src/data/martialArts.ts'
import { SECTS } from '../src/data/sects.ts'
import { NPCS, createItemFromCatalog } from '../src/data/npcs.ts'
import { MATERIAL_IDS, makeMaterial } from '../src/data/alchemy.ts'
import {
  pullMany,
  GACHA_SINGLE_COST,
  GACHA_TEN_COST,
} from '../src/lib/gachaEngine.ts'
import type { OwnedEquipment } from '../src/types/game.ts'

const STARTER_MARTIAL = new Set([
  'ma_jiuyin',
  'ma_heart_calm',
  'ma_qing_cloud',
  'ma_act_flashlight',
  'ma_act_luoying',
])
const STARTER_EQUIP = new Set([
  'eq_wood_sword',
  'eq_travel_robe',
  'eq_straw_shoes',
])
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
} from '../src/lib/combatEngine.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import {
  SECT_MARTIAL_GRANTS,
  LOCATION_MARTIAL_FINDS,
  grantMartialArts,
} from '../src/lib/martialUnlock.ts'
import { canProgressMartial } from '../src/lib/martialGates.ts'
import {
  applyJoinSect,
  canJoinSect,
  getSectRule,
} from '../src/lib/sectRules.ts'
import { computeDifficultyMods } from '../src/lib/difficultyModifiers.ts'
import { flavorEventForNgPlus } from '../src/lib/ngPlusStory.ts'
import { applyNightTravelApRestore } from '../src/lib/travelApRules.ts'
import { canSettleNgPlus } from '../src/lib/ngPlus.ts'
import {
  COLD_MARTIAL_IDS,
  COLD_SECT_IDS,
  STARTER_MARTIAL_IDS,
  computeJourneyProfile,
} from '../src/lib/journeyPath.ts'
import type { GameState, InventoryItem } from '../src/types/game.ts'

const OUT =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/clear-usage-result.json'

const PERSONAS = 40
const RUNS_PER = 10 // 400 局
const MAX_STEPS = 520
const COMBO_FIGHTS = 40

/** 上一輪 clear-usage 基準（修前） */
const BASELINE = {
  clearRate: 99.3,
  martialNearUnused: 18,
  coldRates: {
    ma_qing_icefire: 0,
    ma_qing_tomb: 0.5,
    ma_act_xuantie: 0.8,
    ma_qing_emei: 2,
    ma_act_needle: 2,
    sect_riyue: 1.5,
    sect_huashan: 2.3,
    sect_taohua: 3.1,
  } as Record<string, number>,
}

type Style =
  | 'main'
  | 'sect_hero'
  | 'combat'
  | 'explore'
  | 'train_craft'
  | 'mixed'

type Persona = {
  id: number
  style: Style
  originId: string
  forceSectId: string | null
  forcePartyBias: string | null
}

type UsageSnap = {
  martialLearned: string[]
  martialEquipped: string[]
  equipOwned: string[]
  equipEquipped: string[]
  sectId: string | null
  partyIds: string[]
  partnerId: string | null
  routes: Record<string, string>
  combatWins: number
  combatLosses: number
  steps: number
  cleared: boolean
  enemyScaleEnd: number
  panelAtk: number
  pathTier: string
  diversityScore: number
  endingBranch: string | null
  coldMartialEquipped: number
  nonStarterEquipped: number
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

function weightedPick(rng: () => number, weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  let total = 0
  for (const [, w] of entries) total += w
  let roll = rng() * total
  for (const [k, w] of entries) {
    roll -= w
    if (roll < 0) return k
  }
  return entries[entries.length - 1]![0]
}

function mergeItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const next = inventory.map((i) => ({ ...i }))
  const found = next.find((i) => i.id === item.id)
  if (found) found.quantity += item.quantity
  else next.push(item)
  return next
}

function buildPersonas(): Persona[] {
  const styles: Style[] = [
    'main',
    'sect_hero',
    'combat',
    'explore',
    'train_craft',
    'mixed',
  ]
  const list: Persona[] = []
  for (let i = 0; i < PERSONAS; i++) {
    const style = styles[i % styles.length]!
    const origin = ORIGINS[i % ORIGINS.length]!
    const forceSect =
      style === 'sect_hero' ? SECTS[i % SECTS.length]!.id : rngForceSect(i)
    const forceParty =
      style === 'sect_hero' || style === 'combat'
        ? NPCS[i % NPCS.length]!.id
        : null
    list.push({
      id: i + 1,
      style,
      originId: origin.id,
      forceSectId: forceSect,
      forcePartyBias: forceParty,
    })
  }
  return list
}

function rngForceSect(i: number): string | null {
  if (i % 5 === 0) return null
  return SECTS[i % SECTS.length]!.id
}

function applyOrigin(state: GameState, originId: string): GameState {
  const cat = ORIGINS.find((o) => o.id === originId) ?? ORIGINS[0]!
  const bonuses = cat.bonuses
  const stats = { ...state.stats }
  if (bonuses.maxHp) {
    stats.maxHp += bonuses.maxHp
    stats.hp += bonuses.maxHp
  }
  if (bonuses.attack) stats.attack += bonuses.attack
  if (bonuses.defense) stats.defense += bonuses.defense
  if (bonuses.maxStamina) {
    stats.maxStamina += bonuses.maxStamina
    stats.stamina = Math.min(
      stats.maxStamina,
      stats.stamina + Math.floor(bonuses.maxStamina / 2),
    )
  }
  let inventory = state.inventory.map((i) => ({ ...i }))
  for (const id of cat.startingItemIds) {
    const item = createItemFromCatalog(id, 1)
    if (item) inventory = mergeItem(inventory, item)
  }
  const techTree = { ...state.techTree }
  for (const t of cat.startingTechIds) techTree[t] = 1
  return {
    ...state,
    playerName: '使用率測',
    originChosen: true,
    originId: cat.id,
    originJobTitle: cat.defaultJobTitle,
    stats,
    inventory,
    techTree,
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
    potential: (choice.rewards.potential ?? 0) + 10,
  })
  return grantStarterGear({
    ...rewarded,
    prologueDone: true,
    activeEventId: null,
    completedEvents: [...rewarded.completedEvents, prologue.id],
    locationId: 'loc_broken_temple',
    locationName: '雨夜破廟',
    knownLocationIds: [
      ...new Set([
        ...rewarded.knownLocationIds,
        'loc_broken_temple',
        'loc_xiangyang',
      ]),
    ],
    time: { ...rewarded.time, period: 'dawn' },
  })
}

function autoEquip(state: GameState): GameState {
  // 優先非開局招，再以等級排序——模擬玩家「研究有回報」的配置
  const rank = (id: string) => {
    const lv = state.martialProgress[id] ?? 0
    const cold = (COLD_MARTIAL_IDS as readonly string[]).includes(id) ? 30 : 0
    const starter = (STARTER_MARTIAL_IDS as readonly string[]).includes(id)
      ? -20
      : 10
    return lv * 10 + cold + starter
  }
  const pickKind = (kind: string, limit: number) =>
    MARTIAL_ARTS.filter(
      (a) => a.kind === kind && (state.martialProgress[a.id] ?? 0) > 0,
    )
      .sort((a, b) => rank(b.id) - rank(a.id))
      .slice(0, limit)
      .map((a) => a.id)
  const internals = pickKind('internal', 1)
  const hearts = pickKind('heart', 1)
  const qings = pickKind('qinggong', 1)
  const actives = pickKind('active', 4)
  const loadout = {
    internalId: internals[0] ?? null,
    heartId: hearts[0] ?? null,
    qinggongId: qings[0] ?? null,
    activeIds: [
      actives[0] ?? null,
      actives[1] ?? null,
      actives[2] ?? null,
      actives[3] ?? null,
    ] as GameState['martialLoadout']['activeIds'],
  }
  const equipped = { ...state.equipped }
  // 同槽位選精煉較高／稀有度較後獲得者覆蓋
  const bySlot = new Map<string, OwnedEquipment>()
  for (const owned of state.ownedEquipment) {
    const def = getEquipmentById(owned.defId)
    if (!def) continue
    const prev = bySlot.get(def.slot)
    if (!prev || owned.refineLevel >= prev.refineLevel) bySlot.set(def.slot, owned)
  }
  for (const [slot, owned] of bySlot) {
    equipped[slot as keyof typeof equipped] = owned.uid
  }
  return { ...state, martialLoadout: loadout, equipped }
}

function runCombat(
  state: GameState,
  rng: () => number,
  smart: boolean,
): { state: GameState; win: boolean } {
  const mods = computeDifficultyMods(state)
  let combat = makeBanditEncounter(
    buildPlayerCombatant(state),
    buildPartyCombatants(state),
    {
      loseStreak: state.combatLoseStreak,
      year: state.time.year,
      enemyScale: mods.enemyScale,
    },
  )
  let guard = 0
  while (!combat.finished && guard < 90) {
    guard++
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    const player = combat.allies.find((a) => a.isPlayer)
    let action: CombatActionKind = 'attack'
    if (smart && player) {
      if (player.hp < player.maxHp * 0.4 && (combat.aidUsesLeft ?? 0) > 0) {
        action = 'tactic_aid'
      } else action = rng() < 0.7 ? 'skill' : 'attack'
    } else {
      action = pick(rng, [
        'attack',
        'skill',
        'defend',
        'tactic_flash',
        'tactic_aid',
      ] as CombatActionKind[])
    }
    combat = performPlayerAction(combat, action, target)
  }
  if (!combat.finished || !combat.victory) {
    const streak = state.combatLoseStreak + 1
    return {
      win: false,
      state: {
        ...state,
        combatLoseStreak: streak,
        stats: {
          ...state.stats,
          hp: Math.max(1, Math.floor(state.stats.maxHp * 0.45)),
        },
      },
    }
  }
  const reward = banditWinRewards(state.banditFightsThisXun)
  const player = combat.allies.find((a) => a.isPlayer)
  let next: GameState = {
    ...state,
    combatLoseStreak: 0,
    lifetimeBanditWins: (state.lifetimeBanditWins ?? 0) + 1,
    stats: {
      ...state.stats,
      hp: Math.max(1, Math.min(state.stats.maxHp, player?.hp ?? state.stats.hp)),
    },
    currency: {
      ...state.currency,
      silver: state.currency.silver + reward.silver + mods.banditSilverFlat,
    },
    potential: state.potential + reward.potential,
  }
  // 勝仗掉落冷門招（與實機一致偏高）
  if (rng() < 0.4) {
    const pool = [...COLD_MARTIAL_IDS]
    const unknown = pool.filter((id) => (next.martialProgress[id] ?? 0) <= 0)
    if (unknown.length) {
      const mid = pick(rng, unknown)
      next = grantMartialArts(next, [mid]).state
    }
  }
  return { win: true, state: autoEquip(next) }
}

function stepXun(state: GameState, rng: () => number): GameState {
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
      silver: routed.currency.silver + 5 + routed.tradeRouteLevel * 8,
    },
    rumors: story.rumors,
    pendingEventId: story.pendingEventId,
    unlockedArcIds: story.unlockedArcIds,
    xunsSinceLastBeat: story.xunsSinceLastBeat,
    combatLoseStreak: 0,
    banditFightsThisXun: 0,
    sparFightsThisXun: 0,
    lifetimeXuns: (routed.lifetimeXuns ?? 0) + 1,
  }
}

function stepTravel(state: GameState, rng: () => number): GameState {
  const links = getLinkedLocations(state.locationId)
  if (!links.length) return state
  const target = pick(rng, links)
  const cost = target.travelStamina
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
  const nextPeriod =
    state.time.period === 'dawn'
      ? 'noon'
      : state.time.period === 'noon'
        ? 'dusk'
        : state.time.period === 'dusk'
          ? 'night'
          : 'dawn'
  const fromNight = state.time.period === 'night'
  let next: GameState = {
    ...state,
    locationId: target.id,
    locationName: target.name,
    knownLocationIds: [...known],
    stats: { ...state.stats, stamina: state.stats.stamina - cost },
    time: {
      ...state.time,
      period: nextPeriod,
      day: fromNight ? state.time.day + 1 : state.time.day,
    },
    actionPoints: fromNight
      ? applyNightTravelApRestore(state.actionPoints, state.maxActionPoints)
      : state.actionPoints,
  }
  // 初訪書冊
  if (!state.knownLocationIds.includes(target.id)) {
    const pool = LOCATION_MARTIAL_FINDS[target.id]
    if (pool && rng() < 0.72) {
      const unknown = pool.filter((id) => (next.martialProgress[id] ?? 0) <= 0)
      if (unknown.length) {
        next = grantMartialArts(next, [pick(rng, unknown)]).state
      }
    }
  }
  return autoEquip(next)
}

function stepEvent(
  state: GameState,
  rng: () => number,
  c: { wins: number; losses: number },
): GameState {
  const eventId = state.pendingEventId
  if (!eventId) return state
  const raw = getStoryEventById(eventId)
  if (!raw?.choices.length) return { ...state, pendingEventId: null }
  const def = flavorEventForNgPlus(raw, state.ngPlusCount)
  const choice = pick(rng, def.choices)
  const { state: rewarded } = applyRewards(state, choice.rewards)
  const storyFlags = { ...rewarded.storyFlags, [eventId]: true }
  const mainDone = Boolean(storyFlags['main_y5_wharf'])
  let next: GameState = {
    ...rewarded,
    pendingEventId: null,
    storyFlags,
    lastOutcomeText: choice.outcomeText,
    tradeRouteLevel: rewarded.tradeRouteLevel + (choice.tradeBump ?? 0),
    ngPlusReady: rewarded.ngPlusReady || mainDone,
  }
  next =
    eventId.startsWith('main_') || eventId.startsWith('arc_')
      ? applyMainBeatResolved(next, eventId)
      : ensureStoryRoute(next)
  if (choice.startCombat) {
    const r = runCombat(next, rng, true)
    if (r.win) c.wins++
    else c.losses++
    next = r.state
  }
  return next
}

function stepBandit(
  state: GameState,
  rng: () => number,
  c: { wins: number; losses: number },
): GameState {
  const block = getBanditStartBlock(state)
  if (block) {
    if (block === 'xun_cap' || block === 'no_ap') return stepXun(state, rng)
    return {
      ...state,
      combatLoseStreak: block === 'lose_streak' ? 0 : state.combatLoseStreak,
      stats: {
        ...state.stats,
        hp: Math.min(state.stats.maxHp, state.stats.hp + 20),
      },
    }
  }
  let next = applyBanditFightStartCost(state)
  const r = runCombat(next, rng, true)
  if (r.win) c.wins++
  else c.losses++
  return r.state
}

function stepTrain(state: GameState, rng: () => number): GameState {
  const candidates = MARTIAL_ARTS.filter((m) => {
    const lv = state.martialProgress[m.id] ?? 0
    if (lv >= 10) return false
    if (lv <= 0) return canProgressMartial(state, m.id, { learning: true }).ok
    return canProgressMartial(state, m.id, { learning: false }).ok
  })
  if (!candidates.length) return state
  // 六成偏好冷門／非開局
  const cold = candidates.filter((m) =>
    (COLD_MARTIAL_IDS as readonly string[]).includes(m.id),
  )
  const art =
    cold.length && rng() < 0.6 ? pick(rng, cold) : pick(rng, candidates)
  const lv = state.martialProgress[art.id] ?? 0
  if (lv <= 0) {
    if (state.potential < 5) return state
    const granted = grantMartialArts(
      { ...state, potential: state.potential - 5 },
      [art.id],
    )
    return autoEquip(granted.state)
  }
  const cost = trainPotentialCost(lv)
  if (state.potential < cost) return state
  return autoEquip({
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: lv + 1 },
  })
}

function stepSect(state: GameState, persona: Persona, rng: () => number): GameState {
  if (!state.sectId) {
    const prefer = persona.forceSectId
    const candidates = SECTS.filter((s) => canJoinSect(state, s.id).ok)
    if (!candidates.length) return stepTravel(state, rng)
    const sect =
      prefer && candidates.some((s) => s.id === prefer)
        ? candidates.find((s) => s.id === prefer)!
        : pick(rng, candidates)
    let next = applyJoinSect(state, sect.id)
    const grants = SECT_MARTIAL_GRANTS[sect.id]?.onJoin ?? []
    next = grantMartialArts(next, grants).state
    return autoEquip(next)
  }
  if (state.currency.silver < 20) return state
  const nextContrib = state.sectContribution + 15
  let next = {
    ...state,
    sectContribution: nextContrib,
    currency: {
      ...state.currency,
      silver: state.currency.silver - 20,
    },
  }
  const sect = SECTS.find((s) => s.id === state.sectId)
  if (sect) {
    // 粗晉升：貢獻過門檻時嘗試傳功
    for (const [rank, arts] of Object.entries(
      SECT_MARTIAL_GRANTS[state.sectId]?.onRank ?? {},
    )) {
      if (nextContrib >= (sect.rankThresholds[Number(rank) - 1] ?? 9999)) {
        next = grantMartialArts(next, arts).state
      }
    }
  }
  return autoEquip(next)
}

function stepHero(state: GameState, persona: Persona, rng: () => number): GameState {
  const bias = persona.forcePartyBias
  const npc =
    bias && rng() < 0.55
      ? NPCS.find((n) => n.id === bias) ?? pick(rng, NPCS)
      : pick(rng, NPCS)
  const aff = Math.min(100, (state.affinity[npc.id] ?? 0) + 12)
  let next: GameState = {
    ...state,
    affinity: { ...state.affinity, [npc.id]: aff },
  }
  if (
    next.partyIds.length < 2 &&
    !next.partyIds.includes(npc.id) &&
    aff >= 30
  ) {
    next = { ...next, partyIds: [...next.partyIds, npc.id] }
  }
  return next
}

function stepGather(state: GameState, rng: () => number): GameState {
  const loc = getLocationById(state.locationId)
  if (!loc || loc.gather === 'none' || state.actionPoints < 1) return state
  const kind = loc.gather === 'both' ? (rng() < 0.5 ? 'herb' : 'ore') : loc.gather
  const mat = makeMaterial(
    kind === 'herb' ? MATERIAL_IDS.herb : MATERIAL_IDS.ore,
    1,
  )
  if (!mat) return state
  return {
    ...state,
    actionPoints: state.actionPoints - 1,
    inventory: mergeItem(state.inventory, mat),
    potential: state.potential + 1,
  }
}

function stepGacha(state: GameState, rng: () => number): GameState {
  const ten = rng() < 0.4
  const cost = ten ? GACHA_TEN_COST : GACHA_SINGLE_COST
  let next = state
  if (next.currency.yuanbao < cost) {
    next = {
      ...next,
      currency: {
        ...next.currency,
        yuanbao: next.currency.yuanbao + 600,
      },
    }
  }
  if (next.currency.yuanbao < cost) return next
  const pulled = pullMany(ten ? 10 : 1, {
    year: next.time.year,
    pityEpic: next.gachaPityEpic,
    pityLegendary: next.gachaPityLegendary,
  })
  let seq = next.equipUidSeq
  const owned: OwnedEquipment[] = [...next.ownedEquipment]
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
  return autoEquip({
    ...next,
    currency: {
      ...next.currency,
      yuanbao: next.currency.yuanbao - cost,
    },
    ownedEquipment: owned,
    equipUidSeq: seq,
    gachaPityEpic: pulled.pityEpic,
    gachaPityLegendary: pulled.pityLegendary,
    gachaTotalPulls: next.gachaTotalPulls + (ten ? 10 : 1),
  })
}

function styleWeights(style: Style): Record<string, number> {
  switch (style) {
    case 'main':
      return {
        xun: 28,
        travel: 12,
        bandit: 14,
        train: 10,
        sect: 4,
        hero: 14,
        gather: 4,
        gacha: 6,
      }
    case 'sect_hero':
      return {
        xun: 20,
        travel: 14,
        sect: 16,
        hero: 16,
        train: 10,
        bandit: 8,
        gather: 4,
        gacha: 6,
      }
    case 'combat':
      return {
        xun: 16,
        bandit: 26,
        train: 12,
        hero: 12,
        travel: 10,
        sect: 8,
        gather: 4,
        gacha: 6,
      }
    case 'explore':
      return {
        travel: 28,
        gather: 14,
        xun: 14,
        train: 8,
        hero: 8,
        sect: 6,
        bandit: 6,
        gacha: 6,
      }
    case 'train_craft':
      return {
        train: 22,
        gather: 14,
        xun: 18,
        travel: 10,
        sect: 8,
        hero: 6,
        bandit: 6,
        gacha: 8,
      }
    default:
      return {
        xun: 18,
        travel: 12,
        bandit: 12,
        train: 12,
        sect: 10,
        hero: 10,
        gather: 6,
        gacha: 8,
      }
  }
}

function snapshot(state: GameState, c: { wins: number; losses: number }, steps: number): UsageSnap {
  const equippedArts = [
    state.martialLoadout.internalId,
    state.martialLoadout.heartId,
    state.martialLoadout.qinggongId,
    ...state.martialLoadout.activeIds,
  ].filter(Boolean) as string[]
  const equipEquipped = Object.values(state.equipped)
    .map((uid) => state.ownedEquipment.find((e) => e.uid === uid)?.defId)
    .filter(Boolean) as string[]
  const routes: Record<string, string> = {}
  for (const k of ['route_y1', 'route_y2', 'route_y3', 'route_y4']) {
    const v = state.flags[k]
    if (typeof v === 'string') routes[k] = v
  }
  const mods = computeDifficultyMods(state)
  const path = computeJourneyProfile(state)
  const ending =
    typeof state.flags.ending_branch === 'string'
      ? state.flags.ending_branch
      : null
  return {
    martialLearned: Object.keys(state.martialProgress).filter(
      (id) => (state.martialProgress[id] ?? 0) > 0,
    ),
    martialEquipped: equippedArts,
    equipOwned: state.ownedEquipment.map((e) => e.defId),
    equipEquipped,
    sectId: state.sectId,
    partyIds: [...state.partyIds],
    partnerId: state.partnerId,
    routes,
    combatWins: c.wins,
    combatLosses: c.losses,
    steps,
    cleared: !!state.storyFlags['main_y5_wharf'] || canSettleNgPlus(state),
    enemyScaleEnd: mods.enemyScale,
    panelAtk: buildPlayerCombatant(state).atk,
    pathTier: path.pathTier,
    diversityScore: path.diversityScore,
    endingBranch: ending,
    coldMartialEquipped: path.coldMartialEquipped,
    nonStarterEquipped: path.nonStarterEquipped,
  }
}

function runOne(persona: Persona, seed: number): UsageSnap {
  const rng = mulberry32(seed)
  const c = { wins: 0, losses: 0 }
  let state = autoEquip(
    applyPrologue(applyOrigin(createInitialGameState(), persona.originId), rng),
  )
  // 開局略加銀／潛能，讓門派／修練有機會
  state = {
    ...state,
    currency: { ...state.currency, silver: state.currency.silver + 120 },
    potential: state.potential + 24,
    stats: { ...state.stats, level: Math.max(state.stats.level, 3) },
  }
  let steps = 0
  while (steps < MAX_STEPS) {
    steps++
    if (state.pendingEventId) {
      state = stepEvent(state, rng, c)
    } else if (state.storyFlags['main_y5_wharf']) {
      break
    } else {
      const act = weightedPick(rng, styleWeights(persona.style))
      if (act === 'xun') state = stepXun(state, rng)
      else if (act === 'travel') state = stepTravel(state, rng)
      else if (act === 'bandit') state = stepBandit(state, rng, c)
      else if (act === 'train') state = stepTrain(state, rng)
      else if (act === 'sect') state = stepSect(state, persona, rng)
      else if (act === 'hero') state = stepHero(state, persona, rng)
      else if (act === 'gather') state = stepGather(state, rng)
      else if (act === 'gacha') state = stepGacha(state, rng)
      else state = stepXun(state, rng)
    }
    if (state.stats.hp <= 0) {
      state = {
        ...state,
        stats: { ...state.stats, hp: Math.max(1, Math.floor(state.stats.maxHp * 0.4)) },
      }
    }
  }
  return snapshot(autoEquip(state), c, steps)
}

/** 固定面板下測組隊／門派穩贏 */
function comboBench(year = 5) {
  const setups: {
    id: string
    title: string
    apply: (s: GameState) => GameState
  }[] = [
    {
      id: 'solo_starter',
      title: '單人起步裝',
      apply: (s) => s,
    },
    {
      id: 'party_tank_dps',
      title: '隊友廓靖+楊過式（tank+dps）',
      apply: (s) => ({
        ...s,
        partyIds: ['npc_guo_jing', 'npc_yang_guo'].filter((id) =>
          NPCS.some((n) => n.id === id),
        ),
        affinity: {
          ...s.affinity,
          npc_guo_jing: 80,
          npc_yang_guo: 80,
        },
      }),
    },
    {
      id: 'party_huang_rong',
      title: '皇容+洪柒公',
      apply: (s) => ({
        ...s,
        partyIds: ['npc_huang_rong', 'npc_hong_qigong'],
        affinity: {
          ...s.affinity,
          npc_huang_rong: 90,
          npc_hong_qigong: 90,
        },
      }),
    },
    {
      id: 'sect_huashan_lonely',
      title: '華嶠+獨孤配置',
      apply: (s) => {
        let n = applyJoinSect(s, 'sect_huashan')
        n = grantMartialArts(n, ['ma_qing_huashan', 'ma_act_lonely']).state
        n = {
          ...n,
          martialProgress: {
            ...n.martialProgress,
            ma_qing_huashan: 6,
            ma_act_lonely: 6,
          },
        }
        return autoEquip(n)
      },
    },
    {
      id: 'sect_shaolin_def',
      title: '少凜守勢配置',
      apply: (s) => {
        let n = applyJoinSect(s, 'sect_shaolin')
        n = grantMartialArts(n, ['ma_shaolin_yi', 'ma_shaolin_xisui']).state
        n = {
          ...n,
          martialProgress: {
            ...n.martialProgress,
            ma_shaolin_yi: 6,
            ma_shaolin_xisui: 5,
          },
        }
        return autoEquip(n)
      },
    },
    {
      id: 'sect_mingjiao_fire',
      title: '明皎火系',
      apply: (s) => {
        let n = applyJoinSect(s, 'sect_mingjiao')
        n = grantMartialArts(n, ['ma_mingjiao_fire', 'ma_jiuyang']).state
        n = {
          ...n,
          martialProgress: {
            ...n.martialProgress,
            ma_mingjiao_fire: 6,
            ma_jiuyang: 5,
          },
          flags: { ...n.flags, route_y1: 'scheme' },
        }
        return autoEquip(n)
      },
    },
    {
      id: 'full_stack',
      title: '華嶠+雙隊友+高修',
      apply: (s) => {
        let n = applyJoinSect(s, 'sect_huashan')
        n = grantMartialArts(n, ['ma_qing_huashan', 'ma_act_lonely']).state
        n = {
          ...n,
          partyIds: ['npc_guo_jing', 'npc_huang_rong'],
          martialProgress: {
            ...n.martialProgress,
            ma_qing_huashan: 8,
            ma_act_lonely: 8,
            ma_jiuyin: 8,
          },
          paidAtkBonus: 6,
          paidDefBonus: 6,
        }
        return autoEquip(n)
      },
    },
  ]

  const rows = []
  for (const setup of setups) {
    let wins = 0
    for (let i = 0; i < COMBO_FIGHTS; i++) {
      const rng = mulberry32(90000 + setups.indexOf(setup) * 1000 + i)
      let s = applyPrologue(
        applyOrigin(createInitialGameState(), 'cat_tech'),
        rng,
      )
      s = {
        ...s,
        stats: {
          ...s.stats,
          attack: 18,
          defense: 12,
          hp: 130,
          maxHp: 130,
          level: 5,
        },
        time: { ...s.time, year },
        potential: 40,
        currency: { ...s.currency, silver: 200 },
      }
      // 確保隊友 id 存在
      const partyFix = setup.apply(s)
      const knownParty = partyFix.partyIds.filter((id) =>
        NPCS.some((n) => n.id === id),
      )
      s = { ...partyFix, partyIds: knownParty }
      // 補齊缺失的 tank/dps
      if (setup.id === 'party_tank_dps' && knownParty.length < 2) {
        const dps = NPCS.find((n) => n.role === 'dps')
        const tank = NPCS.find((n) => n.role === 'tank')
        s = {
          ...s,
          partyIds: [tank?.id, dps?.id].filter(Boolean) as string[],
        }
      }
      const r = runCombat(s, rng, true)
      if (r.win) wins++
    }
    rows.push({
      id: setup.id,
      title: setup.title,
      winRate: Math.round((wins / COMBO_FIGHTS) * 1000) / 10,
      fights: COMBO_FIGHTS,
    })
  }
  return rows
}

function rateMap(
  ids: string[],
  counter: Map<string, number>,
  denom: number,
): { id: string; name: string; count: number; rate: number }[] {
  return ids
    .map((id) => {
      const count = counter.get(id) ?? 0
      return {
        id,
        name: id,
        count,
        rate: denom ? Math.round((count / denom) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => a.rate - b.rate)
}

function main() {
  const personas = buildPersonas()
  const snaps: (UsageSnap & { personaId: number; style: Style; seed: number })[] =
    []

  for (const p of personas) {
    for (let r = 0; r < RUNS_PER; r++) {
      const seed = 55000 + p.id * 100 + r
      const snap = runOne(p, seed)
      snaps.push({ ...snap, personaId: p.id, style: p.style, seed })
    }
  }

  const cleared = snaps.filter((s) => s.cleared)
  const clearN = cleared.length || 1
  const totalN = snaps.length

  const martialLearn = new Map<string, number>()
  const martialEquip = new Map<string, number>()
  const equipOwn = new Map<string, number>()
  const equipWear = new Map<string, number>()
  const sectJoin = new Map<string, number>()
  const partySeen = new Map<string, number>()
  const routeSeen = new Map<string, number>()

  for (const s of cleared) {
    for (const id of new Set(s.martialLearned)) {
      martialLearn.set(id, (martialLearn.get(id) ?? 0) + 1)
    }
    for (const id of new Set(s.martialEquipped)) {
      martialEquip.set(id, (martialEquip.get(id) ?? 0) + 1)
    }
    for (const id of new Set(s.equipOwned)) {
      equipOwn.set(id, (equipOwn.get(id) ?? 0) + 1)
    }
    for (const id of new Set(s.equipEquipped)) {
      equipWear.set(id, (equipWear.get(id) ?? 0) + 1)
    }
    if (s.sectId) sectJoin.set(s.sectId, (sectJoin.get(s.sectId) ?? 0) + 1)
    for (const id of s.partyIds) {
      partySeen.set(id, (partySeen.get(id) ?? 0) + 1)
    }
    for (const [k, v] of Object.entries(s.routes)) {
      const key = `${k}:${v}`
      routeSeen.set(key, (routeSeen.get(key) ?? 0) + 1)
    }
  }

  const martialIds = MARTIAL_ARTS.map((m) => m.id)
  const equipIds = EQUIPMENTS.map((e) => e.id)
  const sectIds = SECTS.map((s) => s.id)
  const npcIds = NPCS.map((n) => n.id)

  const nameMartial = (id: string) =>
    MARTIAL_ARTS.find((m) => m.id === id)?.name ?? id
  const nameEquip = (id: string) =>
    EQUIPMENTS.find((e) => e.id === id)?.name ?? id
  const nameSect = (id: string) => SECTS.find((s) => s.id === id)?.name ?? id
  const nameNpc = (id: string) => NPCS.find((n) => n.id === id)?.name ?? id

  const deadMartial = rateMap(martialIds, martialEquip, clearN)
    .filter((x) => x.rate < 5 && !STARTER_MARTIAL.has(x.id))
    .map((x) => ({ ...x, name: nameMartial(x.id), metric: 'equippedAtClear' }))
  const deadEquip = rateMap(equipIds, equipOwn, clearN)
    .filter((x) => x.rate < 5 && !STARTER_EQUIP.has(x.id))
    .map((x) => ({ ...x, name: nameEquip(x.id), metric: 'ownedAtClear' }))
  const deadSect = rateMap(sectIds, sectJoin, clearN)
    .filter((x) => x.rate < 8)
    .map((x) => ({ ...x, name: nameSect(x.id) }))
  const deadNpc = rateMap(npcIds, partySeen, clearN)
    .filter((x) => x.rate < 5)
    .map((x) => ({ ...x, name: nameNpc(x.id) }))

  // 穩贏：依門派／隊友聚合通關局戰鬥勝率
  const bySect: Record<string, { n: number; wins: number; losses: number; steps: number[] }> = {}
  const byParty: Record<string, { n: number; wins: number; losses: number }> = {}
  const byInternal: Record<string, { n: number; wins: number; losses: number }> = {}

  for (const s of cleared) {
    const fights = s.combatWins + s.combatLosses
    const sectKey = s.sectId ?? 'none'
    if (!bySect[sectKey]) bySect[sectKey] = { n: 0, wins: 0, losses: 0, steps: [] }
    bySect[sectKey].n++
    bySect[sectKey].wins += s.combatWins
    bySect[sectKey].losses += s.combatLosses
    bySect[sectKey].steps.push(s.steps)

    for (const pid of s.partyIds.length ? s.partyIds : ['solo']) {
      if (!byParty[pid]) byParty[pid] = { n: 0, wins: 0, losses: 0 }
      byParty[pid].n++
      byParty[pid].wins += s.combatWins
      byParty[pid].losses += s.combatLosses
    }
    const internal = s.martialEquipped.find((id) =>
      MARTIAL_ARTS.some((m) => m.id === id && m.kind === 'internal'),
    ) ?? 'none'
    if (!byInternal[internal]) byInternal[internal] = { n: 0, wins: 0, losses: 0 }
    byInternal[internal].n++
    byInternal[internal].wins += s.combatWins
    byInternal[internal].losses += s.combatLosses
    void fights
  }

  const winRate = (w: number, l: number) => {
    const t = w + l
    return t ? Math.round((w / t) * 1000) / 10 : null
  }

  const sectWin = Object.entries(bySect)
    .map(([id, v]) => ({
      id,
      name: id === 'none' ? '無門派' : nameSect(id),
      clears: v.n,
      combatWinRate: winRate(v.wins, v.losses),
      medianSteps: [...v.steps].sort((a, b) => a - b)[Math.floor(v.steps.length / 2)],
      enemyHint: id === 'none' ? 1 : getSectRule(id)?.combat.enemyScale,
    }))
    .sort((a, b) => (b.combatWinRate ?? 0) - (a.combatWinRate ?? 0))

  const partyWin = Object.entries(byParty)
    .map(([id, v]) => ({
      id,
      name: id === 'solo' ? '無隊友' : nameNpc(id),
      clears: v.n,
      combatWinRate: winRate(v.wins, v.losses),
    }))
    .filter((x) => x.clears >= 8)
    .sort((a, b) => (b.combatWinRate ?? 0) - (a.combatWinRate ?? 0))

  const combosY5 = comboBench(5)
  const combosY1 = comboBench(1)
  const comboSorted = [...combosY5].sort((a, b) => b.winRate - a.winRate)
  const comboY1Sorted = [...combosY1].sort((a, b) => b.winRate - a.winRate)
  const solo = comboSorted.find((c) => c.id === 'solo_starter')
  const soloY1 = comboY1Sorted.find((c) => c.id === 'solo_starter')
  const partyY1 = comboY1Sorted.find((c) => c.id === 'party_tank_dps')
  // 同年早期：組隊相對單人仍 ≥25pp 且組隊 ≥95% → 視為過強
  const earlyPartyOp =
    !!partyY1 &&
    !!soloY1 &&
    partyY1.winRate >= 95 &&
    partyY1.winRate - soloY1.winRate >= 25
  const opCombos = comboSorted.filter((c) => {
    if (c.id === 'solo_starter') return false
    if (solo && c.winRate - solo.winRate >= 40 && c.winRate >= 90) return true
    return false
  })

  const avgClearWin = winRate(
    cleared.reduce((a, s) => a + s.combatWins, 0),
    cleared.reduce((a, s) => a + s.combatLosses, 0),
  )

  const partyTilt =
    (comboSorted.find((c) => c.id === 'party_tank_dps')?.winRate ?? 0) -
    (solo?.winRate ?? 0)
  // 高修單人基準：用來區分「養成優勢」vs「組隊漏洞」
  const trainedSolo = comboSorted.find((c) => c.id === 'sect_huashan_lonely')
  const partyVsTrained =
    (comboSorted.find((c) => c.id === 'full_stack')?.winRate ?? 0) -
    (trainedSolo?.winRate ?? 0)

  const pathTierCounts: Record<string, number> = {}
  const endingCounts: Record<string, number> = {}
  const pathTierAll: Record<string, number> = {}
  let sumDiversity = 0
  let sumColdEquip = 0
  for (const s of snaps) {
    pathTierAll[s.pathTier] = (pathTierAll[s.pathTier] ?? 0) + 1
  }
  for (const s of cleared) {
    pathTierCounts[s.pathTier] = (pathTierCounts[s.pathTier] ?? 0) + 1
    const eb = s.endingBranch ?? 'unknown'
    endingCounts[eb] = (endingCounts[eb] ?? 0) + 1
    sumDiversity += s.diversityScore
    sumColdEquip += s.coldMartialEquipped
  }
  for (const s of snaps.filter((x) => !x.cleared)) {
    endingCounts['blocked_or_unfinished'] =
      (endingCounts['blocked_or_unfinished'] ?? 0) + 1
  }

  const coldMartialRates = [...COLD_MARTIAL_IDS].map((id) => {
    const count = martialEquip.get(id) ?? 0
    return {
      id,
      name: nameMartial(id),
      rate: Math.round((count / clearN) * 1000) / 10,
      baseline: BASELINE.coldRates[id] ?? null,
    }
  })
  const coldSectRates = [...COLD_SECT_IDS].map((id) => {
    const count = sectJoin.get(id) ?? 0
    return {
      id,
      name: nameSect(id),
      rate: Math.round((count / clearN) * 1000) / 10,
      baseline: BASELINE.coldRates[id] ?? null,
    }
  })

  const clearRate = Math.round((cleared.length / totalN) * 1000) / 10

  const payload = {
    generatedAt: new Date().toISOString(),
    meta: {
      personas: PERSONAS,
      runsPerPersona: RUNS_PER,
      totalRuns: totalN,
      cleared: cleared.length,
      clearRate,
      pools: {
        martial: martialIds.length,
        equip: equipIds.length,
        sect: sectIds.length,
        npc: npcIds.length,
      },
      avgCombatWinRateOnClear: avgClearWin,
      avgDiversityScore:
        cleared.length
          ? Math.round((sumDiversity / cleared.length) * 10) / 10
          : 0,
      avgColdMartialEquipped:
        cleared.length
          ? Math.round((sumColdEquip / cleared.length) * 10) / 10
          : 0,
      pathTierCounts,
      pathTierAllRuns: pathTierAll,
      endingBranchCounts: endingCounts,
    },
    beforeAfter: {
      baselineClearRate: BASELINE.clearRate,
      clearRate,
      baselineMartialNearUnused: BASELINE.martialNearUnused,
      martialNearUnused: deadMartial.length,
      coldMartialRates,
      coldSectRates,
    },
    deadContent: {
      martialEquipRateLt5: deadMartial,
      equipOwnRateLt5: deadEquip,
      sectClearRateLt8: deadSect,
      partyRateLt5: deadNpc,
      summary: {
        martialNearUnused: deadMartial.length,
        martialNeverEquipped: deadMartial.filter((x) => x.rate === 0).length,
        equipNearUnused: deadEquip.length,
        equipNeverOwned: deadEquip.filter((x) => x.rate === 0).length,
        sectLow: deadSect.length,
        npcLow: deadNpc.length,
      },
    },
    hotContent: {
      martialEquipTop: rateMap(martialIds, martialEquip, clearN)
        .map((x) => ({ ...x, name: nameMartial(x.id) }))
        .reverse()
        .slice(0, 10),
      equipWearTop: rateMap(equipIds, equipWear, clearN)
        .map((x) => ({ ...x, name: nameEquip(x.id) }))
        .reverse()
        .slice(0, 8),
      sectTop: rateMap(sectIds, sectJoin, clearN)
        .map((x) => ({ ...x, name: nameSect(x.id) }))
        .reverse(),
      partyTop: rateMap(npcIds, partySeen, clearN)
        .map((x) => ({ ...x, name: nameNpc(x.id) }))
        .reverse()
        .slice(0, 10),
    },
    winTilt: {
      bySect: sectWin,
      byPartyTop: partyWin.slice(0, 12),
      byInternal: Object.entries(byInternal)
        .map(([id, v]) => ({
          id,
          name: id === 'none' ? '無主內功' : nameMartial(id),
          clears: v.n,
          combatWinRate: winRate(v.wins, v.losses),
        }))
        .sort((a, b) => (b.combatWinRate ?? 0) - (a.combatWinRate ?? 0)),
      comboBenchYear5: comboSorted,
      comboBenchYear1: comboY1Sorted,
      opCombos,
      earlyPartyOp,
    },
    verdict: {
      deadContentSevere:
        deadMartial.filter((x) => x.rate === 0).length >= 12 ||
        deadEquip.filter((x) => x.rate === 0).length >= 8,
      partyTiltVsSolo: partyTilt,
      partyVsTrainedSolo: partyVsTrained,
      partyTiltYear1: (partyY1?.winRate ?? 0) - (soloY1?.winRate ?? 0),
      overpoweredCombo: earlyPartyOp,
      clearRateDropped: clearRate < BASELINE.clearRate - 5,
      coldUsageImproved: coldMartialRates.some(
        (r) => r.baseline != null && r.rate > (r.baseline as number) + 5,
      ),
      pathForkVisible: Object.keys(endingCounts).length >= 2,
      notes: [
        '結局閘需旅程投入（入派／組隊／勝仗／非開局招），空轉點敘事無法 99% 通關。',
        '新學自動占空欄／替換開局招；冷門掉落池加重。',
        '結局分支：空舟／刀光／並肩／門牆。',
      ],
    },
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  console.log(
    JSON.stringify(
      {
        clearRate: payload.meta.clearRate,
        dead: payload.deadContent.summary,
        pathTier: payload.meta.pathTierCounts,
        endings: payload.meta.endingBranchCounts,
        beforeAfterCold: payload.beforeAfter.coldMartialRates.slice(0, 8),
        verdict: payload.verdict,
      },
      null,
      2,
    ),
  )
  console.log('wrote', OUT)
}

main()
