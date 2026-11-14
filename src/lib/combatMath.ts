/**
 * 傷害公式：
 * atk * (100 / (100 + def)) * 倍率 * 內力壓制(±30%)
 */
export function calcDamage(params: {
  atk: number
  def: number
  multiplier?: number
  attackerInternal: number
  defenderInternal: number
}): number {
  const { atk, def, attackerInternal, defenderInternal } = params
  const multiplier = params.multiplier ?? 1
  const mitigation = 100 / (100 + Math.max(0, def))
  const base = atk * mitigation * multiplier
  const ratio =
    Math.max(1, attackerInternal) / Math.max(1, defenderInternal)
  const suppress = Math.min(1.3, Math.max(0.7, ratio))
  return Math.max(1, Math.floor(base * suppress))
}

/** 內力壓制係數（供 UI 顯示） */
export function internalSuppressFactor(
  attackerInternal: number,
  defenderInternal: number,
): number {
  const ratio =
    Math.max(1, attackerInternal) / Math.max(1, defenderInternal)
  return Math.min(1.3, Math.max(0.7, ratio))
}
