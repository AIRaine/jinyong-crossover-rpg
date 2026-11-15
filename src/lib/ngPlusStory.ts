import type { StoryEventChoiceDef, StoryEventDef } from '../types/game'

/** NG+ 主線／結局選項文案變體（依 choice id） */
const NG_OUTCOME: Record<number, Record<string, string>> = {
  1: {
    y1_guard:
      '二周目的你早知刀客埋伏點。糧車仍險，但你少走了兩段冤枉路——襄揚守軍愣了愣：「這人怎像預演過？」',
    y1_scout:
      '你這次連敵營茶水口味都記得。情報賣得更貴，百曉笙嘀咕：「訂閱制升級了？」',
    y1_bargain:
      '銀兩仍要撒，但你精準砸在內應的賭債上。廓靖皺眉更深，皇容卻悄悄豎了拇指。',
    y2_spar:
      '劍台再上，對手招式似曾相識。你改用另一套節奏拆招——華嶠弟子討論：「他換流派了？」',
    y2_judge:
      '筆記第二版多了「破綻時間軸」。望語嫣說這可比第一版好用——你沒說那是迭代。',
    y2_expose:
      '你這回把「君子簡報」對上了三份旁證。仍未當眾拆穿，抄本卻更厚。',
    y3_clear:
      '墓道機關你幾乎能背。盜墓者潰逃更快，宵朧女多看你一眼：「不像初來。」',
    y3_seal:
      '裂縫量測更快，封石一次到位。宵朧女點頭幅度比上周目大半寸。',
    y3_peach:
      '皇藥師遠距琴音仍來，附贈一句：「別每次都吵我。」你回：「這次比較短。」',
    y4_break:
      '談判仍崩，但你預留撤退巷。突圍少流兩成血，雙方願意「再約」的口氣軟了點。',
    y4_clause:
      '契約範本你早備好第二版。崖上改條款速度變快，兆敏笑：「有備而來？」',
    y4_fire:
      '小火盆誓言多了「冷靜期」附註。土味依舊，流程更像專案結案。',
    y5_ending_chivalry:
      '護弱登船仍是你的選擇。有人喊「大俠」時，你回：「二周目也一樣。」風裡有人聽懂，有人沒懂。',
    y5_ending_contract:
      '船票公證條款寫得更細。魏曉寶說手續費可議，兆敏說違約金不可議。',
    y5_ending_retreat:
      '桃華小住再度啟程。皇藥師：「又來？」你：「換個角落，不踩同一叢花。」',
    y5_ending_sword:
      '碼頭劍台再開。峯清揚說：「招熟不算贏。」你換了一式——勝敗仍其次，話題更新了。',
  },
  2: {
    y1_guard:
      '三周目護糧，你幾乎在導遊劫匪：「左邊第二棵柳樹。」刀客懵了，隊友也懵了。',
    y1_scout:
      '情報這次附「風險矩陣」。天機閣想聘你當顧問——你婉拒，只要現銀。',
    y1_bargain:
      '你用三周目經驗談批發價拆散內應。銀兩少花，效果一樣髒。',
    y2_spar:
      '論劍預熱成了你的複習考。險勝改為穩勝，凌狐沖酒醒一半：「你這傢伙……進步得假。」',
    y2_judge:
      '筆記第三版開始標「NG+ 注意事項」。望語嫣問何謂 NG+，你說：「多周目的現代黑話。」',
    y2_expose:
      '你把嶽不群的進度表做成紅黃綠燈。他笑容僵了一瞬，隨即更亮。',
    y3_clear:
      '清剿變成流程演練。揚過抱怨不夠刺激，宵朧女說：「夠用就好。」',
    y3_seal:
      '封陣圖你能倒背。工程味十足，古暮派默默記你人情更厚。',
    y3_peach:
      '琴音定石後，皇藥師多丟一句：「三周目了還來？」你回：「迭代。」',
    y4_break:
      '你預判崩盤節點，開打前先挪隊友。戰損下降，合約桌上的火氣也下降。',
    y4_clause:
      '第三方公證條款已成範本庫。天機閣想收授權費，你說下個周目再說。',
    y4_fire:
      '聖火見證多了簽到表。章無忌無奈，榭遜只哼：「麻煩。」',
    y5_ending_chivalry:
      '你仍護弱先登。旁人說看穿你了——你說：「看穿也無妨，選擇沒變。」',
    y5_ending_contract:
      '公證船票幾乎成行業標準。有人罵你把江湖做成金流，你回：「至少透明。」',
    y5_ending_retreat:
      '歸隱路徑你走得更熟，也更故意繞遠。海風裡你寫下：重複不等於無意義。',
    y5_ending_sword:
      '論劍成了老友局。峯清揚點頭：「招可舊，心要新。」你記下這句當周目標語。',
  },
}

const NG_PARAGRAPH_SUFFIX: Record<number, string> = {
  1: '（二周目低語：有些旗影似曾相識，選擇卻仍要親手再蓋一次章。）',
  2: '（三周目低語：劇本骨架未變，節奏與吐槽已換層皮——別急著說看穿。）',
}

/** 依周目為事件套上差分段落與結局變體 */
export function flavorEventForNgPlus(
  def: StoryEventDef,
  ngPlusCount: number,
): StoryEventDef {
  if (ngPlusCount <= 0) return def
  const tier = Math.min(2, ngPlusCount) as 1 | 2
  const suffix = NG_PARAGRAPH_SUFFIX[tier]
  const outcomeMap = NG_OUTCOME[tier] ?? {}

  const paragraphs = suffix
    ? [...def.paragraphs, suffix]
    : [...def.paragraphs]

  const choices: StoryEventChoiceDef[] = def.choices.map((c) => {
    const alt = outcomeMap[c.id]
    if (!alt) return c
    return { ...c, outcomeText: alt }
  })

  return {
    ...def,
    title:
      ngPlusCount >= 2
        ? `${def.title}·三周目影`
        : `${def.title}·二周目影`,
    paragraphs,
    choices,
  }
}

/** NG+ 專屬奇遇（僅 ngPlusCount≥1 進入池） */
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
        rewards: { martialIds: ['ma_beiming'], affinity: { npc_bai_xiaosheng: 4 } },
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
]
