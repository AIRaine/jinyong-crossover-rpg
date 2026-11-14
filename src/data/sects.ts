import type { SectDef } from '../types/game'

export const SECT_RANK_LABELS = ['未入門', '外門弟子', '內門弟子', '執事前', '長老'] as const

/** 6～8 個諧音門派 */
export const SECTS: SectDef[] = [
  {
    id: 'sect_shaolin',
    name: '少凜寺',
    motto: '禪武雙修，戒急用忍。',
    homeLocationId: 'loc_shaolin',
    description: '嵩高鐘聲遠，棍拳皆可入道。入門需心靜，貢獻以護寺為先。',
    entry: {
      minLevel: 1,
      minSilver: 30,
      description: '銀兩 30、等級 1，並曾踏足少凜寺。',
    },
    rankThresholds: [0, 40, 100, 220],
  },
  {
    id: 'sect_wudang',
    name: '武鐺派',
    motto: '以柔克剛，後發先至。',
    homeLocationId: 'loc_wudang',
    description: '雲海環峰，太極圓轉。適合重內息與身法的穿越客。',
    entry: {
      minLevel: 1,
      minSilver: 40,
      description: '銀兩 40，並曾登武鐺。',
    },
    rankThresholds: [0, 45, 110, 240],
  },
  {
    id: 'sect_huashan',
    name: '華嶠派',
    motto: '劍在人在，論劍峯巔。',
    homeLocationId: 'loc_huashan',
    description: '西嶽削壁，劍氣如嘯。入門看膽色與腳力。',
    entry: {
      minLevel: 2,
      minSilver: 50,
      description: '等級 2、銀兩 50，並曾攀華嶠。',
    },
    rankThresholds: [0, 50, 120, 260],
  },
  {
    id: 'sect_beggar',
    name: '丐幇',
    motto: '信息換酒肉，棒法護同門。',
    homeLocationId: 'loc_beggar_hall',
    description: '襄揚城南分舵，消息靈通。入門門檻低，貢獻靠跑腿與義氣。',
    entry: {
      minLevel: 1,
      minSilver: 10,
      description: '銀兩 10 即可叩門。',
    },
    rankThresholds: [0, 30, 90, 200],
  },
  {
    id: 'sect_mingjiao',
    name: '明皎教',
    motto: '聖火不滅，同行莫問出身。',
    homeLocationId: 'loc_wudang',
    description: '教義爭議大，卻重情義。入門需證明不是官府細作——交點銀兩意思意思。',
    entry: {
      minLevel: 2,
      minSilver: 60,
      description: '等級 2、銀兩 60。',
    },
    rankThresholds: [0, 55, 130, 280],
  },
  {
    id: 'sect_gumupo',
    name: '古暮派',
    motto: '墓門一閉，紅塵兩斷。',
    homeLocationId: 'loc_dead_tomb',
    description: '活死人暮傳承。入門極挑人，需高悟性（遊戲內以靈感／悟性近似）。',
    entry: {
      minLevel: 2,
      minSilver: 40,
      minComprehension: 45,
      description: '等級 2、悟性 ≥ 45、銀兩 40，並曾入活死人暮。',
    },
    rankThresholds: [0, 60, 140, 300],
  },
  {
    id: 'sect_riyue',
    name: '日月教',
    motto: '崖上風急，心中月明。',
    homeLocationId: 'loc_xuanmu',
    description: '玄木崖餘勢。入門看膽識，貢獻靠辦差與守秘。',
    entry: {
      minLevel: 2,
      minSilver: 55,
      description: '等級 2、銀兩 55，並曾至玄木崖。',
    },
    rankThresholds: [0, 50, 125, 270],
  },
  {
    id: 'sect_emei',
    name: '峩眉派',
    motto: '柔中帶剛，劍氣如虹。',
    homeLocationId: 'loc_suhang',
    description: '江南有分院聯絡點。入門重規矩，貢獻以護道濟弱為主。',
    entry: {
      minLevel: 1,
      minSilver: 35,
      description: '銀兩 35，並曾至蘇杭津。',
    },
    rankThresholds: [0, 40, 105, 230],
  },
]

export function getSectById(id: string): SectDef | undefined {
  return SECTS.find((s) => s.id === id)
}

export function sectRankFromContribution(
  sect: SectDef,
  contribution: number,
): number {
  let rank = 0
  for (let i = 0; i < sect.rankThresholds.length; i++) {
    if (contribution >= sect.rankThresholds[i]) rank = i + 1
  }
  return Math.min(rank, SECT_RANK_LABELS.length - 1)
}
