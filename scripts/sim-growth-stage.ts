/**
 * 養成＋關卡台階垂直切片驗證
 * - 無腦推旬 vs 認真修練／門派／精煉
 * - 年分敵勢台階、戰敗代價、結局閘
 * - 急救／課金不跳關（回歸）
 *
 * 用法：npm run sim:growth-stage
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { MARTIAL_ARTS } from '../src/data/martialArts.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import { grantMartialArts } from '../src/lib/martialUnlock.ts'
import { applyJoinSect } from '../src/lib/sectRules.ts'
import { computeDifficultyMods } from '../src/lib/difficultyModifiers.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import {
  makeBanditEncounter,
  performPlayerAction,
  TACTIC_AID_MAX_PER_FIGHT,
  type CombatActionKind,
} from '../src/lib/combatEngine.ts'
import {
  applyCombatOutcomeToStoryPressure,
  combatDefeatPenalty,
  computeGrowthProfile,
  expectedCultivationForYear,
  finaleCombatCultivationOk,
  stageYearEnemyScale,
} from '../src/lib/growthStage.ts'
import { computeJourneyProfile } from '../src/lib/journeyPath.ts'
import type { GameState } from '../src/types/game.ts'

const OUT =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/growth-stage-result.json'
const FIGHTS = 60

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

function baseState(year = 1): GameState {
  let s = createInitialGameState()
  s = {
    ...s,
    playerName: '養成測',
    prologueDone: true,
    originChosen: true,
    time: { ...s.time, year, month: 3, xun: 2, day: year * 80 },
    stats: {
      ...s.stats,
      level: 2 + year,
      attack: 12 + year * 2,
      defense: 8 + year,
      hp: 100 + year * 20,
      maxHp: 100 + year * 20,
      internalForce: 30 + year * 5,
      maxInternalForce: 30 + year * 5,
    },
    currency: { silver: 200 + year * 40, yuanbao: 0 },
    comprehension: 50,
    potential: 40 + year * 10,
  }
  return grantStarterGear(s)
}

function trainChain(state: GameState, ids: string[], level = 4): GameState {
  let s = state
  const martialProgress = { ...s.martialProgress }
  for (const id of ids) {
    martialProgress[id] = Math.max(martialProgress[id] ?? 0, level)
  }
  s = { ...s, martialProgress }
  const loadout = {
    ...s.martialLoadout,
    activeIds: [...s.martialLoadout.activeIds] as GameState['martialLoadout']['activeIds'],
  }
  for (const id of ids) {
    const art = MARTIAL_ARTS.find((m) => m.id === id)
    if (!art) continue
    if (art.kind === 'internal') loadout.internalId = id
    if (art.kind === 'heart') loadout.heartId = id
    if (art.kind === 'qinggong') loadout.qinggongId = id
    if (art.kind === 'active') {
      const idx = loadout.activeIds.findIndex((x) => x === null)
      if (idx >= 0) loadout.activeIds[idx] = id
    }
  }
  return { ...s, martialLoadout: loadout }
}

function refineEquipped(state: GameState, levels: number): GameState {
  const owned = state.ownedEquipment.map((e) => {
    const isWorn = Object.values(state.equipped).includes(e.uid)
    if (!isWorn) return e
    return { ...e, refineLevel: Math.min(9, levels), quenched: levels >= 4 }
  })
  return { ...state, ownedEquipment: owned }
}

function runFights(
  state: GameState,
  seed: number,
  year: number,
  policy: 'attack' | 'skill' = 'skill',
): {
  wins: number
  losses: number
  winRate: number
  avgTurns: number
  enemyScale: number
  yearScale: number
  growthScale: number
} {
  const mods = computeDifficultyMods(state)
  const growth = computeGrowthProfile(state)
  const yearScale = stageYearEnemyScale(year)
  let wins = 0
  let losses = 0
  let turns = 0
  for (let i = 0; i < FIGHTS; i++) {
    void mulberry32(seed + i * 19)
    let combat = makeBanditEncounter(
      buildPlayerCombatant(state),
      buildPartyCombatants(state),
      { loseStreak: 0, year, enemyScale: mods.enemyScale },
    )
    let guard = 0
    while (!combat.finished && guard < 80) {
      guard++
      const foes = combat.enemies.filter((e) => e.hp > 0)
      const target = foes[Math.floor(Math.random() * foes.length)]?.id
      const player = combat.allies.find((a) => a.isPlayer)!
      const action: CombatActionKind =
        policy === 'skill'
          ? player.hp < player.maxHp * 0.35
            ? 'tactic_aid'
            : 'skill'
          : 'attack'
      combat = performPlayerAction(combat, action, target)
    }
    turns += combat.turn
    if (combat.victory) wins++
    else losses++
  }
  const total = wins + losses || 1
  return {
    wins,
    losses,
    winRate: Math.round((wins / total) * 1000) / 10,
    avgTurns: Math.round((turns / total) * 10) / 10,
    enemyScale: Math.round(mods.enemyScale * 1000) / 1000,
    yearScale,
    growthScale: Math.round(growth.enemyGrowthScale * 1000) / 1000,
  }
}

function scenarioMindlessXun(year: number): GameState {
  // 只推旬：開局招、無門派、無精煉、幾乎不練
  let s = baseState(year)
  s = trainChain(s, ['ma_jiuyin', 'ma_act_flashlight'], 1)
  s = { ...s, lifetimeBanditWins: Math.min(2, year), sectContribution: 0 }
  return s
}

function scenarioSeriousResearch(year: number): GameState {
  let s = baseState(year)
  s = applyJoinSect(s, 'sect_shaolin')
  s = {
    ...s,
    sectContribution: 20 + year * 25,
    lifetimeBanditWins: 2 + year * 3,
  }
  s = grantMartialArts(s, ['ma_shaolin_yi', 'ma_shaolin_xisui', 'ma_act_dragon']).state
  const lv = Math.min(6, 2 + year)
  s = trainChain(
    s,
    ['ma_shaolin_yi', 'ma_shaolin_xisui', 'ma_act_dragon', 'ma_qing_cloud'],
    lv,
  )
  s = refineEquipped(s, Math.min(6, year + 1))
  return s
}

function scenarioMidSplitSect(year: number): GameState {
  let s = baseState(year)
  s = applyJoinSect(s, 'sect_mingjiao')
  s = {
    ...s,
    sectContribution: 40 + year * 15,
    lifetimeBanditWins: 3 + year * 2,
    flags: { ...s.flags, route_y1: 'scheme', route_y2: 'battle' },
  }
  s = grantMartialArts(s, ['ma_mingjiao_fire', 'ma_jiuyang', 'ma_qing_icefire']).state
  s = trainChain(
    s,
    ['ma_mingjiao_fire', 'ma_jiuyang', 'ma_qing_icefire'],
    Math.min(5, 1 + year),
  )
  s = refineEquipped(s, Math.min(5, year))
  return s
}

function scenarioEquipHeavy(year: number): GameState {
  let s = baseState(year)
  s = trainChain(s, ['ma_jiuyin', 'ma_act_flashlight', 'ma_act_luoying'], 3)
  s = refineEquipped(s, 7)
  s = { ...s, lifetimeBanditWins: 4 + year, sectContribution: 0 }
  return s
}

function main() {
  const yearScales = [1, 2, 3, 4, 5].map((y) => ({
    year: y,
    scale: stageYearEnemyScale(y),
    expectedCultivation: expectedCultivationForYear(y),
  }))

  const loadouts: {
    id: string
    title: string
    year: number
    build: (y: number) => GameState
  }[] = [
    { id: 'mindless_y1', title: '無腦推旬·一年', year: 1, build: scenarioMindlessXun },
    { id: 'mindless_y3', title: '無腦推旬·三年', year: 3, build: scenarioMindlessXun },
    { id: 'mindless_y5', title: '無腦推旬·五年', year: 5, build: scenarioMindlessXun },
    { id: 'research_y1', title: '認真研究·一年', year: 1, build: scenarioSeriousResearch },
    { id: 'research_y3', title: '認真研究·三年', year: 3, build: scenarioSeriousResearch },
    { id: 'research_y5', title: '認真研究·五年', year: 5, build: scenarioSeriousResearch },
    { id: 'sect_split_y3', title: '門派分化·明皎三年', year: 3, build: scenarioMidSplitSect },
    { id: 'equip_y3', title: '裝備精煉重·三年', year: 3, build: scenarioEquipHeavy },
  ]

  const scenarios: Record<string, unknown>[] = []
  for (const L of loadouts) {
    const s = L.build(L.year)
    const growth = computeGrowthProfile(s)
    const journey = computeJourneyProfile(s)
    const fights = runFights(s, 700 + L.year * 11, L.year, 'skill')
    const attack = runFights(s, 800 + L.year * 13, L.year, 'attack')
    scenarios.push({
      id: L.id,
      title: L.title,
      year: L.year,
      growth,
      finaleOk: finaleCombatCultivationOk(s),
      endingBranch: journey.endingBranch,
      pathTier: journey.pathTier,
      skillFights: fights,
      attackFights: attack,
      modsLabels: computeDifficultyMods(s).labels,
    })
  }

  // 戰敗代價／節拍壓力
  {
    let s = scenarioMindlessXun(3)
    s = { ...s, currency: { silver: 120, yuanbao: 0 }, potential: 8 }
    const pen = combatDefeatPenalty(s)
    const afterLoss = applyCombatOutcomeToStoryPressure(s, false)
    const afterWin = applyCombatOutcomeToStoryPressure(
      { ...s, lifetimeBanditWins: 6 },
      true,
    )
    scenarios.push({
      id: 'defeat_cost_pressure',
      title: '戰敗代價與節拍壓力',
      penalty: pen,
      biasAfterLoss: afterLoss.flags.combat_beat_bias,
      biasAfterWin: afterWin.flags.combat_beat_bias,
      xunsAfterLoss: afterLoss.xunsSinceLastBeat,
      xunsAfterWin: afterWin.xunsSinceLastBeat,
      silverAfterLoss: afterLoss.currency.silver,
      potentialAfterLoss: afterLoss.potential,
    })
  }

  // 結局閘：只入派不夠
  {
    let joinOnly = baseState(4)
    joinOnly = applyJoinSect(joinOnly, 'sect_beggar')
    joinOnly = {
      ...joinOnly,
      sectContribution: 10,
      lifetimeBanditWins: 0,
      partyIds: ['npc_huang_rong'],
    }
    const joinOnlyOk = finaleCombatCultivationOk(joinOnly)
    let forged = scenarioSeriousResearch(4)
    forged = { ...forged, lifetimeBanditWins: 8 }
    const forgedOk = finaleCombatCultivationOk(forged)
    scenarios.push({
      id: 'finale_gate',
      title: '結局閘：入派≠投入',
      joinSectOnlyFinale: joinOnlyOk,
      researchFinale: forgedOk,
      joinOnlyBranch: computeJourneyProfile(joinOnly).endingBranch,
      researchBranch: computeJourneyProfile(forged).endingBranch,
    })
  }

  // P0 回歸：急救上限、課金不進養成分
  {
    const s = scenarioMindlessXun(3)
    const modsPaid = computeDifficultyMods({
      ...s,
      currency: { ...s.currency, yuanbao: 9999 },
    })
    const modsFree = computeDifficultyMods(s)
    scenarios.push({
      id: 'p0_regression',
      title: 'P0：急救上限／課金不抬養成',
      tacticAidMaxPerFight: TACTIC_AID_MAX_PER_FIGHT,
      yuanbaoDoesNotChangeEnemyScale:
        modsPaid.enemyScale === modsFree.enemyScale,
      yuanbaoDoesNotChangeAtk: modsPaid.atkFlat === modsFree.atkFlat,
      growthScoreIgnoresYuanbao:
        computeGrowthProfile({
          ...s,
          currency: { ...s.currency, yuanbao: 9999 },
        }).cultivationScore === computeGrowthProfile(s).cultivationScore,
    })
  }

  // 分叉摘要
  const mindlessY5 = scenarios.find((x) => x.id === 'mindless_y5') as {
    skillFights?: { winRate: number; enemyScale: number }
    growth?: { cultivationScore: number; deficitRatio: number }
    finaleOk?: boolean
  }
  const researchY5 = scenarios.find((x) => x.id === 'research_y5') as {
    skillFights?: { winRate: number; enemyScale: number }
    growth?: { cultivationScore: number; deficitRatio: number }
    finaleOk?: boolean
  }
  const finale = scenarios.find((x) => x.id === 'finale_gate') as {
    joinSectOnlyFinale?: boolean
    researchFinale?: boolean
  }
  const p0 = scenarios.find((x) => x.id === 'p0_regression') as {
    tacticAidMaxPerFight?: number
    yuanbaoDoesNotChangeEnemyScale?: boolean
  }

  const summary = {
    yearScaleSteep:
      stageYearEnemyScale(5) >= 1.5 && stageYearEnemyScale(1) === 1,
    mindlessY5WinRate: mindlessY5?.skillFights?.winRate ?? null,
    researchY5WinRate: researchY5?.skillFights?.winRate ?? null,
    winRateGap:
      researchY5?.skillFights && mindlessY5?.skillFights
        ? Math.round(
            (researchY5.skillFights.winRate - mindlessY5.skillFights.winRate) *
              10,
          ) / 10
        : null,
    mindlessDeficit: mindlessY5?.growth?.deficitRatio ?? null,
    researchScore: researchY5?.growth?.cultivationScore ?? null,
    joinOnlyBlockedFinale: finale?.joinSectOnlyFinale === false,
    researchUnlocksFinale: finale?.researchFinale === true,
    firstAidCapped: (p0?.tacticAidMaxPerFight ?? 0) <= 2,
    payNoCombatBoost: p0?.yuanbaoDoesNotChangeEnemyScale === true,
  }

  const ok =
    summary.yearScaleSteep &&
    (summary.winRateGap ?? 0) >= 8 &&
    summary.joinOnlyBlockedFinale &&
    summary.researchUnlocksFinale &&
    summary.firstAidCapped &&
    summary.payNoCombatBoost

  const report = {
    generatedAt: new Date().toISOString(),
    fightsPerScenario: FIGHTS,
    yearScales,
    summary,
    ok,
    scenarios,
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8')
  console.log(JSON.stringify({ ok, summary, out: OUT }, null, 2))
  if (!ok) process.exitCode = 1
}

main()
