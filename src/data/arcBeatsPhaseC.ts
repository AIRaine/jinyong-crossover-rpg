/**
 * 階段 C：加深舊弧第 4 拍＋新建連城／飛狐／書劍／碧血短弧
 * 僅諧音代稱；勿在 UI 寫原著對照。
 */
import type { StoryEventDef } from '../types/game'

export const PHASE_C_ARC_BEATS: StoryEventDef[] = [
  // —— 射鵰加深・第 4 拍 ——
  {
    id: 'arc_shediao_4',
    year: 0,
    title: '邊城・白駝餘波',
    summary: '白駝奇功的傳聞未歇，歐楊鋒在關外留下一道難題。',
    locationId: 'loc_yanmen',
    paragraphs: [
      '關外風砂把「白駝」二字刮得若隱若現。歐楊鋒坐在斷碑上，像在等遲到的面試者。',
      '皇容傳來短箋：「別跟他比毒，比誰更能把現代人嚇跑。」你回了一個貼紙。',
      '你掏出沒訊號的手機當記事本：題一、別碰蛇；題二、別說 KPI；題三、活著離開。',
    ],
    choices: [
      {
        id: 'sd4_dodge',
        label: '以輕功繞開毒霧，只取情報',
        hint: '潛能｜身法',
        outcomeText:
          '你像躲避催稿一樣穿過毒霧。歐楊鋒哼一聲：「還算識相。」你記下他的走位圖。',
        rewards: {
          potential: 5,
          martialIds: ['ma_qing_swallow', 'ma_qing_yanmen'],
          affinity: { npc_huang_rong: 4 },
          flags: { arc_shediao_deep: true },
        },
      },
      {
        id: 'sd4_bargain',
        label: '談條件：情報換「不往中原放蛇」',
        hint: '契約｜銀兩',
        outcomeText:
          '你用現代合約口吻談停火。歐楊鋒笑得很奇怪，但仍收了銀兩與一袋茶磚。',
        rewards: {
          silver: -20,
          inspiration: 5,
          affinity: { npc_ouyang_feng: 6 },
          flags: { arc_shediao_deep: true },
        },
      },
      {
        id: 'sd4_fight',
        label: '硬撼一掌，證明邊城不是軟柿子',
        hint: '戰鬥｜掌法',
        outcomeText:
          '掌風過後雙方都後退三步。廓靖在城頭點頭：這場夠邊城撐一陣。',
        rewards: {
          exp: 40,
          martialIds: ['ma_act_xiangyang', 'ma_hua_gong'],
          affinity: { npc_guo_jing: 6 },
          flags: { arc_shediao_deep: true },
          combatPlaceholder: {
            victory: true,
            summary: '白駝餘波對掌：險勝。',
          },
        },
        startCombat: true,
      },
    ],
  },

  // —— 笑傲加深・第 4 拍 ——
  {
    id: 'arc_xiaoao_4',
    year: 0,
    title: '華嶠・琴劍同盟',
    summary: '思過崖後，琴聲與劍意決定要不要同桌。',
    locationId: 'loc_huashan',
    paragraphs: [
      '凌狐沖把酒葫蘆敲出節奏，壬盈盈坐在崖邊調弦。嶽不群在山下發「門規更新通知」。',
      '峯清揚只留一句：「同盟不是群組，是刀口。」',
      '你忽然懂了：江湖版 OKR，寫得越漂亮越危險。',
    ],
    choices: [
      {
        id: 'xa4_join',
        label: '促成琴劍同盟，公開對門規',
        hint: '俠義｜好感',
        outcomeText:
          '你幫他們擬了一份「不劇透、不背刺」的簡約盟約。華嶠夜風忽然好聞了。',
        rewards: {
          affinity: { npc_linghu_chong: 10, npc_ren_yingying: 10 },
          martialIds: ['ma_act_lonely', 'ma_heart_wine'],
          inspiration: 4,
          flags: { arc_xiaoao_deep: true },
        },
      },
      {
        id: 'xa4_spy',
        label: '潛入山門，抄下門規漏洞',
        hint: '情報｜潛能',
        outcomeText:
          '漏洞比想像多。百曉笙願意高價買摘要，你只賣半份——留半份當保險。',
        rewards: {
          silver: 40,
          potential: 5,
          martialIds: ['ma_heart_tianji'],
          flags: { arc_xiaoao_deep: true },
        },
      },
      {
        id: 'xa4_quiet',
        label: '只陪他們喝一夜，不問盟約',
        hint: '歸隱味',
        outcomeText:
          '酒盡弦歇。你什麼都沒簽，卻記住了兩種笑法。有時這就夠了。',
        rewards: {
          staminaDelta: 10,
          affinity: { npc_linghu_chong: 6, npc_ren_yingying: 6 },
          flags: { arc_xiaoao_deep: true },
        },
      },
    ],
  },

  // —— 神鵰加深・第 4 拍 ——
  {
    id: 'arc_shendiao_4',
    year: 0,
    title: '暮門・玄鐵再遇',
    summary: '寒絲夜課之後，沉劍又在暮門響了一聲。',
    locationId: 'loc_dead_tomb',
    paragraphs: [
      '宵朧女指尖繞絲：「你若怕重，就別碰；若怕輕，也別碰。」揚過在一旁傻笑。',
      '玄鐵沉劍靠牆，像一封還沒拆的郵件。',
      '你內心吐槽：這哪是劍，這是 deadline 的實體化。',
    ],
    choices: [
      {
        id: 'sdm4_lift',
        label: '硬舉三息，記力量節點',
        hint: '力量｜武學',
        outcomeText:
          '你舉了三息就放手。宵朧女點頭：「記得痛，比記得招重要。」',
        rewards: {
          potential: 6,
          martialIds: ['ma_act_xuantie'],
          affinity: { npc_xiaolongnu: 8 },
          flags: { arc_shendiao_deep: true },
        },
      },
      {
        id: 'sdm4_silk',
        label: '以寒絲輔助，練控劍而非蠻力',
        hint: '技巧｜心法',
        outcomeText:
          '絲與劍短暫同軌。你悟到一點：控制感比力量更像穿越者的優勢。',
        rewards: {
          inspiration: 6,
          martialIds: ['ma_gumupo_jade', 'ma_qing_tomb'],
          affinity: { npc_xiaolongnu: 6, npc_yang_guo: 4 },
          flags: { arc_shendiao_deep: true },
        },
      },
      {
        id: 'sdm4_leave',
        label: '不碰劍，只幫忙修封石',
        hint: '穩妥｜好感',
        outcomeText:
          '你用現代槓桿原理撬正封石。揚過鼓掌：「這招比劍酷。」',
        rewards: {
          exp: 30,
          affinity: { npc_yang_guo: 8, npc_xiaolongnu: 5 },
          flags: { arc_shendiao_deep: true },
        },
      },
    ],
  },

  // —— 倚天加深・第 4 拍 ——
  {
    id: 'arc_yitian_4',
    year: 0,
    title: '明皎・屠朧影',
    summary: '倚巔去向未定，屠朧刀影卻先到了海岸。',
    locationId: 'loc_icefire_isle',
    paragraphs: [
      '冰火交界處，榭遜的笑聲像雷。章無忌皺眉，兆敏把披風當筆記本攤開。',
      '週芷若遠距留言：「戒律不是用來貼人臉上的。」滅訣師太已讀不回。',
      '你寫下：刀可以重，決策不要重到抬不動。',
    ],
    choices: [
      {
        id: 'yt4_mediate',
        label: '調停明皎與峩眉，簽「不互砍備忘」',
        hint: '協調｜好感',
        outcomeText:
          '備忘寫得很短：今晚不互砍。雙方勉強簽名。你覺得像開成功的站會。',
        rewards: {
          affinity: {
            npc_zhang_wuji: 6,
            npc_zhao_min: 6,
            npc_zhou_zhiruo: 6,
          },
          martialIds: ['ma_heart_emei', 'ma_mingjiao_fire'],
          inspiration: 5,
          flags: { arc_yitian_deep: true },
        },
      },
      {
        id: 'yt4_blade',
        label: '試握屠朧殘鋒，感受重量',
        hint: '潛能｜內力',
        outcomeText:
          '刀意壓腕。你沒舞完整式，卻摸到一絲久陽真息的餘溫。',
        rewards: {
          potential: 7,
          martialIds: ['ma_jiuyang', 'ma_qing_icefire'],
          flags: { arc_yitian_deep: true },
        },
      },
      {
        id: 'yt4_hide',
        label: '建議藏刀，先救島上傷者',
        hint: '俠義',
        outcomeText:
          '刀入石縫。你把急救草藥包拆給傷者。榭遜嘀咕：「穿越客麻煩，但有用。」',
        rewards: {
          exp: 35,
          martialIds: ['ma_act_first_aid'],
          affinity: { npc_xie_xun: 8 },
          flags: { arc_yitian_deep: true },
        },
      },
    ],
  },

  // —— 連城線新建 ——
  {
    id: 'arc_liancheng_1',
    year: 0,
    title: '連城・殘圖夜拍',
    summary: '洛邑東巷流出半張藏寶殘圖，字跡像被刀刮過。',
    locationId: 'loc_tianji_hall',
    paragraphs: [
      '百曉笙把殘圖壓在茶托下：「買斷？還是租賃？我們有靈活方案。」',
      '荻雲站在角落，袖口有新傷，眼神卻乾淨得不像尋寶的人。',
      '你掃描圖面——沒訊號，但腦內自動跑起「這圖絕對有坑」的風控模型。',
    ],
    choices: [
      {
        id: 'lc1_buy',
        label: '付訂金租複本，與荻雲同看',
        hint: '銀兩｜好感',
        outcomeText:
          '你付了訂金。荻雲低聲說：「別信圖，信人。」你第一次覺得這句比合約重要。',
        rewards: {
          silver: -30,
          affinity: { npc_di_yun: 10, npc_bai_xiaosheng: 4 },
          martialIds: ['ma_heart_liancheng'],
          flags: { arc_liancheng_start: true },
        },
      },
      {
        id: 'lc1_steal',
        label: '趁亂拍下關鍵記號（手機閃一下）',
        hint: '吐槽｜靈感',
        outcomeText:
          '閃光嚇到三個人。你記下記號，百曉笙咬牙：「妖光服務費另計。」',
        rewards: {
          inspiration: 6,
          silver: -10,
          martialIds: ['ma_act_flashlight'],
          flags: { arc_liancheng_start: true },
        },
      },
      {
        id: 'lc1_refuse',
        label: '拒絕尋寶，只幫荻雲包紮',
        hint: '俠義',
        outcomeText:
          '你包紮、問傷、不問寶。荻雲把半片竹簡塞你手裡：「不是寶，是提醒。」',
        rewards: {
          exp: 25,
          affinity: { npc_di_yun: 12 },
          martialIds: ['ma_act_first_aid'],
          flags: { arc_liancheng_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_liancheng_2',
    year: 0,
    title: '連城・血字機關',
    summary: '殘圖指向一處廢宅，牆縫有血字與現代人都懂的「陷阱提示」。',
    locationId: 'loc_luoyang_post',
    paragraphs: [
      '廢宅走廊窄得像過道會議室。地面機關咔噠響，像即將開始的強制全員報告。',
      '荻雲按住你的腕：「一步一停。急，會死。」',
      '你在心裡把機關翻譯成：踩 A 觸發 B，B 連到 KPI——不，連到毒箭。',
    ],
    choices: [
      {
        id: 'lc2_map',
        label: '畫流程圖拆機關',
        hint: '靈感｜潛能',
        outcomeText:
          '你把踩點畫成流程。機關停了。荻雲看呆：「這……也是劍意？」你說：「是專案管理。」',
        rewards: {
          inspiration: 7,
          potential: 4,
          martialIds: ['ma_heart_tianji'],
          flags: { arc_liancheng_mid: true },
        },
      },
      {
        id: 'lc2_force',
        label: '硬闖，靠躲閃穿過箭雨',
        hint: '身法｜戰鬥',
        outcomeText:
          '箭擦肩而過。你滾進內室，撿到一柄無銘短劍——刃上有「連」字殘劃。',
        rewards: {
          exp: 35,
          martialIds: ['ma_qing_swallow', 'ma_heart_liancheng'],
          flags: { arc_liancheng_mid: true },
          combatPlaceholder: {
            victory: true,
            summary: '廢宅箭雨：倖存。',
          },
        },
        startCombat: true,
      },
      {
        id: 'lc2_retreat',
        label: '先撤，改從驛站打聽買家',
        hint: '穩妥｜銀兩',
        outcomeText:
          '你撤得乾淨。驛站茶博士透露：有人高價收「血字拓片」。你賣半份，留半份。',
        rewards: {
          silver: 45,
          affinity: { npc_di_yun: 6 },
          flags: { arc_liancheng_mid: true },
        },
      },
    ],
  },
  {
    id: 'arc_liancheng_3',
    year: 0,
    title: '連城・空匣真相',
    summary: '寶匣打開，裡面不是金銀——是一封寫給後來者的信。',
    locationId: 'loc_tianji_hall',
    paragraphs: [
      '匣內無寶。信上只有一句：貪者自困，義者自渡。',
      '荻雲笑了，笑意很淺：「原來我們找的是自己。」',
      '百曉笙在門外喊：「有差評嗎？五星好評送情報券！」你決定給三星——服務態度扣分。',
    ],
    choices: [
      {
        id: 'lc3_keep',
        label: '收下信與短劍心法，不公開',
        hint: '歸隱｜武學',
        outcomeText:
          '你把心法縫進夾層。荻雲拱手：「江湖見。」你忽然覺得空匣比滿匣輕快。',
        rewards: {
          potential: 8,
          martialIds: ['ma_heart_liancheng', 'ma_act_lonely'],
          affinity: { npc_di_yun: 10 },
          flags: { arc_liancheng_done: true },
        },
      },
      {
        id: 'lc3_public',
        label: '公開真相，阻止下一波尋寶潮',
        hint: '俠義｜聲望',
        outcomeText:
          '你在天機閣貼告示：匣空，別來。尋寶客罵你壞行情，邊城卻少了幾場仇殺。',
        rewards: {
          exp: 50,
          silver: 20,
          affinity: { npc_bai_xiaosheng: 6, npc_di_yun: 8 },
          flags: { arc_liancheng_done: true },
        },
      },
      {
        id: 'lc3_sell',
        label: '把「空匣故事」賣成話本分成',
        hint: '契約｜銀兩',
        outcomeText:
          '說書人搶著買版權。你與荻雲分銀。故事比寶藏傳得更遠。',
        rewards: {
          silver: 70,
          inspiration: 4,
          flags: { arc_liancheng_done: true },
        },
      },
    ],
  },

  // —— 飛狐／雪山線新建 ——
  {
    id: 'arc_feihu_1',
    year: 0,
    title: '雪蒼・嶺上刀痕',
    summary: '雪蒼嶺風硬，石上刀痕新舊交疊，像一本被翻爛的帳。',
    locationId: 'loc_snow_ridge',
    paragraphs: [
      '狐斐站在刀痕前，呵出白氣：「仇不是天氣，是選擇。」',
      '你腳下打滑，差點表演現代摔倒合集。他伸手扶你，力道穩得像錨。',
      '遠方雁門關道隱約可見——原來雪與關，只隔一場執念。',
    ],
    choices: [
      {
        id: 'fh1_read',
        label: '拓下刀痕，分析力道節奏',
        hint: '靈感｜身法',
        outcomeText:
          '你拓痕、計拍。狐斐愣住：「你把仇寫成樂譜？」你說：「先讀懂，再決定要不要續寫。」',
        rewards: {
          inspiration: 6,
          martialIds: ['ma_qing_snow'],
          affinity: { npc_hu_fei: 8 },
          flags: { arc_feihu_start: true },
        },
      },
      {
        id: 'fh1_spar',
        label: '請他指點一式雪地步',
        hint: '潛能｜武學',
        outcomeText:
          '你摔了兩次，第三次站住。狐斐點頭：「穿越客也有膝蓋，不錯。」',
        rewards: {
          potential: 5,
          martialIds: ['ma_qing_snow', 'ma_qing_yanmen'],
          affinity: { npc_hu_fei: 10 },
          flags: { arc_feihu_start: true },
        },
      },
      {
        id: 'fh1_tea',
        label: '分享保溫瓶熱水，先不當刀客',
        hint: '人情',
        outcomeText:
          '熱水霧氣散在雪裡。仇名暫時排第二。你記下：有時熱飲比名刀管用。',
        rewards: {
          staminaDelta: 12,
          affinity: { npc_hu_fei: 12 },
          flags: { arc_feihu_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_feihu_2',
    year: 0,
    title: '雪蒼・仇冊夜讀',
    summary: '一本殘冊列出舊怨，字跡冷，風更冷。',
    locationId: 'loc_snow_ridge',
    paragraphs: [
      '仇冊被霜咬過，名字糊成一片。狐斐問：「你若名字在上面，會怎麼做？」',
      '你想到績效評等與黑名單，忽然說不出玩笑。',
      '山下有人舉火：尋仇者，或送炭者——火光看起來都一樣急。',
    ],
    choices: [
      {
        id: 'fh2_burn',
        label: '勸他燒冊，留刀不留名單',
        hint: '俠義｜好感',
        outcomeText:
          '紙灰飛進雪裡。狐斐握刀的手鬆了半寸：「名單沒了，路還在。」',
        rewards: {
          exp: 35,
          affinity: { npc_hu_fei: 12 },
          martialIds: ['ma_heart_calm'],
          flags: { arc_feihu_mid: true },
        },
      },
      {
        id: 'fh2_annotate',
        label: '幫他註解：可解／不可解',
        hint: '契約｜靈感',
        outcomeText:
          '你用紅筆標「可談」「勿追」。仇冊變成風險矩陣。狐斐第一次笑出聲。',
        rewards: {
          inspiration: 7,
          silver: 15,
          martialIds: ['ma_heart_tianji'],
          flags: { arc_feihu_mid: true },
        },
      },
      {
        id: 'fh2_ambush',
        label: '設伏擊退尋仇者，不取性命',
        hint: '戰鬥',
        outcomeText:
          '雪地一戰，對手退。你沒下殺手，狐斐說：「這樣，我才認你是同行。」',
        rewards: {
          exp: 40,
          martialIds: ['ma_qing_snow'],
          flags: { arc_feihu_mid: true },
          combatPlaceholder: {
            victory: true,
            summary: '雪蒼伏擊：逼退尋仇者。',
          },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_feihu_3',
    year: 0,
    title: '雪蒼・刀名放下',
    summary: '嶺上日出，刀光淡了，人影卻清楚了。',
    locationId: 'loc_yanmen',
    paragraphs: [
      '你們走到雁門關道。風砂比雪硬，卻再也吹不散昨夜那句「路還在」。',
      '狐斐把刀入鞘：「我不改名，只改用法。」',
      '你拍拍凍僵的手套：穿越以來，這是少數不用吐槽也能懂的結局前奏。',
    ],
    choices: [
      {
        id: 'fh3_teach',
        label: '請他教你「止殺」的一式',
        hint: '武學｜潛能',
        outcomeText:
          '刀意收在寸間。你學會的不是殺法，是停手的時機——比出招難。',
        rewards: {
          potential: 7,
          martialIds: ['ma_qing_snow', 'ma_act_dragon'],
          affinity: { npc_hu_fei: 10, npc_qiao_feng: 4 },
          flags: { arc_feihu_done: true },
        },
      },
      {
        id: 'fh3_escort',
        label: '护送他回關內，換個活法',
        hint: '人情｜銀兩',
        outcomeText:
          '關內茶熱。狐斐說要去丐幇聽消息。你付了兩人的乾糧錢，心裡卻賺了。',
        rewards: {
          silver: -15,
          exp: 40,
          affinity: { npc_hu_fei: 14 },
          flags: { arc_feihu_done: true },
        },
      },
      {
        id: 'fh3_part',
        label: '道別：刀路各自，音信可通',
        hint: '歸隱',
        outcomeText:
          '他留下一枚雪蒼石。你收下，當書籤用——提醒自己：有些帳不必算到最後一頁。',
        rewards: {
          inspiration: 5,
          staminaDelta: 8,
          flags: { arc_feihu_done: true },
        },
      },
    ],
  },

  // —— 書劍線新建 ——
  {
    id: 'arc_shujian_1',
    year: 0,
    title: '紅華・河燈密信',
    summary: '蘇杭津河燈裡夾著密信，署名「紅華」。',
    locationId: 'loc_suhang',
    paragraphs: [
      '河燈漂過畫舫，密信被你用現代夾子撈起——旁人以為你在撿垃圾。',
      '陳家珞立於橋影：「紅華不是會社APP，是一群不想只會喝酒的人。」',
      '你回：「那請先把密信字體加大，我夜視一般。」他竟然真的點頭。',
    ],
    choices: [
      {
        id: 'sj1_join',
        label: '暫接密信，幫傳一程',
        hint: '俠義｜好感',
        outcomeText:
          '你接下密信。陳家珞說：「穿越客若肯守信，比刀更快。」',
        rewards: {
          affinity: { npc_chen_jialuo: 10 },
          martialIds: ['ma_qing_wave'],
          exp: 25,
          flags: { arc_shujian_start: true },
        },
      },
      {
        id: 'sj1_copy',
        label: '複寫一份給天機閣存證',
        hint: '契約｜銀兩',
        outcomeText:
          '存證換薄酬。紅華內部有人罵你洩密，有人誇你專業。江湖評論區好吵。',
        rewards: {
          silver: 35,
          affinity: { npc_bai_xiaosheng: 5, npc_chen_jialuo: 4 },
          flags: { arc_shujian_start: true },
        },
      },
      {
        id: 'sj1_refuse',
        label: '把信塞回河燈，不當信使',
        hint: '穩妥',
        outcomeText:
          '燈漂走了。陳家珞沒怒，只說：「至少你誠實。」你獲得一枚茶葉當路費。',
        rewards: {
          silver: 10,
          inspiration: 3,
          flags: { arc_shujian_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_shujian_2',
    year: 0,
    title: '紅華・酒樓對席',
    summary: '酒樓包廂裡，書與劍爭的是路線，不是座位。',
    locationId: 'loc_suhang',
    paragraphs: [
      '有人主張直取邊城，有人主張先救民籍。菜涼了三輪，結論還在投影裡——你腦補的。',
      '陳家珞看你：「現代人，給個不害人的辦法。」',
      '你突然想起跨部門對齊會：先共識目標，再吵手段。',
    ],
    choices: [
      {
        id: 'sj2_align',
        label: '主持對齊：先救民籍，再談鋒刃',
        hint: '協調｜靈感',
        outcomeText:
          '你畫了兩欄：民與刃。眾人勉強簽名。酒終於熱了。',
        rewards: {
          inspiration: 7,
          affinity: { npc_chen_jialuo: 10, npc_linghu_chong: 3 },
          martialIds: ['ma_heart_calm'],
          flags: { arc_shujian_mid: true },
        },
      },
      {
        id: 'sj2_duel',
        label: '以切磋定發言權，點到為止',
        hint: '戰鬥｜劍意',
        outcomeText:
          '劍氣過桌，誰也沒流血。發言權暫時歸你——你馬上還回去，只留議程。',
        rewards: {
          exp: 35,
          martialIds: ['ma_act_lonely', 'ma_qing_huashan'],
          flags: { arc_shujian_mid: true },
          combatPlaceholder: {
            victory: true,
            summary: '酒樓點到為止。',
          },
        },
        startCombat: true,
      },
      {
        id: 'sj2_fund',
        label: '出資辦義學，換路線緩衝期',
        hint: '銀兩｜聲望',
        outcomeText:
          '銀兩換成桌椅與筆墨。紅華內部爭吵降噪。陳家珞說：「這筆，值。」',
        rewards: {
          silver: -40,
          exp: 40,
          affinity: { npc_chen_jialuo: 12 },
          flags: { arc_shujian_mid: true },
        },
      },
    ],
  },
  {
    id: 'arc_shujian_3',
    year: 0,
    title: '紅華・夜雨分途',
    summary: '密信送到，雨來了，人要各自走一段。',
    locationId: 'loc_xiangyang',
    paragraphs: [
      '襄揚城門燈火晃動。密信交到該交的人手裡——你沒問名字，只問回執。',
      '陳家珞拱手：「書可藏劍，劍亦可護書。你選過了。」',
      '你回：「我選的是少害人。」雨聲像掌聲，也很像散會鈴。',
    ],
    choices: [
      {
        id: 'sj3_stay',
        label: '暫留襄揚，協助民籍登記',
        hint: '俠義｜潛能',
        outcomeText:
          '你用表格思維整理民籍。官吏傻眼，百姓卻排得比較快。潛能微漲。',
        rewards: {
          potential: 6,
          exp: 40,
          martialIds: ['ma_act_xiangyang'],
          affinity: { npc_guo_jing: 5, npc_chen_jialuo: 8 },
          flags: { arc_shujian_done: true },
        },
      },
      {
        id: 'sj3_token',
        label: '收下紅華信物，日後可召',
        hint: '人情｜武學',
        outcomeText:
          '信物是半枚竹符。陳家珞教你一式藏鋒。雨停時，符也暖了。',
        rewards: {
          martialIds: ['ma_qing_wave', 'ma_heart_wine'],
          affinity: { npc_chen_jialuo: 14 },
          flags: { arc_shujian_done: true },
        },
      },
      {
        id: 'sj3_leave',
        label: '功成不居，轉身去碼頭吹風',
        hint: '歸隱',
        outcomeText:
          '你沒留名。船老大說河燈故事會流傳。你戴上兜帽，當自己是路人。',
        rewards: {
          staminaDelta: 10,
          inspiration: 4,
          silver: 20,
          flags: { arc_shujian_done: true },
        },
      },
    ],
  },

  // —— 碧血線新建 ——
  {
    id: 'arc_bixue_1',
    year: 0,
    title: '碧血・殘鋒問心',
    summary: '華嶠劍台下，一柄染碧的殘鋒插在石縫，像未完成的簽名。',
    locationId: 'loc_huashan',
    paragraphs: [
      '園承志蹲在殘鋒旁：「不是寶劍，是問句。」',
      '你問：「問什麼？」他說：「你殺人之前，會先想誰會收屍嗎？」',
      '這問題太現代，也太古老。你沉默的時間剛好夠一道茶涼。',
    ],
    choices: [
      {
        id: 'bx1_pull',
        label: '拔殘鋒，試其重量與心',
        hint: '潛能｜劍意',
        outcomeText:
          '鋒輕、心重。你沒舞出殺意，只記下一式收勢。園承志說：「合格。」',
        rewards: {
          potential: 5,
          martialIds: ['ma_act_blood_sword'],
          affinity: { npc_yuan_chengzhi: 10 },
          flags: { arc_bixue_start: true },
        },
      },
      {
        id: 'bx1_leave',
        label: '不拔劍，只清理石縫青苔',
        hint: '穩妥｜好感',
        outcomeText:
          '青苔清了，劍仍在。園承志反而多看你一眼：「有人不靠拔劍證明自己。」',
        rewards: {
          exp: 20,
          affinity: { npc_yuan_chengzhi: 12 },
          martialIds: ['ma_heart_calm'],
          flags: { arc_bixue_start: true },
        },
      },
      {
        id: 'bx1_ask',
        label: '反問：你收過誰的屍？',
        hint: '吐槽｜靈感',
        outcomeText:
          '他答得很短。你沒追問，只把答案寫進備忘錄標題：碧血，不是濾鏡。',
        rewards: {
          inspiration: 6,
          affinity: { npc_yuan_chengzhi: 8 },
          flags: { arc_bixue_start: true },
        },
      },
    ],
  },
  {
    id: 'arc_bixue_2',
    year: 0,
    title: '碧血・洛邑義莊',
    summary: '義莊缺糧缺人手，殘鋒的問句變成勞動清單。',
    locationId: 'loc_luoyang_post',
    paragraphs: [
      '義莊門口排著布施隊伍。園承志捲袖：「今日不論劍，論米。」',
      '你掏出現代排隊法：號碼牌、分流、先老弱。官吏說你妖法，百姓說你懂事。',
      '凌狐沖不知何時在角落喝酒，舉葫蘆致意：「這場比華嶠好看。」',
    ],
    choices: [
      {
        id: 'bx2_organize',
        label: '把義莊流程跑順',
        hint: '俠義｜潛能',
        outcomeText:
          '隊伍不再推擠。園承志把一頁心法殘箋塞你袖中：「這比銀兩乾淨。」',
        rewards: {
          potential: 6,
          exp: 35,
          martialIds: ['ma_act_blood_sword', 'ma_heart_calm'],
          affinity: { npc_yuan_chengzhi: 10 },
          flags: { arc_bixue_mid: true },
        },
      },
      {
        id: 'bx2_fund',
        label: '捐銀辦三日粥棚',
        hint: '銀兩｜聲望',
        outcomeText:
          '粥香壓過爭吵。你荷包瘦了，肩卻鬆了。園承志記你一筆「可深交」。',
        rewards: {
          silver: -35,
          exp: 40,
          affinity: { npc_yuan_chengzhi: 14 },
          flags: { arc_bixue_mid: true },
        },
      },
      {
        id: 'bx2_guard',
        label: '守夜防劫糧，點到為止',
        hint: '戰鬥',
        outcomeText:
          '劫糧者退。你沒追擊。園承志說：「碧血不是血越多越忠。」',
        rewards: {
          exp: 38,
          martialIds: ['ma_act_blood_sword'],
          flags: { arc_bixue_mid: true },
          combatPlaceholder: {
            victory: true,
            summary: '義莊守夜：逼退劫糧。',
          },
        },
        startCombat: true,
      },
    ],
  },
  {
    id: 'arc_bixue_3',
    year: 0,
    title: '碧血・鋒收如諾',
    summary: '殘鋒入鞘，問句有了暫時的答案。',
    locationId: 'loc_huashan',
    paragraphs: [
      '華嶠夜風清。園承志把殘鋒收回布套：「今日之答：先活人，再論名。」',
      '你想起穿越前的績效表，忽然想把它撕掉——可惜那裡沒有紙。',
      '峯清揚遠在某處，未必看見；但你覺得這場收鋒，比論劍更接近劍意。',
    ],
    choices: [
      {
        id: 'bx3_swear',
        label: '立約：拔劍前先問收屍',
        hint: '俠義｜武學',
        outcomeText:
          '約是私下的。你卻覺得比門規硬。園承志傳你收勢一式，刃意內斂。',
        rewards: {
          martialIds: ['ma_act_blood_sword', 'ma_qing_huashan'],
          affinity: { npc_yuan_chengzhi: 12 },
          potential: 5,
          flags: { arc_bixue_done: true },
        },
      },
      {
        id: 'bx3_write',
        label: '把義莊方法寫成冊，交給天機閣流傳',
        hint: '契約｜靈感',
        outcomeText:
          '小冊流傳。有人笑你矯情，有人照著做。你收薄酬，心安比銀兩響。',
        rewards: {
          silver: 30,
          inspiration: 6,
          affinity: { npc_bai_xiaosheng: 6 },
          flags: { arc_bixue_done: true },
        },
      },
      {
        id: 'bx3_wander',
        label: '不立約，只把這夜記住',
        hint: '歸隱',
        outcomeText:
          '你下山。殘鋒的冷意還在指尖，提醒你：有些答案要邊走邊寫。',
        rewards: {
          staminaDelta: 10,
          inspiration: 4,
          flags: { arc_bixue_done: true },
        },
      },
    ],
  },
]

/** 短篇奇遇包（白馬／鴛鴦／越女等露出，非長弧） */
export const SHORTPACK_ENCOUNTERS: StoryEventDef[] = [
  {
    id: 'enc_baima_road',
    year: 0,
    title: '奇遇｜白馬溪聲',
    summary: '溪邊白馬蹄聲清脆，少女催你讓路——或一起躲官差。',
    locationId: 'loc_luoyang_post',
    paragraphs: [
      '白馬噴鼻，鞍上少女眼神比蹄鐵硬：「讓開，或上來。」',
      '你看了看自己的運動鞋，決定先問一句：官差是來收稅還是來收命？',
    ],
    choices: [
      {
        id: 'enc_baima_ride',
        label: '翻身上馬，幫忙斷後',
        hint: '俠義｜身法',
        outcomeText:
          '你抱緊鞍橋，差點咬到舌頭。甩掉追兵後，她丢你一枚馬飾：「記得溪聲。」',
        rewards: {
          exp: 22,
          martialIds: ['ma_qing_swallow'],
          potential: 2,
        },
      },
      {
        id: 'enc_baima_path',
        label: '指另一條驛道，自己當誘餌',
        hint: '吐槽｜銀兩',
        outcomeText:
          '你揮手機閃光誘敵。官差追錯路。少女遠去，茶博士塞你一筆「看熱鬧費」。',
        rewards: { silver: 25, inspiration: 3 },
      },
    ],
  },
  {
    id: 'enc_yuanyang_knife',
    year: 0,
    title: '奇遇｜鴛鴦刀謎',
    summary: '市集攤上兩柄對刀，賣家堅稱「合璧有奇效」。',
    locationId: 'loc_suhang',
    paragraphs: [
      '刀鞘成對，像情侶款周邊。賣家眨眼：「合則利，分則災——詳情請掃碼。」沒訊號。',
      '你懷疑這是江湖版綁銷售。',
    ],
    choices: [
      {
        id: 'enc_yy_buy',
        label: '買一柄，送另一柄給需要的人',
        hint: '人情｜潛能',
        outcomeText:
          '你拆套賣人情。據說某處少了一場因刀而起的爭吵——也許是巧合。',
        rewards: {
          silver: -20,
          potential: 4,
          martialIds: ['ma_act_needle'],
        },
      },
      {
        id: 'enc_yy_pass',
        label: '勸賣家別綁銷，改單賣',
        hint: '靈感',
        outcomeText:
          '賣家被你說動，生意反而變好。他送你一塊磨刀石當顧問費。',
        rewards: { inspiration: 5, silver: 8 },
      },
    ],
  },
  {
    id: 'enc_yuenyu_sword',
    year: 0,
    title: '奇遇｜越女劍影',
    summary: '竹林流泉邊，有人練劍，水聲替她打拍子。',
    locationId: 'loc_emei_gate',
    paragraphs: [
      '劍光如水線。你不敢靠近，只敢在石後做筆記：步法、呼吸、以及「不要出聲」。',
      '她收勢：「看就看，別用那妖物閃光。」你秒關手電筒。',
    ],
    choices: [
      {
        id: 'enc_yyu_learn',
        label: '請教半式，承諾不外傳姓名',
        hint: '武學',
        outcomeText:
          '她點頭極淺，教你一式以水洗劍意。你記住動作，忘了追問名姓——正如所約。',
        rewards: {
          martialIds: ['ma_act_emei_sword', 'ma_qing_emei'],
          potential: 3,
        },
      },
      {
        id: 'enc_yyu_watch',
        label: '只旁觀，留下乾糧便走',
        hint: '禮數',
        outcomeText:
          '乾糧放在石上。你離開時，竹葉響了一聲，像道謝，也像趕人。',
        rewards: { staminaDelta: 6, inspiration: 2 },
      },
    ],
  },
]
