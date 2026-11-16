/**
 * 武學成對共鳴（正向一句）——諧音招式，非經典專名照搬
 */
import { getMartialById } from '../data/martialArts'
import type { GameState } from '../types/game'

export type MartialResonanceDef = {
  id: string
  /** 需雙方皆學會；配置時額外有感 */
  pair: [string, string]
  /** 短名（UI） */
  title: string
  /** 正向效果一句 */
  effect: string
}

/** 以既有前置／門派鏈為成對，鼓勵專精而非亂學 */
export const MARTIAL_RESONANCES: MartialResonanceDef[] = [
  {
    id: 'res_shaolin_body',
    pair: ['ma_shaolin_yi', 'ma_shaolin_xisui'],
    title: '易筋洗髓共鳴',
    effect: '護體續航更穩，逆境較耐打',
  },
  {
    id: 'res_shaolin_palm',
    pair: ['ma_shaolin_xisui', 'ma_act_dragon'],
    title: '洗髓降朧共鳴',
    effect: '少凜傳功成線，掌勢更沉',
  },
  {
    id: 'res_wudang',
    pair: ['ma_wudang_taiji', 'ma_act_taiji_sword'],
    title: '太極綿劍共鳴',
    effect: '柔中帶剛，長線回復較從容',
  },
  {
    id: 'res_huashan',
    pair: ['ma_qing_huashan', 'ma_act_lonely'],
    title: '猿躍劍意共鳴',
    effect: '華嶠身法與劍意相生，破法更利',
  },
  {
    id: 'res_mingjiao',
    pair: ['ma_mingjiao_fire', 'ma_jiuyang'],
    title: '聖火久陽共鳴',
    effect: '火息相續，戰中氣勢更盛',
  },
  {
    id: 'res_icefire',
    pair: ['ma_jiuyang', 'ma_qing_icefire'],
    title: '久陽踏雪共鳴',
    effect: '明皎高階連線，身法更刁',
  },
  {
    id: 'res_tomb',
    pair: ['ma_gumupo_jade', 'ma_qing_tomb'],
    title: '玉女墓影共鳴',
    effect: '古暮路徑成形，閃轉更利',
  },
  {
    id: 'res_tomb_blade',
    pair: ['ma_qing_tomb', 'ma_act_xuantie'],
    title: '墓影玄鐵共鳴',
    effect: '古暮終式連動，一擊更重',
  },
  {
    id: 'res_riyue',
    pair: ['ma_kuiying', 'ma_act_needle'],
    title: '葵影針雨共鳴',
    effect: '先手暗器更準，短兵更險',
  },
  {
    id: 'res_emei',
    pair: ['ma_heart_emei', 'ma_qing_emei'],
    title: '靜念雲嶺共鳴',
    effect: '峩眉心法與身法相守',
  },
  {
    id: 'res_emei_sword',
    pair: ['ma_qing_emei', 'ma_act_emei_sword'],
    title: '雲嶺刺線共鳴',
    effect: '峩眉傳功成線，劍意更清',
  },
  {
    id: 'res_peach',
    pair: ['ma_heart_peach', 'ma_act_luoying'],
    title: '奇門落影共鳴',
    effect: '桃華心法餵養落影掌勢',
  },
]

function known(state: GameState, id: string): boolean {
  return (state.martialProgress[id] ?? 0) > 0
}

function equippedIds(state: GameState): Set<string> {
  const L = state.martialLoadout
  return new Set(
    [L.internalId, L.heartId, L.qinggongId, ...L.activeIds].filter(
      (x): x is string => Boolean(x),
    ),
  )
}

export type ResonanceStatus = MartialResonanceDef & {
  knownBoth: boolean
  equippedBoth: boolean
  partnerName: string
  line: string
}

export function resonancesForArt(
  state: GameState,
  artId: string,
): ResonanceStatus[] {
  const eq = equippedIds(state)
  return MARTIAL_RESONANCES.filter((r) => r.pair.includes(artId)).map((r) => {
    const partnerId = r.pair[0] === artId ? r.pair[1] : r.pair[0]
    const partnerName = getMartialById(partnerId)?.name ?? partnerId
    const knownBoth = known(state, r.pair[0]) && known(state, r.pair[1])
    const equippedBoth = eq.has(r.pair[0]) && eq.has(r.pair[1])
    const line = knownBoth
      ? equippedBoth
        ? `共鳴啟動：${r.title}——${r.effect}`
        : `可共鳴：與「${partnerName}」同配→${r.effect}`
      : `共鳴線索：搭配「${partnerName}」→${r.effect}`
    return { ...r, knownBoth, equippedBoth, partnerName, line }
  })
}

export function activeEquippedResonances(state: GameState): ResonanceStatus[] {
  const eq = equippedIds(state)
  return MARTIAL_RESONANCES.filter(
    (r) => eq.has(r.pair[0]) && eq.has(r.pair[1]),
  ).map((r) => ({
    ...r,
    knownBoth: true,
    equippedBoth: true,
    partnerName: getMartialById(r.pair[1])?.name ?? r.pair[1],
    line: `共鳴啟動：${r.title}——${r.effect}`,
  }))
}

/** 已啟動共鳴的微小面板加值（每對 +2 攻防，最多兩對） */
export function resonancePanelBonus(state: GameState): {
  atk: number
  def: number
} {
  const n = Math.min(2, activeEquippedResonances(state).length)
  return { atk: n * 2, def: n * 2 }
}
