/**
 * 夜間→破曉移動時的 AP 回復（上限內）。
 * 刻意不回滿：避免短距連走刷夜間、無腦回滿 AP 再刷採集／戰鬥。
 * 主要 AP 來源仍是「推進一旬」的 +1。
 */
export const NIGHT_TRAVEL_AP_RESTORE = 1

export function applyNightTravelApRestore(
  actionPoints: number,
  maxActionPoints: number,
): number {
  return Math.min(maxActionPoints, actionPoints + NIGHT_TRAVEL_AP_RESTORE)
}
