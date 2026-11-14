/**
 * 裝備／武學加成軟上限：超過 soft 後收益遞減，防止數值膨脹。
 * 例：soft=48、ratio=0.45 → 加成 80 約等效 48+(32*0.45)=62.4
 */
export function softCapBonus(
  bonus: number,
  soft = 48,
  ratio = 0.45,
): number {
  if (bonus <= soft) return bonus
  return soft + (bonus - soft) * ratio
}

/**
 * 傷害公式：
 * atk * (100 / (100 + def)) * 倍率 * 內力壓制(±30%)
 * atk／def 建議先經 softCapBonus 處理面板加成。
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
