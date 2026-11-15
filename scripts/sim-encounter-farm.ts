/**
 * 路遇 3v3 刷取實測（含開戰消耗／同旬上限／獎勵衰減）
 * 鏡像 useGame.startBanditFight / combatAct + banditEncounterRules
 * 用法：npx --yes tsx scripts/sim-encounter-farm.ts
 * 或：npm run sim:encounter-farm
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { ORIGINS } from '../src/data/origins.ts'
import { getPrologueEvent } from '../src/data/prologue.ts'
import { createItemFromCatalog } from '../src/data/npcs.ts'
import { applyRewards } from '../src/lib/applyRewards.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import {
  applyBanditFightStartCost,
  BANDIT_FIGHT_AP_COST,
  BANDIT_FIGHTS_PER_XUN_MAX,
  BANDIT_FULL_REWARD_FIGHTS,
  BANDIT_WIN_POTENTIAL_DECAYED,
  BANDIT_WIN_POTENTIAL_FULL,
  BANDIT_WIN_SILVER_DECAYED,
  BANDIT_WIN_SILVER_FULL,
  banditStartBlockLabel,
  banditWinRewards,
  clearCombatLoseStreak,
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
    const reward = banditWinRewards(state.banditFightsThisXun)
    const silverGain = reward.silver
    const potGain = reward.potential
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

/** 鏡像推進一旬的休整副作用（路遇次數重置、連敗清零、AP+1 上限內） */
function applyAdvanceXunRest(state: GameState): GameState {
  return {
    ...clearCombatLoseStreak(state),
    banditFightsThisXun: 0,
    actionPoints: Math.min(state.maxActionPoints, state.actionPoints + 1),
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
  fightsThisXun: number
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
  blockedNoAp: number
  blockedXunCap: number
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
    fightsThisXun: number
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

type FarmOptions = {
  freeHeal?: boolean
  /** 連敗鎖定時模擬服丹／遠行解鎖（不另給獎） */
  unlockLoseOnRest?: boolean
  /** 本旬次數滿或 AP 不足時推進旬制（仍耗淨資源節奏） */
  advanceXunWhenBlocked?: boolean
  maxXunAdvances?: number
}

function runFarm(seed: number, maxFights: number, opts: FarmOptions = {}): RunResult {
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
  let blockedNoAp = 0
  let blockedXunCap = 0
  let xunAdvances = 0
  let stopReason = `完成 ${maxFights} 場嘗試`
  let fightsAttempted = 0
  const maxXun = opts.maxXunAdvances ?? 40

  for (let i = 1; i <= maxFights; i++) {
    if (opts.freeHeal && state.stats.hp <= state.stats.maxHp * 0.35) {
      blockedLowHp++
      state = {
        ...state,
        stats: { ...state.stats, hp: state.stats.maxHp },
      }
    }

    let block = getBanditStartBlock(state)
    let rested = false
    while (block && opts.advanceXunWhenBlocked && xunAdvances < maxXun) {
      if (
        block === 'xun_cap' ||
        block === 'no_ap' ||
        (block === 'lose_streak' && opts.unlockLoseOnRest)
      ) {
        state = applyAdvanceXunRest(state)
        xunAdvances++
        rested = true
        block = getBanditStartBlock(state)
        continue
      }
      break
    }
    if (block === 'lose_streak' && opts.unlockLoseOnRest && !rested) {
      state = clearCombatLoseStreak(state)
      block = getBanditStartBlock(state)
    }

    if (block) {
      const label = banditStartBlockLabel(block)
      if (block === 'low_hp') blockedLowHp++
      if (block === 'lose_streak') blockedLoseStreak++
      if (block === 'no_ap') blockedNoAp++
      if (block === 'xun_cap') blockedXunCap++
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
        fightsThisXun: state.banditFightsThisXun,
        martialCount: Object.keys(state.martialProgress).filter(
          (k) => (state.martialProgress[k] ?? 0) > 0,
        ).length,
        equipCount: state.ownedEquipment.length,
        blocked: label,
      })
      stopReason = `第 ${i} 次嘗試被擋：${label}`
      break
    }

    state = applyBanditFightStartCost(state)
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
      fightsThisXun: state.banditFightsThisXun,
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
    blockedNoAp,
    blockedXunCap,
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
      fightsThisXun: state.banditFightsThisXun,
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
    stoppedByNoAp: runs.filter((r) => r.stopReason.includes('AP 不足')).length,
    stoppedByXunCap: runs.filter((r) =>
      r.stopReason.includes('本旬次數已滿'),
    ).length,
    winRate:
      avg(runs.map((r) => r.wins + r.losses)) > 0
        ? avg(runs.map((r) => r.wins)) /
          avg(runs.map((r) => r.wins + r.losses))
        : 0,
  }
}

const strictRuns: RunResult[] = []
const healRuns: RunResult[] = []
const restLoopRuns: RunResult[] = []
for (let i = 0; i < RUNS; i++) {
  const seed = 20261115 + i * 97
  strictRuns.push(runFarm(seed, FIGHTS_PER_RUN))
  healRuns.push(
    runFarm(seed ^ 0x9e3779b9, FIGHTS_PER_RUN, { freeHeal: true }),
  )
  // 即便免費回血＋休整推進旬，每場仍扣 1 AP；同旬第 3 場獎衰減
  restLoopRuns.push(
    runFarm(seed ^ 0x85ebca6b, FIGHTS_PER_RUN, {
      freeHeal: true,
      unlockLoseOnRest: true,
      advanceXunWhenBlocked: true,
      maxXunAdvances: 60,
    }),
  )
}

const codeFacts = {
  startCost: {
    ap: BANDIT_FIGHT_AP_COST,
    stamina: 0,
    silver: 0,
    xunCap: BANDIT_FIGHTS_PER_XUN_MAX,
    fullRewardFights: BANDIT_FULL_REWARD_FIGHTS,
    gates: [
      'prologueDone',
      'hp > 35% maxHp',
      'combatLoseStreak < 3',
      `actionPoints >= ${BANDIT_FIGHT_AP_COST}`,
      `banditFightsThisXun < ${BANDIT_FIGHTS_PER_XUN_MAX}`,
    ],
  },
  winReward: {
    silverFull: BANDIT_WIN_SILVER_FULL,
    potentialFull: BANDIT_WIN_POTENTIAL_FULL,
    silverDecayed: BANDIT_WIN_SILVER_DECAYED,
    potentialDecayed: BANDIT_WIN_POTENTIAL_DECAYED,
    martialChance: 0.28,
    equipment: '無',
    exp: '無（stats.exp 不變）',
  },
  loseEffects: {
    streakInc: 1,
    hpRestore: '40% / 55% / 70%（依連敗）',
    staminaGain: '+6 或 +12',
    lockAt: 3,
    streakResetOnRest: true,
    note: '推進旬／服丹／遠行清零連敗；推進旬並重置本旬路遇次數',
  },
}

function trimLogs(runs: RunResult[]) {
  return runs.map((r) => ({
    ...r,
    fightLog: r.fightLog.filter(
      (_, idx) => idx < 5 || idx >= r.fightLog.length - 3 || idx % 10 === 9,
    ),
  }))
}

const payload = {
  generatedAt: new Date().toISOString(),
  codeFacts,
  strictMode: {
    note: '不作弊回血／不推進旬；貼近連點按鈕（AP／同旬上限會卡住）',
    summary: summarize(strictRuns),
    runs: trimLogs(strictRuns),
  },
  freeHealMode: {
    note: '氣血過低時免費回滿；仍受 AP／同旬上限約束，無法無成本連刷',
    summary: summarize(healRuns),
    runs: trimLogs(healRuns),
  },
  restLoopMode: {
    note: '免費回血＋旬滿／AP 不足時推進旬（AP+1）＋連敗可解；證明每場仍耗 1 AP，獎有衰減',
    summary: summarize(restLoopRuns),
    runs: trimLogs(restLoopRuns),
  },
}

mkdirSync(
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
  { recursive: true },
)
writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2))

console.log('=== 路遇刷取實測（修後） ===')
console.log('程式事實:', JSON.stringify(codeFacts, null, 2))
console.log('\n嚴格模式摘要:', JSON.stringify(payload.strictMode.summary, null, 2))
console.log('\n免費回血模式摘要:', JSON.stringify(payload.freeHealMode.summary, null, 2))
console.log('\n休整循環模式摘要:', JSON.stringify(payload.restLoopMode.summary, null, 2))
console.log('\n嚴格模式各局:')
for (const r of strictRuns) {
  console.log(
    `  seed=${r.seed} origin=${r.originId} wins=${r.wins} losses=${r.losses} Δ銀=${r.deltas.silver} Δ潛=${r.deltas.potential} Δ武=${r.deltas.martialLearned} ΔAP=${r.deltas.apDelta} stop=${r.stopReason}`,
  )
}
console.log('\n免費回血各局:')
for (const r of healRuns) {
  console.log(
    `  seed=${r.seed} wins=${r.wins} losses=${r.losses} Δ銀=${r.deltas.silver} Δ潛=${r.deltas.potential} ΔAP=${r.deltas.apDelta} stop=${r.stopReason}`,
  )
}
console.log('\n休整循環各局:')
for (const r of restLoopRuns) {
  console.log(
    `  seed=${r.seed} wins=${r.wins} losses=${r.losses} Δ銀=${r.deltas.silver} Δ潛=${r.deltas.potential} ΔAP=${r.deltas.apDelta} stop=${r.stopReason}`,
  )
}
console.log(`\n寫入 ${OUT_JSON}`)
