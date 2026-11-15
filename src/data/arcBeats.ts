/**
 * 階段 B：各故事弧加長／新建節拍（≥3 拍／弧）
 * 僅使用諧音代稱；library 對照勿進 UI。
 */
import type { StoryEventDef } from '../types/game'

/** 弧節拍事件池（不含舊五年主線；舊線仍在 MAIN_STORY_EVENTS） */
export const ARC_BEAT_EVENTS: StoryEventDef[] = [
  // —— 射鵰線加深 ——
  {
    id: 'arc_shediao_2',
    year: 0,
    title: '邊城・桃華請柬',
    summary: '白鵰銜來一紙短箋：島主要見「會用妖光的那位」。',
    locationId: 'loc_peach_island',
    paragraphs: [
      '桃華島潮聲比城市白噪音還規律。皇藥師撫琴不看你：「現代人，先別踩花。」',
      '皇容在側偷笑：「爹這是面試。過了有桃華酥，不過——可能被趕去餵鳥。」',
      '你打開手機備忘錄，寫下三條：勿踩花、勿談 KPI、勿說「這琴能做 ASMR」。',
    ],
    choices: [
      {
        id: 'sd2_qin',
        label: '以現代樂理試譯琴意',
        hint: '靈感｜好感',
        outcomeText:
          '你比劃節拍與調式，皇藥師停弦片刻：「勉強能聽。」島上多了一位不被立刻踢下海的訪客。',
        rewards: {
          inspiration: 6,
          potential: 4,
          affinity: { npc_huang_yaoshi: 12, npc_huang_rong: 8 },
          martialIds: ['ma_heart_peach'],
          flags: { arc_shediao_qin: true },
        },
      },
      {
        id: 'sd2_cook',
        label: '跟皇容學做一席桃華宴',
        hint: '銀兩↓｜好感',
        outcomeText:
          '刀工比戰鬥還累。宴席上洪柒公不知何時出現，啃完雞腿說：「小子有點慧根。」',
        rewards: {
          silver: -20,
          exp: 35,
          affinity: { npc_huang_rong: 14, npc_hong_qigong: 8 },
          flags: { arc_shediao_feast: true },
        },
      },
      {
        id: 'sd2_scout',
        label: '夜探島陣，畫出簡易地圖',
        hint: '潛能｜風險',
        outcomeText:
          '迷陣比 APP 導航還不講理。你總算標出三處「會把人轉暈」的拐點，百曉笙願意高價收購。',
        rewards: {
          potential: 6,
          silver: 45,
          staminaDelta: -10,
          affinity: { npc_bai_xiaosheng: 6 },
          flags: { arc_shediao_map: true },
        },
      },
    ],
  },
  {
    id: 'arc_shediao_3',
    year: 0,
    title: '邊城・糧道終裁',
    summary: '歐楊鋒現身官道，聲言要「驗一驗」你的現代底氣。',
    locationId: 'loc_xiangyang',
    paragraphs: [
      '襄揚城外風沙再起。歐楊鋒拄杖而立，像一位來做壓力測試的外部顧問。',
      '廓靖擋在你身前：「有事衝我。」皇容拉住他袖子：「先聽條件。」',
      '你意識到這不是一場能用表情符號結束的對話。',
    ],
    choices: [
      {
        id: 'sd3_fight',
        label: '硬撼白駝奇功',
        hint: '戰鬥｜俠義',
        outcomeText:
          '杖風如刮骨。你靠隊友頂住，總算逼得對方收招：「還行——下次別用手電筒晃眼。」',
        rewards: {
          exp: 55,
          potential: 6,
          affinity: { npc_guo_jing: 10, npc_ouyang_feng: 4 },
          martialIds: ['ma_act_xiangyang'],
          flags: { arc_shediao_done: true },
        },
        startCombat: true,
      },
      {
        id: 'sd3_bargain',
        label: '談「互不侵糧」條款',
        hint: '契約｜銀兩',
        outcomeText:
          '你把條款寫得像服務協議。歐楊鋒看完：「無聊……但有效。」糧道暫時安靜。',
        rewards: {
          silver: 70,
          inspiration: 5,
          affinity: { npc_zhao_min: 6, npc_huang_rong: 8 },
          flags: { arc_shediao_done: true, arc_shediao_pact: true },
        },
      },
      {
        id: 'sd3_redirect',
        label: '引他去找洪柒公比酒',
        hint: '和平｜搞笑',
        outcomeText:
          '兩人喝到第三壇，歐楊鋒忘了劫糧。你默默把酒賬記在「公關費」。',
        rewards: {
          silver: -35,
          inspiration: 4,
          affinity: { npc_hong_qigong: 10, npc_ouyang_feng: 6 },
          flags: { arc_shediao_done: true },
        },
      },
    ],
  },

  // —— 神鵰線加深 ——
  {
    id: 'arc_shendiao_2',
    year: 0,
    title: '暮門・寒絲夜課',
    summary: '宵朧女允你在暮門借宿一晚，條件是「別吵」。',
    locationId: 'loc_dead_tomb',
    paragraphs: [
      '活死人暮的燈火像低電量提示。宵朧女把玉女心經口訣寫在沙上，寫完即抹。',
      '揚過在外邊練劍，玄鐵沉劍刮出的風，讓你想起伺服器風扇。',
      '你忽然懂了：這裡的安靜，是另一種高強度運作。',
    ],
    choices: [
      {
        id: 'sdm2_learn',
        label: '靜心抄錄半式',
        hint: '武學｜潛能',
        outcomeText:
          '你不敢全記，只記節奏。宵朧女點頭：「記得刪瀏覽紀錄。」——她是從哪學的比喻？',
        rewards: {
          potential: 7,
          martialIds: ['ma_gumupo_jade', 'ma_qing_tomb'],
          affinity: { npc_xiaolongnu: 12 },
          flags: { arc_shendiao_silk: true },
        },
      },
      {
        id: 'sdm2_spar',
        label: '與揚過對一招沉劍',
        hint: '戰鬥',
        outcomeText:
          '你被震得虎口發麻。揚過收劍：「還能站，就不算浪費玄鐵。」',
        rewards: {
          exp: 50,
          potential: 5,
          affinity: { npc_yang_guo: 10 },
          martialIds: ['ma_act_xuantie'],
          flags: { arc_shendiao_spar: true },
        },
        startCombat: true,
      },
      {
        id: 'sdm2_gift',
        label: '贈白玉梳，換一句指路',
        hint: '好感',
        outcomeText:
          '宵朧女接過梳子，指了指暮門東岔：「那條路少機關。別開閃光燈。」',
        rewards: {
          affinity: { npc_xiaolongnu: 14 },
          inspiration: 3,
          flags: { arc_shendiao_path: true },
        },
      },
    ],
  },
  {
    id: 'arc_shendiao_3',
    year: 0,
    title: '暮門・古暮收束',
    summary: '封石再裂，暮門要你在「守」與「傳」之間選邊。',
    locationId: 'loc_dead_tomb',
    paragraphs: [
      '裂縫裡透出冷香。有人要把古暮心法帶去市井叫賣，也有人要把裂縫重新封死。',
      '宵朧女看你：「穿越客的選擇，會變成傳聞的版本號。」',
      '揚過把劍橫在肩上，等你開票。',
    ],
    choices: [
      {
        id: 'sdm3_seal',
        label: '協助封石，守住祕辛',
        hint: '潛能｜歸隱味',
        outcomeText:
          '你用現代黏合概念胡扯一通，居然管用。暮門復靜，像把資料夾設成「僅限邀請」。',
        rewards: {
          potential: 8,
          inspiration: 5,
          affinity: { npc_xiaolongnu: 10, npc_yang_guo: 6 },
          flags: { arc_shendiao_done: true },
        },
      },
      {
        id: 'sdm3_share',
        label: '摘半式傳給可信之人',
        hint: '門派／俠義',
        outcomeText:
          '你把節奏教給廓靖與皇容各一半。揚過哼聲：「至少不是賣給行商。」',
        rewards: {
          exp: 45,
          affinity: { npc_guo_jing: 6, npc_huang_rong: 6, npc_yang_guo: 8 },
          martialIds: ['ma_heart_calm'],
          flags: { arc_shendiao_done: true, arc_shendiao_share: true },
        },
      },
      {
        id: 'sdm3_chase',
        label: '追截盜經刀客',
        hint: '戰鬥',
        outcomeText:
          '刀客在暮門外栽進自己挖的坑。你拾回殘頁，宵朧女只說：「下次別這麼大聲。」',
        rewards: {
          silver: 40,
          exp: 50,
          potential: 5,
          flags: { arc_shendiao_done: true },
        },
        startCombat: true,
      },
    ],
  },

  // —— 笑傲線第三拍 ——
  {
    id: 'arc_xiaoao_3',
    year: 0,
    title: '華嶠・思過崖回音',
    summary: '峯清揚約你上崖；壬盈盈的琴音從山下傳來。',
    locationId: 'loc_huashan',
    paragraphs: [
      '思過崖風大，適合計畫下一季的人生，不適合開視訊。',
      '峯清揚只問一句：「你的劍，是為贏，還是為活得像自己？」',
      '山下琴聲一頓，像有人在等你的回覆通知。',
    ],
    choices: [
      {
        id: 'xa3_sword',
        label: '請教獨孤九劍意半式',
        hint: '武學｜戰鬥後路',
        outcomeText:
          '峯清揚點到為止。你下山時步伐輕了半寸，凌狐沖舉酒：「喝！你終於不像在開會。」',
        rewards: {
          potential: 8,
          martialIds: ['ma_act_lonely', 'ma_qing_huashan'],
          affinity: { npc_feng_qingyang: 12, npc_linghu_chong: 8 },
          flags: { arc_xiaoao_done: true },
        },
      },
      {
        id: 'xa3_qin',
        label: '先赴琴約，再談劍',
        hint: '好感｜日月',
        outcomeText:
          '壬盈盈一曲終了：「崖上的人，也該聽人間。」你把這句寫進備忘錄置頂。',
        rewards: {
          staminaDelta: 10,
          affinity: { npc_ren_yingying: 14, npc_linghu_chong: 6 },
          martialIds: ['ma_heart_wine'],
          flags: { arc_xiaoao_done: true },
        },
      },
      {
        id: 'xa3_expose',
        label: '當面拆嶽不群的簡報造假',
        hint: '風險｜靈感',
        outcomeText:
          '你指出三處邏輯漏洞。嶽不群笑容不變，耳根卻紅了。華嶠派內部論壇今夜必爆。',
        rewards: {
          inspiration: 7,
          affinity: { npc_linghu_chong: 10, npc_yue_buqun: -6 },
          flags: { arc_xiaoao_done: true, arc_xiaoao_expose: true },
        },
      },
    ],
  },

  // —— 倚天線（新建三拍） ——
  {
    id: 'arc_yitian_1',
    year: 0,
    title: '明皎・冰火初探',
    summary: '冰火島影傳來獅吼；章無忌請你「來看看能不能別爆炸」。',
    locationId: 'loc_icefire_isle',
    paragraphs: [
      '島上一邊呵氣成霜，一邊腳下發燙，像冷熱雙修的 Bug 現場。',
      '榭遜坐在礁石上，聲音能把海鳥嚇去改行。章無忌忙著勸：「爺，先別吼簡報。」',
      '兆敏遠遠拋來一個眼神：這筆人情，她記賬。',
    ],
    choices: [
      {
        id: 'yt1_calm',
        label: '用現代急救穩定榭遜氣息',
        hint: '醫理｜好感',
        outcomeText:
          '你亂唸「緩慢呼吸＋分次發力」。榭遜居然安靜一瞬：「……還有點用。」',
        rewards: {
          inspiration: 5,
          affinity: { npc_xie_xun: 10, npc_zhang_wuji: 10 },
          martialIds: ['ma_qing_icefire'],
          flags: { arc_yitian_start: true },
        },
      },
      {
        id: 'yt1_bath',
        label: '試泡冰火溫泉（短時間）',
        hint: '氣血｜風險',
        outcomeText:
          '你進進出出像在做壓力測試。出水後內息意外順暢，也差點抽筋。',
        rewards: {
          hpDelta: -8,
          potential: 6,
          staminaDelta: 8,
          flags: { arc_yitian_start: true },
        },
      },
      {
        id: 'yt1_deal',
        label: '與兆敏談「島上臨時條款」',
        hint: '契約',
        outcomeText:
          '條款寫明：吼聲限時、訪客限額、火堆禁燃塑膠。兆敏蓋了牙印：「專業。」',
        rewards: {
          silver: 35,
          affinity: { npc_zhao_min: 12 },
          martialIds: ['ma_heart_zhao'],
          flags: { arc_yitian_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_yitian_2',
    year: 0,
    title: '明皎・聖火與戒律',
    summary: '峩眉山門與明皎使者同日抵達襄揚，空氣像兩份互斥的推播。',
    locationId: 'loc_xiangyang',
    paragraphs: [
      '週芷若持劍而立，滅訣師太的戒律牌在陽光下反光刺眼。',
      '章無忌站在中間，像被拉進兩個群組卻不能退。',
      '你嘆道：這場景，現代叫「跨部門對齊會」。',
    ],
    choices: [
      {
        id: 'yt2_mediate',
        label: '主持對談，先停刀再談理',
        hint: '靈感｜雙好感',
        outcomeText:
          '你設了發言時長與禁止人身攻擊規則。雙方嫌煩，但刀沒落下。章無忌偷偷比讚。',
        rewards: {
          inspiration: 6,
          affinity: { npc_zhang_wuji: 10, npc_zhou_zhiruo: 8, npc_mie_jue: 4 },
          flags: { arc_yitian_mid: true },
        },
      },
      {
        id: 'yt2_emei',
        label: '暫助峩眉守戒巡城',
        hint: '門派向',
        outcomeText:
          '你跟著戒律牌走了一夜。週芷若低聲：「謝謝。別告訴師太我說了謝謝。」',
        rewards: {
          exp: 40,
          affinity: { npc_zhou_zhiruo: 12, npc_mie_jue: 8 },
          martialIds: ['ma_heart_emei', 'ma_act_emei_sword'],
          flags: { arc_yitian_mid: true },
        },
      },
      {
        id: 'yt2_fire',
        label: '護送明皎聖火信物過巷',
        hint: '戰鬥風險',
        outcomeText:
          '巷戰很短，狼狽很長。信物保住，你衣服燻黑，章無忌塞你一塊糕：「補償糖分。」',
        rewards: {
          exp: 48,
          potential: 5,
          affinity: { npc_zhang_wuji: 12 },
          martialIds: ['ma_mingjiao_fire'],
          flags: { arc_yitian_mid: true },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_yitian_3',
    year: 0,
    title: '明皎・倚巔去向',
    summary: '倚巔劍與屠朧刀的傳聞同時升溫，天機閣開盤。',
    locationId: 'loc_tianji_hall',
    paragraphs: [
      '百曉笙把賠率寫在板上：「俠義盤」「契約盤」「我全都要盤」。',
      '兆敏與週芷若一左一右，章無忌在中間想裝看不見。',
      '你知道無論怎麼選，都會變成下周目的回憶殺素材。',
    ],
    choices: [
      {
        id: 'yt3_hide',
        label: '主張封存兵刃，延後爭端',
        hint: '歸隱味｜潛能',
        outcomeText:
          '你把「冷卻期」概念講給各派。百曉笙抱怨盤口難做，但城內刀光少了三日。',
        rewards: {
          potential: 7,
          inspiration: 4,
          affinity: { npc_zhang_wuji: 8, npc_bai_xiaosheng: 4 },
          flags: { arc_yitian_done: true },
        },
      },
      {
        id: 'yt3_zhao',
        label: '促成公開競價與用途限制',
        hint: '契約',
        outcomeText:
          '用途條款寫進公證：禁私刑、禁血祭、禁直播處刑。兆敏滿意，週芷若沉默後點頭。',
        rewards: {
          silver: 80,
          affinity: { npc_zhao_min: 12, npc_zhou_zhiruo: 8 },
          flags: { arc_yitian_done: true, arc_yitian_auction: true },
        },
      },
      {
        id: 'yt3_spar',
        label: '以切磋決定暫時保管權',
        hint: '戰鬥',
        outcomeText:
          '擂台塵起又落。保管權暫歸中立的天機閣——百曉笙樂壞了，你累壞了。',
        rewards: {
          exp: 60,
          potential: 6,
          affinity: { npc_bai_xiaosheng: 8 },
          flags: { arc_yitian_done: true },
        },
        startCombat: true,
      },
    ],
  },

  // —— 天龍線（新建） ——
  {
    id: 'arc_tianlong_1',
    year: 0,
    title: '天龍・大裡迷路局',
    summary: '緞語又迷路了；望語嫣請你「順便」把人帶回來。',
    locationId: 'loc_dali',
    paragraphs: [
      '大裡城巷弄像沒更新的地圖 APP。緞語笑稱自己在「隨機探索」。',
      '望語嫣合上書：「他若再把北溟口訣念成點餐，我就不認帳。」',
      '虛築在寺門外發呆，像在等一個他也不知道的通知。',
    ],
    choices: [
      {
        id: 'tl1_guide',
        label: '當導遊，收一點「找路費」',
        hint: '銀兩｜好感',
        outcomeText:
          '你用路標與太陽方位把他帶回書樓。望語嫣給你茶，緞語給你一個桃華酥（來路不明）。',
        rewards: {
          silver: 30,
          affinity: { npc_duan_yu: 10, npc_wang_yuyan: 10 },
          flags: { arc_tianlong_start: true },
        },
      },
      {
        id: 'tl1_book',
        label: '向望語嫣請教武學對照表',
        hint: '靈感｜武學',
        outcomeText:
          '她翻書如搜尋引擎。你記下三式「看起來會用到」的要點，腦中像多開了分頁。',
        rewards: {
          inspiration: 7,
          martialIds: ['ma_act_liumei', 'ma_qing_lingbo'],
          affinity: { npc_wang_yuyan: 12 },
          flags: { arc_tianlong_start: true },
        },
      },
      {
        id: 'tl1_zen',
        label: '跟虛築坐半日糊塗禪',
        hint: '精力｜心法',
        outcomeText:
          '你什麼也沒想明白，卻睡得很好。虛築：「有時候，當機也是一種修養。」',
        rewards: {
          staminaDelta: 15,
          martialIds: ['ma_heart_xuzhu'],
          affinity: { npc_xu_zhu: 12 },
          flags: { arc_tianlong_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_tianlong_2',
    year: 0,
    title: '天龍・靈鷲雲約',
    summary: '靈鷲峯來信：虛築被請去「喝茶」，你也被點名。',
    locationId: 'loc_lingjiu',
    paragraphs: [
      '雲層薄處，峯頂亭台像漂浮的會議室。',
      '虛築抓耳：「我只是來錯地方……結果變成主人？」',
      '暮容復在側遞上復國簡報，你下意識想按「稍後提醒」。',
    ],
    choices: [
      {
        id: 'tl2_tea',
        label: '赴雲席，聽虛築胡言卻真心',
        hint: '好感｜身法',
        outcomeText:
          '茶是好茶，話是糊塗話。你離峯時步伐更穩，像被雲托了一把。',
        rewards: {
          potential: 6,
          martialIds: ['ma_qing_cloud'],
          affinity: { npc_xu_zhu: 12, npc_azhu: 6 },
          flags: { arc_tianlong_mid: true },
        },
      },
      {
        id: 'tl2_kpi',
        label: '幫暮容復重寫「可執行」簡報',
        hint: '靈感｜吐槽',
        outcomeText:
          '你把宏願拆成三個季度目標。暮容復眼睛發亮，阿硃在背後對你比口型：謝謝。',
        rewards: {
          inspiration: 6,
          silver: 40,
          affinity: { npc_murong_fu: 8, npc_azhu: 10 },
          martialIds: ['ma_heart_azhu'],
          flags: { arc_tianlong_mid: true },
        },
      },
      {
        id: 'tl2_guard',
        label: '護峯道，擋一波來亂的刀客',
        hint: '戰鬥',
        outcomeText:
          '峯道窄，刀客更窄。你擋完，虛築塞你一包乾糧：「戰損補貼。」',
        rewards: {
          exp: 50,
          potential: 4,
          flags: { arc_tianlong_mid: true },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_tianlong_3',
    year: 0,
    title: '天龍・雁門沉默',
    summary: '橋峰約你至雁門關道；風很大，話很少。',
    locationId: 'loc_yanmen',
    paragraphs: [
      '碑文斑駁。橋峰看著關外，像在看一封無法回覆的郵件。',
      '阿硃遠遠跟著，不靠近，只怕風把自己的眼淚吹成故事。',
      '你把手機調靜音，決定這次不當氣氛組。',
    ],
    choices: [
      {
        id: 'tl3_listen',
        label: '陪他沉默一炷香',
        hint: '好感｜潛能',
        outcomeText:
          '香盡，橋峰開口：「你若走江湖，記得別把人只分成敵我。」你點頭，像簽下一份無紙契約。',
        rewards: {
          potential: 8,
          affinity: { npc_qiao_feng: 14, npc_azhu: 8 },
          martialIds: ['ma_act_dragon', 'ma_qing_yanmen'],
          flags: { arc_tianlong_done: true },
        },
      },
      {
        id: 'tl3_beggar',
        label: '邀他回丐幇分舵喝一碗',
        hint: '門派｜銀兩↓',
        outcomeText:
          '熱湯比道理好用。丐幇少年們圍著聽他講「怎麼打不還手也要護人」。你付了湯錢。',
        rewards: {
          silver: -25,
          exp: 40,
          affinity: { npc_qiao_feng: 10, npc_hong_qigong: 6 },
          flags: { arc_tianlong_done: true },
        },
      },
      {
        id: 'tl3_fight',
        label: '關道伏擊，並肩一戰',
        hint: '戰鬥',
        outcomeText:
          '風砂裡拳掌相交。事後橋峰拍你肩：「還能打。」這大概是他的五星好評。',
        rewards: {
          exp: 55,
          potential: 6,
          affinity: { npc_qiao_feng: 12 },
          flags: { arc_tianlong_done: true },
        },
        startCombat: true,
      },
    ],
  },

  // —— 鹿鼎線（新建） ——
  {
    id: 'arc_luding_1',
    year: 0,
    title: '鹿鼎・碼頭股份說明會',
    summary: '魏曉寶要拉你入「船票友情價」計畫。',
    locationId: 'loc_east_wharf',
    paragraphs: [
      '東海碼頭人聲如潮。魏曉寶展開一張手繪組織圖，箭頭多到像故障線路。',
      '雙児在旁默默把茶續上，眼神卻提醒你：別簽你看不懂的字。',
      '你想起現代的加盟說明會，冷汗下來。',
    ],
    choices: [
      {
        id: 'ld1_sign',
        label: '小額入股，換情報網',
        hint: '銀兩↓｜傳聞',
        outcomeText:
          '你掏了一小袋銀。魏曉寶塞你三條「內部消息」，兩條有用，一條是廣告。',
        rewards: {
          silver: -40,
          inspiration: 5,
          affinity: { npc_wei_xiaobao: 12, npc_shuang_er: 6 },
          flags: { arc_luding_start: true },
        },
      },
      {
        id: 'ld1_audit',
        label: '要求雙児做帳本審計',
        hint: '契約｜好感',
        outcomeText:
          '雙児翻帳極快。魏曉寶哀嚎，你卻第一次看懂碼頭的真實水流。',
        rewards: {
          inspiration: 6,
          affinity: { npc_shuang_er: 14, npc_wei_xiaobao: 4 },
          martialIds: ['ma_act_needle'],
          flags: { arc_luding_start: true },
        },
      },
      {
        id: 'ld1_refuse',
        label: '拒股份，改換工換船票',
        hint: '肝｜AP 感',
        outcomeText:
          '你搬了一下午貨。船票入手，腰也快報銷。魏曉寶：「兄弟，這叫沉沒成本轉體驗。」',
        rewards: {
          staminaDelta: -12,
          potential: 4,
          affinity: { npc_wei_xiaobao: 8 },
          flags: { arc_luding_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_luding_2',
    year: 0,
    title: '鹿鼎・夜半妖光公關',
    summary: '有人要把你的手電筒打成「妖物直播」。',
    locationId: 'loc_suhang',
    paragraphs: [
      '蘇杭津的茶棚裡，流言比茶熱。有人說你能召喚白日焰火。',
      '魏曉寶提議：「我們做澄清——順便賣周邊。」雙児：「先活下來。」',
      '你考慮要不要永久關閉手電筒功能。',
    ],
    choices: [
      {
        id: 'ld2_demo',
        label: '公開演示：這是科技不是妖法',
        hint: '靈感｜風險',
        outcomeText:
          '人群喔了一聲。有人跪，有人笑，有人要買同款。百曉笙開始賣「防妖教學」。',
        rewards: {
          inspiration: 6,
          silver: 25,
          affinity: { npc_bai_xiaosheng: 6, npc_wei_xiaobao: 8 },
          martialIds: ['ma_act_flashlight'],
          flags: { arc_luding_mid: true },
        },
      },
      {
        id: 'ld2_hide',
        label: '低調藏器，改以人情滅謠',
        hint: '好感',
        outcomeText:
          '雙児串起茶棚與船幫的嘴。三日内妖光傳聞降溫，你的電量也保住了。',
        rewards: {
          affinity: { npc_shuang_er: 12, npc_wei_xiaobao: 6 },
          potential: 4,
          flags: { arc_luding_mid: true },
        },
      },
      {
        id: 'ld2_fight',
        label: '揍醒帶風向的刀客水軍',
        hint: '戰鬥',
        outcomeText:
          '水軍散得比退訂還快。魏曉寶在旁直播？——你一把搶過他的話頭。',
        rewards: {
          exp: 45,
          silver: 20,
          flags: { arc_luding_mid: true },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_luding_3',
    year: 0,
    title: '鹿鼎・人情收束',
    summary: '船幫要清帳；魏曉寶把你推到談判桌正中。',
    locationId: 'loc_east_wharf',
    paragraphs: [
      '帳本、船票、人情、威脅——四樣擺滿桌。',
      '雙児把筆遞給你：「寫得清楚，他們才不敢賴。」',
      '你突然理解：江湖與職場的差，有時只差一件古裝。',
    ],
    choices: [
      {
        id: 'ld3_contract',
        label: '寫一份三方可執行合約',
        hint: '契約｜銀兩',
        outcomeText:
          '合約蓋印。船幫消氣，魏曉寶請你吃麵，雙児幫你擦掉袖口墨跡。',
        rewards: {
          silver: 70,
          inspiration: 5,
          affinity: { npc_wei_xiaobao: 10, npc_shuang_er: 12 },
          flags: { arc_luding_done: true },
        },
      },
      {
        id: 'ld3_split',
        label: '勸散股份，改成工錢日結',
        hint: '和平｜潛能',
        outcomeText:
          '日結制讓人少做白日夢。魏曉寶雖嘆，卻也睡得著了。',
        rewards: {
          potential: 7,
          affinity: { npc_shuang_er: 10, npc_wei_xiaobao: 8 },
          flags: { arc_luding_done: true },
        },
      },
      {
        id: 'ld3_bluff',
        label: '虛張天機閣監管嚇退訛詐',
        hint: '嘴炮',
        outcomeText:
          '你抬出百曉笙名號。對方退去，百曉笙後來來收「品牌授權費」——你認栽。',
        rewards: {
          silver: -15,
          inspiration: 4,
          affinity: { npc_bai_xiaosheng: 8, npc_wei_xiaobao: 8 },
          flags: { arc_luding_done: true },
        },
      },
    ],
  },

  // —— 俠客行線（新建） ——
  {
    id: 'arc_xiake_1',
    year: 0,
    title: '俠氣・潮履引路',
    summary: '碼頭老人說：穿潮履者，島影會近一尺。',
    locationId: 'loc_xiake_isle',
    paragraphs: [
      '俠客氣島臨水，石壁刻字被潮汐啃咬，像一則加密訊息。',
      '石破添蹲在岸邊數浪：「前輩說，讀懂的人會笑，讀不懂的人會游泳。」',
      '你檢查鞋帶，決定先別笑。',
    ],
    choices: [
      {
        id: 'xk1_read',
        label: '抄錄石壁可辨字跡',
        hint: '靈感｜武學',
        outcomeText:
          '字跡像詩也像密碼。你抄下半闕，腳步竟與潮聲合拍。',
        rewards: {
          inspiration: 6,
          martialIds: ['ma_qing_wave'],
          affinity: { npc_shi_potian: 10 },
          flags: { arc_xiake_start: true },
        },
      },
      {
        id: 'xk1_swim',
        label: '跟石破添游一趟礁間',
        hint: '精力｜身法',
        outcomeText:
          '水冷，笑熱。你上岸後發現自己不太怕浪了——也可能是被凍醒。',
        rewards: {
          staminaDelta: -8,
          potential: 5,
          martialIds: ['ma_qing_wharf'],
          affinity: { npc_shi_potian: 12 },
          flags: { arc_xiake_start: true },
        },
      },
      {
        id: 'xk1_trade',
        label: '用乾糧換島民指路',
        hint: '物資',
        outcomeText:
          '老人指了指東崖：「夜半潮最低。別帶火把——石頭怕光，人怕滑。」',
        rewards: {
          silver: -10,
          inspiration: 3,
          flags: { arc_xiake_start: true, arc_xiake_path: true },
        },
      },
    ],
  },
  {
    id: 'arc_xiake_2',
    year: 0,
    title: '俠氣・壁上殘譜',
    summary: '夜潮退去，石壁多露出三行字。',
    locationId: 'loc_xiake_isle',
    paragraphs: [
      '月光把刻痕拉長。石破添念得磕絆，卻念得認真。',
      '你忽然想到：這不像祕籍，比較像一封寫給後來者的信。',
      '浪聲裡，有人遠眺，不近前。',
    ],
    choices: [
      {
        id: 'xk2_practice',
        label: '依殘譜練半宿身法',
        hint: '潛能｜肝',
        outcomeText:
          '你摔了七次，第八次站穩。石破添鼓掌：「前輩說失敗是學費。」',
        rewards: {
          potential: 8,
          staminaDelta: -12,
          martialIds: ['ma_qing_swallow'],
          flags: { arc_xiake_mid: true },
        },
      },
      {
        id: 'xk2_share',
        label: '拓印殘譜，分送可信友伴',
        hint: '俠義',
        outcomeText:
          '你拓了兩份：一份給石破添，一份留給未來的自己。島風把墨吹乾。',
        rewards: {
          inspiration: 5,
          affinity: { npc_shi_potian: 10, npc_guo_jing: 4 },
          flags: { arc_xiake_mid: true },
        },
      },
      {
        id: 'xk2_guard',
        label: '驅離想來鑿壁的盜刻者',
        hint: '戰鬥',
        outcomeText:
          '鑿子叮叮，被你叮回去。石壁保住，你的袖口掛了海藻。',
        rewards: {
          exp: 48,
          silver: 25,
          flags: { arc_xiake_mid: true },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_xiake_3',
    year: 0,
    title: '俠氣・島信寄出',
    summary: '你要決定：把島上所悟帶向何處。',
    locationId: 'loc_xiake_isle',
    paragraphs: [
      '潮又漲了。石破添把一枚潮履舊釘放你掌心：「記得回來換季。」',
      '遠方碼頭燈火如星，江湖仍吵。',
      '你寫下自己的註解，刻在無人注意的石角——只一句：活著，比成名難，也比成名值。',
    ],
    choices: [
      {
        id: 'xk3_return',
        label: '帶回江湖，教願學的人半式',
        hint: '俠義｜露出',
        outcomeText:
          '你在襄揚破廟教了兩個少年落地。他們摔得很開心。你忽然覺得穿越沒白費。',
        rewards: {
          exp: 50,
          potential: 6,
          affinity: { npc_shi_potian: 8, npc_huang_rong: 4 },
          flags: { arc_xiake_done: true },
        },
      },
      {
        id: 'xk3_keep',
        label: '秘而不宣，只留給同伴',
        hint: '歸隱味',
        outcomeText:
          '你把殘譜縫進夾層。石破添說：「這樣也好。海會保密。」',
        rewards: {
          potential: 9,
          inspiration: 4,
          flags: { arc_xiake_done: true },
        },
      },
      {
        id: 'xk3_tianji',
        label: '交給天機閣存證，公開摘要',
        hint: '契約｜銀兩',
        outcomeText:
          '百曉笙給了存證編號與一筆薄酬。摘要流傳，鑿壁的人少了。',
        rewards: {
          silver: 55,
          affinity: { npc_bai_xiaosheng: 10 },
          flags: { arc_xiake_done: true },
        },
      },
    ],
  },
]

export function getArcBeatById(id: string): StoryEventDef | undefined {
  return ARC_BEAT_EVENTS.find((e) => e.id === id)
}
