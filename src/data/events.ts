import { ARC_BEAT_EVENTS } from './arcBeats'
import { SHORTPACK_ENCOUNTERS } from './arcBeatsPhaseC'
import { NG_PLUS_ENCOUNTERS } from '../lib/ngPlusStory'
import type { StoryEventDef } from '../types/game'

/** 過熱樞紐：造訪權重略降；過冷秘境：加權與導流 */
export const HOT_LOCATION_IDS = [
  'loc_broken_temple',
  'loc_xiangyang',
  'loc_luoyang_post',
] as const

export const COLD_LOCATION_IDS = [
  'loc_lingjiu',
  'loc_peach_island',
  'loc_dead_tomb',
  'loc_huashan',
  'loc_emei_gate',
  'loc_icefire_isle',
  'loc_xiake_isle',
  'loc_snow_ridge',
] as const

/** 旬名 */
export const XUN_LABELS = ['上旬', '中旬', '下旬'] as const

/**
 * 五年主線：每年可選結局／路線分支。
 * 五年結局會寫入 storyFlags：ending_chivalry｜ending_contract｜ending_retreat｜ending_sword
 */
export const MAIN_STORY_EVENTS: StoryEventDef[] = [
  {
    id: 'main_y1_xiangyang',
    year: 1,
    title: '元年｜襄揚烽煙',
    summary: '襄揚城牆外塵土再起，丐幇來報：有人要劫糧道。',
    locationId: 'loc_xiangyang',
    paragraphs: [
      '襄揚城頭旗影獵獵。你剛在市井站穩腳跟，便聽百曉笙放話：「糧車若斷，邊城先亂。」',
      '皇容託人帶話：若你願意出手，她欠你一頓桃華宴——用現代話說，這叫「重要合作夥伴邀請」。',
      '洪柒公啃著雞腿路過：「小子，護糧還是護命，自己選。」',
    ],
    choices: [
      {
        id: 'y1_guard',
        label: '護送糧車，硬撼刀客',
        hint: '戰鬥｜俠義路線',
        outcomeText:
          '你率隊友沿官道推進，刀客果然劫營。一番混戰後糧車保全，襄揚守軍記你一功。',
        rewards: {
          silver: 40,
          exp: 40,
          potential: 4,
          inspiration: 2,
          flags: { route_y1: 'chivalry' },
          affinity: { npc_guo_jing: 8, npc_hong_qigong: 6 },
          martialIds: ['ma_act_xiangyang'],
        },
        startCombat: true,
      },
      {
        id: 'y1_scout',
        label: '夜探敵營，只取情報',
        hint: '避戰｜情報路線',
        outcomeText:
          '你用手電筒短暫照明標記敵哨位置，把情報賣給天機閣。沒打起來，但消息比拳頭值錢。',
        rewards: {
          silver: 25,
          inspiration: 5,
          potential: 2,
          flags: { route_y1: 'intel' },
          affinity: { npc_bai_xiaosheng: 10 },
          martialIds: ['ma_heart_tianji'],
        },
      },
      {
        id: 'y1_bargain',
        label: '收買刀客帶路人',
        hint: '耗銀｜權謀苗頭',
        outcomeText:
          '你撒銀兩拆散劫匪內應。廓靖皺眉，兆敏（遠方傳聞裡）大概會鼓掌。',
        rewards: {
          silver: -35,
          exp: 20,
          inspiration: 3,
          flags: { route_y1: 'scheme' },
          affinity: { npc_huang_rong: 6 },
          martialIds: ['ma_heart_zhao'],
        },
      },
    ],
  },
  {
    id: 'main_y2_huashan',
    year: 2,
    title: '二年｜華嶠論劍預熱',
    summary: '華嶠派放話要辦小型論劍，邀請各方「有名有姓」的人。',
    locationId: 'loc_huashan',
    paragraphs: [
      '西嶽風大，劍台未搭完就有人放狠話。凌狐沖醉醺醺道：「來都來了，比一場又如何？」',
      '嶽不群微笑：「以武會友。」你總覺得這句像開場白後面藏著 KPI。',
      '峯清揚只在崖邊點了點頭，像在審核你的 PR。',
    ],
    choices: [
      {
        id: 'y2_spar',
        label: '上台切磋，打出名聲',
        hint: '戰鬥｜劍鋒',
        outcomeText: '劍台三合，你以現代節奏感拆招，險勝。華嶠弟子開始記得你的名號。',
        rewards: {
          exp: 50,
          potential: 6,
          silver: 30,
          flags: { route_y2: 'sword' },
          affinity: { npc_linghu_chong: 10, npc_feng_qingyang: 6 },
          martialIds: ['ma_qing_huashan'],
        },
        startCombat: true,
      },
      {
        id: 'y2_judge',
        label: '擔任記錄，整理招式筆記',
        hint: '穩妥｜學問',
        outcomeText:
          '你把各派招式寫成「對照表」，望語嫣翻了兩頁眼睛發亮。筆記本身就是禮物。',
        rewards: {
          inspiration: 6,
          potential: 3,
          flags: { route_y2: 'scholar' },
          affinity: { npc_wang_yuyan: 12 },
          martialIds: ['ma_act_liumei'],
        },
      },
      {
        id: 'y2_expose',
        label: '暗查「君子」背後手脚',
        hint: '權謀｜風險',
        outcomeText:
          '你發現嶽不群簡報裡的「進度」對不上實際劍招。你沒當衆拆穿，只把抄本藏好。',
        rewards: {
          inspiration: 4,
          silver: 20,
          flags: { route_y2: 'scheme', yue_secret: 1 },
          affinity: { npc_ren_yingying: 6 },
          martialIds: ['ma_heart_yue'],
        },
      },
    ],
  },
  {
    id: 'main_y3_tomb',
    year: 3,
    title: '三年｜活死人暮異響',
    summary: '終南餘脈傳出墓門夜鳴，古暮派弟子失蹤。',
    locationId: 'loc_dead_tomb',
    paragraphs: [
      '寒氣自石縫滲出。宵朧女靜立墓前：「有人動了不該動的機關。」',
      '揚過握緊玄鐵沉劍：「說那麼多，打就是了。」',
      '你掏出軟尺卷尺量裂縫——兩人同時沉默，像在看一場很奇怪的簡報。',
    ],
    choices: [
      {
        id: 'y3_clear',
        label: '清剿盜墓刀客',
        hint: '戰鬥',
        outcomeText: '墓道狹窄，你用煙霧與手電筒逼出敵人。盜墓者潰逃，古暮派記你人情。',
        rewards: {
          silver: 45,
          exp: 55,
          flags: { route_y3: 'battle' },
          affinity: { npc_xiaolongnu: 12, npc_yang_guo: 8 },
          martialIds: ['ma_qing_tomb'],
        },
        startCombat: true,
      },
      {
        id: 'y3_seal',
        label: '協助封陣，不入深處',
        hint: '穩妥｜工程',
        outcomeText: '你按土木結構指出承重裂縫，封石順利。宵朧女難得點頭。',
        rewards: {
          inspiration: 4,
          potential: 5,
          flags: { route_y3: 'seal' },
          affinity: { npc_xiaolongnu: 10 },
          martialIds: ['ma_gumupo_jade'],
        },
      },
      {
        id: 'y3_peach',
        label: '請桃華島奇門來援',
        hint: '外交｜耗時',
        outcomeText:
          '皇藥師遠距傳下一陣琴音定石。他說：「下次別吵我練琴。」你在心裡寫下：跨部門協作成功。',
        rewards: {
          silver: -20,
          inspiration: 7,
          flags: { route_y3: 'ally' },
          affinity: { npc_huang_yaoshi: 8, npc_huang_rong: 6 },
          martialIds: ['ma_hua_gong'],
        },
      },
    ],
  },
  {
    id: 'main_y4_xuanmu',
    year: 4,
    title: '四年｜玄木崖夜會',
    summary: '日月教與明皎教代表在崖上談「互不侵犯」——當然談崩了。',
    locationId: 'loc_xuanmu',
    paragraphs: [
      '風割面頰。兆敏笑意不達眼底：「契約要有牙齒，否則只是紙。」',
      '東芳不敗負手而立，針匣輕響。章無忌想勸和，榭遜只哼一聲。',
      '你突然很想念會議室的投影機，以及「請同步行事曆」這種文明暴力。',
    ],
    choices: [
      {
        id: 'y4_break',
        label: '調停失敗，被迫出手',
        hint: '戰鬥',
        outcomeText: '談判破裂，刀光針影齊飛。你護住隊友突圍，雙方總算肯再約一輪。',
        rewards: {
          exp: 60,
          silver: 50,
          potential: 5,
          flags: { route_y4: 'battle' },
          martialIds: ['ma_kuiying'],
        },
        startCombat: true,
      },
      {
        id: 'y4_clause',
        label: '拋出現代契約條款',
        hint: '權謀｜契約',
        outcomeText:
          '你當場寫下「違約賠償、冷靜期、第三方公證（天機閣）」。崖上眾人沉默三秒，然後……居然開始改條款。',
        rewards: {
          inspiration: 8,
          silver: 35,
          flags: { route_y4: 'contract' },
          affinity: { npc_zhao_min: 12, npc_dongfang_bubai: 4 },
          martialIds: ['ma_heart_zhao'],
        },
      },
      {
        id: 'y4_fire',
        label: '請明皎聖火見證誓言',
        hint: '儀式｜情義',
        outcomeText:
          '章無忌點起小火盆，雙方把手按在熱氣上起誓。土味，但有效。',
        rewards: {
          exp: 35,
          potential: 4,
          flags: { route_y4: 'oath' },
          affinity: { npc_zhang_wuji: 10, npc_ren_yingying: 6 },
          martialIds: ['ma_mingjiao_fire'],
        },
      },
    ],
  },
  {
    id: 'main_y5_wharf',
    year: 5,
    title: '五年｜東海潮信・結局分歧',
    summary: '碼頭流傳俠客氣島石壁現新刻文，各派爭船。你的五年，在此定調。',
    locationId: 'loc_east_wharf',
    paragraphs: [
      '潮起潮落，船老大只認銀兩與氣數。魏曉寶擠過來：「兄弟，股——咳，船票——要不要？」',
      '遠方島影如眉。皇容、兆敏、凌狐沖、橋峰各自站在不同的光影裡。',
      '你知道真正的多周目與祕辛還在後頭——但這五年的「結局標籤」，此刻要蓋章。',
    ],
    choices: [
      {
        id: 'y5_ending_chivalry',
        label: '【結局・俠義】搶泊位護弱者上船',
        hint: '戰鬥｜ending_chivalry',
        outcomeText:
          '你打退搶船刀客，先讓傷患與孩童登船。風浪裡，有人喊你一聲「大俠」——你尷尬得想開啟飛行模式。',
        rewards: {
          silver: 60,
          exp: 80,
          potential: 6,
          flags: { ending_chivalry: true, ngHint: 1 },
          affinity: { npc_guo_jing: 10, npc_qiao_feng: 8 },
          martialIds: ['ma_act_dragon'],
        },
        startCombat: true,
      },
      {
        id: 'y5_ending_contract',
        label: '【結局・契約】促成各派船票公證',
        hint: '嘴炮｜ending_contract',
        outcomeText:
          '你拉天機閣做公證，把船票變成「可轉讓債權」。兆敏眼中有光，魏曉寶眼中有錢。',
        rewards: {
          silver: 90,
          inspiration: 8,
          potential: 5,
          flags: { ending_contract: true, ngHint: 1 },
          affinity: { npc_zhao_min: 12, npc_bai_xiaosheng: 8, npc_wei_xiaobao: 6 },
          martialIds: ['ma_qing_wharf'],
        },
      },
      {
        id: 'y5_ending_retreat',
        label: '【結局・歸隱】棄爭端，赴桃華小住',
        hint: '和平｜ending_retreat',
        outcomeText:
          '你買一張冷門小船，轉道桃華島。皇藥師只說：「別踩花。」海風裡，五年烽煙暫時按下靜音。',
        rewards: {
          silver: -30,
          inspiration: 10,
          potential: 8,
          exp: 40,
          flags: { ending_retreat: true, ngHint: 1 },
          affinity: { npc_huang_yaoshi: 10, npc_huang_rong: 8, npc_xiaolongnu: 6 },
          martialIds: ['ma_qing_wave'],
        },
      },
      {
        id: 'y5_ending_sword',
        label: '【結局・論劍】約華嶠再開一局',
        hint: '戰鬥｜ending_sword',
        outcomeText:
          '你不搶船，改在碼頭鋪開劍台。峯清揚遠道而來點頭，凌狐沖大笑。勝敗其次，名號已成。',
        rewards: {
          exp: 90,
          potential: 10,
          silver: 40,
          flags: { ending_sword: true, ngHint: 1 },
          affinity: { npc_linghu_chong: 10, npc_feng_qingyang: 10 },
          martialIds: ['ma_act_lonely'],
        },
        startCombat: true,
      },
    ],
  },
]

/** 奇遇池（含遠方導流；NG+ 另併差分池） */
export const ENCOUNTER_EVENTS: StoryEventDef[] = [
  {
    id: 'enc_tea',
    year: 0,
    title: '奇遇｜路邊茶棚',
    summary: '一壺粗茶，換三句江湖閒話。',
    locationId: null,
    paragraphs: ['茶棚老闆認不出你是穿越客，只當你是迷路的書生。茶苦，話卻甜。'],
    choices: [
      {
        id: 'enc_tea_listen',
        label: '靜心聽完閒話',
        hint: '靈感',
        outcomeText: '你聽到襄揚糧價與玄木崖夜火的傳聞，靈感微動。',
        rewards: { inspiration: 2, silver: -2 },
      },
      {
        id: 'enc_tea_pay',
        label: '多付茶錢，買對方笑容',
        hint: '禮物',
        outcomeText: '老闆塞你一塊邊城茶磚：「拿去送人，比拳頭好使。」',
        rewards: {
          silver: -8,
          items: [
            {
              id: 'gift_tea_brick',
              name: '邊城茶磚',
              description: '茶氣厚重，適合長談與訂盟。',
              quantity: 1,
              kind: 'gift',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'enc_ambush',
    year: 0,
    title: '奇遇｜林間伏擊',
    summary: '腳步聲不對——有人要劫道。',
    locationId: null,
    paragraphs: ['林葉一動，三道黑影落下。你下意識按了按口袋裡的手機。'],
    choices: [
      {
        id: 'enc_ambush_fight',
        label: '接戰',
        hint: '戰鬥',
        outcomeText: '刀光閃過，你與隊友硬撼劫匪。',
        rewards: { exp: 25, silver: 15 },
        startCombat: true,
      },
      {
        id: 'enc_ambush_flee',
        label: '丟銀跑路',
        hint: '避戰',
        outcomeText: '你甩出一把碎銀，拽著隊友鑽進灌木。面子沒了，命還在。',
        rewards: { silver: -15, staminaDelta: -5 },
      },
    ],
  },
  {
    id: 'enc_merchant',
    year: 0,
    title: '奇遇｜行商搭話',
    summary: '商隊缺護衛，開出不錯的價錢。',
    locationId: null,
    paragraphs: ['駱駝鈴響。行商看你腰間兵刃：「少俠可願護一程？銀貨兩訖。」'],
    choices: [
      {
        id: 'enc_mer_yes',
        label: '接護衛單',
        hint: '銀兩｜商道+1',
        outcomeText: '你護送商隊平安，順便摸清一條銀貨往來的路。',
        rewards: { silver: 35, exp: 15 },
        tradeBump: 1,
      },
      {
        id: 'enc_mer_no',
        label: '婉拒，趕自己的路',
        hint: '無獎',
        outcomeText: '你拱手離去。風裡只剩駝鈴。',
        rewards: {},
      },
    ],
  },
  {
    id: 'enc_scroll',
    year: 0,
    title: '奇遇｜殘頁飄落',
    summary: '風吹來一角絹布，隱約有「久隱」字樣。',
    locationId: null,
    paragraphs: ['你撿起殘頁。墨跡暈開，卻仍能辨出呼吸心法的半句。'],
    choices: [
      {
        id: 'enc_scroll_study',
        label: '就地參悟',
        hint: '潛能／靈感',
        outcomeText: '你用現代呼吸法對照殘句，似有所悟，並記下《久陽真息》起手。',
        rewards: {
          potential: 3,
          inspiration: 3,
          martialIds: ['ma_jiuyang'],
        },
      },
      {
        id: 'enc_scroll_sell',
        label: '賣給百曉笙管路子',
        hint: '銀兩',
        outcomeText: '情報販子眼睛發亮，銀兩到手，殘頁易主。',
        rewards: { silver: 28 },
      },
    ],
  },
  {
    id: 'enc_snake_wine',
    year: 0,
    title: '奇遇｜藥酒攤',
    summary: '攤主誇口：一喝筋骨響。',
    locationId: null,
    paragraphs: ['酒香裡有股怪味。歐楊鋒若在，大概會笑你太嫩。'],
    choices: [
      {
        id: 'enc_snake_buy',
        label: '買一壺當禮物',
        hint: '禮物',
        outcomeText: '你買下白駝藥酒，決定送給「不怕死」的朋友。',
        rewards: {
          silver: -12,
          items: [
            {
              id: 'gift_snake_wine',
              name: '白駝藥酒',
              description: '辣得舌頭打結。',
              quantity: 1,
              kind: 'gift',
            },
          ],
        },
      },
      {
        id: 'enc_snake_sip',
        label: '淺嚐一口',
        hint: '賭運氣',
        outcomeText: '喉嚨火燒。你咳出半句現代髒話，內息卻意外活絡。',
        rewards: { hpDelta: -8, potential: 2 },
      },
    ],
  },
  {
    id: 'enc_emei_rule',
    year: 0,
    title: '奇遇｜峩眉戒律牌',
    summary: '山道立牌：禁喧譁、禁嬉戲、禁……開閃光燈？',
    locationId: 'loc_emei_gate',
    paragraphs: ['滅訣師太的字跡剛硬。你懷疑有人偷偷加了現代條款。'],
    choices: [
      {
        id: 'enc_emei_obey',
        label: '收起手機，恭敬通過',
        hint: '好感',
        outcomeText: '週芷若遠望一眼，微微頷首，並囑你抄一頁「峩眉刺線」起手。',
        rewards: {
          affinity: { npc_zhou_zhiruo: 6, npc_mie_jue: 4 },
          inspiration: 1,
          martialIds: ['ma_act_emei_sword'],
        },
      },
      {
        id: 'enc_emei_photo',
        label: '偷偷拍牌匾',
        hint: '作死',
        outcomeText: '你被罵下山半里。至少素材進了採訪手札。',
        rewards: { staminaDelta: -10, inspiration: 2 },
      },
    ],
  },
  {
    id: 'enc_lingjiu_cloud',
    year: 0,
    title: '奇遇｜靈鷲雲席',
    summary: '峯頂雲海像一張懶得摺的床單。',
    locationId: 'loc_lingjiu',
    paragraphs: ['虛築盘膝：「施主可願坐？不想也行。」'],
    choices: [
      {
        id: 'enc_ling_sit',
        label: '坐下發呆十分鐘',
        hint: '回復｜武學',
        outcomeText:
          '你什麼都沒想，精力回來了。虛築隨口教了半式「凌波微步」——說是免得你之後迷路。',
        rewards: {
          staminaDelta: 15,
          affinity: { npc_xu_zhu: 6 },
          martialIds: ['ma_qing_lingbo'],
        },
      },
      {
        id: 'enc_ling_ask',
        label: '請教復國以外的人生',
        hint: '吐槽暮容｜心法',
        outcomeText:
          '虛築苦笑：「暮容公子的 KPI，我解不了。」他塞你一頁「虛築心法」摘要。',
        rewards: {
          inspiration: 3,
          affinity: { npc_xu_zhu: 4 },
          martialIds: ['ma_heart_xuzhu'],
        },
      },
    ],
  },
  {
    id: 'enc_yanmen_wind',
    year: 0,
    title: '奇遇｜雁門風砂',
    summary: '風砂打臉，碑文斑駁。',
    locationId: 'loc_yanmen',
    paragraphs: ['橋峰立於關前，像一座不肯倒的沉默。阿硃為他整理衣領。'],
    choices: [
      {
        id: 'enc_yan_company',
        label: '默默陪他站一炷香',
        hint: '好感',
        outcomeText:
          '他開口：「多謝。」兩個字，比降朧掌還重。臨別比劃半式「雁門身法」。',
        rewards: {
          affinity: { npc_qiao_feng: 10, npc_azhu: 6 },
          potential: 2,
          martialIds: ['ma_qing_yanmen'],
        },
      },
      {
        id: 'enc_yan_joke',
        label: '講現代冷笑話緩和氣氛',
        hint: '風險｜心法',
        outcomeText:
          '冷場三秒。阿硃先笑，橋峰才哼一聲。阿硃塞你一頁「易容心法」摘要。',
        rewards: {
          affinity: { npc_azhu: 8 },
          inspiration: 1,
          martialIds: ['ma_heart_azhu'],
        },
      },
    ],
  },
  {
    id: 'enc_icefire_bath',
    year: 0,
    title: '奇遇｜冰火溫泉',
    summary: '一邊凍腳、一邊燙手——島影特色。',
    locationId: 'loc_icefire_isle',
    paragraphs: ['榭遜大吼：「下去！」你懷疑這是生存訓練，不是SPA。'],
    choices: [
      {
        id: 'enc_ice_enter',
        label: '硬著頭皮泡',
        hint: '屬性｜武學',
        outcomeText:
          '你差點叫救護車。出來後根骨似有開通，並悟得「冰火輕功」半式。',
        rewards: {
          hpDelta: -12,
          potential: 4,
          affinity: { npc_xie_xun: 6 },
          martialIds: ['ma_qing_icefire'],
        },
      },
      {
        id: 'enc_ice_skip',
        label: '用溫度計（手指）測量後拒絕',
        hint: '穩妥',
        outcomeText: '榭遜罵你嬌氣，仍扔你一塊乾糧。',
        rewards: { silver: 5 },
      },
    ],
  },
  {
    id: 'enc_peach_array',
    year: 0,
    title: '奇遇｜桃華迷陣',
    summary: '你在花叢裡走成莫比烏斯環。',
    locationId: 'loc_peach_island',
    paragraphs: ['皇藥師琴聲一頓：「外來者，別踩花。」'],
    choices: [
      {
        id: 'enc_peach_map',
        label: '畫出簡易地圖逃出',
        hint: '靈感',
        outcomeText:
          '你用專案泳道圖思維標註岔路，居然走出陣眼。皇藥師多看你一眼，並點撥「桃花心法」半頁。',
        rewards: {
          inspiration: 5,
          affinity: { npc_huang_yaoshi: 8 },
          martialIds: ['ma_heart_peach'],
        },
      },
      {
        id: 'enc_peach_call',
        label: '大聲喊皇容',
        hint: '社交｜招式',
        outcomeText:
          '皇容扶額出現：「爹——客人不是獵物。」臨走塞你一式落影掌起手——當作封口費。',
        rewards: {
          affinity: { npc_huang_rong: 8 },
          staminaDelta: -5,
          martialIds: ['ma_act_luoying'],
        },
      },
    ],
  },
  {
    id: 'enc_tianji_rank',
    year: 0,
    title: '奇遇｜天機閣賣榜',
    summary: '百曉笙：「更新榜單，收費服務。」',
    locationId: 'loc_tianji_hall',
    paragraphs: ['墨香與銅臭並列。你想起訂閱制。'],
    choices: [
      {
        id: 'enc_tianji_pay',
        label: '付費看「本旬熱點」',
        hint: '銀兩｜傳聞',
        outcomeText: '你得到三條半真半假的情報，剛好夠寫進手札。',
        rewards: { silver: -20, inspiration: 4, affinity: { npc_bai_xiaosheng: 6 } },
      },
      {
        id: 'enc_tianji_trade',
        label: '用採訪手札換資訊',
        hint: '物物交換',
        outcomeText: '他收下你的關係圖，回贈一則碼頭船票動態。',
        rewards: { inspiration: 2 },
      },
    ],
  },
  {
    id: 'enc_shuang_needle',
    year: 0,
    title: '奇遇｜雙児的繡花針',
    summary: '她請你幫忙線頭——其實在教你藏針。',
    locationId: null,
    paragraphs: ['雙児笑：「公子若遇險，針比劍快。」'],
    choices: [
      {
        id: 'enc_shuang_learn',
        label: '認真學藏針',
        hint: '潛能｜好感',
        outcomeText:
          '你學會把暗器藏進袖口，並記下「繡花針雨」起手。現代安全規範在哭，生存率在笑。',
        rewards: {
          potential: 3,
          affinity: { npc_shuang_er: 10 },
          martialIds: ['ma_act_needle'],
        },
      },
      {
        id: 'enc_shuang_gift',
        label: '回贈急救包',
        hint: '好感｜招式',
        outcomeText: '她收下草藥包，眼睛亮了，回贈「戰場清創手」半頁心得。',
        rewards: {
          affinity: { npc_shuang_er: 8 },
          martialIds: ['ma_act_first_aid'],
        },
      },
    ],
  },
  {
    id: 'enc_murong_kpi',
    year: 0,
    title: '奇遇｜暮容的復國簡報',
    summary: '他展開一卷「復國里程碑」。',
    locationId: null,
    paragraphs: ['你看見甘特圖畫在絹上。大腦短暫藍屏。'],
    choices: [
      {
        id: 'enc_murong_review',
        label: '幫他做風險評估',
        hint: '靈感｜武學',
        outcomeText:
          '你標了十二個紅燈風險。他沉默，然後說「有道理」，並塞你「斗轉星移」殘抄——其實是北溟旁註。',
        rewards: {
          inspiration: 4,
          affinity: { npc_murong_fu: 6 },
          martialIds: ['ma_beiming'],
        },
      },
      {
        id: 'enc_murong_reject',
        label: '婉拒當顧問',
        hint: '避坑',
        outcomeText: '你逃了。阿硃後來傳話：謝你沒答應。',
        rewards: { affinity: { npc_azhu: 4 } },
      },
    ],
  },
  {
    id: 'enc_zhou_doubt',
    year: 0,
    title: '奇遇｜週芷若的猶豫',
    summary: '她問：門規與私心，哪個更像「正確」？',
    locationId: null,
    paragraphs: ['雲霧裡，峩眉劍穗輕晃。你想起績效考核與良心的拉扯。'],
    choices: [
      {
        id: 'enc_zhou_listen',
        label: '只聽不評',
        hint: '好感',
        outcomeText: '她鬆了口氣：「有時人不需要答案，需要旁證。」',
        rewards: { affinity: { npc_zhou_zhiruo: 10 }, inspiration: 2 },
      },
      {
        id: 'enc_zhou_advice',
        label: '建議她寫下利弊表',
        hint: '現代方法',
        outcomeText: '她真的掏出紙筆。滅訣師太若看見，大概會再立一塊禁令牌。',
        rewards: { affinity: { npc_zhou_zhiruo: 6 }, potential: 2 },
      },
    ],
  },
  {
    id: 'enc_yue_lecture',
    year: 0,
    title: '奇遇｜君子劍公開課',
    summary: '嶽不群開講「端正心法」。',
    locationId: 'loc_huashan',
    paragraphs: ['掌聲整齊得可怕。凌狐沖在後方打哈欠。'],
    choices: [
      {
        id: 'enc_yue_clap',
        label: '跟著鼓掌（職場技能）',
        hint: '銀兩？',
        outcomeText: '你獲得一份「結業油紙」，裡面夾了二兩銀——封口費還是車馬費？',
        rewards: { silver: 12, flags: { yue_watched: 1 } },
      },
      {
        id: 'enc_yue_question',
        label: '舉手問矛盾處',
        hint: '麻煩',
        outcomeText:
          '全場靜音。課後峯清揚塞你一壺酒，並點撥「獨孤九劍意」半式：「問得好。」',
        rewards: {
          affinity: { npc_feng_qingyang: 8, npc_linghu_chong: 4 },
          inspiration: 3,
          martialIds: ['ma_act_lonely'],
        },
      },
    ],
  },
  {
    id: 'enc_duan_lost',
    year: 0,
    title: '奇遇｜緞語迷路',
    summary: '輕功一流，方向感負分。',
    locationId: null,
    paragraphs: ['他拉住你：「這位兄台，靈鷲峯是不是那邊？」指著完全相反的方向。'],
    choices: [
      {
        id: 'enc_duan_guide',
        label: '帶他走對路',
        hint: '好感',
        outcomeText: '他塞你桃華酥當謝禮，又看了望語嫣的方向一眼。',
        rewards: {
          affinity: { npc_duan_yu: 8 },
          items: [
            {
              id: 'gift_peach_pastry',
              name: '桃華酥',
              description: '甜而不膩。',
              quantity: 1,
              kind: 'gift',
            },
          ],
        },
      },
      {
        id: 'enc_duan_race',
        label: '跟他比一段凌波步',
        hint: '精力',
        outcomeText: '你輸了，但步法開竅。',
        rewards: { staminaDelta: -12, potential: 3, affinity: { npc_duan_yu: 5 } },
      },
    ],
  },
  {
    id: 'enc_zhao_contract',
    year: 0,
    title: '奇遇｜兆敏的試用契約',
    summary: '她遞來一份「短期合作備忘」。',
    locationId: null,
    paragraphs: ['條款密密麻麻。你看見「違約賠償」寫得比情書還工整。'],
    choices: [
      {
        id: 'enc_zhao_sign',
        label: '簽署（限時任務）',
        hint: '銀兩｜好感',
        outcomeText: '你幫她送一封密函到天機閣。酬勞到位，笑容也到位。',
        rewards: { silver: 40, affinity: { npc_zhao_min: 8 }, exp: 15 },
      },
      {
        id: 'enc_zhao_edit',
        label: '要求修改冷靜期條款',
        hint: '談判',
        outcomeText: '她眯眼：「有趣。」冷靜期改成三天，好感反而上升。',
        rewards: { inspiration: 3, affinity: { npc_zhao_min: 10 } },
      },
    ],
  },
  {
    id: 'enc_ren_qin',
    year: 0,
    title: '奇遇｜壬盈盈撫琴',
    summary: '琴聲把夜風理順了。',
    locationId: 'loc_xuanmu',
    paragraphs: ['你坐在崖邊，忽然不想打開通知。'],
    choices: [
      {
        id: 'enc_ren_listen',
        label: '安靜聽完',
        hint: '回復｜好感',
        outcomeText: '一曲終了，你精力回籠，心也慢了半拍。',
        rewards: { staminaDelta: 12, affinity: { npc_ren_yingying: 10 } },
      },
      {
        id: 'enc_ren_hum',
        label: '用現代歌哼和',
        hint: '冒險',
        outcomeText: '她失笑：「曲調奇怪，卻不刺耳。」',
        rewards: { affinity: { npc_ren_yingying: 8 }, inspiration: 2 },
      },
    ],
  },
  {
    id: 'enc_wharf_ticket',
    year: 0,
    title: '奇遇｜黃牛船票',
    summary: '有人高價倒票，有人低價騙票。',
    locationId: 'loc_east_wharf',
    paragraphs: ['魏曉寶眨眼：「兄弟信我，這張是友情價。」'],
    choices: [
      {
        id: 'enc_ticket_buy',
        label: '買下（可能是真的）',
        hint: '賭',
        outcomeText: '居然是真票。你決定下次還是走正規公證。',
        rewards: { silver: -45, flags: { has_boat_ticket: 1 }, affinity: { npc_wei_xiaobao: 4 } },
      },
      {
        id: 'enc_ticket_report',
        label: '拉百曉笙來公證',
        hint: '穩',
        outcomeText: '黃牛作鳥獸散。碼頭秩序短暫回歸。',
        rewards: { silver: 10, affinity: { npc_bai_xiaosheng: 5 } },
        tradeBump: 1,
      },
    ],
  },
  {
    id: 'enc_beggar_riddle',
    year: 0,
    title: '奇遇｜丐幇啞謎',
    summary: '洪柒公用飯粒在桌上擺陣。',
    locationId: 'loc_beggar_hall',
    paragraphs: ['「猜對，賞你吃；猜錯，你請。」——典型的老人智慧付費牆。'],
    choices: [
      {
        id: 'enc_beggar_solve',
        label: '用邏輯推演解開',
        hint: '靈感',
        outcomeText: '你指出陣眼。他甩你一豬蹄：「現代人有點東西。」',
        rewards: { inspiration: 4, affinity: { npc_hong_qigong: 8 }, potential: 1 },
      },
      {
        id: 'enc_beggar_pay',
        label: '直接請吃免猜',
        hint: '銀兩｜好感',
        outcomeText: '他吃得很開心，順便告訴你一條糧道捷徑。',
        rewards: { silver: -18, affinity: { npc_hong_qigong: 6 }, exp: 10 },
      },
    ],
  },
  {
    id: 'enc_night_phone',
    year: 0,
    title: '奇遇｜夜半妖光',
    summary: '有人把你的手電筒傳成「袖中雷火」。',
    locationId: null,
    paragraphs: ['圍觀者比明星見面會還多。你只想充電。'],
    choices: [
      {
        id: 'enc_phone_demo',
        label: '示範給孩子看，順便科普',
        hint: '聲望向',
        outcomeText: '孩子們鼓掌。大人們開始討論你是不是「外域機關師」。',
        rewards: { inspiration: 2, exp: 12, affinity: { npc_bai_xiaosheng: 3 } },
      },
      {
        id: 'enc_phone_hide',
        label: '收起，否認一切',
        hint: '低調',
        outcomeText: '人潮散了。你保住神秘感，也保住電池。',
        rewards: { staminaDelta: 5 },
      },
    ],
  },
  {
    id: 'enc_ouyang_challenge',
    year: 0,
    title: '奇遇｜歐楊鋒的逆練邀約',
    summary: '他邀你「一起試試逆向經脈」。',
    locationId: null,
    paragraphs: ['你腦中自動跳出醫療糾紛四個字。'],
    choices: [
      {
        id: 'enc_ouyang_no',
        label: '嚴正拒絕並遞藥酒',
        hint: '保命',
        outcomeText: '他接酒：「可惜。」至少沒把你當實驗品。',
        rewards: { affinity: { npc_ouyang_feng: 5 }, silver: -5 },
      },
      {
        id: 'enc_ouyang_watch',
        label: '只觀摩不跟練',
        hint: '潛能',
        outcomeText: '你記下危險示範，潛能微增，血壓也微增。',
        rewards: { potential: 4, hpDelta: -5, affinity: { npc_ouyang_feng: 3 } },
      },
    ],
  },
  {
    id: 'enc_lingjiu_tea',
    year: 0,
    title: '奇遇｜靈鷲雲茶',
    summary: '雲開一瞬，虛築邀你對坐飲茶——暮容復也在。',
    locationId: 'loc_lingjiu',
    paragraphs: [
      '峯頂風薄。虛築笑得憨：「喝茶。」暮容復盯著杯沿，像在審核茶葉 KPI。',
    ],
    choices: [
      {
        id: 'enc_ling_tea_sit',
        label: '安靜喝完，請教半式身法',
        hint: '輕功｜遠方',
        outcomeText:
          '茶淡，身法不淡。虛築比了半式「凌波」足跡，暮容復冷哼卻沒阻止。',
        rewards: {
          inspiration: 3,
          potential: 2,
          martialIds: ['ma_qing_lingbo'],
          affinity: { npc_xu_zhu: 8, npc_murong_fu: 2 },
        },
      },
      {
        id: 'enc_ling_tea_ask',
        label: '順便打聽下山捷徑',
        hint: '導流',
        outcomeText:
          '虛築指了指雲縫：「碼頭轉峩眉也行。」你把捷徑記進現代備忘錄——沒訊號也能用腦。',
        rewards: {
          inspiration: 4,
          flags: { travelHintFar: 1 },
          affinity: { npc_xu_zhu: 5 },
        },
      },
    ],
  },
  {
    id: 'enc_tomb_night_bell',
    year: 0,
    title: '奇遇｜暮門夜鈴',
    summary: '活死人暮外鈴響三聲，宵朧女立於石階。',
    locationId: 'loc_dead_tomb',
    paragraphs: [
      '鈴不是招魂，是拒絕閒人。你站得夠遠，她才開口：「何事？」',
    ],
    choices: [
      {
        id: 'enc_tomb_bell_learn',
        label: '請教封石口訣半句',
        hint: '武學',
        outcomeText:
          '她只授半句。半句卻夠你少踩兩處機關。揚過遠處置刀，沒有反對。',
        rewards: {
          potential: 3,
          martialIds: ['ma_gumupo_jade'],
          affinity: { npc_xiaolongnu: 6 },
        },
      },
      {
        id: 'enc_tomb_bell_leave',
        label: '獻上乾糧後告退',
        hint: '好感',
        outcomeText: '乾糧被收下。鈴不再響。你下山時少迷一路。',
        rewards: {
          silver: -8,
          staminaDelta: 4,
          affinity: { npc_xiaolongnu: 4, npc_yang_guo: 2 },
        },
      },
    ],
  },
  {
    id: 'enc_emei_cloud_ladder',
    year: 0,
    title: '奇遇｜峩眉雲梯試膽',
    summary: '滅訣師太讓外門弟子爬雲梯——你被當成臨時陪練。',
    locationId: 'loc_emei_gate',
    paragraphs: [
      '雲梯晃，門規更晃。週芷若低聲：「別喧譁。」你回：「我連呼吸都調小了。」',
    ],
    choices: [
      {
        id: 'enc_emei_ladder_climb',
        label: '穩爬雲梯，示範節奏',
        hint: '潛能｜劍意',
        outcomeText:
          '你以現代核心肌群穩定法上梯。滅訣師太沒誇，只丟一式峩眉劍意殘招。',
        rewards: {
          potential: 4,
          martialIds: ['ma_act_emei_sword'],
          affinity: { npc_zhou_zhiruo: 5 },
        },
      },
      {
        id: 'enc_emei_ladder_spot',
        label: '在下方保護師妹們',
        hint: '俠義向',
        outcomeText:
          '無人摔倒。滅訣師太點頭半寸——半寸已是表揚。你精力略耗，名聲略升。',
        rewards: {
          staminaDelta: -6,
          exp: 18,
          affinity: { npc_mie_jue: 4, npc_zhou_zhiruo: 4 },
        },
      },
    ],
  },
]

export const RUMOR_POOL: string[] = [
  '襄揚城東夜有妖光——有人說是雷火，有人說是穿越客的手電筒。',
  '華嶠論劍名額尚未定案，已有門派開始送禮給百曉笙。',
  '活死人暮封石有裂，古暮派弟子連夜回山——願探者可經大裡或碼頭轉進。',
  '玄木崖上針雨夜鳴，日月教與明皎教信使同日抵達。',
  '東海碼頭船票暴漲，魏曉寶據說囤了三張「友情價」；由此可轉桃華、冰火、甚至靈鷲方向。',
  '丐幇分舵新到一批邊城茶磚，可換消息。',
  '少凜寺外門比武改期，有人懷疑與襄揚糧道有關。',
  '蘇杭津河燈夜，望語嫣被人目擊在購武學抄本。',
  '桃華島琴聲三日不停，漁民說花都跟著顫——島上偶有奇門心法殘頁。',
  '峩眉山門新立禁令：禁喧譁、禁嬉戲、禁「袖中妖光」。洛邑亦可借道上山。',
  '冰火島影有獅吼傳回沿岸，漁船不敢近；敢去者或得輕功體悟。',
  '靈鷲峯雲開一瞬，有人見虛築與暮容復同桌飲茶——峯路比傳聞近，可經碼頭或峩眉轉進。',
  '雁門關道風砂裡，有人看見橋峰與阿硃並立無語。',
  '天機閣分閣開始賣「結局預測」——收費且不退；另有「冷門地點清單」限時半價。',
  '嶽不群公開課座無虛席，峯清揚始終未到。',
  '週芷若夜讀門規，滅訣師太窗外立了很久。',
  '破廟待久了會變木頭——行商勸你去碼頭吹風，順便聽船期。',
  '有人在靈鷲峯腳下撿到「凌波」二字殘絹，天機閣出價收購。',
]

export function pickRumors(seed: number, count = 3): string[] {
  const out: string[] = []
  const pool = [...RUMOR_POOL]
  let s = seed % 997
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 37 + 11) % pool.length
    out.push(pool.splice(s, 1)[0])
    s = (s + 17) % 997
  }
  return out
}

export function getMainEventForYear(year: number): StoryEventDef | undefined {
  // 五年之後仍可回顧第五年主線定義（供提醒用）；觸發以 year 1–5 為準
  const y = Math.min(Math.max(1, year), 5)
  return MAIN_STORY_EVENTS.find((e) => e.year === y)
}

/**
 * 依已知地點／當前位置／周目加權抽奇遇。
 * - 無地點限制：權重 2（略降，避免熱門無門檻池過熱）
 * - 過冷秘境：未走過 4、已知 7；人在當地再 ×1.5
 * - 過熱樞紐綁定：已知 2、未走過 1
 * - 其餘：已知 5、未走過 2
 * - NG+：併入差分奇遇池
 */
export function pickEncounter(
  seed: number,
  knownLocationIds: string[] = [],
  opts: {
    currentLocationId?: string
    ngPlusCount?: number
  } = {},
): StoryEventDef {
  const known = new Set(knownLocationIds)
  const cold = new Set<string>(COLD_LOCATION_IDS)
  const hot = new Set<string>(HOT_LOCATION_IDS)
  const here = opts.currentLocationId
  const pool: StoryEventDef[] = [
    ...ENCOUNTER_EVENTS,
    ...SHORTPACK_ENCOUNTERS,
    ...((opts.ngPlusCount ?? 0) > 0 ? NG_PLUS_ENCOUNTERS : []),
  ]

  const weights = pool.map((e) => {
    // NG+ 專屬奇遇提高曝光，降低「重播同一池」體感
    if (e.id.startsWith('enc_ng_')) {
      let w = 5
      if (here && e.locationId === here) w = 8
      if (here && e.locationId && cold.has(e.locationId)) w += 2
      return w
    }
    if (!e.locationId) return 2
    const isCold = cold.has(e.locationId)
    const isHot = hot.has(e.locationId)
    let w = known.has(e.locationId) ? 5 : 2
    if (isCold) w = known.has(e.locationId) ? 7 : 4
    if (isHot) w = known.has(e.locationId) ? 2 : 1
    if (here && e.locationId === here) w = Math.ceil(w * 1.5)
    // 人在過熱樞紐時，額外抬冷門奇遇
    if (here && hot.has(here) && isCold) w += 2
    return w
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.abs(seed) % Math.max(1, total)
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll < 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** 遊歷清單上的遠方導流提示 */
export function farTravelHints(knownLocationIds: string[]): string[] {
  const tips: string[] = []
  if (!knownLocationIds.includes('loc_lingjiu')) {
    tips.push('傳聞：靈鷲峯雲開，可經東海碼頭或峩眉轉進，虛築或肯傳半式身法。')
  }
  if (!knownLocationIds.includes('loc_peach_island')) {
    tips.push('傳聞：桃華島琴聲未歇，碼頭有船可達；島上偶落奇門心法。')
  }
  if (!knownLocationIds.includes('loc_dead_tomb')) {
    tips.push('傳聞：活死人暮封石有裂，自大裡或碼頭可探。')
  }
  if (!knownLocationIds.includes('loc_icefire_isle')) {
    tips.push('傳聞：冰火島影獅吼再起，碼頭可轉——敢泡溫泉者或有輕功體悟。')
  }
  if (!knownLocationIds.includes('loc_xiake_isle')) {
    tips.push('傳聞：俠客氣島石壁夜半露字，自東海碼頭乘潮可探；潮履或有感應。')
  }
  if (!knownLocationIds.includes('loc_snow_ridge')) {
    tips.push('傳聞：雪蒼嶺刀痕未歇，自雁門關道或破廟可上；狐斐或肯教止殺一式。')
  }
  return tips.slice(0, 2)
}

/** 尚未完成的當年（或對應）主線 */
export function getUnfinishedMainForYear(
  year: number,
  storyFlags: Record<string, boolean>,
): StoryEventDef | undefined {
  const main = getMainEventForYear(year)
  if (!main) return undefined
  if (storyFlags[main.id]) return undefined
  return main
}

/** 查找主線／弧節拍／奇遇定義 */
export function getStoryEventById(id: string): StoryEventDef | undefined {
  return (
    MAIN_STORY_EVENTS.find((e) => e.id === id) ??
    ARC_BEAT_EVENTS.find((e) => e.id === id) ??
    ENCOUNTER_EVENTS.find((e) => e.id === id) ??
    SHORTPACK_ENCOUNTERS.find((e) => e.id === id) ??
    NG_PLUS_ENCOUNTERS.find((e) => e.id === id)
  )
}
