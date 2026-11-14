import type { LocationDef } from '../types/game'

/**
 * 階段二可連通地圖切片：4 主城＋門派／秘境／路點，共 12 處。
 * 鄰接雙向於資料中對稱維護。
 */
export const LOCATIONS: LocationDef[] = [
  {
    id: 'loc_broken_temple',
    name: '雨夜破廟',
    kind: 'road',
    region: '襄揚外圍',
    description: '漏雨的山神破廟。你穿越落地之處，也是序章結束後仍可回望的坐標。',
    links: ['loc_xiangyang', 'loc_luoyang_post'],
    travelStamina: 4,
    npcIds: [],
    gather: 'herb',
  },
  {
    id: 'loc_xiangyang',
    name: '襄揚城',
    kind: 'city',
    region: '中原邊城',
    description: '烽煙與市井並存的邊城。牆頭望得見塵土，城內聽得見説書與鐵砧。',
    links: [
      'loc_broken_temple',
      'loc_luoyang_post',
      'loc_beggar_hall',
      'loc_shaolin',
      'loc_east_wharf',
    ],
    travelStamina: 6,
    npcIds: ['npc_huang_rong', 'npc_guo_jing', 'npc_bai_xiaosheng'],
    gather: 'none',
  },
  {
    id: 'loc_luoyang_post',
    name: '洛邑驛',
    kind: 'city',
    region: '中原腹地',
    description: '驛道交會的大站，客商雲集。消息比銀兩流得更快。',
    links: ['loc_broken_temple', 'loc_xiangyang', 'loc_suhang', 'loc_wudang'],
    travelStamina: 7,
    npcIds: ['npc_wei_xiaobao', 'npc_wang_yuyan'],
    gather: 'none',
  },
  {
    id: 'loc_suhang',
    name: '蘇杭津',
    kind: 'city',
    region: '江南水鄉',
    description: '河網如織，茶樓與畫舫相望。適合打聽風流韻事與門派八卦。',
    links: ['loc_luoyang_post', 'loc_huashan', 'loc_east_wharf', 'loc_dali'],
    travelStamina: 8,
    npcIds: ['npc_linghu_chong', 'npc_ren_yingying'],
    gather: 'herb',
  },
  {
    id: 'loc_dali',
    name: '大裡城',
    kind: 'city',
    region: '西南邊陲',
    description: '風物殊異的邊城，藥市與佛寺並立。遠客至此，口音先軟三分。',
    links: ['loc_suhang', 'loc_east_wharf', 'loc_dead_tomb'],
    travelStamina: 9,
    npcIds: ['npc_wang_yuyan', 'npc_duan_yu'],
    gather: 'herb',
  },
  {
    id: 'loc_shaolin',
    name: '少凜寺',
    kind: 'sect',
    region: '嵩高一帶',
    description: '鐘聲悠遠，戒律森嚴。外來者須在山門說明來意。',
    links: ['loc_xiangyang', 'loc_wudang'],
    travelStamina: 8,
    npcIds: ['npc_qiao_feng'],
    gather: 'ore',
  },
  {
    id: 'loc_wudang',
    name: '武鐺派',
    kind: 'sect',
    region: '楚地群山',
    description: '雲海環峰，太極圓轉。山道陡峭，適合檢驗你的負重行進。',
    links: ['loc_luoyang_post', 'loc_shaolin', 'loc_xuanmu'],
    travelStamina: 9,
    npcIds: ['npc_zhang_wuji'],
    gather: 'ore',
  },
  {
    id: 'loc_huashan',
    name: '華嶠派',
    kind: 'sect',
    region: '西嶽',
    description: '削壁千仞，論劍臺風聲如嘯。登頂本身就是一場試煉。',
    links: ['loc_suhang', 'loc_xuanmu'],
    travelStamina: 10,
    npcIds: ['npc_linghu_chong', 'npc_dongfang_bubai'],
    gather: 'ore',
  },
  {
    id: 'loc_beggar_hall',
    name: '丐幇分舵',
    kind: 'sect',
    region: '襄揚城南',
    description: '破棚連營，卻消息靈通。打狗棒法的影子在巷弄裡晃。',
    links: ['loc_xiangyang'],
    travelStamina: 3,
    npcIds: ['npc_huang_rong', 'npc_qiao_feng'],
    gather: 'none',
  },
  {
    id: 'loc_dead_tomb',
    name: '活死人暮',
    kind: 'secret',
    region: '終南餘脈',
    description: '墓門深鎖，古暮派傳承隱於其間。寒氣沁骨，不宜久留。',
    links: ['loc_dali', 'loc_east_wharf'],
    travelStamina: 10,
    npcIds: ['npc_xiaolongnu', 'npc_yang_guo'],
    gather: 'herb',
  },
  {
    id: 'loc_xuanmu',
    name: '玄木崖',
    kind: 'secret',
    region: '黑林峻嶺',
    description: '崖寨舊址，日月教餘勢未散。夜裡風過，像有人低聲練劍。',
    links: ['loc_huashan', 'loc_wudang'],
    travelStamina: 9,
    npcIds: ['npc_dongfang_bubai', 'npc_ren_yingying', 'npc_zhao_min'],
    gather: 'ore',
  },
  {
    id: 'loc_east_wharf',
    name: '東海碼頭',
    kind: 'road',
    region: '東海沿岸',
    description: '通往桃華島方向的跳板。潮起潮落，船老大只認銀兩與氣數。',
    links: ['loc_xiangyang', 'loc_suhang', 'loc_dali', 'loc_dead_tomb'],
    travelStamina: 7,
    npcIds: ['npc_huang_rong', 'npc_wei_xiaobao', 'npc_zhang_wuji'],
    gather: 'both',
  },
]

export function getLocationById(id: string): LocationDef | undefined {
  return LOCATIONS.find((l) => l.id === id)
}

export function getLinkedLocations(fromId: string): LocationDef[] {
  const from = getLocationById(fromId)
  if (!from) return []
  return from.links
    .map((id) => getLocationById(id))
    .filter((l): l is LocationDef => Boolean(l))
}

export const LOCATION_KIND_LABEL: Record<LocationDef['kind'], string> = {
  city: '主城',
  sect: '門派',
  secret: '秘境',
  road: '路點',
}
