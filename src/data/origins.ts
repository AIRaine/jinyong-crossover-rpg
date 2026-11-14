import type { OriginDef, TechNodeDef } from '../types/game'

/** 十二種現代穿越職業——小傳／獨白／過渡敘事寫滿 */
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
  {
    id: 'origin_bahang',
    name: '八大公關',
    summary: '八大行業出身：讀空氣、擋酒、圓場——江湖飯局你未必輸。',
    flavor: '你隨身帶潤喉糖與名片夾。有人以為那是投名狀，其實只是上班工具。',
    bio: '你在都會夜場做公關／櫃檯領班那一掛：排班、安撫難搞客人、把衝突變成「再來一盤水果」。薪水看營業額，膝蓋看班表。你練就的不是風月，是察言觀色與場面話。',
    crossoverHook:
      '打烊盤點到天亮，你靠在吧台閉眼，耳機還播著循環歌單。下一秒霓虹變成雷光，地毯變成泥地——潤喉糖還在口袋，訊號已死。',
    tags: ['察言觀色', '場面話', '班表戰士'],
    monologue:
      '這裡沒有吧台燈，但有刀光與脾氣。先分誰是「難搞貴客」、誰是「自己人」，再談活法。',
    passiveText:
      '交際與圓場見長；送禮／攀談較不易冷場。開局銀兩略豐（小費積習）。',
    startingItemBlurb: '潤喉糖＋名片夾：談生意先甜嗓，再交換「現代奇物」座標。',
    startingTechBlurb: '起始科技「止血包紮」：擋酒打架看多了，包紮意外地熟。',
    transitPages: [
      '領班還在對講機喊：「三位貴客到——」你回「收到」，聲音卻像隔著水箱。',
      '你想起還沒報的業績、還沒回的家人訊息、還有那雙磨腳的班鞋。',
      '雨打破廟。你下意識整理衣領、掛上職業笑——然後發現四週沒有客人，只有雷。',
    ],
    bonuses: {
      maxHp: 8,
      maxStamina: 12,
      defense: 2,
      maxInternalForce: 8,
      inspiration: 7,
      silver: 45,
    },
    startingTechIds: ['tech_med_1'],
    startingItemIds: ['gift_throat_lozenge', 'gift_namecard_case'],
  },
  {
    id: 'origin_delivery',
    name: '外送騎手',
    summary: '風雨無阻送單；地圖感與腿力，是你穿越後的第一門輕功。',
    flavor: '你還習慣側耳聽「下一單」提示音——這裡只有雨。',
    bio: '你跑過午高峰與颱風天，學會跟店家吵架也跟演算法和解。超时扣款比刀傷可怕。你的座右銘：先送達，再哲學。',
    crossoverHook:
      '你停在紅燈下刷到「系統維護」，頭盔裡一片安靜。再抬頭，交通號誌變成破廟神像，保溫袋還背在肩上。',
    tags: ['抗風吹', '路徑控', '時效狂'],
    monologue:
      '沒有導航，就把星當路標、把刀聲當塞車。活過今晚，算準時配達。',
    passiveText:
      '精力與趕路較強；開局即懂「間歇訓練」。旅行耗精略耐操。',
    startingItemBlurb: '防水披肩扣：外送雨衣精神續作，江湖人當斗篷扣飾。',
    startingTechBlurb: '起始科技「間歇訓練」：衝刺—休息—再衝刺的肌肉記憶。',
    transitPages: [
      'App 還顯示「距離 300 公尺」。你加速——路面卻突然變成泥濘石階。',
      '你想起差評、油錢、與那句「騎慢一點」。',
      '破廟裡你下意識看手機：沒單。只有雨。你把披肩扣繫緊，像還要再跑一趟。',
    ],
    bonuses: {
      maxHp: 12,
      maxStamina: 28,
      attack: 2,
      inspiration: 5,
      silver: 18,
    },
    startingTechIds: ['tech_body_1'],
    startingItemIds: ['gift_rain_cape_pin'],
  },
  {
    id: 'origin_streamer',
    name: '直播主',
    summary: '鏡頭感與臨場反應一流；穿越後仍下意識想「跟觀眾打招呼」。',
    flavor: '你口袋裡有迷你補光燈。江湖人問：這是不是妖火？',
    bio: '你做過遊戲實況、雜談、帶貨。演算法是喜怒無常的門派掌門，禮物聲是江湖排名。你最怕的不是黑粉，是斷網。',
    crossoverHook:
      '深夜檔最後一段，你說「我們下週見」——然後真的「下線」到另一個世界。補光燈還亮著，彈幕沒了。',
    tags: ['臨場感', '話術', '流量直覺'],
    monologue:
      '沒有訂閱數，但有生死。先別開播，先別死；素材可以以後再剪。',
    passiveText:
      '話術與吸引注意較佳；靈感獲取略快。開局帶迷你補光（夜戰唬人用）。',
    startingItemBlurb: '迷你補光燈：電力有限，卻能在暗處製造「妖光乍現」。',
    startingTechBlurb: '起始科技「手電筒戰術」：你本來就靠光吃飯。',
    transitPages: [
      '禮物音效還在耳裡循環。你笑著道謝，視野卻開始像素化。',
      '你想起沒簽的商案、沒睡的白天、還有那句「真實一點會更紅」。',
      '雨夜破廟。你下意識對空氣說：「哈囉大家好——」回音裡只有自己。',
    ],
    bonuses: {
      maxStamina: 14,
      maxInternalForce: 12,
      attack: 1,
      defense: 1,
      inspiration: 11,
      silver: 22,
    },
    startingTechIds: ['tech_gadget_1'],
    startingItemIds: ['gift_mini_light'],
  },
  {
    id: 'origin_lawyer',
    name: '律師',
    summary: '條款、舉證、冷靜對質；談判桌比比武台更像你的主場。',
    flavor: '你穿越時握著簽字筆。有人以為那是短刺。',
    bio: '你做過諮詢、和解、也開過庭。你相信程序正義——至少在公文格式上。加班寫書狀的夜晚，比任何武俠劇漫長。',
    crossoverHook:
      '截稿式的答辯期限前，你在事務所沙發上闔眼。再醒，卷宗變成濕葉，筆還在，法典不在。',
    tags: ['邏輯抗辯', '邊界感', '條款控'],
    monologue:
      '這裡的「規矩」寫在刀上。先搞清楚誰有管轄權，再決定和解或开战。',
    passiveText:
      '談判與情報整理見長；悟性向加成。面對門派條款／契約事件較不易被唬。',
    startingItemBlurb: '簽字筆與便箋：可寫「現代契約條款」唬人，也可當細短鐵籤。',
    startingTechBlurb: '起始科技「止血包紮」：法務社團急救訓意外派上用場。',
    transitPages: [
      '你還在心裡排「爭點一、爭點二」。雨聲把法官的木槌敲成雷。',
      '你想起客戶、助理、與那封未送的意見信。',
      '破廟石階如證人席。你把便箋按平，寫下第一行：本件事實仍有爭議。',
    ],
    bonuses: {
      maxHp: 8,
      maxInternalForce: 14,
      defense: 3,
      inspiration: 10,
      silver: 28,
    },
    startingTechIds: ['tech_med_1'],
    startingItemIds: ['gift_contract_pen'],
  },
  {
    id: 'origin_cabin',
    name: '空服員',
    summary: '緊急程序、微笑服務、時差耐力；亂流裡練出的鎮定可搬家到江湖。',
    flavor: '你還會下意識做安全示範手勢。刀客一臉茫然。',
    bio: '你背過安全手冊、安撫過暈機乘客、也在紅眼班機裡偷站著睡覺。你的超能力是：再累也能把語氣維持在「標準溫度」。',
    crossoverHook:
      ' descending後你在跳機點閉眼三秒。再睜眼，滑道變成泥坡，廣播變成雨——過夜包還在。',
    tags: ['程序控', '溫柔強硬', '時差耐性'],
    monologue:
      '沒有氧氣面罩，但有呼吸。先確保自己清醒，再協助鄰座——啊不，鄰座是陌生江湖。',
    passiveText:
      '體力與穩定度佳；開局即懂「間歇訓練」。團隊輔佐時較能安撫氣氛。',
    startingItemBlurb: '過夜盥洗小包：香皂片、隱形眼鏡盒與薄荷糖，江湖當奇物禮盒。',
    startingTechBlurb: '起始科技「間歇訓練」：長途航班的站姿與腳力遺產。',
    transitPages: [
      '「請繫好安全帶」還在腦內自動播放。座椅震動變成雷響。',
      '你想起班表、時差、與那句「客人永遠是對的」（你從不信）。',
      '破廟漏雨如客艙漏水。你打開過夜包，清點：能用的，都帶著。',
    ],
    bonuses: {
      maxHp: 14,
      maxStamina: 20,
      defense: 2,
      inspiration: 6,
      silver: 24,
    },
    startingTechIds: ['tech_body_1'],
    startingItemIds: ['gift_amenity_kit'],
  },
  {
    id: 'origin_unemployed',
    name: '無業',
    summary: '待業、被裁、或主動躺平——現代空白檔期，意外變成江湖新手光環。',
    flavor: '你口袋裡只剩便利商店點數卡與半包衛生紙。江湖人問：這可是什麼令牌？',
    bio: '你剛結束一段合約／被優退／或乾脆決定「先休息一個季度」。履歷投到麻木，面試話術背到反胃。你學會用最少的錢把一天過完：圖書館冷氣、免費wifi、泡麵哲學。別人說躺平，你說資源配置。',
    crossoverHook:
      '又一個「感謝您的應徵」郵件彈出時，你把手機扣在胸口睡著。再醒，拒絕信變成雨，便利商店點數卡還在——只是刷不了。',
    tags: ['彈性工時', '低成本生存', '意外 lag 高手'],
    monologue:
      '沒有班要上，反而冷靜。先活過今晚；就業市場的殘酷，你已經預修過了。',
    passiveText:
      '開銷觀念極佳，遇事不易慌；靈感來自「空窗期亂讀」。銀兩起步偏低，但悟性／根骨有空白優勢。',
    startingItemBlurb: '便利商店點數卡＋半包衛生紙：現代遺跡，送禮時意外好笑又好用。',
    startingTechBlurb: '起始科技「手電筒戰術」：省錢夜遊與停電對策練出來的。',
    transitPages: [
      '信箱還顯示「已讀不回」。你想回「好的謝謝」，手指抬不起來。',
      '你想起房租、健保、與那句「先回家住一陣子」。',
      '雨夜破廟。你清點口袋：點數卡、衛生紙、勇氣——第三樣勉強及格。',
    ],
    bonuses: {
      maxHp: 10,
      maxStamina: 15,
      maxInternalForce: 10,
      defense: 1,
      inspiration: 9,
      silver: 5,
    },
    startingTechIds: ['tech_gadget_1'],
    startingItemIds: ['gift_point_card', 'gift_tissue_pack'],
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
