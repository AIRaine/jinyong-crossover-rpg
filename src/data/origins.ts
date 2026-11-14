import type { OriginDef, TechNodeDef } from '../types/game'

/** 六種現代穿越職業——小傳／獨白／過渡敘事寫滿 */
export const ORIGINS: OriginDef[] = [
  {
    id: 'origin_er_doctor',
    name: '急診醫師',
    summary: '止血包紮信手拈來，雨夜破廟也能開臨時診療。',
    flavor: '你穿越時還掛著聽診器。江湖人以為那是奇特的護心鏡。',
    bio: '你在都會醫院急診輪值了七年。分級檢傷、氣管插管、安撫家屬，流程像刻在肌肉裡。同事說你「冷靜得像儀器」——其實你只是把崩潰排到下班後的捷運上。',
    crossoverHook:
      '連續三十六小時後，你靠牆灌冰美式，心電圖警報此起彼落。眼前忽然白了一下——不是燈光故障，是整個人像被抽離值班表。再睜眼，雨打在破廟瓦上。',
    tags: ['冷靜', '救人優先', '黑眼圈專業戶'],
    monologue:
      '第一反應不是「我穿越了」，而是「傷患在哪、氣道通不通」。聽診器還在，手機沒訊號——好，至少還有兩樣能用的東西。',
    passiveText:
      '戰鬥後與傷勢相關回復更穩；開局即懂「止血包紮」。面對流血場景不易慌亂。',
    startingItemBlurb: '急救草藥包：以現代分類裝好的止血散與清創布。',
    startingTechBlurb: '起始科技「止血包紮」：無菌觀念處理刀傷擦傷。',
    transitPages: [
      '螢幕上的生命徵象還在跳。你聽見自己說：「再給我一瓶——」聲音卻像隔著水。',
      '咖啡涼了。護理師的身影拉長、模糊。你想起來：明天還有教學查房、論文deadline、房租。',
      '然後，警報聲被雨聲取代。泥土味灌進鼻腔。你趴在冷石板上，聽診器冰得像嘲諷。',
    ],
    bonuses: {
      maxHp: 20,
      maxStamina: 10,
      defense: 2,
      inspiration: 8,
      silver: 20,
    },
    startingTechIds: ['tech_med_1'],
    startingItemIds: ['gift_herb_kit'],
  },
  {
    id: 'origin_engineer',
    name: '資訊工程師',
    summary: '邏輯清晰，善拆機關；手機沒訊號也能當手電筒。',
    flavor: '你習慣把問題拆成可重現的步驟——哪怕對方是一把鐵門。',
    bio: '你寫過支付、後台、鬼打牆的舊系統。最擅長的不是炫技，是把「再掛一次就好」變成可追蹤的票。加班對你不是榮譽，是預設選項。',
    crossoverHook:
      '上線夜，監控全綠，你卻在座位上睡著。夢裡有人把 stack trace 念成咒語。醒來時，螢幕亮著——那是你的手電筒模式，照著漏雨的梁柱。',
    tags: ['邏輯控', '夜貓', '先復現再修'],
    monologue:
      '沒有 Wi‑Fi、沒有文件、只有一把可能會響的手機。好。先盤點資源，再定義「活過今晚」這個 MVP。',
    passiveText:
      '機關與夜戰思路較佳；開局即懂「手電筒戰術」。面對謎題傾向拆步驟而非硬撞。',
    startingItemBlurb: '奇巧草圖：槓桿與機關的原子筆示意，天機閣會眼熱。',
    startingTechBlurb: '起始科技「手電筒戰術」：夜戰強光擾亂、爭取先手。',
    transitPages: [
      'Slack 還在跳：@here 拜托看一下。你回了一個「ok」，手指卻抬不起來。',
      '螢幕光刺眼。你想起沒交的 code review、沒吃的晚餐、沒睡的週末。',
      '光熄了。雨聲極大。你按亮手機——訊號格全空，手電筒卻忠實地照出一尊落塵的神像。',
    ],
    bonuses: {
      maxInternalForce: 15,
      attack: 2,
      inspiration: 10,
      silver: 15,
    },
    startingTechIds: ['tech_gadget_1'],
    startingItemIds: ['gift_blueprint'],
  },
  {
    id: 'origin_coach',
    name: '體育教練',
    summary: '體能底子厚，短跑、負重、呼吸節奏皆有章法。',
    flavor: '你第一反應不是怕刀，而是想糾正對方的出拳重心。',
    bio: '你帶過高中隊、社區班，也罵過自己「又把課表排太滿」。你相信汗水誠實：姿勢錯了會痛，態度飄了會輸。',
    crossoverHook:
      '操場夜跑收操，胸悶來得又急又乾脆。你還想喊「大家拉伸」，視野卻先黑了。再醒時，雨比哨音還響，你下意識先檢查自己的腳踝。',
    tags: ['熱血', '紀律', '先活動再開會'],
    monologue:
      '這裡沒有跑道，但有人要動手。重心、呼吸、步伐——武道和訓練其實共用同一本講義。',
    passiveText:
      '精力與爆發較佳；開局即懂「間歇訓練」。長途奔走與近身對抗更耐操。',
    startingItemBlurb: '能量硬糕：包裝刺眼，卻能頂半日腳力。',
    startingTechBlurb: '起始科技「間歇訓練」：短衝與休息交替，精力上限較易堆。',
    transitPages: [
      '秒錶還停在你設的配速。隊員的笑聲遠去，只剩自己的心跳像鼓。',
      '你想起沒簽的保險、沒回的訊息、還有那句「教練你也休息一下」。',
      '雨打在臉上。你撐起身，第一句差點喊「集合！」——周圍只有破廟與雷。',
    ],
    bonuses: {
      maxHp: 15,
      maxStamina: 25,
      attack: 3,
      inspiration: 6,
      silver: 10,
    },
    startingTechIds: ['tech_body_1'],
    startingItemIds: ['gift_protein_bar'],
  },
  {
    id: 'origin_reporter',
    name: '新聞記者',
    summary: '擅長打聽、記錄與拆穿謊言，人脈比拳頭快半步。',
    flavor: '你口袋裡永遠有原子筆——在這時代，它被當成細短的鐵籤。',
    bio: '你跑過社會線、突發、也寫過被拔掉的稿。你相信紀錄本身是一種抵抗：誰說了什麼、誰沉默、誰在笑。',
    crossoverHook:
      '截稿前十分鐘，你在採訪車後座補眠。雨刷聲太規律，像倒數。醒來時車沒了，稿紙變成泥地，原子筆還在——墨水居然沒漏。',
    tags: ['好奇', '嘴炮', '證據癖'],
    monologue:
      '這場景若發稿，標題會很聳：〈現代人墜入雨夜破廟〉。但先活著，才有下一則。',
    passiveText:
      '打聽與紀錄見長；靈感獲取較順。開局帶「採訪手札」，對情報販子很有用。',
    startingItemBlurb: '採訪手札：密密麻麻的人物關係圖，百曉笙會感興趣。',
    startingTechBlurb: '起始科技「止血包紮」：跑現場練出來的急救常識。',
    transitPages: [
      '錄音筆還亮著紅點。受訪者的聲音忽然變成雨。你想按暫停，指尖卻摸到冰冷石階。',
      '編輯在群組催：稿呢？你回「再五分鐘」，訊息顯示傳送失敗。',
      '破廟漏雨。你打開手札第一頁，寫下：「時間不明。地點：疑似襄揚外圍。當事人：我。」',
    ],
    bonuses: {
      maxStamina: 10,
      maxInternalForce: 10,
      defense: 1,
      inspiration: 9,
      silver: 25,
    },
    startingTechIds: ['tech_med_1'],
    startingItemIds: ['gift_ink_notes'],
  },
  {
    id: 'origin_chef',
    name: '餐飲廚師',
    summary: '一把鍋鏟安天下；人情往往從一碗熱湯開始。',
    flavor: '你相信大多數恩怨，只要火候對了，就能談。',
    bio: '你從小吃店做到餐廳档口，燙過手、罵過菜、也偷偷給跑堂加過宵夜。你懂：餓的人最好說話，飽的人最好談判。',
    crossoverHook:
      '打烊後你倚著冰箱閉眼，油煙味還在。下一口呼吸卻是泥土與濕木。火熄了——不對，是整間廚房消失了，只剩你握著調料袋。',
    tags: ['氣味記憶', '護短', '火候主義'],
    monologue:
      '沒有瓦斯爐，但有雨水、草藥、與一堆看起來很需要被餵飽的江湖人。先活，再開灶。',
    passiveText:
      '人情與防禦向較穩；開局帶異香調料。送禮與攀談時常有意外加成空間。',
    startingItemBlurb: '異香調料袋：花椒與香葉，擅廚者與饞嘴俠客都難拒絕。',
    startingTechBlurb: '起始科技「止血包紮」：廚房意外與刀傷讓你很熟清創。',
    transitPages: [
      '計時器叮了一聲。你伸手去關——摸到的是神像底座的灰塵。',
      '你想起沒請的假、沒回的母親訊息、還有那鍋明天要熬的湯。',
      '雨夜破廟。肚子先叫了一聲。你苦笑：穿越可以，但能不能留一點鹽？',
    ],
    bonuses: {
      maxHp: 10,
      maxStamina: 15,
      defense: 3,
      inspiration: 7,
      silver: 30,
    },
    startingTechIds: ['tech_med_1'],
    startingItemIds: ['gift_spice_pouch'],
  },
  {
    id: 'origin_civil',
    name: '土木技師',
    summary: '懂結構、懂承重；破廟漏雨你第一眼先看樑柱。',
    flavor: '你穿越前最後一份圖紙，是橋梁加固——如今腳下這座破廟，也像待修的標案。',
    bio: '你畫過圖、盯過工地、也和業主吵過「不能省這根樑」。你害怕的不是加班，是結構算錯——那會死人。',
    crossoverHook:
      '工地會議開到半夜，投影片還停在「風險項目」。你站起來倒水，腳下一空。再落地，是塌了一角的瓦。你第一眼看樑：還能撐。',
    tags: ['務實', '風險控管', '先看承重'],
    monologue:
      '這廟能住人，前提是別再加載。先找乾處，再找出口，最後才問「為什麼是古代」。',
    passiveText:
      '防禦與結構直覺佳；開局即懂「手電筒戰術」。秘境與機關互動較不易踩坑。',
    startingItemBlurb: '軟尺卷尺：能量長度，古暮派當奇物，你當命根。',
    startingTechBlurb: '起始科技「手電筒戰術」：工地夜班養成的照明習慣。',
    transitPages: [
      '安全帽還在桌上。你聽見自己說：「這跨距不行——」下一個音節被雷劈斷。',
      '圖紙邊角捲起。你想起未簽的變更單、未睡的孩子、未修的眼鏡。',
      '雨打梁木。你掏出卷尺量裂縫，動作熟練得像還在驗收——然後才發現：驗收單上的年代不對。',
    ],
    bonuses: {
      maxHp: 15,
      defense: 4,
      maxInternalForce: 5,
      inspiration: 8,
      silver: 20,
    },
    startingTechIds: ['tech_gadget_1'],
    startingItemIds: ['gift_measuring_tape'],
  },
]

/** 科技樹 */
export const TECH_NODES: TechNodeDef[] = [
  {
    id: 'tech_med_1',
    name: '止血包紮',
    branch: 'medical',
    tier: 1,
    description: '以現代無菌觀念處理刀傷與擦傷。',
    inspirationCost: 3,
    requires: [],
    effectText: '戰鬥後氣血回復小幅提升（後續結算）。',
  },
  {
    id: 'tech_med_2',
    name: '草藥辨識',
    branch: 'medical',
    tier: 2,
    description: '對照現代藥理，分辨可入藥的江湖草本。',
    inspirationCost: 4,
    requires: ['tech_med_1'],
    effectText: '採藥與治療道具效果提升。',
  },
  {
    id: 'tech_med_3',
    name: '創傷清創',
    branch: 'medical',
    tier: 3,
    description: '清創、換藥與防感染流程標準化。',
    inspirationCost: 5,
    requires: ['tech_med_2'],
    effectText: '重傷狀態持續時間縮短。',
  },
  {
    id: 'tech_med_4',
    name: '急救推車思維',
    branch: 'medical',
    tier: 4,
    description: '把戰場當成急診：分級、分流、先救命。',
    inspirationCost: 6,
    requires: ['tech_med_3'],
    effectText: '隊伍輔佐技能冷卻略降。',
  },
  {
    id: 'tech_med_5',
    name: '久隱呼吸對照',
    branch: 'medical',
    tier: 5,
    description: '以現代呼吸與循環知識解讀《久隱心經》殘篇。',
    inspirationCost: 8,
    requires: ['tech_med_4'],
    effectText: '內力上限提升；解鎖醫武合參路線。',
  },
  {
    id: 'tech_gadget_1',
    name: '手電筒戰術',
    branch: 'gadget',
    tier: 1,
    description: '夜戰以強光擾亂視覺，爭取脫身或先手。',
    inspirationCost: 3,
    requires: [],
    effectText: '夜間遭遇先制機率提升。',
  },
  {
    id: 'tech_gadget_2',
    name: '簡易槓桿',
    branch: 'gadget',
    tier: 2,
    description: '撬門、抬石、機關觸發的力學應用。',
    inspirationCost: 4,
    requires: ['tech_gadget_1'],
    effectText: '秘境互動成功率提升。',
  },
  {
    id: 'tech_gadget_3',
    name: '火藥替代試作',
    branch: 'gadget',
    tier: 3,
    description: '以現有礦粉與油料調配煙霧與聲響唬敵。',
    inspirationCost: 5,
    requires: ['tech_gadget_2'],
    effectText: '可製作煙霧彈類消耗品。',
  },
  {
    id: 'tech_gadget_4',
    name: '測距估高',
    branch: 'gadget',
    tier: 4,
    description: '目測距離、落差與弓矢拋物線。',
    inspirationCost: 6,
    requires: ['tech_gadget_3'],
    effectText: '遠程與地形戰優勢。',
  },
  {
    id: 'tech_gadget_5',
    name: '天機對表',
    branch: 'gadget',
    tier: 5,
    description: '把現代專案管理套進天機閣情報網：里程碑、風險、備援。',
    inspirationCost: 8,
    requires: ['tech_gadget_4'],
    effectText: '任務情報獎勵與靈感獲取提升。',
  },
  {
    id: 'tech_body_1',
    name: '間歇訓練',
    branch: 'physique',
    tier: 1,
    description: '以短衝刺與休息交替鍛鍊耐力。',
    inspirationCost: 3,
    requires: [],
    effectText: '精力上限小幅提升。',
  },
  {
    id: 'tech_body_2',
    name: '核心穩定',
    branch: 'physique',
    tier: 2,
    description: '強化腰腹，減少出拳與閃避時的晃動。',
    inspirationCost: 4,
    requires: ['tech_body_1'],
    effectText: '防禦與受擊穩定度提升。',
  },
  {
    id: 'tech_body_3',
    name: '負重行進',
    branch: 'physique',
    tier: 3,
    description: '背包負重下仍能維持步幅與呼吸。',
    inspirationCost: 5,
    requires: ['tech_body_2'],
    effectText: '旅行精力消耗降低。',
  },
  {
    id: 'tech_body_4',
    name: '反應節奏',
    branch: 'physique',
    tier: 4,
    description: '用口令與節拍訓練躲閃時機。',
    inspirationCost: 6,
    requires: ['tech_body_3'],
    effectText: '閃避與連擊窗口擴大。',
  },
  {
    id: 'tech_body_5',
    name: '華嶠登頂法',
    branch: 'physique',
    tier: 5,
    description: '針對華嶠陡峭山路的登山節奏與供氧策略。亦可遷移至峩眉雲嶺與雁門關道。',
    inspirationCost: 8,
    requires: ['tech_body_4'],
    effectText: '山岳／關隘地形旅行優勢；攻擊小幅提升。',
  },
  {
    id: 'tech_gadget_6',
    name: '桃華測繪',
    branch: 'gadget',
    tier: 5,
    description: '以現代測繪對抗桃華奇門：標記岔路、避免踩花（皇藥師很在意）。',
    inspirationCost: 9,
    requires: ['tech_gadget_5'],
    effectText: '秘境（桃華島／活死人暮）互動成功率再提升。',
  },
  {
    id: 'tech_med_6',
    name: '冰火調溫',
    branch: 'medical',
    tier: 5,
    description: '對照冰火島影溫差，建立低溫／燙傷分級處理。',
    inspirationCost: 9,
    requires: ['tech_med_5'],
    effectText: '極端環境氣血損耗降低；與榭遜同遊較不易被吼。',
  },
]

export function getOriginById(id: string): OriginDef | undefined {
  return ORIGINS.find((o) => o.id === id)
}

export function getTechNodeById(id: string): TechNodeDef | undefined {
  return TECH_NODES.find((n) => n.id === id)
}

export function getTechNodesByBranch(branch: TechNodeDef['branch']): TechNodeDef[] {
  return TECH_NODES.filter((n) => n.branch === branch).sort((a, b) => a.tier - b.tier)
}
