/**
 * 養成＋關卡台階（垂直切片）
 * - 成長靠修練／配置／門派貢獻／裝備精煉，而非無腦推旬
 * - 年分路遇台階加劇；養成落後 → 敵勢抬升
 * - 戰鬥勝負回寫推進壓力（節拍冷卻／結局閘）
 */
import type { GameState } from '../types/game'

/** 與 journeyPath 同步：開局武學（避免循環依賴） */
const STARTER_MARTIAL_IDS = [
  'ma_jiuyin',
  'ma_heart_calm',
  'ma_qing_cloud',
  'ma_act_flashlight',
  'ma_act_luoying',
] as const

export type GrowthProfile = {
  /** 0～100 養成實力 */
  cultivationScore: number
  martialLevelsEquipped: number
  refineTotal: number
  sectPower: number
  researchDepth: number
  /** 當年預期養成（低於此＝落後） */
  expectedForYear: number
  /** 落後幅度 0～1 */
  deficitRatio: number
  /** 乘到敵方面板（≥1） */
  enemyGrowthScale: number
  /** 絕招額外倍率（認真修練回報） */
  skillGrowthFlat: number
  /** 攻防小幅加成（門派貢獻／精煉） */
  atkFlat: number
  defFlat: number
  labels: string[]
  stageLabel: string
}

function equippedIds(state: GameState): string[] {
  const L = state.martialLoadout
  return [
    L.internalId,
    L.heartId,
    L.qinggongId,
    ...L.activeIds,
  ].filter((x): x is string => Boolean(x))
}

/** 當年「像樣」的養成目標：逼出修練，而非只推旬 */
export function expectedCultivationForYear(year: number): number {
  const y = Math.max(1, Math.min(5, year))
  return [0, 10, 20, 32, 44, 56][y]!
}

export function computeGrowthProfile(state: GameState): GrowthProfile {
  const year = Math.max(1, state.time?.year ?? 1)
  const equipped = equippedIds(state)
  let martialLevelsEquipped = 0
  let researchDepth = 0
  for (const id of equipped) {
    const lv = state.martialProgress[id] ?? 0
    martialLevelsEquipped += lv
    if (!(STARTER_MARTIAL_IDS as readonly string[]).includes(id)) {
      researchDepth += lv + 2
    } else {
      // 開局招升高等仍有回報，但權重較低
      researchDepth += Math.max(0, lv - 1)
    }
  }

  let refineTotal = 0
  for (const uid of Object.values(state.equipped)) {
    if (!uid) continue
    const owned = state.ownedEquipment.find((e) => e.uid === uid)
    if (!owned) continue
    refineTotal += owned.refineLevel
    if (owned.quenched) refineTotal += 1
  }

  const sectPower = state.sectId
    ? Math.min(24, Math.floor((state.sectContribution ?? 0) / 12) + 6)
    : 0

  let cultivationScore =
    martialLevelsEquipped * 2.2 +
    researchDepth * 1.4 +
    refineTotal * 1.5 +
    sectPower
  // 無研究且僅開局招：後期分數被壓，推旬無法「自然變強」
  const starterOnly =
    equipped.length > 0 &&
    equipped.every((id) =>
      (STARTER_MARTIAL_IDS as readonly string[]).includes(id),
    )
  if (starterOnly && year >= 3) {
    cultivationScore *= 0.72
  }
  cultivationScore = Math.max(0, Math.min(100, Math.round(cultivationScore)))

  const expectedForYear = expectedCultivationForYear(year)
  const deficit = Math.max(0, expectedForYear - cultivationScore)
  const deficitRatio = Math.min(1, deficit / Math.max(12, expectedForYear))

  // 落後最多約 +28% 敵勢——逼修練／換裝／門派
  const enemyGrowthScale = 1 + deficitRatio * 0.28

  // 認真修練絕招回報；開局裸裝後期吃罰
  let skillGrowthFlat = Math.min(0.12, researchDepth * 0.006 + martialLevelsEquipped * 0.003)
  if (starterOnly && year >= 3) skillGrowthFlat -= 0.06
  if (sectPower >= 12) skillGrowthFlat += 0.02
  skillGrowthFlat = Math.max(-0.08, Math.min(0.14, skillGrowthFlat))

  const atkFlat =
    Math.floor(refineTotal * 0.35) + Math.floor((state.sectContribution ?? 0) / 40)
  const defFlat =
    Math.floor(refineTotal * 0.25) + Math.floor((state.sectContribution ?? 0) / 50)

  const labels: string[] = []
  if (deficitRatio >= 0.45) labels.push('養成·落後')
  else if (deficitRatio >= 0.2) labels.push('養成·吃力')
  else if (cultivationScore >= expectedForYear + 8) labels.push('養成·超前')
  else labels.push('養成·跟上')
  if (researchDepth >= 12) labels.push('研究有成')
  if (sectPower >= 12) labels.push('門牆紮根')
  if (refineTotal >= 6) labels.push('兵甲精煉')

  const stageLabel =
    year <= 1 ? '關卡·入門' : year === 2 ? '關卡·立足' : year === 3 ? '關卡·分化' : year === 4 ? '關卡·高壓' : '關卡·潮前'

  return {
    cultivationScore,
    martialLevelsEquipped,
    refineTotal,
    sectPower,
    researchDepth,
    expectedForYear,
    deficitRatio,
    enemyGrowthScale,
    skillGrowthFlat,
    atkFlat,
    defFlat,
    labels,
    stageLabel,
  }
}

const STAGE_NEXT: Record<number, string> = {
  1: '下階·立足：多修練、勝幾場路遇',
  2: '下階·分化：換非開局招／入派貢獻',
  3: '下階·高壓：精煉兵甲、研究有成',
  4: '下階·潮前：戰績＋養成深度開潮信',
  5: '潮信當前：維持養成，勿空轉推旬',
}

/**
 * 遊歷預告：關卡階＋下一養成缺口（可讀、不抄數值表）
 */
export function nextCultivationPreview(state: GameState): {
  stageLabel: string
  nextStageHint: string
  gapLine: string
  focusTips: string[]
} {
  const g = computeGrowthProfile(state)
  const year = Math.max(1, Math.min(5, state.time?.year ?? 1))
  const nextStageHint = STAGE_NEXT[year] ?? STAGE_NEXT[5]!
  const gap = g.expectedForYear - g.cultivationScore
  const gapLine =
    gap > 0
      ? `養成缺口 ${gap}（現 ${g.cultivationScore}／目標 ${g.expectedForYear}）`
      : `養成已達標（${g.cultivationScore}／${g.expectedForYear}）`

  const focusTips: string[] = []
  if (g.martialLevelsEquipped < 8 || g.researchDepth < 6) {
    focusTips.push('修練武學／換非開局招')
  }
  if (g.refineTotal < 4) focusTips.push('裝備精煉')
  if (!state.sectId || (state.sectContribution ?? 0) < 30) {
    focusTips.push('門派貢獻')
  }
  if ((state.lifetimeBanditWins ?? 0) < 3) focusTips.push('路遇勝仗')
  if (focusTips.length === 0) focusTips.push('可選驗收秘境／挑戰旗標')

  return {
    stageLabel: g.stageLabel,
    nextStageHint,
    gapLine,
    focusTips: focusTips.slice(0, 3),
  }
}

/**
 * 年分台階：早期可硬剛，中後期必須養成。
 * y1=1.00 → y5≈1.58（比舊版每年 +6% 更陡）
 */
export function stageYearEnemyScale(year: number): number {
  const y = Math.max(1, Math.min(5, year))
  const table = [1, 1.0, 1.12, 1.28, 1.42, 1.58]
  return table[y]!
}

/** 戰鬥勝／負對推進的壓力修正（旬冷卻加減） */
export function combatBeatPressureDelta(state: GameState, won: boolean): number {
  const g = computeGrowthProfile(state)
  if (won) {
    // 勝利略加速節拍；超前養成多一點回報
    return g.deficitRatio < 0.15 ? -1 : 0
  }
  // 戰敗拖慢；落後養成再罰
  return g.deficitRatio >= 0.35 ? 2 : 1
}

/** 戰敗代價：銀兩／潛能（不歸零，可感） */
export function combatDefeatPenalty(state: GameState): {
  silverLost: number
  potentialLost: number
} {
  const year = Math.max(1, state.time?.year ?? 1)
  const silverLost = Math.min(
    state.currency.silver,
    8 + year * 6 + Math.floor(state.currency.silver * 0.03),
  )
  const potentialLost = Math.min(state.potential, 1 + Math.floor(year / 2))
  return { silverLost, potentialLost }
}

/**
 * 結局閘強化：不能只靠「入個派」——要有戰鬥或養成深度。
 */
export function finaleCombatCultivationOk(state: GameState): boolean {
  const wins = state.lifetimeBanditWins ?? 0
  const g = computeGrowthProfile(state)
  if (wins >= 5 && g.cultivationScore >= 14) return true
  if (g.cultivationScore >= 30 && wins >= 2) return true
  if (g.researchDepth >= 14 && wins >= 3) return true
  if (
    state.sectId &&
    (state.sectContribution ?? 0) >= 45 &&
    wins >= 3 &&
    g.martialLevelsEquipped >= 10
  ) {
    return true
  }
  return false
}

export function applyCombatOutcomeToStoryPressure(
  state: GameState,
  won: boolean,
): GameState {
  // delta：勝 -1/0（縮短冷卻）、負 +1/+2（拉長冷卻）
  const delta = combatBeatPressureDelta(state, won)
  const prev =
    typeof state.flags.combat_beat_bias === 'number'
      ? state.flags.combat_beat_bias
      : 0
  const nextBias = Math.max(-3, Math.min(4, prev + delta))
  // xunsSinceLastBeat 越大越接近節拍：勝利略加、戰敗略減
  const xunAdjust = won ? (delta < 0 ? 1 : 0) : -Math.abs(delta)
  let next: GameState = {
    ...state,
    flags: {
      ...state.flags,
      combat_beat_bias: nextBias,
      last_combat_won: won,
    },
    xunsSinceLastBeat: Math.max(0, state.xunsSinceLastBeat + xunAdjust),
  }
  if (!won) {
    const pen = combatDefeatPenalty(state)
    next = {
      ...next,
      currency: {
        ...next.currency,
        silver: Math.max(0, next.currency.silver - pen.silverLost),
      },
      potential: Math.max(0, next.potential - pen.potentialLost),
      lastOutcomeText:
        (next.lastOutcomeText ? `${next.lastOutcomeText}\n` : '') +
        `戰敗代價：銀兩 -${pen.silverLost}、潛能 -${pen.potentialLost}（節拍亦被拖慢）。`,
    }
  }
  return next
}
