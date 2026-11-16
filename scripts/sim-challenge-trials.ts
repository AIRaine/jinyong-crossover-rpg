/**
 * 可選驗收／挑戰旗標：不擋主線；通過點旗標
 * 用法：npm run sim:challenge-trials
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { createInitialGameState } from '../src/data/initialState.ts'
import { grantStarterGear } from '../src/lib/starterGear.ts'
import { applyJoinSect } from '../src/lib/sectRules.ts'
import { grantMartialArts } from '../src/lib/martialUnlock.ts'
import { MARTIAL_ARTS } from '../src/data/martialArts.ts'
import {
  buildPartyCombatants,
  buildPlayerCombatant,
} from '../src/lib/buildCombatants.ts'
import { performPlayerAction, type CombatActionKind } from '../src/lib/combatEngine.ts'
import {
  canStartChallenge,
  challengeCleared,
  CHALLENGE_TRIALS,
  makeChallengeEncounter,
  applyChallengeVictory,
} from '../src/lib/challengeTrials.ts'
import { nextCultivationPreview as growthPreview } from '../src/lib/growthStage.ts'
import type { GameState } from '../src/types/game.ts'

const OUT =
  '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal/challenge-trials-result.json'
const FIGHTS = 40

function base(year: number): GameState {
  let s = createInitialGameState()
  s = {
    ...s,
    prologueDone: true,
    originChosen: true,
    originId: 'cat_tech',
    time: { ...s.time, year },
    actionPoints: 10,
    stats: {
      ...s.stats,
      level: 2 + year,
      attack: 14 + year * 2,
      defense: 10 + year,
      hp: 120 + year * 15,
      maxHp: 120 + year * 15,
      internalForce: 35 + year * 4,
      maxInternalForce: 35 + year * 4,
    },
    currency: { silver: 200, yuanbao: 0 },
    potential: 50,
    lifetimeBanditWins: year >= 3 ? 5 : 1,
  }
  return grantStarterGear(s)
}

function trainStrong(s: GameState): GameState {
  let n = applyJoinSect(s, 'sect_shaolin')
  n = grantMartialArts(n, ['ma_shaolin_yi', 'ma_act_dragon']).state
  const mp = { ...n.martialProgress }
  for (const id of ['ma_shaolin_yi', 'ma_act_dragon', 'ma_qing_cloud']) {
    mp[id] = 5
  }
  const loadout = { ...n.martialLoadout, activeIds: [...n.martialLoadout.activeIds] as GameState['martialLoadout']['activeIds'] }
  for (const id of Object.keys(mp)) {
    const art = MARTIAL_ARTS.find((m) => m.id === id)
    if (!art) continue
    if (art.kind === 'internal') loadout.internalId = id
    if (art.kind === 'qinggong') loadout.qinggongId = id
    if (art.kind === 'active') {
      const i = loadout.activeIds.findIndex((x) => x === null)
      if (i >= 0) loadout.activeIds[i] = id
    }
  }
  return {
    ...n,
    martialProgress: mp,
    martialLoadout: loadout,
    sectContribution: 60,
  }
}

function runTrial(state: GameState, trialId: string): { winRate: number; cleared: boolean } {
  const trial = CHALLENGE_TRIALS.find((t) => t.id === trialId)!
  let wins = 0
  for (let i = 0; i < FIGHTS; i++) {
    let combat = makeChallengeEncounter(
      buildPlayerCombatant(state),
      buildPartyCombatants(state),
      state,
      trial,
    )
    let g = 0
    while (!combat.finished && g < 80) {
      g++
      const foes = combat.enemies.filter((e) => e.hp > 0)
      const target = foes[0]?.id
      const player = combat.allies.find((a) => a.isPlayer)!
      const action: CombatActionKind =
        trial.aidUses === 0
          ? 'skill'
          : player.hp < player.maxHp * 0.35
            ? 'tactic_aid'
            : 'skill'
      combat = performPlayerAction(combat, action, target)
    }
    if (combat.victory) wins++
  }
  const after = applyChallengeVictory(state, trial)
  return {
    winRate: Math.round((wins / FIGHTS) * 1000) / 10,
    cleared: challengeCleared(after, trial),
  }
}

function main() {
  const weakY2 = base(2)
  const strongY3 = trainStrong(base(3))
  const preview = growthPreview(strongY3)

  const rows = []
  for (const trial of CHALLENGE_TRIALS) {
    const early = canStartChallenge(weakY2, trial)
    const ready = canStartChallenge(strongY3, trial)
    const fight = ready.ok ? runTrial(strongY3, trial.id) : null
    rows.push({
      id: trial.id,
      title: trial.title,
      year2Gate: early,
      year3Strong: ready,
      fight,
      mainlineIndependent: true,
    })
  }

  // 主線不依賴旗標：未點亮亦可視為「可結局」代理
  const flagsNeededForStory = false

  const report = {
    generatedAt: new Date().toISOString(),
    previewSample: preview,
    flagsNeededForStory,
    noAidCapsAtZero: (() => {
      const t = CHALLENGE_TRIALS.find((x) => x.id === 'no_aid')!
      const c = makeChallengeEncounter(
        buildPlayerCombatant(strongY3),
        buildPartyCombatants(strongY3),
        strongY3,
        t,
      )
      return c.aidUsesLeft === 0
    })(),
    rows,
    ok:
      flagsNeededForStory === false &&
      canStartChallenge(weakY2, CHALLENGE_TRIALS[0]!).ok === true &&
      canStartChallenge(weakY2, CHALLENGE_TRIALS[1]!).ok === false,
  }

  mkdirSync(
    '/cursor/stores/bc-94541db2-36ac-4a3c-a5bc-a3f7b97e3303/internal',
    { recursive: true },
  )
  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ok: report.ok, preview: preview.gapLine, out: OUT }, null, 2))
  if (!report.ok) process.exitCode = 1
}

main()
