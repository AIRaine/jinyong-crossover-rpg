import type { MartialArtDef, MartialKind } from '../types/game'

export const MARTIAL_KIND_LABEL: Record<MartialKind, string> = {
  internal: '主內功',
  heart: '輔心法',
  qinggong: '輕功',
  active: '主動招式',
}

/** 至少 20 門諧音武學 */
export const MARTIAL_ARTS: MartialArtDef[] = [
  // 主內功
  {
    id: 'ma_jiuyin',
    name: '《久隱心經》',
    kind: 'internal',
    description: '以深長呼吸為骨，現代循環知識為輔，內息綿長。',
    maxInternalPerLevel: 4,
    defensePerLevel: 1,
  },
  {
    id: 'ma_wudang_taiji',
    name: '武鐺太極勁',
    kind: 'internal',
    description: '圓轉化力，後發而先至。',
    maxInternalPerLevel: 3,
    defensePerLevel: 2,
  },
  {
    id: 'ma_shaolin_yi',
    name: '少凜易筋法',
    kind: 'internal',
    description: '筋骨並煉，氣血厚實。',
    maxHpPerLevel: 3,
    maxInternalPerLevel: 2,
  },
  {
    id: 'ma_mingjiao_fire',
    name: '明皎聖火功',
    kind: 'internal',
    description: '內息如焰，攻守轉換迅猛。',
    attackPerLevel: 1,
    maxInternalPerLevel: 3,
  },
  {
    id: 'ma_gumupo_jade',
    name: '古暮玉女心經',
    kind: 'internal',
    description: '寒意護體，雙人合練時效益倍增（雙修預留）。',
    maxInternalPerLevel: 4,
    defensePerLevel: 1,
  },
  // 輔心法
  {
    id: 'ma_heart_calm',
    name: '靜心觀息訣',
    kind: 'heart',
    description: '鎮定心神，降低修練失敗時的走火風險。',
    defensePerLevel: 1,
    maxInternalPerLevel: 1,
  },
  {
    id: 'ma_heart_poison',
    name: '百草識毒心法',
    kind: 'heart',
    description: '辨藥識毒，塗毒與煉丹更穩。',
    maxInternalPerLevel: 2,
  },
  {
    id: 'ma_heart_tianji',
    name: '天機推演心法',
    kind: 'heart',
    description: '以現代專案思維推演對手破綻。',
    attackPerLevel: 1,
    maxInternalPerLevel: 1,
  },
  {
    id: 'ma_heart_wine',
    name: '酒意通玄心法',
    kind: 'heart',
    description: '凌狐沖一系：醉裡藏清醒，輸出波動大。',
    attackPerLevel: 2,
  },
  {
    id: 'ma_heart_peach',
    name: '桃華奇門心法',
    kind: 'heart',
    description: '奇門方位與烹飪火候互通，輔佐效果佳。',
    defensePerLevel: 1,
    maxStaminaPerLevel: 1,
  },
  // 輕功
  {
    id: 'ma_qing_cloud',
    name: '踏雲步',
    kind: 'qinggong',
    description: '步法輕靈，旅行略省精力。',
    maxStaminaPerLevel: 2,
  },
  {
    id: 'ma_qing_swallow',
    name: '燕迴身',
    kind: 'qinggong',
    description: '轉身如燕，閃避窗口擴大。',
    maxStaminaPerLevel: 1,
    defensePerLevel: 1,
  },
  {
    id: 'ma_qing_wave',
    name: '踏浪訣',
    kind: 'qinggong',
    description: '碼頭與水鄉地形更穩。',
    maxStaminaPerLevel: 2,
    attackPerLevel: 0,
  },
  {
    id: 'ma_qing_tomb',
    name: '墓影穿梭',
    kind: 'qinggong',
    description: '古暮派潛行步法，狹窄處如入無人之境。',
    maxStaminaPerLevel: 1,
    attackPerLevel: 1,
  },
  {
    id: 'ma_qing_huashan',
    name: '華嶠猿躍',
    kind: 'qinggong',
    description: '專為峭壁設計的縱躍節奏。',
    maxStaminaPerLevel: 3,
  },
  // 主動招式
  {
    id: 'ma_act_luoying',
    name: '落影神劍掌',
    kind: 'active',
    description: '掌影如落英，連綿不絕。',
    attackPerLevel: 2,
  },
  {
    id: 'ma_act_dog',
    name: '打狗棒法十八路',
    kind: 'active',
    description: '丐幇鎮舵絕技，控場強於爆發。',
    attackPerLevel: 1,
    defensePerLevel: 1,
  },
  {
    id: 'ma_act_lonely',
    name: '獨孤九劍意',
    kind: 'active',
    description: '無招勝有招——你用現代語言叫做「動態規劃破綻」。',
    attackPerLevel: 3,
  },
  {
    id: 'ma_act_dragon',
    name: '降朧十八掌',
    kind: 'active',
    description: '橋峰一系剛猛掌力，正面硬撼。',
    attackPerLevel: 2,
    maxHpPerLevel: 1,
  },
  {
    id: 'ma_act_needle',
    name: '繡花針雨',
    kind: 'active',
    description: '東芳不敗暗器雨，適合塗毒後使用。',
    attackPerLevel: 2,
  },
  {
    id: 'ma_act_flashlight',
    name: '妖光乍現',
    kind: 'active',
    description: '穿越者專屬：手電筒強光戰術招式化。',
    attackPerLevel: 1,
    maxStaminaPerLevel: 1,
  },
  {
    id: 'ma_act_first_aid',
    name: '戰場清創手',
    kind: 'active',
    description: '急診醫師思維：先救命再出力，戰中回復預留。',
    defensePerLevel: 1,
    maxHpPerLevel: 2,
  },
  {
    id: 'ma_act_xiangyang',
    name: '襄揚守城槍',
    kind: 'active',
    description: '邊城槍陣簡化版，穩守反擊。',
    attackPerLevel: 1,
    defensePerLevel: 2,
  },
]

export function getMartialById(id: string): MartialArtDef | undefined {
  return MARTIAL_ARTS.find((m) => m.id === id)
}

export function getMartialsByKind(kind: MartialKind): MartialArtDef[] {
  return MARTIAL_ARTS.filter((m) => m.kind === kind)
}

/** 修練消耗潛能（普通層） */
export function trainPotentialCost(level: number): number {
  return 2 + level
}

/** 瓶頸層（即將升到 5 或 10）成功率：悟性＋根骨影響 */
export function bottleneckSuccessChance(
  comprehension: number,
  rootBone: number,
  targetLevel: number,
): number {
  const base = targetLevel === 10 ? 0.35 : 0.55
  const bonus = (comprehension + rootBone) / 200
  return Math.min(0.92, Math.max(0.15, base + bonus))
}
