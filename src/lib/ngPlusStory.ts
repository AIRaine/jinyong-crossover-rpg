import type {
  EventRewards,
  GameFlags,
  StoryEvent,
  StoryEventChoiceDef,
  StoryEventDef,
} from '../types/game'

export type EndingKey = 'chivalry' | 'contract' | 'retreat' | 'sword'

export const ENDING_FLAG_KEYS: Record<EndingKey, string> = {
  chivalry: 'ending_chivalry',
  contract: 'ending_contract',
  retreat: 'ending_retreat',
  sword: 'ending_sword',
}

export const ENDING_LABEL: Record<EndingKey, string> = {
  chivalry: '俠義',
  contract: '契約',
  retreat: '歸隱',
  sword: '論劍',
}

/** 自 flags 讀取本周目（或跨周目保留的）結局標籤 */
export function detectEndingKey(flags: GameFlags): EndingKey | null {
  if (flags.ending_chivalry) return 'chivalry'
  if (flags.ending_contract) return 'contract'
  if (flags.ending_retreat) return 'retreat'
  if (flags.ending_sword) return 'sword'
  const last = flags.lastEnding
  if (
    last === 'chivalry' ||
    last === 'contract' ||
    last === 'retreat' ||
    last === 'sword'
  ) {
    return last
  }
  return null
}

type NgTier = 1 | 2

interface ChoiceFlavor {
  label?: string
  outcomeText: string
  /** 覆寫／合併獎勵；不寫則沿用一週目 */
  rewardsPatch?: Partial<EventRewards>
}

interface MainFlavor {
  paragraphs: string[]
  summary?: string
  choices: Record<string, ChoiceFlavor>
}

/** 二／三週目主線段落＋選項標籤／結果變體 */
const MAIN_FLAVOR: Record<string, Record<NgTier, MainFlavor>> = {
  main_y1_xiangyang: {
    1: {
      summary: '襄揚糧道再起烽煙——你卻記得柳樹下的埋伏。',
      paragraphs: [
        '襄揚城頭旗影仍獵獵，你卻先看向官道第二棵柳樹。刀客埋伏點與上周目重合七成。',
        '皇容託人帶話仍是那句桃華宴。你回：「這次改吃快一點。」洪柒公啃雞腿：「小子，預演過？」',
        '百曉笙低聲：「訂閱制客戶請走快速通道。」你沒承認自己是回頭客。',
      ],
      choices: {
        y1_guard: {
          label: '依記憶改道護糧，硬撼刀客',
          outcomeText:
            '二周目的你早知刀客埋伏點。糧車仍險，但你少走了兩段冤枉路——襄揚守軍愣了愣：「這人怎像預演過？」',
          rewardsPatch: { inspiration: 3, potential: 5 },
        },
        y1_scout: {
          label: '夜探敵營，連茶水口味一併記錄',
          outcomeText:
            '你這次連敵營茶水口味都記得。情報賣得更貴，百曉笙嘀咕：「訂閱制升級了？」',
          rewardsPatch: { silver: 35, inspiration: 6 },
        },
        y1_bargain: {
          label: '銀兩精準砸在內應賭債上',
          outcomeText:
            '銀兩仍要撒，但你精準砸在內應的賭債上。廓靖皺眉更深，皇容卻悄悄豎了拇指。',
          rewardsPatch: { silver: -28, inspiration: 4 },
        },
      },
    },
    2: {
      summary: '三周目護糧——你幾乎能當劫匪導遊。',
      paragraphs: [
        '你指著柳樹對隊友說：「左邊第二棵，等一下會有人咳嗽兩聲。」刀客如約出現，全場沉默。',
        '皇容遠距留言：「別把江湖做成攻略網站。」你回：「太晚了。」',
        '洪柒公把雞腿骨頭丟進火堆：「第三遍了還來，你是不是很閒？」',
      ],
      choices: {
        y1_guard: {
          label: '邊護糧邊替劫匪導覽',
          outcomeText:
            '三周目護糧，你幾乎在導遊劫匪：「左邊第二棵柳樹。」刀客懵了，隊友也懵了。',
          rewardsPatch: { inspiration: 4, potential: 6, silver: 45 },
        },
        y1_scout: {
          label: '附風險矩陣的情報套餐',
          outcomeText:
            '情報這次附「風險矩陣」。天機閣想聘你當顧問——你婉拒，只要現銀。',
          rewardsPatch: { silver: 40, inspiration: 7 },
        },
        y1_bargain: {
          label: '批發價拆散內應',
          outcomeText:
            '你用三周目經驗談批發價拆散內應。銀兩少花，效果一樣髒。',
          rewardsPatch: { silver: -22, inspiration: 5 },
        },
      },
    },
  },
  main_y2_huashan: {
    1: {
      summary: '華嶠劍台再搭，你已換過一套節奏。',
      paragraphs: [
        '西嶽風大如昨。凌狐沖醉眼一亮：「咦，這次站位不一樣？」你回：「迭代。」',
        '嶽不群微笑依舊像藏 KPI。你悄悄把錄音筆——咳，記憶——對準他簡報裡的破綻時間軸。',
        '峯清揚在崖邊點頭，像在審核你是否交了第二版 PR。',
      ],
      choices: {
        y2_spar: {
          label: '上台切磋，改用另一套節奏',
          outcomeText:
            '劍台再上，對手招式似曾相識。你改用另一套節奏拆招——華嶠弟子討論：「他換流派了？」',
          rewardsPatch: { potential: 7, exp: 55 },
        },
        y2_judge: {
          label: '整理第二版招式對照表',
          outcomeText:
            '筆記第二版多了「破綻時間軸」。望語嫣說這可比第一版好用——你沒說那是迭代。',
          rewardsPatch: { inspiration: 7, potential: 4 },
        },
        y2_expose: {
          label: '把君子簡報對上三份旁證',
          outcomeText:
            '你這回把「君子簡報」對上了三份旁證。仍未當眾拆穿，抄本卻更厚。',
          rewardsPatch: { inspiration: 5, silver: 25 },
        },
      },
    },
    2: {
      summary: '論劍預熱成了你的複習考。',
      paragraphs: [
        '有人在崖下傳單寫「穿越客三周目回歸場」。你假装沒看到。',
        '凌狐沖酒醒一半：「你這傢伙……進步得假。」嶽不群笑容更亮，也更僵。',
        '峯清揚只丟一句：「招可舊，心要新。」',
      ],
      choices: {
        y2_spar: {
          label: '複習考式切磋，求穩勝',
          outcomeText:
            '論劍預熱成了你的複習考。險勝改為穩勝，凌狐沖酒醒一半：「你這傢伙……進步得假。」',
          rewardsPatch: { potential: 8, exp: 60 },
        },
        y2_judge: {
          label: '筆記標上「NG+ 注意事項」',
          outcomeText:
            '筆記第三版開始標「NG+ 注意事項」。望語嫣問何謂 NG+，你說：「多周目的現代黑話。」',
          rewardsPatch: { inspiration: 8, potential: 4 },
        },
        y2_expose: {
          label: '做成紅黃綠燈進度表',
          outcomeText:
            '你把嶽不群的進度表做成紅黃綠燈。他笑容僵了一瞬，隨即更亮。',
          rewardsPatch: { inspiration: 6, silver: 28 },
        },
      },
    },
  },
  main_y3_tomb: {
    1: {
      summary: '墓門夜鳴如舊，你卻記得承重裂縫位置。',
      paragraphs: [
        '寒氣自石縫滲出。你先掏軟尺——宵朧女靜靜看你：「不像初來。」',
        '揚過握緊玄鐵沉劍：「說那麼多，打就是了。」你回：「先量，再打。」',
        '遠方似有琴音一瞬，像桃華島有人翻了個白眼。',
      ],
      choices: {
        y3_clear: {
          label: '按記憶清剿盜墓刀客',
          outcomeText:
            '墓道機關你幾乎能背。盜墓者潰逃更快，宵朧女多看你一眼：「不像初來。」',
          rewardsPatch: { exp: 60, silver: 50 },
        },
        y3_seal: {
          label: '一次到位封石',
          outcomeText:
            '裂縫量測更快，封石一次到位。宵朧女點頭幅度比上周目大半寸。',
          rewardsPatch: { inspiration: 5, potential: 6 },
        },
        y3_peach: {
          label: '遠距請援，附「這次比較短」',
          outcomeText:
            '皇藥師遠距琴音仍來，附贈一句：「別每次都吵我。」你回：「這次比較短。」',
          rewardsPatch: { inspiration: 8, silver: -15 },
        },
      },
    },
    2: {
      summary: '清剿變成流程演練，古暮派開始記你人情帳。',
      paragraphs: [
        '揚過抱怨不夠刺激。宵朧女說：「夠用就好。」你在心裡打開專案管理表。',
        '封陣圖你能倒背，連哪塊石頭會晃都記得。',
        '琴音再來時，皇藥師先問：「三周目了還來？」',
      ],
      choices: {
        y3_clear: {
          label: '流程演練式清剿',
          outcomeText:
            '清剿變成流程演練。揚過抱怨不夠刺激，宵朧女說：「夠用就好。」',
          rewardsPatch: { exp: 65, silver: 55, potential: 3 },
        },
        y3_seal: {
          label: '倒背封陣圖施工',
          outcomeText:
            '封陣圖你能倒背。工程味十足，古暮派默默記你人情更厚。',
          rewardsPatch: { inspiration: 6, potential: 7 },
        },
        y3_peach: {
          label: '回一句「迭代」請援',
          outcomeText:
            '琴音定石後，皇藥師多丟一句：「三周目了還來？」你回：「迭代。」',
          rewardsPatch: { inspiration: 9, silver: -12 },
        },
      },
    },
  },
  main_y4_xuanmu: {
    1: {
      summary: '崖上談判再崩——你預留了撤退巷。',
      paragraphs: [
        '風割面頰。兆敏笑意不達眼底：「契約要有牙齒。」你口袋裡已有第二版範本。',
        '東芳不敗針匣輕響。章無忌想勸和，榭遜只哼。你突然想念「請同步行事曆」。',
        '有人低語：「這穿越客怎麼每次都準時踩點？」你假裝風太大沒聽見。',
      ],
      choices: {
        y4_break: {
          label: '預留巷道後再出手',
          outcomeText:
            '談判仍崩，但你預留撤退巷。突圍少流兩成血，雙方願意「再約」的口氣軟了點。',
          rewardsPatch: { exp: 65, potential: 6, silver: 55 },
        },
        y4_clause: {
          label: '拋出第二版契約範本',
          outcomeText:
            '契約範本你早備好第二版。崖上改條款速度變快，兆敏笑：「有備而來？」',
          rewardsPatch: { inspiration: 9, silver: 40 },
        },
        y4_fire: {
          label: '聖火見證加冷靜期附註',
          outcomeText:
            '小火盆誓言多了「冷靜期」附註。土味依舊，流程更像專案結案。',
          rewardsPatch: { potential: 5, exp: 40 },
        },
      },
    },
    2: {
      summary: '第三方公證已成範本庫，崖上火氣下降。',
      paragraphs: [
        '天機閣派人旁聽，想收「條款授權費」。你說下個周目再說。',
        '章無忌點火時多了一張簽到表。榭遜：「麻煩。」',
        '你預判崩盤節點，開打前先挪隊友——合約桌上的火氣也跟著下降。',
      ],
      choices: {
        y4_break: {
          label: '預判崩盤節點再戰',
          outcomeText:
            '你預判崩盤節點，開打前先挪隊友。戰損下降，合約桌上的火氣也下降。',
          rewardsPatch: { exp: 70, potential: 7, silver: 60 },
        },
        y4_clause: {
          label: '範本庫條款一次到位',
          outcomeText:
            '第三方公證條款已成範本庫。天機閣想收授權費，你說下個周目再說。',
          rewardsPatch: { inspiration: 10, silver: 45 },
        },
        y4_fire: {
          label: '聖火見證＋簽到表',
          outcomeText:
            '聖火見證多了簽到表。章無忌無奈，榭遜只哼：「麻煩。」',
          rewardsPatch: { potential: 6, exp: 45 },
        },
      },
    },
  },
  main_y5_wharf: {
    1: {
      summary: '碼頭潮信再起——結局標籤要蓋第二版章。',
      paragraphs: [
        '潮起潮落。魏曉寶擠過來：「兄弟，二周目船票要不要友情價？」你回：「先看結局標籤。」',
        '皇容、兆敏、凌狐沖、橋峰仍站在不同光影裡——位置微偏，像導演換了機位。',
        '（二周目低語：有些旗影似曾相識，選擇卻仍要親手再蓋一次章。）',
      ],
      choices: {
        y5_ending_chivalry: {
          label: '【結局・俠義·影】護弱登船，回一句「二周目也一樣」',
          outcomeText:
            '護弱登船仍是你的選擇。有人喊「大俠」時，你回：「二周目也一樣。」風裡有人聽懂，有人沒懂。潮聲替你蓋上第二枚俠義章。',
          rewardsPatch: { inspiration: 3, potential: 7 },
        },
        y5_ending_contract: {
          label: '【結局・契約·影】公證條款寫得更細',
          outcomeText:
            '船票公證條款寫得更細。魏曉寶說手續費可議，兆敏說違約金不可議。你把江湖暫時做成了可轉讓債權。',
          rewardsPatch: { silver: 100, inspiration: 9 },
        },
        y5_ending_retreat: {
          label: '【結局・歸隱·影】桃華小住，換角落不踩同花',
          outcomeText:
            '桃華小住再度啟程。皇藥師：「又來？」你：「換個角落，不踩同一叢花。」海風按下靜音鍵，卻留了一線續集預告。',
          rewardsPatch: { inspiration: 12, potential: 9 },
        },
        y5_ending_sword: {
          label: '【結局・論劍·影】碼頭再開，換一式',
          outcomeText:
            '碼頭劍台再開。峯清揚說：「招熟不算贏。」你換了一式——勝敗仍其次，話題更新了。名號在潮聲裡換了皮。',
          rewardsPatch: { potential: 12, exp: 95 },
        },
      },
    },
    2: {
      summary: '三周目潮信：重複不等於無意義。',
      paragraphs: [
        '有人在碼頭貼「結局預測」黃牛票。你把票撕了，改寫自己的標籤。',
        '旁人說看穿你了。你說：「看穿也無妨，選擇可以不變，理由可以變。」',
        '（三周目低語：劇本骨架未變，節奏與吐槽已換層皮——別急著說看穿。）',
      ],
      choices: {
        y5_ending_chivalry: {
          label: '【結局・俠義·三影】護弱先登，承認被看穿',
          outcomeText:
            '你仍護弱先登。旁人說看穿你了——你說：「看穿也無妨，選擇沒變。」潮聲第三次為你鼓掌，掌聲卻不廉價。',
          rewardsPatch: { inspiration: 4, potential: 8, silver: 70 },
        },
        y5_ending_contract: {
          label: '【結局・契約·三影】公證成行業標準',
          outcomeText:
            '公證船票幾乎成行業標準。有人罵你把江湖做成金流，你回：「至少透明。」兆敏點頭，魏曉寶收手續費。',
          rewardsPatch: { silver: 110, inspiration: 10 },
        },
        y5_ending_retreat: {
          label: '【結局・歸隱·三影】故意繞遠的歸途',
          outcomeText:
            '歸隱路徑你走得更熟，也更故意繞遠。海風裡你寫下：重複不等於無意義。桃華花開，仍是第一次聞見的甜。',
          rewardsPatch: { inspiration: 14, potential: 10 },
        },
        y5_ending_sword: {
          label: '【結局・論劍·三影】老友局，心要新',
          outcomeText:
            '論劍成了老友局。峯清揚點頭：「招可舊，心要新。」你記下這句當周目標語，劍光裡沒有重播鍵。',
          rewardsPatch: { potential: 14, exp: 100 },
        },
      },
    },
  },
  arc_liancheng_3: {
    1: {
      summary: '空匣再開——你記得信上那句，卻仍想確認字跡。',
      paragraphs: [
        '匣仍空。荻雲看你一眼：「二周目還來拆？」你回：「確認字沒變。」',
        '百曉笙在門外喊升級套餐。你給了三星半——服務態度微調。',
        '信上那句貪者自困，讀第二次仍刺耳，卻比較像提醒而非判決。',
      ],
      choices: {
        lc3_keep: {
          outcomeText:
            '你把心法縫進另一層夾層。荻雲笑：「這次藏得比較專業。」',
          rewardsPatch: { potential: 2, inspiration: 2 },
        },
        lc3_public: {
          outcomeText:
            '告示多了一行：回頭客請勿劇透。尋寶客罵聲依舊，仇殺仍少。',
          rewardsPatch: { exp: 10 },
        },
        lc3_sell: {
          outcomeText:
            '話本改成「空匣續集」。分成略增，荻雲堅持要具名感謝穿越客。',
          rewardsPatch: { silver: 15 },
        },
      },
    },
    2: {
      summary: '三周目空匣——故事比寶藏還值錢。',
      paragraphs: [
        '你幾乎能背出機關流程。荻雲說：「那我們改走側門。」',
        '空匣裡多了一張小紙：歡迎回來，別貪。字跡像玩笑。',
        '你決定這周目把「不貪」寫進週目標。',
      ],
      choices: {
        lc3_keep: {
          outcomeText: '心法第三遍仍有新理解。你把註解寫在現代備忘錄——沒訊號也能存。',
          rewardsPatch: { potential: 3, inspiration: 3 },
        },
        lc3_public: {
          outcomeText: '告示成了經典。天機閣收授權費分你一成——你只要茶錢。',
          rewardsPatch: { silver: 25, exp: 15 },
        },
        lc3_sell: {
          outcomeText: '話本三部曲完結。你與荻雲分銀，順便拒絕影劇化邀約。',
          rewardsPatch: { silver: 30, inspiration: 2 },
        },
      },
    },
  },
  arc_feihu_3: {
    1: {
      summary: '刀名放下過一次，仍要再走一趟關道。',
      paragraphs: [
        '狐斐在雁門等你：「二周目也來送？」你遞上熱水。',
        '仇冊灰燼早散，風砂卻還記得刀痕。',
        '你說：「路還在。」他點頭，這次笑得比較開。',
      ],
      choices: {
        fh3_teach: {
          outcomeText:
            '止殺一式你記得更穩。狐斐：「停手的時機，第二遍才真懂。」',
          rewardsPatch: { potential: 2 },
        },
        fh3_escort: {
          outcomeText: '關內茶仍熱。丐幇消息多了一條：雪蒼嶺暫無新仇。',
          rewardsPatch: { exp: 10 },
        },
        fh3_part: {
          outcomeText: '雪蒼石換成書籤第二枚。你說：「收集癖。」他說：「也好。」',
          rewardsPatch: { inspiration: 2 },
        },
      },
    },
    2: {
      summary: '三周目關道：止殺已成肌肉記憶。',
      paragraphs: [
        '狐斐幾乎不等你：「熱水呢？」你預先倒好。',
        '刀入鞘的聲音你聽過兩次，第三次像老朋友敲門。',
        '有人問刀名，他答：「改用法了。」你在旁邊點頭當人證。',
      ],
      choices: {
        fh3_teach: {
          outcomeText: '他改教你「如何教別人停手」。你覺得這比劍意難，也更值。',
          rewardsPatch: { potential: 3, inspiration: 2 },
        },
        fh3_escort: {
          outcomeText: '护送變成散步。關內有人認你：「又是送刀客的那位。」',
          rewardsPatch: { exp: 15, silver: 10 },
        },
        fh3_part: {
          outcomeText: '道別縮短成拱手。石在袋裡輕響，像週目標完成的提示音。',
          rewardsPatch: { inspiration: 3 },
        },
      },
    },
  },
  arc_bixue_3: {
    1: {
      summary: '殘鋒再收，問句仍在。',
      paragraphs: [
        '園承志看你：「二周目還問收屍？」你回：「還問。」',
        '義莊粥香與上周目重疊七成，排隊法你又優化了一版。',
        '華嶠夜風裡，收勢比出招更像答案。',
      ],
      choices: {
        bx3_swear: {
          outcomeText: '私約續簽。刃意更收，心卻更亮。',
          rewardsPatch: { potential: 2 },
        },
        bx3_write: {
          outcomeText: '小冊出第二版，附「排隊分流圖」。天機閣願意加印。',
          rewardsPatch: { silver: 10, inspiration: 2 },
        },
        bx3_wander: {
          outcomeText: '你下山，這次故意繞義莊門口看一眼燈火，再走。',
          rewardsPatch: { inspiration: 2 },
        },
      },
    },
    2: {
      summary: '三周目問心：答案可以重複，理由可以更新。',
      paragraphs: [
        '園承志把布套遞給你：「你來收。」信任比劍重。',
        '有人把你的義莊方法抄去別城。你說好，別署名也行。',
        '殘鋒冷意仍在指尖，提醒你：績效表可以撕，收屍問題不能撕。',
      ],
      choices: {
        bx3_swear: {
          outcomeText: '約寫進你的現代備忘錄置頂。拔劍前先讀一句——很土，很有效。',
          rewardsPatch: { potential: 3, inspiration: 2 },
        },
        bx3_write: {
          outcomeText: '第三版小冊被當教材。你只收茶錢與一句「別拿去害人」。',
          rewardsPatch: { silver: 20, inspiration: 3 },
        },
        bx3_wander: {
          outcomeText: '歸途更熟，心卻更輕。你把這夜標成「可重複的正確」。',
          rewardsPatch: { staminaDelta: 4, inspiration: 3 },
        },
      },
    },
  },
}

/** 高頻奇遇：NG+ 結果／標籤差分（加深池體感） */
const ENC_OUTCOME_FLAVOR: Record<
  string,
  Record<NgTier, Record<string, ChoiceFlavor>>
> = {
  enc_tea: {
    1: {
      enc_tea_listen: {
        label: '換個角度聽完閒話',
        outcomeText:
          '老闆說的襄揚糧價你聽過，但這次多了靈鷲船期。舊茶新渣，靈感仍動。',
      },
      enc_tea_pay: {
        outcomeText:
          '你多付茶錢，老闆塞你一張「冷門地點」草圖——破廟待太久會變木頭，他寫得很大。',
      },
    },
    2: {
      enc_tea_listen: {
        outcomeText:
          '三周目茶棚老闆換人了。閒話版本號升級，你聽到活死人暮封石新裂紋。',
      },
      enc_tea_pay: {
        outcomeText:
          '茶錢換成「續杯資訊包」。末行附註：桃華琴聲三日不停——敢去的人有奇門殘頁。',
      },
    },
  },
  enc_merchant: {
    1: {
      enc_mer_yes: {
        label: '用上周目議價術成交',
        outcomeText:
          '你先報出他心裡價的八成。商販一愣，成交後塞你一小袋草藥：「回頭客優惠。」',
      },
      enc_mer_no: {
        outcomeText: '你婉拒，卻記下他下一站是雁門。情報免費，荷包安全。',
      },
    },
    2: {
      enc_mer_yes: {
        outcomeText:
          '議價成了表演賽。圍觀的人以為你在施「口才奇功」。貨仍是那個貨，心情比較貴。',
      },
      enc_mer_no: {
        outcomeText: '你搖頭。商販叹气：「三周目了還不買？」你回：「預算控管。」',
      },
    },
  },
  enc_murong_kpi: {
    1: {
      enc_murong_review: {
        label: '幫他改第二版 KPI 表',
        outcomeText:
          '暮容復盯著你改的權重：「這叫……平衡性補丁？」你點頭。他塞你一式身法殘頁當顧問費。',
        rewardsPatch: { martialIds: ['ma_qing_cloud'], inspiration: 3 },
      },
      enc_murong_reject: {
        outcomeText:
          '你拒絕當他的 OKR 顧問。他竟說：「也好，我自己迭代。」江湖第一次聽見這詞從他嘴裡出來。',
      },
    },
    2: {
      enc_murong_review: {
        outcomeText:
          'KPI 第三版你閉眼都能改。暮容復開始談「北溟」與「復國」的資源排程——你只收現銀與殘招。',
        rewardsPatch: { martialIds: ['ma_beiming'], silver: 20 },
      },
      enc_murong_reject: {
        outcomeText: '你拒得乾脆。他低頭記筆記：「拒絕也是一種數據。」你背脊發涼。',
      },
    },
  },
  enc_yanmen_wind: {
    1: {
      enc_yan_company: {
        outcomeText:
          '風砂裡橋峰看你一眼：「步伐穩了。」阿硃低聲：「像走過第二遍的人。」你沒解釋。',
      },
      enc_yan_joke: {
        outcomeText:
          '你丟了個穿越梗。橋峰沒笑，阿硃笑了——風把笑聲撕成碎片，你卻記下一式雁門身法。',
        rewardsPatch: { martialIds: ['ma_qing_yanmen'] },
      },
    },
    2: {
      enc_yan_company: {
        outcomeText:
          '三周目並肩，風砂味道沒變。橋峰只說：「走。」這次你走在上風處，少嗆兩口沙。',
      },
      enc_yan_joke: {
        outcomeText:
          '玩笑說完，阿硃丟你一塊手帕：「擦沙。下個周目別站下風。」你當這是隱藏成就。',
      },
    },
  },
  enc_wharf_ticket: {
    1: {
      enc_ticket_buy: {
        outcomeText:
          '魏曉寶眨眨眼：「二周目友情價。」船票邊角多印小字：可轉桃華／靈鷲。你懷疑他開了會員制。',
      },
      enc_ticket_report: {
        outcomeText:
          '你舉報黃牛。碼頭官差認得你：「又是你？」票價瞬降，名聲微升，魏曉寶遠距比中指——文明版。',
      },
    },
    2: {
      enc_ticket_buy: {
        outcomeText:
          '船票幾乎印著你的外號。魏曉寶：「三周目套餐含保險。」你買了，保險是他拍胸脯。',
      },
      enc_ticket_report: {
        outcomeText:
          '黃牛看到你轉身就跑。碼頭清靜一刻，潮聲替你鼓掌——你把省下的銀兩換成遠航傳聞。',
      },
    },
  },
}

const ENDING_EPILOGUE: Record<NgTier, Record<EndingKey, string>> = {
  1: {
    chivalry:
      '【二周目尾聲】有人在碼頭牆角刻「大俠二刷」。你擦掉兩個字，留下「護弱」。',
    contract:
      '【二周目尾聲】公證處多掛一塊牌：回頭客條款諮詢半價。你假装與你無關。',
    retreat:
      '【二周目尾聲】桃華島多了一張竹椅——皇藥師說是「給吵琴的回頭客」。',
    sword:
      '【二周目尾聲】華嶠弟子開始傳「換招不換心」的江湖段子，主角疑似是你。',
  },
  2: {
    chivalry:
      '【三周目尾聲】潮水第三次送你出港。你明白：俠義不是存檔讀取，是每次重新出手。',
    contract:
      '【三周目尾聲】契約範本流入天機閣庫。你拒絕署名，只在末行寫：透明優先。',
    retreat:
      '【三周目尾聲】你繞遠路回島，花香仍新。重複的腳步，走的是不同的影子。',
    sword:
      '【三周目尾聲】劍台收工，峯清揚留下茶盞：「下周目若還來，換你先出招。」',
  },
}

/** 依上周目結局改寫的 NG+ 序章差分 */
const PROLOGUE_OPENERS: Record<EndingKey, { title: string; lines: string[] }> = {
  chivalry: {
    title: '序章｜雨夜破廟・俠影迴聲',
    lines: [
      '雷聲未歇，你卻先聽見潮聲——上周目護弱登船的喊話，像從雨幕縫裡漏進來。',
      '破廟仍漏，黃衫影仍在。你心裡多了一句：這次，未必走同一條活路。',
    ],
  },
  contract: {
    title: '序章｜雨夜破廟・條款未乾',
    lines: [
      '你醒來第一件事是摸口袋——手機在，合約範本的殘影也在。雨聲像蓋章。',
      '皇容仍受傷，刀客仍在門外。你忽然很想先寫「冷靜期」三字，再決定救人。',
    ],
  },
  retreat: {
    title: '序章｜雨夜破廟・花香錯位',
    lines: [
      '雨裡竟有一瞬桃華花香。你知道那是錯覺，卻仍想：歸隱的路，要不要這次晚一點走？',
      '廟門刀光一閃。穿越第一夜，舊結局的餘溫還在掌心。',
    ],
  },
  sword: {
    title: '序章｜雨夜破廟・劍意未散',
    lines: [
      '你握拳時指節記得碼頭劍台的震感。雷聲像峯清揚的點頭。',
      '黃衫少女抬眼。你明白：招可舊，這一夜的選擇仍要新。',
    ],
  },
}

const NG_TIER_WHISPER: Record<NgTier, string> = {
  1: '（二周目低語：雨還是那場雨，劇本卻允許你改台詞。）',
  2: '（三周目低語：你已能背出破廟樑柱裂紋——別急著跳過，細節會換皮。）',
}

function tierOf(ngPlusCount: number): NgTier | 0 {
  if (ngPlusCount <= 0) return 0
  return Math.min(2, ngPlusCount) as NgTier
}

function patchRewards(
  base: EventRewards,
  patch?: Partial<EventRewards>,
): EventRewards {
  if (!patch) return base
  return {
    ...base,
    ...patch,
    affinity: patch.affinity
      ? { ...(base.affinity ?? {}), ...patch.affinity }
      : base.affinity,
    flags: patch.flags ? { ...(base.flags ?? {}), ...patch.flags } : base.flags,
    martialIds: patch.martialIds ?? base.martialIds,
    items: patch.items ?? base.items,
  }
}

function applyChoiceFlavor(
  choice: StoryEventChoiceDef,
  flavor?: ChoiceFlavor,
): StoryEventChoiceDef {
  if (!flavor) return choice
  return {
    ...choice,
    label: flavor.label ?? choice.label,
    outcomeText: flavor.outcomeText,
    rewards: patchRewards(choice.rewards, flavor.rewardsPatch),
  }
}

/** 依周目為主線／奇遇套上差分段落、選項標籤與結果變體 */
export function flavorEventForNgPlus(
  def: StoryEventDef,
  ngPlusCount: number,
  lastEnding?: EndingKey | null,
): StoryEventDef {
  const tier = tierOf(ngPlusCount)
  if (!tier) return def

  const main = MAIN_FLAVOR[def.id]?.[tier]
  if (main) {
    const choices = def.choices.map((c) =>
      applyChoiceFlavor(c, main.choices[c.id]),
    )
    // 結局選項附加尾聲句
    const withEpilogue = choices.map((c) => {
      if (!c.id.startsWith('y5_ending_')) return c
      const key = c.id.replace('y5_ending_', '') as EndingKey
      const epi = ENDING_EPILOGUE[tier][key]
      if (!epi) return c
      return { ...c, outcomeText: `${c.outcomeText}\n\n${epi}` }
    })
    return {
      ...def,
      title:
        ngPlusCount >= 2 ? `${def.title}·三周目影` : `${def.title}·二周目影`,
      summary: main.summary ?? def.summary,
      paragraphs: main.paragraphs,
      choices: withEpilogue,
    }
  }

  // 奇遇池差分
  const encMap = ENC_OUTCOME_FLAVOR[def.id]?.[tier]
  let choices = def.choices.map((c) => applyChoiceFlavor(c, encMap?.[c.id]))

  // 若為 NG 專屬「結局迴聲」奇遇，依 lastEnding 微調文案
  if (def.id === 'enc_ng_ending_echo' && lastEnding) {
    const label = ENDING_LABEL[lastEnding]
    choices = choices.map((c) => {
      if (c.id === 'enc_ng_echo_accept') {
        return {
          ...c,
          outcomeText: `你承認上周目的「${label}」結局仍在血裡發燙。雨幕裂開一道縫，塞你一頁對應心法摘要——不是重播，是註腳。`,
        }
      }
      if (c.id === 'enc_ng_echo_refuse') {
        return {
          ...c,
          outcomeText: `你拱手：「${label}」可以留下，路要新走。回聲散去，靈感卻留下來。`,
        }
      }
      return c
    })
  }

  if (encMap || def.id.startsWith('enc_ng_')) {
    return {
      ...def,
      title:
        def.id.startsWith('enc_ng_')
          ? def.title
          : ngPlusCount >= 2
            ? `${def.title}·三影`
            : `${def.title}·二影`,
      paragraphs: def.id.startsWith('enc_ng_')
        ? def.paragraphs
        : [...def.paragraphs, NG_TIER_WHISPER[tier]],
      choices,
    }
  }

  // 其餘奇遇：只加低語，避免全文同質
  return {
    ...def,
    title:
      ngPlusCount >= 2 ? `${def.title}·三影` : `${def.title}·二影`,
    paragraphs: [...def.paragraphs, NG_TIER_WHISPER[tier]],
    choices,
  }
}

/** NG+ 序章差分（依周目＋上周目結局） */
export function flavorPrologueForNgPlus(
  base: StoryEvent,
  ngPlusCount: number,
  lastEnding?: EndingKey | null,
): StoryEvent {
  const tier = tierOf(ngPlusCount)
  if (!tier) return base

  const opener =
    lastEnding && PROLOGUE_OPENERS[lastEnding]
      ? PROLOGUE_OPENERS[lastEnding]
      : {
          title:
            ngPlusCount >= 2
              ? '序章｜雨夜破廟・三周目回環'
              : '序章｜雨夜破廟・似曾相識',
          lines: [
            '雷聲未歇，你是被冷雨澆醒的——但這次，你先摸了摸手機電量。',
            NG_TIER_WHISPER[tier],
          ],
        }

  const paragraphs = [
    ...opener.lines,
    ...base.paragraphs.slice(2),
    NG_TIER_WHISPER[tier],
  ]

  const choices = base.choices.map((c) => {
    if (tier === 1) {
      if (c.id === 'choice_aid') {
        return {
          ...c,
          label: '再次扶起皇容——這次包紮更快',
          outcomeText:
            '二周目急救更熟練。皇容一怔：「公子……像做過很多次。」你回：「職業病。」歹人仍來，你們仍走；絹書仍濕，信任卻多了一層不會重播的溫度。',
        }
      }
      if (c.id === 'choice_flashlight') {
        return {
          ...c,
          label: '手電筒再亮——刀客這回有心理準備？',
          outcomeText:
            '白光再爆。刀客有人喊「又是妖光！」有人卻掏出墨鏡狀鐵片——無效。你笑出聲，皇容也笑。電量仍在掉，元寶體驗包卻記得你是回頭客。',
        }
      }
      if (c.id === 'choice_hide_observe') {
        return {
          ...c,
          label: '神龕後再躲——這次多記一條支線',
          outcomeText:
            '刀客交接點你已耳熟，卻多聽到「靈鷲方向有船」。皇容氣音：「公子膽小心細，且記性好得可怕。」你回：「多周目福利。」',
        }
      }
    } else {
      if (c.id === 'choice_aid') {
        return {
          ...c,
          label: '三周目急救流程演練',
          outcomeText:
            '包紮快到皇容來不及吐槽。她只說：「下次換我救你？」你認真想了三秒：「也可以排程。」絹書入袋，結局標籤的餘溫尚未散盡。',
        }
      }
      if (c.id === 'choice_flashlight') {
        return {
          ...c,
          label: '妖光第三刷——順便科普電池',
          outcomeText:
            '刀客開始討論「妖光是否可充電」。你趁亂丟磚頭，完成心理戰第三版。皇容：「中原奇巧會開分支。」螢幕：電量 23%，穿越值 100%。',
        }
      }
      if (c.id === 'choice_hide_observe') {
        return {
          ...c,
          label: '竊聽第三版：記冷門船期',
          outcomeText:
            '交接台詞你能對口型，重點改記桃華與靈鷲船期。皇容：「風險控管升級了？」你點頭。銀錠入掌，像成就解鎖提示音。',
        }
      }
    }
    return c
  })

  return {
    ...base,
    title: opener.title,
    paragraphs,
    choices,
  }
}

/** NG+ 專屬奇遇（僅 ngPlusCount≥1 進入池；加深版） */
export const NG_PLUS_ENCOUNTERS: StoryEventDef[] = [
  {
    id: 'enc_ng_deja_vu',
    year: 0,
    title: '奇遇｜似曾相識的雨',
    summary: '雨聲節奏與上周目重合，茶棚老闆卻換了人。',
    locationId: null,
    paragraphs: [
      '你下意識想接上周目的台詞，話到嘴邊又改了口。',
      '老闆說：「客官第一次來吧？」你笑：「算是。」',
    ],
    choices: [
      {
        id: 'enc_ng_deja_listen',
        label: '故意換個話題打聽',
        hint: '靈感｜差分',
        outcomeText:
          '你避開舊情報，換問靈鷲與桃華的船期。新傳聞進袋，舊劇本鬆了一角。',
        rewards: { inspiration: 4, potential: 2 },
      },
      {
        id: 'enc_ng_deja_train',
        label: '就地複習一套生疏招式',
        hint: '武學',
        outcomeText: '雨聲當節拍器。你把上周目沒練完的招式補了一層皮。',
        rewards: { potential: 3, martialIds: ['ma_qing_swallow'] },
      },
    ],
  },
  {
    id: 'enc_ng_ledger',
    year: 0,
    title: '奇遇｜多周目帳簿',
    summary: '百曉笙拿出一本只對「回頭客」開放的簿子。',
    locationId: 'loc_tianji_hall',
    paragraphs: [
      '簿子上記著你從沒告訴過他的選擇分支。他眨眼：「別問來源。」',
    ],
    choices: [
      {
        id: 'enc_ng_ledger_buy',
        label: '付銀看「冷門地點清單」',
        hint: '導流',
        outcomeText:
          '清單開頭寫：靈鷲峯、桃華島、活死人暮。末行附註：破廟待太久會變木頭。',
        rewards: {
          silver: -25,
          inspiration: 3,
          flags: { travelHintFar: 1 },
        },
      },
      {
        id: 'enc_ng_ledger_trade',
        label: '用上周目心得換殘招',
        hint: '武學',
        outcomeText: '他撕下一角「北溟」旁註給你。墨漬未乾，像剛從別的周目寄來。',
        rewards: {
          martialIds: ['ma_beiming'],
          affinity: { npc_bai_xiaosheng: 4 },
        },
      },
    ],
  },
  {
    id: 'enc_ng_mirror_fight',
    year: 0,
    title: '奇遇｜鏡中對手',
    summary: '路遇一名步法酷似「上周目的你」的刀客。',
    locationId: null,
    paragraphs: ['他出招的節奏讓你背脊發涼——然後你發現他比較菜。'],
    choices: [
      {
        id: 'enc_ng_mirror_fight',
        label: '接戰，驗證成長',
        hint: '戰鬥｜差分',
        outcomeText: '你用新節奏拆掉舊習慣。勝後拾到一頁「繡花針」心法摘要。',
        rewards: { exp: 30, silver: 18, martialIds: ['ma_act_needle'] },
        startCombat: true,
      },
      {
        id: 'enc_ng_mirror_bow',
        label: '拱手：『這局我換打法』',
        hint: '避戰',
        outcomeText: '刀客愣住，自行退開。你保住氣血，也保住一點神秘感。',
        rewards: { inspiration: 2, staminaDelta: 5 },
      },
    ],
  },
  {
    id: 'enc_ng_ending_echo',
    year: 0,
    title: '奇遇｜結局迴聲',
    summary: '雨幕裡響起上周目結局的殘響——只對你一個人。',
    locationId: null,
    paragraphs: [
      '沒有旁白，沒有存檔讀取提示。只有一句幾乎聽不清的回聲，問你：這次要不要換標籤？',
    ],
    choices: [
      {
        id: 'enc_ng_echo_accept',
        label: '承認舊結局，收一頁註腳',
        hint: '靈感｜武學',
        outcomeText:
          '你承認舊結局仍在。雨幕裂縫塞來一頁心法摘要——不是重播鍵，是註腳。',
        rewards: {
          inspiration: 5,
          potential: 3,
          martialIds: ['ma_heart_calm'],
          flags: { endingEchoAccepted: 1 },
        },
      },
      {
        id: 'enc_ng_echo_refuse',
        label: '拒絕重播，只要新路',
        hint: '差分',
        outcomeText: '回聲散去。你走入雨中，腳步與上周目錯開半寸——剛好夠改命運。',
        rewards: { inspiration: 4, staminaDelta: 4, flags: { endingEchoRefused: 1 } },
      },
    ],
  },
  {
    id: 'enc_ng_cold_compass',
    year: 0,
    title: '奇遇｜冷門羅盤',
    summary: '天機閣小販塞你一枚只指向「人少之地」的羅盤。',
    locationId: 'loc_luoyang_post',
    paragraphs: [
      '指針瘋狂避開襄揚與破廟。小販說：「過熱樞紐會讓羅盤頭暈。」',
    ],
    choices: [
      {
        id: 'enc_ng_compass_follow',
        label: '跟著指針走一段',
        hint: '導流｜遠方',
        outcomeText:
          '羅盤把你推向靈鷲／桃華傳聞交會處。你未必立刻抵達，但地圖在心裡亮了兩格。',
        rewards: {
          inspiration: 3,
          silver: -10,
          flags: { travelHintFar: 1, coldCompass: 1 },
          martialIds: ['ma_qing_lingbo'],
        },
      },
      {
        id: 'enc_ng_compass_sell',
        label: '轉賣給路痴刀客',
        hint: '銀兩',
        outcomeText: '刀客買走羅盤，朝破廟狂奔。你賺了銀兩，也賺了一點良心不安。',
        rewards: { silver: 30, inspiration: 1 },
      },
    ],
  },
  {
    id: 'enc_ng_sect_memo',
    year: 0,
    title: '奇遇｜門派內部備忘',
    summary: '有人把「多周目穿越客注意事項」貼在山門內側。',
    locationId: 'loc_huashan',
    paragraphs: [
      '備忘錄第一條：勿說「我看過結局」。第二條：可請他改 KPI。峯清揚的字跡在頁腳。',
    ],
    choices: [
      {
        id: 'enc_ng_memo_sign',
        label: '簽名：本周目不劇透',
        hint: '好感',
        outcomeText:
          '你簽了名。華嶠弟子鬆口氣，塞你一式劍意殘頁：「當封口費。」',
        rewards: {
          affinity: { npc_feng_qingyang: 5, npc_linghu_chong: 3 },
          martialIds: ['ma_qing_huashan'],
          potential: 2,
        },
      },
      {
        id: 'enc_ng_memo_edit',
        label: '幫他們改成白話版',
        hint: '靈感',
        outcomeText:
          '你把文言改成：「別劇透，可幫忙。」山門一夜讀懂率上升，靈感也上升。',
        rewards: { inspiration: 5, silver: 8 },
      },
    ],
  },
  {
    id: 'enc_ng_timeline_glitch',
    year: 0,
    title: '奇遇｜旬曆錯位',
    summary: '你的現代日曆 App 突然跳出「周目進度 67%」。',
    locationId: null,
    paragraphs: [
      '沒訊號，卻有進度條。你懷疑是穿越系統的錯誤提示——或某種惡趣味。',
    ],
    choices: [
      {
        id: 'enc_ng_glitch_screenshot',
        label: '截圖存證（反正沒雲端）',
        hint: '吐槽｜靈感',
        outcomeText:
          '你截了圖。進度條閃爍後變成一句話：內容差分已套用。潛能微動，像被系統拍肩。',
        rewards: { inspiration: 3, potential: 3, exp: 15 },
      },
      {
        id: 'enc_ng_glitch_ignore',
        label: '關掉 App，當沒看見',
        hint: '穩妥',
        outcomeText:
          '你滑掉通知。雨聲恢復正常。有些 bug 不修，反而是江湖的一部分。',
        rewards: { staminaDelta: 6 },
      },
    ],
  },
  {
    id: 'enc_ng_peach_rerun',
    year: 0,
    title: '奇遇｜桃華返場琴',
    summary: '琴音隔海傳來，像點名回頭客。',
    locationId: 'loc_peach_island',
    paragraphs: [
      '皇藥師未必見你，琴聲卻像在說：別踩同一叢花——除非你有新理由。',
    ],
    choices: [
      {
        id: 'enc_ng_peach_bow',
        label: '隔空拱手，聽完再走',
        hint: '奇門',
        outcomeText:
          '琴音終了，風送一頁奇門殘譜。花瓣沒被你踩到——成就解鎖的感覺。',
        rewards: {
          inspiration: 4,
          martialIds: ['ma_heart_peach'],
          affinity: { npc_huang_yaoshi: 5 },
        },
      },
      {
        id: 'enc_ng_peach_ask',
        label: '大聲問：這周目有新曲嗎？',
        hint: '膽大',
        outcomeText:
          '琴聲頓住半拍，隨後換成你沒聽過的變奏。皇容遠距傳話：「他說你吵，但給過了。」',
        rewards: {
          potential: 4,
          martialIds: ['ma_hua_gong'],
          affinity: { npc_huang_rong: 4 },
        },
      },
    ],
  },
]
