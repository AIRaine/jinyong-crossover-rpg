import type { MartialArtDef, MartialKind } from '../types/game'

export const MARTIAL_KIND_LABEL: Record<MartialKind, string> = {
  internal: '主內功',
  heart: '輔心法',
  qinggong: '輕功',
  active: '主動招式',
}

/**
 * ≥40 門諧音武學。
 * 數值刻意壓低每級成長，避免與裝備疊加後戰力膨脹（面板另有 softCap）。
 */
export const MARTIAL_ARTS: MartialArtDef[] = [
  // —— 主內功（10）——
  {
    id: 'ma_jiuyin',
    name: '《久隱心經》',
    kind: 'internal',
    description: '以深長呼吸為骨，現代循環知識為輔，內息綿長。',
    maxInternalPerLevel: 3,
    defensePerLevel: 1,
  },
  {
    id: 'ma_jiuyang',
    name: '《久陽真息》',
    kind: 'internal',
    description: '陽和之氣護體，傷勢癒合略快。',
    maxInternalPerLevel: 3,
    maxHpPerLevel: 2,
  },
  {
    id: 'ma_wudang_taiji',
    name: '武鐺太極勁',
    kind: 'internal',
    description: '圓轉化力，後發而先至。',
    maxInternalPerLevel: 2,
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
    id: 'ma_shaolin_xisui',
    name: '少凜洗髓訣',
    kind: 'internal',
    description: '清濁並行，根骨微調。',
    maxInternalPerLevel: 2,
    maxStaminaPerLevel: 1,
  },
  {
    id: 'ma_mingjiao_fire',
    name: '明皎聖火功',
    kind: 'internal',
    description: '內息如焰，攻守轉換迅猛。',
    attackPerLevel: 1,
    maxInternalPerLevel: 2,
  },
  {
    id: 'ma_gumupo_jade',
    name: '古暮玉女心經',
    kind: 'internal',
    description: '寒意護體，雙人合練時效益倍增（雙修預留）。',
    maxInternalPerLevel: 3,
    defensePerLevel: 1,
  },
  {
    id: 'ma_beiming',
    name: '北溟納息',
    kind: 'internal',
    description: '吸納遊散內息為己用——你管這叫「資源回收」。',
    maxInternalPerLevel: 4,
  },
  {
    id: 'ma_hua_gong',
    name: '化功小解',
    kind: 'internal',
    description: '短暫滯對手內息。效果有限，防膨脹刻意弱化。',
    defensePerLevel: 1,
    maxInternalPerLevel: 2,
  },
  {
    id: 'ma_kuiying',
    name: '《葵影殘冊》節錄',
    kind: 'internal',
    description: '殘頁而已，完整心法不可得。略提攻速感。',
    attackPerLevel: 1,
    maxInternalPerLevel: 1,
  },
  // —— 輔心法（10）——
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
  {
    id: 'ma_heart_emei',
    name: '峩眉靜念',
    kind: 'heart',
    description: '滅訣師太要求的晨課簡化版。',
    defensePerLevel: 1,
    maxHpPerLevel: 1,
  },
  {
    id: 'ma_heart_yue',
    name: '君子劍心（僞）',
    kind: 'heart',
    description: '嶽不群公開傳授的「端正心法」。數值中庸，味道微妙。',
    attackPerLevel: 1,
    defensePerLevel: 1,
  },
  {
    id: 'ma_heart_zhao',
    name: '契約齒心法',
    kind: 'heart',
    description: '兆敏教你：條款要有牙齒。戰鬥中化為冷靜加成。',
    defensePerLevel: 1,
    maxInternalPerLevel: 1,
  },
  {
    id: 'ma_heart_azhu',
    name: '易容觀心',
    kind: 'heart',
    description: '阿硃一系：先看人心，再換面孔。',
    maxStaminaPerLevel: 1,
    defensePerLevel: 1,
  },
  {
    id: 'ma_heart_xuzhu',
    name: '糊塗禪心',
    kind: 'heart',
    description: '想太多就輸了。意外地提升耐力。',
    maxHpPerLevel: 1,
    maxStaminaPerLevel: 1,
  },
  // —— 輕功（10）——
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
  {
    id: 'ma_qing_lingbo',
    name: '凌波微塵步',
    kind: 'qinggong',
    description: '緞語招牌：步位亂、對手更亂。',
    maxStaminaPerLevel: 2,
    defensePerLevel: 1,
  },
  {
    id: 'ma_qing_icefire',
    name: '冰火踏雪',
    kind: 'qinggong',
    description: '極北島影練出的耐寒步法。',
    maxStaminaPerLevel: 2,
    maxHpPerLevel: 1,
  },
  {
    id: 'ma_qing_yanmen',
    name: '關外疾行',
    kind: 'qinggong',
    description: '雁門風砂裡練出的長途步幅。',
    maxStaminaPerLevel: 3,
  },
  {
    id: 'ma_qing_emei',
    name: '雲嶺雀落',
    kind: 'qinggong',
    description: '峩眉山道專用，落點精準。',
    maxStaminaPerLevel: 2,
    attackPerLevel: 1,
  },
  {
    id: 'ma_qing_wharf',
    name: '跳幫步',
    kind: 'qinggong',
    description: '碼頭搶船用的三步節奏。魏曉寶宣稱自己發明。',
    maxStaminaPerLevel: 2,
  },
  // —— 主動招式（12）——
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
  {
    id: 'ma_act_liumei',
    name: '六脈指意',
    kind: 'active',
    description: '指風如脈，點到穴位。緞語不一定記得全。',
    attackPerLevel: 2,
    maxInternalPerLevel: 1,
  },
  {
    id: 'ma_act_taiji_sword',
    name: '武鐺綿劍',
    kind: 'active',
    description: '以慢打快，以圓化直。',
    attackPerLevel: 1,
    defensePerLevel: 2,
  },
  {
    id: 'ma_act_xuantie',
    name: '沉劍橫掃',
    kind: 'active',
    description: '玄鐵沉劍的力量型一擊，耗體力。',
    attackPerLevel: 3,
  },
  {
    id: 'ma_act_emei_sword',
    name: '峩眉刺線劍',
    kind: 'active',
    description: '劍光如線，專破破綻。',
    attackPerLevel: 2,
    defensePerLevel: 1,
  },
  {
    id: 'ma_qing_snow',
    name: '雪蒼折梅步',
    kind: 'qinggong',
    description: '踏雪無聲，轉折如梅枝——適合嶺上與關道。',
    defensePerLevel: 1,
  },
  {
    id: 'ma_heart_liancheng',
    name: '連城心記',
    kind: 'heart',
    description: '記圖、記坑、記人。貪念一起便自亂節奏。',
    defensePerLevel: 2,
  },
  {
    id: 'ma_act_blood_sword',
    name: '碧血殘鋒',
    kind: 'active',
    description: '收勢重於出招；刃意內斂，先問後斬。',
    attackPerLevel: 2,
    defensePerLevel: 1,
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
