import { EQUIPMENTS } from '../data/equipments'
import type { EquipQuality, EquipmentDef } from '../types/game'

export const GACHA_SINGLE_COST = 60
export const GACHA_TEN_COST = 540

/** 年份封印：低年份鎖高品質 */
export function maxQualityForYear(year: number): EquipQuality {
  if (year <= 1) return 'rare'
  if (year === 2) return 'epic'
  return 'legendary'
}

const QUALITY_ORDER: EquipQuality[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

function qualityRank(q: EquipQuality): number {
  return QUALITY_ORDER.indexOf(q)
}

function poolForYear(year: number): EquipmentDef[] {
  const max = qualityRank(maxQualityForYear(year))
  return EQUIPMENTS.filter((e) => qualityRank(e.quality) <= max)
}

export interface GachaPullResult {
  item: EquipmentDef
  pityTriggered: 'none' | 'epic' | 'legendary'
  nextPityEpic: number
  nextPityLegendary: number
}

/**
 * 單抽：保底
 * - 絕品：每 10 抽必出（若年份已解鎖）
 * - 神兵：每 30 抽必出（若年份已解鎖）
 */
export function pullOnce(params: {
  year: number
  pityEpic: number
  pityLegendary: number
  rng?: () => number
}): GachaPullResult {
  const rng = params.rng ?? Math.random
  const maxQ = maxQualityForYear(params.year)
  const pool = poolForYear(params.year)
  let pityEpic = params.pityEpic + 1
  let pityLegendary = params.pityLegendary + 1
  let pityTriggered: GachaPullResult['pityTriggered'] = 'none'
  let forced: EquipQuality | null = null

  if (maxQ === 'legendary' && pityLegendary >= 30) {
    forced = 'legendary'
    pityTriggered = 'legendary'
  } else if (
    (maxQ === 'epic' || maxQ === 'legendary') &&
    pityEpic >= 10
  ) {
    forced = 'epic'
    pityTriggered = 'epic'
  }

  let item: EquipmentDef
  if (forced) {
    const sub = pool.filter((e) => e.quality === forced)
    item = sub[Math.floor(rng() * sub.length)] ?? pool[pool.length - 1]
  } else {
    const roll = rng()
    let quality: EquipQuality = 'common'
    if (roll < 0.02 && qualityRank(maxQ) >= qualityRank('legendary')) {
      quality = 'legendary'
    } else if (roll < 0.1 && qualityRank(maxQ) >= qualityRank('epic')) {
      quality = 'epic'
    } else if (roll < 0.35) {
      quality = 'rare'
    } else if (roll < 0.65) {
      quality = 'uncommon'
    } else {
      quality = 'common'
    }
    if (qualityRank(quality) > qualityRank(maxQ)) quality = maxQ
    const sub = pool.filter((e) => e.quality === quality)
    item =
      sub[Math.floor(rng() * sub.length)] ??
      pool[Math.floor(rng() * pool.length)]
  }

  if (item.quality === 'legendary') {
    pityLegendary = 0
    pityEpic = 0
  } else if (item.quality === 'epic') {
    pityEpic = 0
  }

  return {
    item,
    pityTriggered,
    nextPityEpic: pityEpic,
    nextPityLegendary: pityLegendary,
  }
}

export function pullMany(
  count: number,
  params: {
    year: number
    pityEpic: number
    pityLegendary: number
  },
): { results: GachaPullResult[]; pityEpic: number; pityLegendary: number } {
  let pityEpic = params.pityEpic
  let pityLegendary = params.pityLegendary
  const results: GachaPullResult[] = []
  for (let i = 0; i < count; i++) {
    const r = pullOnce({
      year: params.year,
      pityEpic,
      pityLegendary,
    })
    results.push(r)
    pityEpic = r.nextPityEpic
    pityLegendary = r.nextPityLegendary
  }
  return { results, pityEpic, pityLegendary }
}

export function yearSealHint(year: number): string {
  const q = maxQualityForYear(year)
  const label =
    q === 'rare' ? '珍品' : q === 'epic' ? '絕品' : '神兵'
  return `當前年份封印：最高可抽到「${label}」（第 ${year} 年）`
}
