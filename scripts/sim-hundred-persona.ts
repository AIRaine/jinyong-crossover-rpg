/**
 * 百人交叉試玩：年齡層 × 遊玩時間 × 課金 × 亂數選擇
 * 用法：npm run sim:hundred-persona
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
import { getEquipmentById } from '../src/data/equipments.ts'
import { MARTIAL_ARTS, trainPotentialCost } from '../src/data/martialArts.ts'
import { SECTS } from '../src/data/sects.ts'
import { NPCS, createItemFromCatalog } from '../src/data/npcs.ts'
import { MATERIAL_IDS, makeMaterial } from '../src/data/alchemy.ts'
import {
  MOCK_TOPUP_PACKS,
  MONTHLY_DAILY_AP,
  MONTHLY_DAILY_POTENTIAL,
  MONTHLY_DAILY_SILVER,
  MONTHLY_DAILY_YUANBAO,
  YUANBAO_SHOP,
} from '../src/data/shop.ts'
import {
  pullMany,
  GACHA_SINGLE_COST,
  GACHA_TEN_COST,
} from '../src/lib/gachaEngine.ts'
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
  TACTIC_AID_MAX_PER_FIGHT,
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
import { applyJoinSect, canJoinSect } from '../src/lib/sectRules.ts'
import { computeDifficultyMods } from '../src/lib/difficultyModifiers.ts'
import { flavorEventForNgPlus } from '../src/lib/ngPlusStory.ts'
import { applyNightTravelApRestore } from '../src/lib/travelApRules.ts'
import { canSettleNgPlus } from '../src/lib/ngPlus.ts'
import {
  COLD_MARTIAL_IDS,
  STARTER_MARTIAL_IDS,
  computeJourneyProfile,
} from '../src/lib/journeyPath.ts'
import type { GameState, InventoryItem, OwnedEquipment } from '../src/types/game.ts'

const OUT =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/hundred-persona-result.json'

type Age = 'teen' | 'young' | 'mid' | 'elder'
type Play = 'fragment' | 'daily' | 'weekend' | 'grind'
type Pay = 'free' | 'small' | 'mid' | 'whale'
type Choice = 'random' | 'first' | 'optimize' | 'chaos_build'

type Persona = {
  id: number
  age: Age
  play: Play
  pay: Pay
  choice: Choice
  originId: string
  label: string
}

type RunSnap = {
  personaId: number
  age: Age
  play: Play
  pay: Pay
  choice: Choice
  label: string
  seed: number
  steps: number
  maxSteps: number
  cleared: boolean
  crashed: boolean
  crashMsg: string | null
  softLock: boolean
  hollowGated: boolean
  finaleBlockedNoEngage: boolean
  pathTier: string
  diversityScore: number
  endingBranch: string | null
  combatWins: number
  combatLosses: number
  aidAttempts: number
  aidBlocked: number
  maxAidInFight: number
  aidAbuseSuspect: boolean
  topupYuanbao: number
  yuanbaoSpent: number
  charmBuys: number
  paidAtk: number
  paidDef: number
  paySkipSuspect: boolean
  sectId: string | null
  partyIds: string[]
  martialEquipped: string[]
  coldEquipped: number
  nonStarterEquipped: number
  pendingStuckSteps: number
}

const AGES: Age[] = ['teen', 'young', 'mid', 'elder']
const PLAYS: Play[] = ['fragment', 'daily', 'weekend', 'grind']
const PAYS: Pay[] = ['free', 'small', 'mid', 'whale']
const CHOICES: Choice[] = ['random', 'first', 'optimize', 'chaos_build']

const PAY_CAP: Record<Pay, number> = {
  free: 0,
  small: 300,
  mid: 980,
  whale: 2720,
}

const PLAY_STEPS: Record<Play, number> = {
  fragment: 140,
  daily: 280,
  weekend: 420,
  grind: 560,
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
  const list: Persona[] = []
  let id = 0
  for (const age of AGES) {
    for (const play of PLAYS) {
      for (const pay of PAYS) {
        for (const choice of CHOICES) {
          id++
          const origin = ORIGINS[(id - 1) % ORIGINS.length]!
          list.push({
            id,
            age,
            play,
            pay,
            choice,
            originId: origin.id,
            label: `${age}/${play}/${pay}/${choice}`,
          })
        }
      }
    }
  }
  // 4×4×4×4 = 256
  return list
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
  for (const iid of cat.startingItemIds) {
    const item = createItemFromCatalog(iid, 1)
    if (item) inventory = mergeItem(inventory, item)
  }
  const techTree = { ...state.techTree }
  for (const t of cat.startingTechIds) techTree[t] = 1
  return {
    ...state,
    playerName: '百人測',
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

function applyPrologue(state: GameState, rng: () => number, choiceMode: Choice): GameState {
  const prologue = getPrologueEvent()
  const choice =
    choiceMode === 'first'
      ? prologue.choices[0]!
      : pick(rng, prologue.choices)
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

function autoEquip(state: GameState, choice: Choice): GameState {
  const rank = (id: string) => {
    const lv = state.martialProgress[id] ?? 0
    const cold = (COLD_MARTIAL_IDS as readonly string[]).includes(id) ? 25 : 0
    const starter = (STARTER_MARTIAL_IDS as readonly string[]).includes(id)
      ? -15
      : 8
    // chaos：故意偏好冷門；first：偏好開局
    if (choice === 'chaos_build') return cold * 3 + lv
    if (choice === 'first')
      return (STARTER_MARTIAL_IDS as readonly string[]).includes(id)
        ? 100 + lv
        : lv
    return lv * 10 + cold + starter
  }
  const pickKind = (kind: string, limit: number) =>
    MARTIAL_ARTS.filter(
      (a) => a.kind === kind && (state.martialProgress[a.id] ?? 0) > 0,
    )
      .sort((a, b) => rank(b.id) - rank(a.id))
      .slice(0, limit)
      .map((a) => a.id)
  const actives = pickKind('active', 4)
  const loadout = {
    internalId: pickKind('internal', 1)[0] ?? null,
    heartId: pickKind('heart', 1)[0] ?? null,
    qinggongId: pickKind('qinggong', 1)[0] ?? null,
    activeIds: [
      actives[0] ?? null,
      actives[1] ?? null,
      actives[2] ?? null,
      actives[3] ?? null,
    ] as GameState['martialLoadout']['activeIds'],
  }
  const equipped = { ...state.equipped }
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

type FightStats = {
  wins: number
  losses: number
  aidAttempts: number
  aidBlocked: number
  maxAidInFight: number
}

function runCombat(
  state: GameState,
  rng: () => number,
  age: Age,
  fs: FightStats,
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
  let aidThis = 0
  let guard = 0
  const spamAid = age === 'teen' || age === 'young'
  while (!combat.finished && guard < 90) {
    guard++
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    const player = combat.allies.find((a) => a.isPlayer)
    let action: CombatActionKind = 'attack'
    if (spamAid && player && player.hp < player.maxHp * 0.85) {
      // 青少年／青年猛刷急救（測上限）
      action = 'tactic_aid'
      fs.aidAttempts++
      const before = combat.aidUsesLeft ?? 0
      combat = performPlayerAction(combat, action, target)
      if ((combat.aidUsesLeft ?? 0) < before) aidThis++
      else fs.aidBlocked++
      continue
    }
    if (age === 'mid' || age === 'elder') {
      if (player && player.hp < player.maxHp * 0.35 && (combat.aidUsesLeft ?? 0) > 0) {
        action = 'tactic_aid'
        fs.aidAttempts++
        const before = combat.aidUsesLeft ?? 0
        combat = performPlayerAction(combat, action, target)
        if ((combat.aidUsesLeft ?? 0) < before) aidThis++
        else fs.aidBlocked++
        continue
      }
      action = rng() < 0.65 ? 'skill' : 'attack'
    } else {
      action = pick(rng, [
        'attack',
        'skill',
        'defend',
        'tactic_flash',
        'tactic_aid',
      ] as CombatActionKind[])
      if (action === 'tactic_aid') {
        fs.aidAttempts++
        const before = combat.aidUsesLeft ?? 0
        combat = performPlayerAction(combat, action, target)
        if ((combat.aidUsesLeft ?? 0) < before) aidThis++
        else fs.aidBlocked++
        continue
      }
    }
    combat = performPlayerAction(combat, action, target)
  }
  fs.maxAidInFight = Math.max(fs.maxAidInFight, aidThis)

  if (!combat.finished || !combat.victory) {
    fs.losses++
    return {
      win: false,
      state: {
        ...state,
        combatLoseStreak: state.combatLoseStreak + 1,
        stats: {
          ...state.stats,
          hp: Math.max(1, Math.floor(state.stats.maxHp * 0.45)),
        },
      },
    }
  }
  fs.wins++
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
  if (rng() < 0.35) {
    const unknown = [...COLD_MARTIAL_IDS].filter(
      (id) => (next.martialProgress[id] ?? 0) <= 0,
    )
    if (unknown.length) next = grantMartialArts(next, [pick(rng, unknown)]).state
  }
  return { win: true, state: next }
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

function stepTravel(state: GameState, rng: () => number, choice: Choice): GameState {
  const links = getLinkedLocations(state.locationId)
  if (!links.length) return state
  const target =
    choice === 'first' ? links[0]! : pick(rng, links)
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
  if (!state.knownLocationIds.includes(target.id)) {
    const pool = LOCATION_MARTIAL_FINDS[target.id]
    if (pool && rng() < 0.72) {
      const unknown = pool.filter((id) => (next.martialProgress[id] ?? 0) <= 0)
      if (unknown.length) next = grantMartialArts(next, [pick(rng, unknown)]).state
    }
  }
  return next
}

function pickChoice<T extends { id?: string }>(
  rng: () => number,
  choices: T[],
  mode: Choice,
): T {
  if (!choices.length) throw new Error('no choices')
  if (mode === 'first') return choices[0]!
  if (mode === 'optimize') {
    // 偏好有銀兩／潛能／武學獎勵的選項
    const scored = [...choices].sort((a, b) => {
      const ra = (a as { rewards?: { silver?: number; potential?: number; martialIds?: string[] } }).rewards
      const rb = (b as { rewards?: { silver?: number; potential?: number; martialIds?: string[] } }).rewards
      const sa =
        (ra?.silver ?? 0) +
        (ra?.potential ?? 0) * 2 +
        (ra?.martialIds?.length ?? 0) * 20
      const sb =
        (rb?.silver ?? 0) +
        (rb?.potential ?? 0) * 2 +
        (rb?.martialIds?.length ?? 0) * 20
      return sb - sa
    })
    return scored[0]!
  }
  return pick(rng, choices)
}

function stepEvent(
  state: GameState,
  rng: () => number,
  p: Persona,
  fs: FightStats,
): GameState {
  const eventId = state.pendingEventId
  if (!eventId) return state
  const raw = getStoryEventById(eventId)
  if (!raw?.choices.length) return { ...state, pendingEventId: null }
  const def = flavorEventForNgPlus(raw, state.ngPlusCount)
  const choice = pickChoice(rng, def.choices, p.choice)
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
    const r = runCombat(next, rng, p.age, fs)
    next = r.state
  }
  return next
}

function stepBandit(
  state: GameState,
  rng: () => number,
  p: Persona,
  fs: FightStats,
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
  const next = applyBanditFightStartCost(state)
  return runCombat(next, rng, p.age, fs).state
}

function stepTrain(state: GameState, rng: () => number, choice: Choice): GameState {
  const candidates = MARTIAL_ARTS.filter((m) => {
    const lv = state.martialProgress[m.id] ?? 0
    if (lv >= 10) return false
    if (lv <= 0) return canProgressMartial(state, m.id, { learning: true }).ok
    return canProgressMartial(state, m.id, { learning: false }).ok
  })
  if (!candidates.length) return state
  const cold = candidates.filter((m) =>
    (COLD_MARTIAL_IDS as readonly string[]).includes(m.id),
  )
  let art = pick(rng, candidates)
  if (choice === 'chaos_build' && cold.length) art = pick(rng, cold)
  else if (choice === 'optimize' && cold.length && rng() < 0.55) art = pick(rng, cold)
  else if (choice === 'first') art = candidates[0]!
  const lv = state.martialProgress[art.id] ?? 0
  if (lv <= 0) {
    if (state.potential < 5) return state
    return grantMartialArts(
      { ...state, potential: state.potential - 5 },
      [art.id],
    ).state
  }
  const cost = trainPotentialCost(lv)
  if (state.potential < cost) return state
  return {
    ...state,
    potential: state.potential - cost,
    martialProgress: { ...state.martialProgress, [art.id]: lv + 1 },
  }
}

function stepSect(state: GameState, rng: () => number, choice: Choice): GameState {
  if (!state.sectId) {
    const candidates = SECTS.filter((s) => canJoinSect(state, s.id).ok)
    if (!candidates.length) return stepTravel(state, rng, choice)
    let sect = pick(rng, candidates)
    if (choice === 'first') sect = candidates[0]!
    if (choice === 'chaos_build') {
      const cold = candidates.filter((s) =>
        ['sect_riyue', 'sect_huashan', 'sect_taohua', 'sect_gumupo', 'sect_emei', 'sect_mingjiao'].includes(
          s.id,
        ),
      )
      if (cold.length) sect = pick(rng, cold)
    }
    if (choice === 'optimize') {
      // 偏好門檻低且非少凜（露出打散）
      const nonShaolin = candidates.filter((s) => s.id !== 'sect_shaolin')
      sect = (nonShaolin.length ? nonShaolin : candidates).sort(
        (a, b) => a.entry.minSilver - b.entry.minSilver,
      )[0]!
    }
    let next = applyJoinSect(state, sect.id)
    const grants = SECT_MARTIAL_GRANTS[sect.id]?.onJoin ?? []
    next = grantMartialArts(next, grants).state
    return next
  }
  if (state.currency.silver < 20) return state
  return {
    ...state,
    sectContribution: state.sectContribution + 15,
    currency: {
      ...state.currency,
      silver: state.currency.silver - 20,
    },
  }
}

function stepHero(state: GameState, rng: () => number, choice: Choice): GameState {
  const npc =
    choice === 'first'
      ? NPCS[0]!
      : choice === 'chaos_build'
        ? pick(
            rng,
            NPCS.filter((n) =>
              [
                'npc_mie_jue',
                'npc_yue_buqun',
                'npc_ouyang_feng',
                'npc_dongfang_bubai',
                'npc_qiao_feng',
                'npc_xie_xun',
              ].includes(n.id),
            ).concat(NPCS),
          )
        : pick(rng, NPCS)
  const aff = Math.min(100, (state.affinity[npc.id] ?? 0) + 14)
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

type PayTrack = { topup: number; spent: number; charms: number }

function applyPaySpend(state: GameState, pay: Pay, track: PayTrack): GameState {
  const cap = PAY_CAP[pay]
  if (cap <= 0) return state
  let next = state
  // 儲值到上限
  while (track.topup < cap) {
    const remain = cap - track.topup
    const pack =
      [...MOCK_TOPUP_PACKS]
        .filter((p) => p.yuanbao <= remain)
        .sort((a, b) => b.yuanbao - a.yuanbao)[0] ??
      MOCK_TOPUP_PACKS.find((p) => p.id === 'topup_tiny')
    if (!pack || pack.yuanbao > remain) break
    track.topup += pack.yuanbao
    next = {
      ...next,
      currency: {
        ...next.currency,
        yuanbao: next.currency.yuanbao + pack.yuanbao,
      },
      flags: { ...next.flags, usedMockTopUp: true },
    }
  }
  const buy = (id: string) => {
    const offer = YUANBAO_SHOP.find((o) => o.id === id)
    if (!offer || next.currency.yuanbao < offer.priceYuanbao) return
    next = {
      ...next,
      currency: {
        ...next.currency,
        yuanbao: next.currency.yuanbao - offer.priceYuanbao,
      },
    }
    track.spent += offer.priceYuanbao
    if (offer.kind === 'monthly') {
      next = { ...next, monthlyCardCharges: next.monthlyCardCharges + 30 }
    } else if (id === 'shop_combat_charm') {
      if (next.paidAtkBonus >= 6 && next.paidDefBonus >= 6) return
      next = {
        ...next,
        paidAtkBonus: Math.min(6, next.paidAtkBonus + 1),
        paidDefBonus: Math.min(6, next.paidDefBonus + 1),
      }
      track.charms++
    } else if (id === 'shop_convenience_kit') {
      next = {
        ...next,
        actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 3),
        travelPassCharges: next.travelPassCharges + 2,
      }
    } else if (id === 'shop_ap_incense') {
      next = {
        ...next,
        actionPoints: Math.min(next.maxActionPoints, next.actionPoints + 4),
      }
    } else if (id === 'shop_potential_pack') {
      next = { ...next, potential: next.potential + 18 }
    }
  }
  if (pay === 'small') {
    buy('shop_convenience_kit')
    buy('shop_combat_charm')
  } else if (pay === 'mid') {
    buy('shop_monthly_pass')
    buy('shop_convenience_kit')
    buy('shop_ap_incense')
    buy('shop_combat_charm')
    buy('shop_combat_charm')
  } else if (pay === 'whale') {
    buy('shop_monthly_pass')
    buy('shop_monthly_pass')
    buy('shop_convenience_kit')
    for (let i = 0; i < 6; i++) buy('shop_combat_charm')
    buy('shop_potential_pack')
    // 抽卡
    while (next.currency.yuanbao >= GACHA_TEN_COST) {
      const pulled = pullMany(10, {
        year: next.time.year,
        pityEpic: next.gachaPityEpic,
        pityLegendary: next.gachaPityLegendary,
      })
      let seq = next.equipUidSeq
      const owned = [...next.ownedEquipment]
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
      track.spent += GACHA_TEN_COST
      next = {
        ...next,
        currency: {
          ...next.currency,
          yuanbao: next.currency.yuanbao - GACHA_TEN_COST,
        },
        ownedEquipment: owned,
        equipUidSeq: seq,
        gachaPityEpic: pulled.pityEpic,
        gachaPityLegendary: pulled.pityLegendary,
        gachaTotalPulls: next.gachaTotalPulls + 10,
      }
      if (track.spent > cap * 2) break
    }
  }
  return next
}

function claimMonthly(state: GameState): GameState {
  if (state.monthlyCardCharges <= 0) return state
  const key = `${state.time.year}-${state.time.month}-${state.time.xun}`
  if (state.monthlyClaimedXunKey === key) return state
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

function styleWeights(p: Persona): Record<string, number> {
  // 年齡：teen 猛刷戰鬥；elder 少戰鬥多推旬；mid 均衡優化
  const base: Record<string, number> = {
    xun: 18,
    travel: 12,
    bandit: 10,
    train: 10,
    sect: 10,
    hero: 10,
    gather: 6,
  }
  if (p.play === 'fragment') {
    base.xun = 36
    base.bandit = 4
    base.travel = 8
  } else if (p.play === 'daily') {
    base.xun = 22
    base.hero = 12
    base.sect = 12
  } else if (p.play === 'weekend') {
    base.travel = 16
    base.train = 14
    base.bandit = 12
  } else {
    base.bandit = 18
    base.train = 16
    base.gather = 10
    base.travel = 14
  }
  if (p.age === 'teen') {
    base.bandit += 10
    base.xun += 6
    base.train -= 4
  } else if (p.age === 'elder') {
    base.bandit = Math.max(2, base.bandit - 8)
    base.xun += 8
    base.hero += 4
  } else if (p.age === 'mid') {
    base.sect += 4
    base.train += 4
    base.hero += 2
  }
  if (p.choice === 'chaos_build') {
    base.sect += 6
    base.train += 8
    base.travel += 4
  }
  if (p.choice === 'optimize') {
    base.sect += 4
    base.hero += 4
    base.train += 4
  }
  return base
}

function runOne(p: Persona, seed: number): RunSnap {
  const rng = mulberry32(seed)
  const fs: FightStats = {
    wins: 0,
    losses: 0,
    aidAttempts: 0,
    aidBlocked: 0,
    maxAidInFight: 0,
  }
  const payTrack: PayTrack = { topup: 0, spent: 0, charms: 0 }
  let crashed = false
  let crashMsg: string | null = null
  let softLock = false
  let pendingStuck = 0
  let samePending = 0
  let lastPending: string | null = null

  let state: GameState
  try {
    state = autoEquip(
      applyPaySpend(
        applyPrologue(applyOrigin(createInitialGameState(), p.originId), rng, p.choice),
        p.pay,
        payTrack,
      ),
      p.choice,
    )
    state = {
      ...state,
      currency: { ...state.currency, silver: state.currency.silver + 100 },
      potential: state.potential + 20,
      stats: { ...state.stats, level: Math.max(state.stats.level, 2) },
    }
  } catch (e) {
    return {
      personaId: p.id,
      age: p.age,
      play: p.play,
      pay: p.pay,
      choice: p.choice,
      label: p.label,
      seed,
      steps: 0,
      maxSteps: PLAY_STEPS[p.play],
      cleared: false,
      crashed: true,
      crashMsg: String(e),
      softLock: false,
      hollowGated: false,
      finaleBlockedNoEngage: false,
      pathTier: 'hollow',
      diversityScore: 0,
      endingBranch: null,
      combatWins: 0,
      combatLosses: 0,
      aidAttempts: 0,
      aidBlocked: 0,
      maxAidInFight: 0,
      aidAbuseSuspect: false,
      topupYuanbao: 0,
      yuanbaoSpent: 0,
      charmBuys: 0,
      paidAtk: 0,
      paidDef: 0,
      paySkipSuspect: false,
      sectId: null,
      partyIds: [],
      martialEquipped: [],
      coldEquipped: 0,
      nonStarterEquipped: 0,
      pendingStuckSteps: 0,
    }
  }

  const maxSteps = PLAY_STEPS[p.play]
  let steps = 0
  try {
    while (steps < maxSteps) {
      steps++
      state = claimMonthly(state)
      if (state.storyFlags['main_y5_wharf']) break

      if (state.pendingEventId) {
        if (state.pendingEventId === lastPending) samePending++
        else {
          samePending = 0
          lastPending = state.pendingEventId
        }
        if (samePending > 25) {
          softLock = true
          pendingStuck = samePending
          break
        }
        state = stepEvent(state, rng, p, fs)
      } else {
        const act = weightedPick(rng, styleWeights(p))
        if (act === 'xun') state = stepXun(state, rng)
        else if (act === 'travel') state = stepTravel(state, rng, p.choice)
        else if (act === 'bandit') state = stepBandit(state, rng, p, fs)
        else if (act === 'train') state = stepTrain(state, rng, p.choice)
        else if (act === 'sect') state = stepSect(state, rng, p.choice)
        else if (act === 'hero') state = stepHero(state, rng, p.choice)
        else if (act === 'gather') state = stepGather(state, rng)
        else state = stepXun(state, rng)
      }
      state = autoEquip(state, p.choice)
      if (state.stats.hp <= 0) {
        state = {
          ...state,
          stats: {
            ...state.stats,
            hp: Math.max(1, Math.floor(state.stats.maxHp * 0.4)),
          },
        }
      }
    }
  } catch (e) {
    crashed = true
    crashMsg = String(e)
  }

  const path = computeJourneyProfile(state)
  const cleared = Boolean(state.storyFlags['main_y5_wharf']) || canSettleNgPlus(state)
  const ending =
    typeof state.flags.ending_branch === 'string'
      ? state.flags.ending_branch
      : null

  // 空轉被閘：步數用盡、旅程 hollow、未通關、且未達投入
  const hollowGated =
    !cleared && path.pathTier === 'hollow' && !path.finaleEngaged
  const finaleBlockedNoEngage =
    !cleared &&
    (state.completedBeatIds?.length ?? 0) >= 12 &&
    !path.finaleEngaged

  const aidAbuseSuspect =
    fs.maxAidInFight > TACTIC_AID_MAX_PER_FIGHT ||
    (fs.aidAttempts >= 10 && fs.aidBlocked === 0 && fs.maxAidInFight > 2)

  // 課金跳關嫌疑：大額通關步數遠低於同 play 白嫖中位 → 後續聚合判定
  const paySkipSuspect =
    p.pay === 'whale' &&
    cleared &&
    steps < PLAY_STEPS[p.play] * 0.25 &&
    (state.paidAtkBonus >= 6 || payTrack.charms >= 4)

  const equipped = [
    state.martialLoadout.internalId,
    state.martialLoadout.heartId,
    state.martialLoadout.qinggongId,
    ...state.martialLoadout.activeIds,
  ].filter(Boolean) as string[]

  return {
    personaId: p.id,
    age: p.age,
    play: p.play,
    pay: p.pay,
    choice: p.choice,
    label: p.label,
    seed,
    steps,
    maxSteps,
    cleared,
    crashed,
    crashMsg,
    softLock,
    hollowGated,
    finaleBlockedNoEngage,
    pathTier: path.pathTier,
    diversityScore: path.diversityScore,
    endingBranch: ending,
    combatWins: fs.wins,
    combatLosses: fs.losses,
    aidAttempts: fs.aidAttempts,
    aidBlocked: fs.aidBlocked,
    maxAidInFight: fs.maxAidInFight,
    aidAbuseSuspect,
    topupYuanbao: payTrack.topup,
    yuanbaoSpent: payTrack.spent,
    charmBuys: payTrack.charms,
    paidAtk: state.paidAtkBonus,
    paidDef: state.paidDefBonus,
    paySkipSuspect,
    sectId: state.sectId,
    partyIds: [...state.partyIds],
    martialEquipped: equipped,
    coldEquipped: path.coldMartialEquipped,
    nonStarterEquipped: path.nonStarterEquipped,
    pendingStuckSteps: pendingStuck,
  }
}

function rate(n: number, d: number) {
  return d ? Math.round((n / d) * 1000) / 10 : 0
}

function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>()
  for (const r of rows) {
    const k = key(r)
    const arr = m.get(k) ?? []
    arr.push(r)
    m.set(k, arr)
  }
  return m
}

function dimTable(rows: RunSnap[], key: (r: RunSnap) => string) {
  const g = groupBy(rows, key)
  return [...g.entries()]
    .map(([k, rs]) => {
      const cleared = rs.filter((r) => r.cleared).length
      const hollow = rs.filter((r) => r.hollowGated).length
      const crash = rs.filter((r) => r.crashed).length
      const soft = rs.filter((r) => r.softLock).length
      const aid = rs.filter((r) => r.aidAbuseSuspect).length
      const paySkip = rs.filter((r) => r.paySkipSuspect).length
      const avgSteps =
        Math.round(rs.reduce((a, r) => a + r.steps, 0) / rs.length) || 0
      const avgDiv =
        Math.round(
          (rs.reduce((a, r) => a + r.diversityScore, 0) / rs.length) * 10,
        ) / 10
      return {
        dim: k,
        n: rs.length,
        clearRate: rate(cleared, rs.length),
        hollowGatedRate: rate(hollow, rs.length),
        crashRate: rate(crash, rs.length),
        softLockRate: rate(soft, rs.length),
        aidAbuseRate: rate(aid, rs.length),
        paySkipSuspectRate: rate(paySkip, rs.length),
        avgSteps,
        avgDiversity: avgDiv,
      }
    })
    .sort((a, b) => a.dim.localeCompare(b.dim))
}

function main() {
  const personas = buildPersonas()
  const snaps: RunSnap[] = []
  for (const p of personas) {
    const seed = 77000 + p.id * 17
    snaps.push(runOne(p, seed))
  }

  const cleared = snaps.filter((s) => s.cleared)
  const crashes = snaps.filter((s) => s.crashed)
  const softLocks = snaps.filter((s) => s.softLock)
  const hollow = snaps.filter((s) => s.hollowGated)
  const finaleBlock = snaps.filter((s) => s.finaleBlockedNoEngage)
  const aidAbuse = snaps.filter((s) => s.aidAbuseSuspect)
  const paySkip = snaps.filter((s) => s.paySkipSuspect)

  // 死內容摘要（通關局配置）
  const martialCnt = new Map<string, number>()
  const sectCnt = new Map<string, number>()
  for (const s of cleared) {
    for (const id of new Set(s.martialEquipped)) {
      martialCnt.set(id, (martialCnt.get(id) ?? 0) + 1)
    }
    if (s.sectId) sectCnt.set(s.sectId, (sectCnt.get(s.sectId) ?? 0) + 1)
  }
  const clearN = cleared.length || 1
  const coldMartial = [...COLD_MARTIAL_IDS].map((id) => ({
    id,
    name: MARTIAL_ARTS.find((m) => m.id === id)?.name ?? id,
    rate: rate(martialCnt.get(id) ?? 0, clearN),
  }))
  const deadMartial = MARTIAL_ARTS.filter(
    (m) =>
      !(STARTER_MARTIAL_IDS as readonly string[]).includes(m.id) &&
      rate(martialCnt.get(m.id) ?? 0, clearN) < 5,
  ).map((m) => ({
    id: m.id,
    name: m.name,
    rate: rate(martialCnt.get(m.id) ?? 0, clearN),
  }))

  // 穩贏離群：通關且勝率極高＋步數極低
  const outliers = snaps
    .filter((s) => s.cleared)
    .map((s) => {
      const fights = s.combatWins + s.combatLosses
      const wr = fights ? s.combatWins / fights : null
      return { ...s, winRate: wr }
    })
    .filter(
      (s) =>
        (s.winRate != null && s.winRate >= 0.95 && s.combatWins >= 8) ||
        s.paySkipSuspect ||
        s.aidAbuseSuspect ||
        s.steps <= 40,
    )
    .slice(0, 20)
    .map((s) => ({
      label: s.label,
      steps: s.steps,
      winRate: s.winRate != null ? Math.round(s.winRate * 1000) / 10 : null,
      pay: s.pay,
      paidAtk: s.paidAtk,
      aidMax: s.maxAidInFight,
      ending: s.endingBranch,
    }))

  // 課金是否跳關：同 play 下 whale vs free 通關步數比
  const payVsFree: Record<string, { freeAvg: number; whaleAvg: number; ratio: number | null }> =
    {}
  for (const play of PLAYS) {
    const free = snaps.filter((s) => s.play === play && s.pay === 'free' && s.cleared)
    const whale = snaps.filter(
      (s) => s.play === play && s.pay === 'whale' && s.cleared,
    )
    const freeAvg =
      free.length
        ? free.reduce((a, s) => a + s.steps, 0) / free.length
        : 0
    const whaleAvg =
      whale.length
        ? whale.reduce((a, s) => a + s.steps, 0) / whale.length
        : 0
    payVsFree[play] = {
      freeAvg: Math.round(freeAvg),
      whaleAvg: Math.round(whaleAvg),
      ratio:
        freeAvg > 0 && whale.length
          ? Math.round((whaleAvg / freeAvg) * 100) / 100
          : null,
    }
  }

  const endingCounts: Record<string, number> = {}
  for (const s of snaps) {
    const k = s.cleared
      ? s.endingBranch ?? 'cleared_no_branch'
      : s.hollowGated
        ? 'hollow_gated'
        : s.finaleBlockedNoEngage
          ? 'finale_blocked'
          : 'unfinished'
    endingCounts[k] = (endingCounts[k] ?? 0) + 1
  }

  const p0Issues: string[] = []
  if (crashes.length) p0Issues.push(`崩潰 ${crashes.length} 局`)
  if (softLocks.length) p0Issues.push(`軟鎖 ${softLocks.length} 局`)
  if (aidAbuse.length) p0Issues.push(`急救濫用嫌疑 ${aidAbuse.length}`)
  if (paySkip.length >= 8) p0Issues.push(`課金跳關嫌疑偏多 ${paySkip.length}`)

  const payload = {
    generatedAt: new Date().toISOString(),
    meta: {
      personas: personas.length,
      runs: snaps.length,
      design: '4 age × 4 play × 4 pay × 4 choice = 256',
      cleared: cleared.length,
      clearRate: rate(cleared.length, snaps.length),
      crashes: crashes.length,
      softLocks: softLocks.length,
      hollowGated: hollow.length,
      finaleBlockedNoEngage: finaleBlock.length,
      aidAbuseSuspect: aidAbuse.length,
      paySkipSuspect: paySkip.length,
      avgDiversity:
        Math.round(
          (snaps.reduce((a, s) => a + s.diversityScore, 0) / snaps.length) * 10,
        ) / 10,
      endingCounts,
    },
    byAge: dimTable(snaps, (r) => r.age),
    byPlay: dimTable(snaps, (r) => r.play),
    byPay: dimTable(snaps, (r) => r.pay),
    byChoice: dimTable(snaps, (r) => r.choice),
    payVsFreeSteps: payVsFree,
    deadContent: {
      martialNearUnused: deadMartial.length,
      deadMartialSample: deadMartial.slice(0, 12),
      coldMartialTop: [...coldMartial].sort((a, b) => b.rate - a.rate).slice(0, 10),
      sectRates: SECTS.map((s) => ({
        id: s.id,
        name: s.name,
        rate: rate(sectCnt.get(s.id) ?? 0, clearN),
      })).sort((a, b) => b.rate - a.rate),
    },
    outliers,
    crashSamples: crashes.slice(0, 5).map((c) => ({
      label: c.label,
      msg: c.crashMsg,
    })),
    softLockSamples: softLocks.slice(0, 5).map((c) => ({
      label: c.label,
      pendingStuck: c.pendingStuckSteps,
    })),
    verdict: {
      p0Issues,
      p0FixNeeded: p0Issues.some((x) => x.includes('崩潰') || x.includes('急救濫用')),
      notes: [
        '旅程品質閘對碎玩／空轉有感（hollowGated）。',
        '急救上限仍生效：maxAidInFight 不應 > 2。',
        '課金縮步但不應零決策通關；paySkipSuspect 供觀察。',
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
        personas: payload.meta.personas,
        clearRate: payload.meta.clearRate,
        crashes: payload.meta.crashes,
        softLocks: payload.meta.softLocks,
        hollowGated: payload.meta.hollowGated,
        aidAbuse: payload.meta.aidAbuseSuspect,
        paySkip: payload.meta.paySkipSuspect,
        byAge: payload.byAge,
        byPay: payload.byPay,
        verdict: payload.verdict,
      },
      null,
      2,
    ),
  )
  console.log('wrote', OUT)
}

main()
