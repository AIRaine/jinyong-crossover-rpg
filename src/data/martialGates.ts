/**
 * 武學前置鏈與互斥（與 MARTIAL_ARTS 分離，便於調參）。
 * 學會 A 可能鎖 B；需先學甲才開乙。
 */
export type MartialGateDef = {
  /** 全部學會後才可學 */
  requires?: string[]
  /** 與下列任一同在則不可新學（已學會的保留但不建議同配） */
  exclusiveWith?: string[]
  /** 必須隸屬此門派才可學（叛出後不可再學／再練升） */
  sectRequired?: string
  /** 必須隸屬此聯盟門派 */
  allianceRequired?: 'orthodox' | 'heretic' | 'tomb' | 'neutral' | 'island'
  /** 簡短提示（UI） */
  hint: string
}

export const MARTIAL_GATES: Record<string, MartialGateDef> = {
  // —— 少凜鏈 ——
  ma_shaolin_xisui: {
    requires: ['ma_shaolin_yi'],
    exclusiveWith: ['ma_mingjiao_fire', 'ma_kuiying'],
    allianceRequired: 'orthodox',
    hint: '需先學少凜易筋法；與聖火／葵影互斥',
  },
  ma_act_dragon: {
    requires: ['ma_shaolin_yi', 'ma_shaolin_xisui'],
    sectRequired: 'sect_shaolin',
    hint: '少凜晉升傳功：易筋→洗髓→降朧掌',
  },
  // —— 武鐺鏈 ——
  ma_act_taiji_sword: {
    requires: ['ma_wudang_taiji'],
    allianceRequired: 'orthodox',
    hint: '需先學武鐺太極勁',
  },
  // —— 華嶠鏈 ——
  ma_act_lonely: {
    requires: ['ma_qing_huashan'],
    sectRequired: 'sect_huashan',
    exclusiveWith: ['ma_act_needle'],
    hint: '華嶠專傳；與繡花針雨互斥',
  },
  ma_heart_yue: {
    requires: ['ma_qing_huashan'],
    exclusiveWith: ['ma_kuiying', 'ma_heart_zhao'],
    hint: '與葵影／契約齒心法互斥（正邪難兩全）',
  },
  // —— 明皎／久陽鏈 ——
  ma_jiuyang: {
    requires: ['ma_mingjiao_fire'],
    exclusiveWith: ['ma_jiuyin', 'ma_gumupo_jade'],
    allianceRequired: 'heretic',
    hint: '聖火為基；與久隱／古暮玉女互斥',
  },
  ma_qing_icefire: {
    requires: ['ma_mingjiao_fire', 'ma_jiuyang'],
    sectRequired: 'sect_mingjiao',
    hint: '明皎高階：聖火→久陽→冰火踏雪',
  },
  // —— 古暮鏈 ——
  ma_qing_tomb: {
    requires: ['ma_gumupo_jade'],
    allianceRequired: 'tomb',
    exclusiveWith: ['ma_mingjiao_fire'],
    hint: '古暮路徑；與聖火互斥',
  },
  ma_act_xuantie: {
    requires: ['ma_gumupo_jade', 'ma_qing_tomb'],
    sectRequired: 'sect_gumupo',
    hint: '古暮傳功終式',
  },
  // —— 日月／葵影鏈 ——
  ma_act_needle: {
    requires: ['ma_kuiying'],
    exclusiveWith: ['ma_act_lonely', 'ma_act_emei_sword'],
    allianceRequired: 'heretic',
    hint: '葵影為基；與獨孤劍意／峩眉刺線互斥',
  },
  ma_heart_zhao: {
    requires: ['ma_kuiying'],
    exclusiveWith: ['ma_heart_yue'],
    hint: '與君子劍心互斥',
  },
  // —— 峩眉鏈 ——
  ma_qing_emei: {
    requires: ['ma_heart_emei'],
    allianceRequired: 'orthodox',
    hint: '需先學峩眉靜念',
  },
  ma_act_emei_sword: {
    requires: ['ma_heart_emei', 'ma_qing_emei'],
    sectRequired: 'sect_emei',
    exclusiveWith: ['ma_act_needle'],
    hint: '峩眉傳功；與針雨互斥',
  },
  // —— 桃華鏈 ——
  ma_act_luoying: {
    // 開局可能已贈落影掌；此前置僅約束「尚未學會時」的主動學習
    requires: ['ma_heart_peach'],
    hint: '新學需先有桃華奇門心法（開局已贈者可續練）',
  },
  // —— 理念互斥 ——
  ma_jiuyin: {
    exclusiveWith: ['ma_jiuyang'],
    hint: '久隱與久陽不可兼修',
  },
  ma_mingjiao_fire: {
    exclusiveWith: ['ma_gumupo_jade', 'ma_shaolin_xisui'],
    hint: '聖火與古暮玉女／洗髓互斥',
  },
  ma_gumupo_jade: {
    exclusiveWith: ['ma_mingjiao_fire', 'ma_jiuyang'],
    hint: '古暮與明皎火系互斥',
  },
  ma_beiming: {
    exclusiveWith: ['ma_hua_gong'],
    hint: '北溟納息與化功小解互斥',
  },
  ma_hua_gong: {
    exclusiveWith: ['ma_beiming'],
    hint: '化功與北溟互斥',
  },
  ma_kuiying: {
    exclusiveWith: ['ma_heart_yue', 'ma_shaolin_xisui'],
    hint: '葵影與君子劍心／洗髓互斥',
  },
  // —— 丐幇 ——
  ma_heart_wine: {
    requires: ['ma_act_dog'],
    hint: '先學打狗棒法再通酒意',
  },
  ma_act_xiangyang: {
    requires: ['ma_act_dog', 'ma_heart_wine'],
    sectRequired: 'sect_beggar',
    hint: '丐幇高階守城槍',
  },
}

export function getMartialGate(id: string): MartialGateDef | undefined {
  return MARTIAL_GATES[id]
}
