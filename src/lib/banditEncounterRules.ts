import type { GameState } from '../types/game'

/** 每次路遇開戰消耗行動點 */
export const BANDIT_FIGHT_AP_COST = 1

/** 同旬路遇上限（含勝敗） */
export const BANDIT_FIGHTS_PER_XUN_MAX = 3

/**
 * 同旬前 N 場勝利給滿額獎；之後銀兩／潛能腰斬。
 * 以「本旬已開戰次數」（含本場）判斷：第 1～2 場滿額，第 3 場起衰減。
 */
export const BANDIT_FULL_REWARD_FIGHTS = 2

export const BANDIT_WIN_SILVER_FULL = 20
export const BANDIT_WIN_POTENTIAL_FULL = 2
export const BANDIT_WIN_SILVER_DECAYED = 10
export const BANDIT_WIN_POTENTIAL_DECAYED = 1

export type BanditStartBlockReason =
  | 'prologue'
  | 'low_hp'
  | 'lose_streak'
  | 'no_ap'
  | 'xun_cap'

const BLOCK_LABEL: Record<BanditStartBlockReason, string> = {
  prologue: '序章未了',
  low_hp: '氣血過低',
  lose_streak: '連敗鎖定',
  no_ap: 'AP 不足',
  xun_cap: '本旬次數已滿',
}

export function banditStartBlockLabel(reason: BanditStartBlockReason): string {
  return BLOCK_LABEL[reason]
}

/** 開戰門檻（不含副作用） */
export function getBanditStartBlock(
  state: GameState,
): BanditStartBlockReason | null {
  if (!state.prologueDone) return 'prologue'
  if (state.stats.hp <= state.stats.maxHp * 0.35) return 'low_hp'
  if (state.combatLoseStreak >= 3) return 'lose_streak'
  if (state.actionPoints < BANDIT_FIGHT_AP_COST) return 'no_ap'
  if (state.banditFightsThisXun >= BANDIT_FIGHTS_PER_XUN_MAX) return 'xun_cap'
  return null
}

/** 開戰時扣 AP、累加本旬次數 */
export function applyBanditFightStartCost(state: GameState): GameState {
  return {
    ...state,
    actionPoints: Math.max(0, state.actionPoints - BANDIT_FIGHT_AP_COST),
    banditFightsThisXun: state.banditFightsThisXun + 1,
  }
}

export function banditWinRewards(fightsThisXunIncludingCurrent: number): {
  silver: number
  potential: number
  decayed: boolean
} {
  const decayed = fightsThisXunIncludingCurrent > BANDIT_FULL_REWARD_FIGHTS
  return {
    silver: decayed ? BANDIT_WIN_SILVER_DECAYED : BANDIT_WIN_SILVER_FULL,
    potential: decayed
      ? BANDIT_WIN_POTENTIAL_DECAYED
      : BANDIT_WIN_POTENTIAL_FULL,
    decayed,
  }
}

/** 休整解鎖連敗：推進旬／遠行／服丹 */
export function clearCombatLoseStreak(state: GameState): GameState {
  if (state.combatLoseStreak <= 0) return state
  return { ...state, combatLoseStreak: 0 }
}
