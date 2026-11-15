/**
 * 路遇 3v3 開場刷取實測
 * 鏡像 useGame.startBanditFight / combatAct 結算邏輯
 * 用法：npx --yes tsx scripts/sim-encounter-farm.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import { createItemFromCatalog } from '../src/data/npcs.ts'
import { applyRewards } from '../src/lib/applyRewards.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
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
import { computePanelStats } from '../src/lib/combatStats.ts'
import {
  COMBAT_MARTIAL_POOL,
  grantMartialArts,
  pickUnknownMartial,
} from '../src/lib/martialUnlock.ts'
import type { GameState, InventoryItem } from '../src/types/game.ts'

const FIGHTS_PER_RUN = 50
const RUNS = 8
const OUT_JSON =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/encounter-farm-result.json'

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

function applyOrigin(state: GameState, rng: () => number): GameState {
  const cat = pick(rng, ORIGINS)
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
    playerName: `刷測客${Math.floor(rng() * 9000 + 1000)}`,
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
    comprehension: Math.min(
      99,
      state.comprehension + (cat.comprehensionBonus ?? 0),
    ),
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

/** 偏進攻 AI：優先 skill／attack，低血時 tactic_aid */
function runCombat(
  encounter: CombatState,
  rng: () => number,
): { combat: CombatState; deadlock: boolean; turns: number } {
  let combat = encounter
  let turns = 0
  while (!combat.finished && turns < 100) {
    turns++
    const player = combat.allies.find((a) => a.isPlayer)
    const hpRatio = player ? player.hp / Math.max(1, player.maxHp) : 1
    let act: CombatActionKind
    if (hpRatio < 0.4 && rng() < 0.7) act = 'tactic_aid'
    else if (rng() < 0.55) act = 'skill'
    else if (rng() < 0.35) act = 'attack'
    else if (rng() < 0.5) act = 'tactic_flash'
    else act = 'defend'
    const foes = combat.enemies.filter((e) => e.hp > 0)
    const target = foes.length ? pick(rng, foes).id : undefined
    combat = performPlayerAction(combat, act, target)
  }
  return { combat, deadlock: !combat.finished, turns }
}

/** 鏡像 useGame.combatAct 路遇結算（非切磋） */
function applyBanditRewards(
  state: GameState,
  combat: CombatState,
  rng: () => number,
): { state: GameState; silverGain: number; potGain: number; martialId: string | null } {
  if (!combat.finished) {
    return { state, silverGain: 0, potGain: 0, martialId: null }
  }
  if (combat.victory) {
    const player = combat.allies.find((a) => a.isPlayer)
    const hp = player?.hp ?? state.stats.hp
    const silverGain = 20
    const potGain = 2
    let martialProgress = state.martialProgress
    let martialId: string | null = null
    if (rng() < 0.28) {
      const mid = pickUnknownMartial(state, [...COMBAT_MARTIAL_POOL], rng)
      if (mid) {
        const granted = grantMartialArts(state, [mid])
        martialProgress = granted.state.martialProgress
        martialId = mid
      }
    }
    return {
      state: {
        ...state,
        martialProgress,
        combatLoseStreak: 0,
        stats: {
          ...state.stats,
          hp: Math.max(1, Math.min(state.stats.maxHp, hp)),
        },
        currency: {
          ...state.currency,
          silver: state.currency.silver + silverGain,
        },
        potential: state.potential + potGain,
      },
      silverGain,
      potGain,
      martialId,
    }
  }
  const streak = state.combatLoseStreak + 1
  const hpRatio = streak >= 3 ? 0.7 : streak === 2 ? 0.55 : 0.4
  return {
    state: {
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
    },
    silverGain: 0,
    potGain: 0,
    martialId: null,
  }
}

type FightLog = {
  n: number
  victory: boolean | null
  silverGain: number
  potGain: number
  martialId: string | null
  silver: number
  potential: number
  hp: number
  maxHp: number
  stamina: number
  ap: number
  loseStreak: number
  martialCount: number
  equipCount: number
  blocked?: string
  turns?: number
}

type RunResult = {
  seed: number
  originId: string | null
  baseline: {
    silver: number
    potential: number
    hp: number
    maxHp: number
    stamina: number
    ap: number
    martialCount: number
    equipCount: number
    panelAtk: number
    panelDef: number
  }
  fightsAttempted: number
  wins: number
  losses: number
  deadlocks: number
  blockedLowHp: number
  blockedLoseStreak: number
  stopReason: string
  final: {
    silver: number
    potential: number
    hp: number
    stamina: number
    ap: number
    martialCount: number
    equipCount: number
    loseStreak: number
  }
  deltas: {
    silver: number
    potential: number
    martialLearned: number
    equipDelta: number
    staminaDelta: number
    apDelta: number
  }
  fightLog: FightLog[]
}

function canStartBandit(state: GameState): string | null {
  if (!state.prologueDone) return '序章未了'
  if (state.stats.hp <= state.stats.maxHp * 0.35) return '氣血過低'
  if (state.combatLoseStreak >= 3) return '連敗鎖定'
  return null
}

function runFarm(seed: number, maxFights: number): RunResult {
  const rng = mulberry32(seed)
  let state = createInitialGameState()
  state = applyOrigin(state, rng)
  state = applyPrologue(state, rng)
  const panel = computePanelStats(state)
  const baseline = {
    silver: state.currency.silver,
    potential: state.potential,
    hp: state.stats.hp,
    maxHp: state.stats.maxHp,
    stamina: state.stats.stamina,
    ap: state.actionPoints,
    martialCount: Object.keys(state.martialProgress).filter(
      (k) => (state.martialProgress[k] ?? 0) > 0,
    ).length,
    equipCount: state.ownedEquipment.length,
    panelAtk: panel.attack,
    panelDef: panel.defense,
  }

  const fightLog: FightLog[] = []
  let wins = 0
  let losses = 0
  let deadlocks = 0
  let blockedLowHp = 0
  let blockedLoseStreak = 0
  let stopReason = `完成 ${maxFights} 場嘗試`
  let fightsAttempted = 0

  for (let i = 1; i <= maxFights; i++) {
    const block = canStartBandit(state)
    if (block) {
      if (block === '氣血過低') blockedLowHp++
      if (block === '連敗鎖定') blockedLoseStreak++
      fightLog.push({
        n: i,
        victory: null,
        silverGain: 0,
        potGain: 0,
        martialId: null,
        silver: state.currency.silver,
        potential: state.potential,
        hp: state.stats.hp,
        maxHp: state.stats.maxHp,
        stamina: state.stats.stamina,
        ap: state.actionPoints,
        loseStreak: state.combatLoseStreak,
        martialCount: Object.keys(state.martialProgress).filter(
          (k) => (state.martialProgress[k] ?? 0) > 0,
        ).length,
        equipCount: state.ownedEquipment.length,
        blocked: block,
      })
      // 真實 UI：鎖定則無法再開；此處不作弊回血／清連敗，視為刷取中斷
      stopReason = `第 ${i} 次嘗試被擋：${block}`
      break
    }

    fightsAttempted++
    const enc = makeBanditEncounter(
      buildPlayerCombatant(state),
      buildPartyCombatants(state),
      {
        loseStreak: state.combatLoseStreak,
        year: state.time.year,
      },
    )
    const { combat, deadlock, turns } = runCombat(enc, rng)
    if (deadlock) deadlocks++
    const beforeSilver = state.currency.silver
    const beforePot = state.potential
    const applied = applyBanditRewards(state, combat, rng)
    state = applied.state
    if (combat.victory) wins++
    else if (combat.finished) losses++

    fightLog.push({
      n: i,
      victory: combat.finished ? combat.victory : null,
      silverGain: state.currency.silver - beforeSilver,
      potGain: state.potential - beforePot,
      martialId: applied.martialId,
      silver: state.currency.silver,
      potential: state.potential,
      hp: state.stats.hp,
      maxHp: state.stats.maxHp,
      stamina: state.stats.stamina,
      ap: state.actionPoints,
      loseStreak: state.combatLoseStreak,
      martialCount: Object.keys(state.martialProgress).filter(
        (k) => (state.martialProgress[k] ?? 0) > 0,
      ).length,
      equipCount: state.ownedEquipment.length,
      turns,
    })
  }

  const martialFinal = Object.keys(state.martialProgress).filter(
    (k) => (state.martialProgress[k] ?? 0) > 0,
  ).length

  return {
    seed,
    originId: state.originId,
    baseline,
    fightsAttempted,
    wins,
    losses,
    deadlocks,
    blockedLowHp,
    blockedLoseStreak,
    stopReason,
    final: {
      silver: state.currency.silver,
      potential: state.potential,
      hp: state.stats.hp,
      stamina: state.stats.stamina,
      ap: state.actionPoints,
      martialCount: martialFinal,
      equipCount: state.ownedEquipment.length,
      loseStreak: state.combatLoseStreak,
    },
    deltas: {
      silver: state.currency.silver - baseline.silver,
      potential: state.potential - baseline.potential,
      martialLearned: martialFinal - baseline.martialCount,
      equipDelta: state.ownedEquipment.length - baseline.equipCount,
      staminaDelta: state.stats.stamina - baseline.stamina,
      apDelta: state.actionPoints - baseline.ap,
    },
    fightLog,
  }
}

/** 第二模式：低血時免費回滿（模擬若玩家可無限養傷）仍無 AP／精力成本 */
function runFarmWithFreeHeal(seed: number, maxFights: number): RunResult {
  const rng = mulberry32(seed ^ 0x9e3779b9)
  let state = createInitialGameState()
  state = applyOrigin(state, rng)
  state = applyPrologue(state, rng)
  const panel = computePanelStats(state)
  const baseline = {
    silver: state.currency.silver,
    potential: state.potential,
    hp: state.stats.hp,
    maxHp: state.stats.maxHp,
    stamina: state.stats.stamina,
    ap: state.actionPoints,
    martialCount: Object.keys(state.martialProgress).filter(
      (k) => (state.martialProgress[k] ?? 0) > 0,
    ).length,
    equipCount: state.ownedEquipment.length,
    panelAtk: panel.attack,
    panelDef: panel.defense,
  }

  const fightLog: FightLog[] = []
  let wins = 0
  let losses = 0
  let deadlocks = 0
  let blockedLowHp = 0
  let blockedLoseStreak = 0
  let stopReason = `完成 ${maxFights} 場嘗試（含免費回血）`
  let fightsAttempted = 0

  for (let i = 1; i <= maxFights; i++) {
    // 模擬：氣血過低時服丹／養傷（不扣 AP／銀兩），但連敗鎖定不作弊解除
    if (state.stats.hp <= state.stats.maxHp * 0.35) {
      blockedLowHp++
      state = {
        ...state,
        stats: { ...state.stats, hp: state.stats.maxHp },
      }
    }
    const block = canStartBandit(state)
    if (block) {
      if (block === '連敗鎖定') blockedLoseStreak++
      fightLog.push({
        n: i,
        victory: null,
        silverGain: 0,
        potGain: 0,
        martialId: null,
        silver: state.currency.silver,
        potential: state.potential,
        hp: state.stats.hp,
        maxHp: state.stats.maxHp,
        stamina: state.stats.stamina,
        ap: state.actionPoints,
        loseStreak: state.combatLoseStreak,
        martialCount: Object.keys(state.martialProgress).filter(
          (k) => (state.martialProgress[k] ?? 0) > 0,
        ).length,
        equipCount: state.ownedEquipment.length,
        blocked: block,
      })
      stopReason = `第 ${i} 次嘗試被擋：${block}`
      break
    }

    fightsAttempted++
    const enc = makeBanditEncounter(
      buildPlayerCombatant(state),
      buildPartyCombatants(state),
      {
        loseStreak: state.combatLoseStreak,
        year: state.time.year,
      },
    )
    const { combat, deadlock, turns } = runCombat(enc, rng)
    if (deadlock) deadlocks++
    const applied = applyBanditRewards(state, combat, rng)
    state = applied.state
    if (combat.victory) wins++
    else if (combat.finished) losses++

    fightLog.push({
      n: i,
      victory: combat.finished ? combat.victory : null,
      silverGain: applied.silverGain,
      potGain: applied.potGain,
      martialId: applied.martialId,
      silver: state.currency.silver,
      potential: state.potential,
      hp: state.stats.hp,
      maxHp: state.stats.maxHp,
      stamina: state.stats.stamina,
      ap: state.actionPoints,
      loseStreak: state.combatLoseStreak,
      martialCount: Object.keys(state.martialProgress).filter(
        (k) => (state.martialProgress[k] ?? 0) > 0,
      ).length,
      equipCount: state.ownedEquipment.length,
      turns,
    })
  }

  const martialFinal = Object.keys(state.martialProgress).filter(
    (k) => (state.martialProgress[k] ?? 0) > 0,
  ).length

  return {
    seed,
    originId: state.originId,
    baseline,
    fightsAttempted,
    wins,
    losses,
    deadlocks,
    blockedLowHp,
    blockedLoseStreak,
    stopReason,
    final: {
      silver: state.currency.silver,
      potential: state.potential,
      hp: state.stats.hp,
      stamina: state.stats.stamina,
      ap: state.actionPoints,
      martialCount: martialFinal,
      equipCount: state.ownedEquipment.length,
      loseStreak: state.combatLoseStreak,
    },
    deltas: {
      silver: state.currency.silver - baseline.silver,
      potential: state.potential - baseline.potential,
      martialLearned: martialFinal - baseline.martialCount,
      equipDelta: state.ownedEquipment.length - baseline.equipCount,
      staminaDelta: state.stats.stamina - baseline.stamina,
      apDelta: state.actionPoints - baseline.ap,
    },
    fightLog,
  }
}

function summarize(runs: RunResult[]) {
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
  return {
    runs: runs.length,
    fightsPerRunTarget: FIGHTS_PER_RUN,
    avgWins: avg(runs.map((r) => r.wins)),
    avgLosses: avg(runs.map((r) => r.losses)),
    avgFightsAttempted: avg(runs.map((r) => r.fightsAttempted)),
    avgSilverGain: avg(runs.map((r) => r.deltas.silver)),
    avgPotentialGain: avg(runs.map((r) => r.deltas.potential)),
    avgMartialLearned: avg(runs.map((r) => r.deltas.martialLearned)),
    avgEquipDelta: avg(runs.map((r) => r.deltas.equipDelta)),
    avgApDelta: avg(runs.map((r) => r.deltas.apDelta)),
    avgStaminaDelta: avg(runs.map((r) => r.deltas.staminaDelta)),
    completedAll50: runs.filter((r) => r.fightsAttempted >= FIGHTS_PER_RUN)
      .length,
    stoppedByLoseLock: runs.filter((r) =>
      r.stopReason.includes('連敗鎖定'),
    ).length,
    stoppedByLowHp: runs.filter((r) => r.stopReason.includes('氣血過低'))
      .length,
    winRate:
      avg(runs.map((r) => r.wins + r.losses)) > 0
        ? avg(runs.map((r) => r.wins)) /
          avg(runs.map((r) => r.wins + r.losses))
        : 0,
  }
}

const strictRuns: RunResult[] = []
const healRuns: RunResult[] = []
for (let i = 0; i < RUNS; i++) {
  const seed = 20261115 + i * 97
  strictRuns.push(runFarm(seed, FIGHTS_PER_RUN))
  healRuns.push(runFarmWithFreeHeal(seed, FIGHTS_PER_RUN))
}

const codeFacts = {
  startCost: {
    ap: 0,
    stamina: 0,
    silver: 0,
    cooldown: '無',
    gates: ['prologueDone', 'hp > 35% maxHp', 'combatLoseStreak < 3'],
  },
  winReward: {
    silver: 20,
    potential: 2,
    martialChance: 0.28,
    equipment: '無',
    exp: '無（stats.exp 不變）',
  },
  loseEffects: {
    streakInc: 1,
    hpRestore: '40% / 55% / 70%（依連敗）',
    staminaGain: '+6 或 +12',
    lockAt: 3,
    streakResetOnRest: false,
    note: '文案稱旬制／丹藥／遠行可解鎖，程式僅勝場清零連敗',
  },
}

const payload = {
  generatedAt: new Date().toISOString(),
  codeFacts,
  strictMode: {
    note: '不作弊回血／不解連敗；貼近真實按鈕可用性',
    summary: summarize(strictRuns),
    runs: strictRuns.map((r) => ({
      ...r,
      fightLog: r.fightLog.filter(
        (_, idx) => idx < 5 || idx >= r.fightLog.length - 3 || idx % 10 === 9,
      ),
    })),
  },
  freeHealMode: {
    note: '氣血過低時免費回滿；連敗鎖定仍不解除',
    summary: summarize(healRuns),
    runs: healRuns.map((r) => ({
      ...r,
      fightLog: r.fightLog.filter(
        (_, idx) => idx < 5 || idx >= r.fightLog.length - 3 || idx % 10 === 9,
      ),
    })),
  },
}

mkdirSync(
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
  { recursive: true },
)
writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2))

console.log('=== 路遇刷取實測 ===')
console.log('程式事實:', JSON.stringify(codeFacts, null, 2))
console.log('\n嚴格模式摘要:', JSON.stringify(payload.strictMode.summary, null, 2))
console.log('\n免費回血模式摘要:', JSON.stringify(payload.freeHealMode.summary, null, 2))
console.log('\n嚴格模式各局:')
for (const r of strictRuns) {
  console.log(
    `  seed=${r.seed} origin=${r.originId} wins=${r.wins} losses=${r.losses} Δ銀=${r.deltas.silver} Δ潛=${r.deltas.potential} Δ武=${r.deltas.martialLearned} Δ裝=${r.deltas.equipDelta} ΔAP=${r.deltas.apDelta} Δ精=${r.deltas.staminaDelta} stop=${r.stopReason}`,
  )
}
console.log('\n免費回血各局:')
for (const r of healRuns) {
  console.log(
    `  seed=${r.seed} wins=${r.wins} losses=${r.losses} Δ銀=${r.deltas.silver} Δ潛=${r.deltas.potential} Δ武=${r.deltas.martialLearned} stop=${r.stopReason}`,
  )
}
console.log(`\n寫入 ${OUT_JSON}`)
