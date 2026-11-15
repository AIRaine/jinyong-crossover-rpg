import type { GameState } from '../types/game'

/** 每次榜單切磋開戰消耗行動點 */
export const SPAR_FIGHT_AP_COST = 1

/** 同旬切磋上限（含勝敗） */
export const SPAR_FIGHTS_PER_XUN_MAX = 3

export const SPAR_WIN_SILVER = 12
export const SPAR_WIN_POTENTIAL = 2

export type SparStartBlockReason =
  | 'prologue'
  | 'no_ap'
  | 'xun_cap'

const BLOCK_LABEL: Record<SparStartBlockReason, string> = {
  prologue: '序章未了',
  no_ap: 'AP 不足',
  xun_cap: '本旬切磋已滿',
}

export function sparStartBlockLabel(reason: SparStartBlockReason): string {
  return BLOCK_LABEL[reason]
}

export function getSparStartBlock(
  state: GameState,
): SparStartBlockReason | null {
  if (!state.prologueDone) return 'prologue'
  if (state.actionPoints < SPAR_FIGHT_AP_COST) return 'no_ap'
  if (state.sparFightsThisXun >= SPAR_FIGHTS_PER_XUN_MAX) return 'xun_cap'
  return null
}

export function applySparFightStartCost(state: GameState): GameState {
  return {
    ...state,
    actionPoints: Math.max(0, state.actionPoints - SPAR_FIGHT_AP_COST),
    sparFightsThisXun: state.sparFightsThisXun + 1,
  }
}
