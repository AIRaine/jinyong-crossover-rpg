import type { StoryEventDef } from '../types/game'

/** 旬名 */
export const XUN_LABELS = ['上旬', '中旬', '下旬'] as const

/** 至少 5 年主線大事件骨架 */
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
    ],
    choices: [
      {
        id: 'y1_guard',
        label: '護送糧車，硬撼刀客',
        hint: '觸發戰鬥｜聲望與銀兩',
        outcomeText:
          '你率隊友沿官道推進，刀客果然劫營。一番混戰後糧車保全，襄揚守軍記你一功。',
        rewards: { silver: 40, exp: 40, potential: 4, inspiration: 2 },
        startCombat: true,
      },
      {
        id: 'y1_scout',
        label: '夜探敵營，只取情報',
        hint: '避戰｜靈感與傳聞',
        outcomeText:
          '你用手電筒短暫照明標記敵哨位置，把情報賣給天機閣掛名散人。沒打起來，但消息比拳頭值錢。',
        rewards: { silver: 25, inspiration: 5, potential: 2 },
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
      '你想起現代職場的 KPI 競賽，忽然覺得論劍也沒那麼玄。',
    ],
    choices: [
      {
        id: 'y2_spar',
        label: '上台切磋，打出名聲',
        hint: '戰鬥｜潛能',
        outcomeText: '劍台三合，你以現代節奏感拆招，險勝。華嶠弟子開始記得你的名號。',
        rewards: { exp: 50, potential: 6, silver: 30 },
        startCombat: true,
      },
      {
        id: 'y2_judge',
        label: '擔任記錄，整理招式筆記',
        hint: '穩妥｜悟性向獎勵',
        outcomeText:
          '你把各派招式寫成「對照表」，望語嫣翻了兩頁眼睛發亮。筆記本身就是禮物。',
        rewards: { inspiration: 6, potential: 3, affinity: { npc_wang_yuyan: 10 } },
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
    ],
    choices: [
      {
        id: 'y3_clear',
        label: '清剿盜墓刀客',
        hint: '戰鬥',
        outcomeText: '墓道狹窄，你用煙霧與手電筒逼出敵人。盜墓者潰逃，古暮派記你人情。',
        rewards: { silver: 45, exp: 55, affinity: { npc_xiaolongnu: 12 } },
        startCombat: true,
      },
      {
        id: 'y3_seal',
        label: '協助封陣，不入深處',
        hint: '穩妥',
        outcomeText: '你按土木結構指出承重裂縫，封石順利。宵朧女難得點頭。',
        rewards: { inspiration: 4, potential: 5, affinity: { npc_xiaolongnu: 8 } },
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
      '東芳不敗負手而立，針匣輕響。你突然很想念會議室的投影機。',
    ],
    choices: [
      {
        id: 'y4_break',
        label: '調停失敗，被迫出手',
        hint: '戰鬥',
        outcomeText: '談判破裂，刀光針影齊飛。你護住隊友突圍，雙方總算肯再約一輪。',
        rewards: { exp: 60, silver: 50, potential: 5 },
        startCombat: true,
      },
      {
        id: 'y4_clause',
        label: '拋出現代契約條款',
        hint: '嘴炮路線',
        outcomeText:
          '你當場寫下「違約賠償、冷靜期、第三方公證（天機閣）」。崖上眾人沉默三秒，然後……居然開始改條款。',
        rewards: { inspiration: 8, silver: 35, affinity: { npc_zhao_min: 10 } },
      },
    ],
  },
  {
    id: 'main_y5_wharf',
    year: 5,
    title: '五年｜東海潮信',
    summary: '碼頭流傳俠客氣島石壁現新刻文，各派爭船。',
    locationId: 'loc_east_wharf',
    paragraphs: [
      '潮起潮落，船老大只認銀兩與氣數。魏曉寶擠過來：「兄弟，股——咳，船票——要不要？」',
      '遠方島影如眉。你知道真正的多周目與祕辛還在後頭，但這五年，總得先活著上船。',
    ],
    choices: [
      {
        id: 'y5_fight_berth',
        label: '搶泊位，打退對手',
        hint: '戰鬥｜銀兩',
        outcomeText: '碼頭混戰，你以陣型與手電筒擾亂對手視線，搶下一艘快船的合約。',
        rewards: { silver: 80, exp: 70, potential: 6 },
        startCombat: true,
      },
      {
        id: 'y5_buy',
        label: '砸錢買票，低調出海',
        hint: '耗銀兩',
        outcomeText: '你付足銀兩，船老大笑得像現代業務達標。風浪裡，新篇章的門縫打開了。',
        rewards: { silver: -40, inspiration: 5, potential: 4, exp: 40 },
      },
    ],
  },
]

/** 若干奇遇 */
export const ENCOUNTER_EVENTS: StoryEventDef[] = [
  {
    id: 'enc_tea',
    year: 0,
    title: '奇遇｜路邊茶棚',
    summary: '一壺粗茶，換三句江湖閒話。',
    locationId: null,
    paragraphs: [
      '茶棚老闆認不出你是穿越客，只當你是迷路的書生。茶苦，話卻甜。',
    ],
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
        hint: '好感預留',
        outcomeText: '老闆塞你一塊邊城茶磚：「拿去送人，比拳頭好使。」',
        rewards: { silver: -8, items: [{ id: 'gift_tea_brick', name: '邊城茶磚', description: '茶氣厚重，適合長談與訂盟。', quantity: 1, kind: 'gift' }] },
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
        outcomeText: '你護送商隊平安，順便摸清一條銀貨往來的路——商道經驗上漲。',
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
        outcomeText: '你用現代呼吸法對照殘句，似有所悟。',
        rewards: { potential: 3, inspiration: 3 },
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
]

export const RUMOR_POOL: string[] = [
  '襄揚城東夜有妖光——有人說是雷火，有人說是穿越客的手電筒。',
  '華嶠論劍名額尚未定案，已有門派開始送禮給百曉笙。',
  '活死人暮封石有裂，古暮派弟子連夜回山。',
  '玄木崖上針雨夜鳴，日月教與明皎教信使同日抵達。',
  '東海碼頭船票暴漲，魏曉寶據說囤了三張「友情價」。',
  '丐幇分舵新到一批邊城茶磚，可換消息。',
  '少凜寺外門比武改期，有人懷疑與襄揚糧道有關。',
  '蘇杭津河燈夜，望語嫣被人目擊在購武學抄本。',
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
  return MAIN_STORY_EVENTS.find((e) => e.year === year)
}

export function pickEncounter(seed: number): StoryEventDef {
  const idx = Math.abs(seed) % ENCOUNTER_EVENTS.length
  return ENCOUNTER_EVENTS[idx]
}
