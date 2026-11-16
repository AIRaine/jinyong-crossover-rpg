/**
 * 可選養成驗收：秘境／挑戰旗標
 * - 不擋主線通關；失敗只耗 AP／資源，不鎖敘事
 * - 通過點亮旗標＋小獎，供研究型玩家自我驗收
 */
import { computeGrowthProfile, stageYearEnemyScale } from './growthStage'
import type { GameState } from '../types/game'
import {
  createCombatEncounter,
  type CombatFighter,
  type CombatState,
} from './combatEngine'

export type ChallengeTrialId = 'no_aid' | 'depth_check' | 'solo_pressure'

export type ChallengeTrialDef = {
  id: ChallengeTrialId
  title: string
  blurb: string
  minYear: number
  apCost: number
  /** 本場急救次數（0＝禁急救） */
  aidUses: number
  /** 是否不含隊友 */
  solo: boolean
  /** 額外敵勢倍率 */
  enemyScaleMul: number
  flagKey: string
  rewardSilver: number
  rewardPotential: number
}

export const CHALLENGE_TRIALS: ChallengeTrialDef[] = [
  {
    id: 'no_aid',
    title: '無急救試煉',
    blurb: '本場禁急救。通過只點旗標，主線仍可不打。',
    minYear: 2,
    apCost: 1,
    aidUses: 0,
    solo: false,
    enemyScaleMul: 1.1,
    flagKey: 'challenge_flag_no_aid',
    rewardSilver: 18,
    rewardPotential: 2,
  },
  {
    id: 'depth_check',
    title: '養成驗收秘境',
    blurb: '敵勢吃養成落後；建議養分達標。失敗不擋結局。',
    minYear: 3,
    apCost: 1,
    aidUses: 2,
    solo: false,
    enemyScaleMul: 1.18,
    flagKey: 'challenge_flag_depth',
    rewardSilver: 28,
    rewardPotential: 3,
  },
  {
    id: 'solo_pressure',
    title: '單騎壓境',
    blurb: '僅你一人出戰，驗收個人養成與配置。',
    minYear: 3,
    apCost: 1,
    aidUses: 1,
    solo: true,
    enemyScaleMul: 1.12,
    flagKey: 'challenge_flag_solo',
    rewardSilver: 24,
    rewardPotential: 3,
  },
]

export function getChallengeTrial(id: string): ChallengeTrialDef | undefined {
  return CHALLENGE_TRIALS.find((t) => t.id === id)
}

export function challengeCleared(state: GameState, trial: ChallengeTrialDef): boolean {
  return Boolean(state.flags[trial.flagKey])
}

export function canStartChallenge(
  state: GameState,
  trial: ChallengeTrialDef,
): { ok: boolean; reason?: string } {
  if ((state.time?.year ?? 1) < trial.minYear) {
    return { ok: false, reason: `需至第 ${trial.minYear} 年才開放` }
  }
  if (state.actionPoints < trial.apCost) {
    return { ok: false, reason: `需 ${trial.apCost} AP` }
  }
  if (state.stats.hp < state.stats.maxHp * 0.35) {
    return { ok: false, reason: '氣血過低，請先休整' }
  }
  return { ok: true }
}

export function makeChallengeEncounter(
  player: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>,
  allies: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[],
  state: GameState,
  trial: ChallengeTrialDef,
): CombatState {
  const year = Math.max(1, state.time?.year ?? 1)
  const growth = computeGrowthProfile(state)
  const yearScale = stageYearEnemyScale(year)
  const growthMul =
    trial.id === 'depth_check' ? growth.enemyGrowthScale : 1
  const scale = yearScale * growthMul * trial.enemyScaleMul

  const mk = (
    id: string,
    name: string,
    base: { hp: number; atk: number; def: number; internal: number },
  ) => ({
    id,
    name,
    hp: Math.max(32, Math.floor(base.hp * scale)),
    maxHp: Math.max(32, Math.floor(base.hp * scale)),
    atk: Math.max(7, Math.floor(base.atk * scale)),
    def: Math.max(3, Math.floor(base.def * scale)),
    internal: Math.max(10, Math.floor(base.internal * scale)),
  })

  const party = trial.solo ? [] : allies.slice(0, 2)
  const encounter = createCombatEncounter({
    player,
    allies: party,
    enemies: [
      mk('trial_1', '秘境刀影', { hp: 70, atk: 16, def: 8, internal: 20 }),
      mk('trial_2', '驗收槍意', { hp: 62, atk: 14, def: 9, internal: 18 }),
      mk('trial_3', '旗標弓手', { hp: 54, atk: 18, def: 6, internal: 16 }),
    ],
  })
  // 單騎：拿掉自動補的臨時幫手，改 1v3 驗收個人養成
  if (trial.solo) {
    encounter.allies = encounter.allies.filter((a) => a.isPlayer)
  }
  encounter.aidUsesLeft = trial.aidUses
  encounter.logs = [
    {
      text: `【${trial.title}】可選驗收——${trial.blurb}（急救剩 ${trial.aidUses}${
        trial.solo ? '｜單人出戰' : ''
      }）`,
    },
  ]
  return encounter
}

export function applyChallengeVictory(
  state: GameState,
  trial: ChallengeTrialDef,
): GameState {
  const already = challengeCleared(state, trial)
  return {
    ...state,
    flags: {
      ...state.flags,
      [trial.flagKey]: true,
      last_challenge_id: trial.id,
    },
    currency: {
      ...state.currency,
      silver:
        state.currency.silver + (already ? Math.floor(trial.rewardSilver / 2) : trial.rewardSilver),
    },
    potential:
      state.potential +
      (already ? Math.max(1, Math.floor(trial.rewardPotential / 2)) : trial.rewardPotential),
  }
}

export function clearedChallengeCount(state: GameState): number {
  return CHALLENGE_TRIALS.filter((t) => challengeCleared(state, t)).length
}
