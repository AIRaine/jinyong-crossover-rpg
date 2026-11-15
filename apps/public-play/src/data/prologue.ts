import type { StoryEvent } from '../types/game'

/**
 * 序章：雨夜破廟
 * 諧音世界觀——皇容、襄揚、《久隱心經》殘頁等，禁止原著完整專名。
 */
export const PROLOGUE_EVENT: StoryEvent = {
  id: 'event_prologue_rain_temple',
  title: '序章｜雨夜破廟',
  locationName: '雨夜破廟',
  paragraphs: [
    '雷聲未歇，你是被冷雨澆醒的。',
    '身下是粗糙的蒲團，頭頂漏著一線天光——不，是火光。破廟樑柱歪斜，門神畫已剝落成兩團墨影。廟外風過林梢，像有人低聲念咒。',
    '你摸了摸口袋：手機還在，訊號格子卻空得徹底。開鎖畫面停在穿越前最後一則訊息——同事問你「襄揚古城旅遊攻略寫完沒」。你苦笑：襄揚是寫完了，人怎麼把自己也寫進去了？',
    '角落裡忽然傳來壓抑的吸氣聲。',
    '一團鵝黃色衣衫蜷在香案後。少女額角帶傷，眉眼卻靈動得不像奄奄一息的人。她抬眼看你，聲音輕，卻字字清楚：「公子若是歹人，這廟外還有三個拿刀的；若不是……便勞駕伸把手。」',
    '你腦海裡莫名冒出一個名字，像是從哪本禁書目錄裡抄來的代稱——皇容。她腕間隱約露出半頁濕透的絹書，隱約可見「久隱」二字，難道是傳聞中的《久隱心經》殘頁？',
    '廟門口靴聲響動。刀光一閃，有人低喝：「黃衫女娃跑不遠！搜！」',
    '雨、刀、傷者、沒訊號的手機。穿越第一夜，便要你選一條活路。',
  ],
  choices: [
    {
      id: 'choice_aid',
      label: '上前扶起皇容，用現代急救法包紮',
      hint: '仁心路線｜消耗精力，換取信任',
      rewards: {
        staminaDelta: -15,
        silver: 20,
        exp: 30,
        affinity: { npc_huang_rong: 25 },
        flags: {
          helpedHuangRong: true,
          firstAidUsed: true,
        },
        items: [
          {
            id: 'item_jiuyin_fragment',
            name: '《久隱心經》殘頁',
            description: '墨跡被雨暈開，僅餘「久隱」與數行呼吸心法。皇容說：先欠你一命，日後再論經文真偽。',
            quantity: 1,
            kind: 'manual',
          },
        ],
        questsToComplete: ['quest_prologue'],
        questsToAdd: [
          {
            id: 'quest_escort_hint',
            title: '桃華舊約',
            description: '皇容言及東南方海島有故人等待。你未必跟去，但這條線已在江湖裡輕輕扣響。',
            status: 'active',
            source: 'event_prologue_rain_temple',
            objectives: [
              {
                id: 'obj_leave_temple',
                text: '離開破廟，尋覓下一處落腳',
                done: false,
              },
            ],
          },
        ],
        combatPlaceholder: {
          victory: true,
          summary: '你護在皇容身前，歹人以刀脅人。混亂中你用醫箱金屬扣撞擊香爐，聲東擊西，趁雨聲掩走刀客視線。雙方未真正交鋒，危局已解。',
          rewardsNote: '戰鬥系統尚未開放，此為序章佔位結算。',
        },
      },
      outcomeText:
        '你撕開能量棒鋁箔當隔水層，又用保溫瓶熱水溫敷她額角。皇容一怔，隨即低笑：「奇哉，江湖郎中從無這等法子。」歹人踹門而入時，她已能自行運氣閉住傷口。你倆藉梁上積灰迷眼，從側門鑽入雨幕。臨別她塞來一角濕絹：「《久隱心經》殘頁。拿著——別告訴丐幇的人我漏了嘴。」你望著她沒入林中的鵝黃色影，忽然覺得這江湖，比旅遊攻略難寫多了。',
    },
    {
      id: 'choice_flashlight',
      label: '掏出手機手電筒猛照廟門',
      hint: '穿越梗路線｜唬退刀客，略損氣血',
      rewards: {
        hpDelta: -10,
        staminaDelta: -5,
        yuanbao: 10,
        silver: 5,
        exp: 25,
        affinity: { npc_huang_rong: 10 },
        flags: {
          usedFlashlightScare: true,
          banditsFled: true,
        },
        items: [
          {
            id: 'item_bandit_pouch',
            name: '刀客遺落的錢袋',
            description: '裡面幾枚碎銀，還有一張寫著「襄揚城東客棧」的皺巴紙片。',
            quantity: 1,
            kind: 'misc',
          },
        ],
        questsToComplete: ['quest_prologue'],
        questsToAdd: [
          {
            id: 'quest_flashlight_rumor',
            title: '妖光傳聞',
            description: '手電筒的白光已在刀客口中變成「破廟妖光」。日後若入襄揚，或可聽到走樣的版本。',
            status: 'active',
            source: 'event_prologue_rain_temple',
            objectives: [
              {
                id: 'obj_hear_rumor',
                text: '在城鎮打聽「破廟妖光」的說法',
                done: false,
              },
            ],
          },
        ],
        combatPlaceholder: {
          victory: true,
          summary: '白光乍現，刀客以為雷公顯聖，陣腳大亂。你趁勢擲出半塊磚頭，對方悲鳴著退入雨夜。稱不上武學對決，卻是場漂亮的心理戰。',
          rewardsNote: '戰鬥系統尚未開放，此為序章佔位結算。',
        },
      },
      outcomeText:
        '你拇指一滑，手機手電筒爆出慘白光柱，直刺廟門。刀客慘叫：「雷火！雷火入廟！」盔甲撞香案，銀兩撒了一地。皇容捂著嘴，眼底卻亮：「這……這是何種機關？比明皎教的夜行火折子還利。」你乾咳：「現代——咳，中原奇巧。體驗用元寶？不，是小意思。」她忍俊不禁，塞你一袋刀客掉落的碎銀，又道：「襄揚方向若有緣，再請你這『妖光公子』喝茶。」你低頭看著螢幕電量：23%。江湖第一課：先省電。系統額外塞了十顆體驗元寶——大概是獎勵你把穿越梗用得夠徹底。',
    },
    {
      id: 'choice_hide_observe',
      label: '拉皇容躲入神龕後，靜觀其變',
      hint: '謹慎路線｜少獲財貨，多留後路',
      rewards: {
        staminaDelta: -8,
        silver: 10,
        exp: 20,
        affinity: { npc_huang_rong: 15 },
        flags: {
          hidWithHuangRong: true,
          overheardBanditPlan: true,
        },
        items: [
          {
            id: 'item_overheard_note',
            name: '竊聽所得的路線圖抄本',
            description: '你默記下刀客口中的交接點：襄揚城西、玄木崖外圍、以及一句「魏曉寶的舊識會接手」。',
            quantity: 1,
            kind: 'quest',
          },
        ],
        questsToComplete: ['quest_prologue'],
        questsToAdd: [
          {
            id: 'quest_shadow_route',
            title: '雨中竊聽',
            description: '刀客提及襄揚與玄木崖的交接。情報在手，何時出手由你決定。',
            status: 'active',
            source: 'event_prologue_rain_temple',
            objectives: [
              {
                id: 'obj_verify_route',
                text: '確認襄揚城西的交接傳聞是否屬實',
                done: false,
              },
            ],
          },
        ],
        combatPlaceholder: {
          victory: true,
          summary: '你與皇容屏息於神龕後。刀客搜廟無果，留下一句「改去襄揚會合」便離開。無拳腳相交，卻聽見了比拳頭更值錢的情報。',
          rewardsNote: '戰鬥系統尚未開放，此為序章佔位結算。',
        },
      },
      outcomeText:
        '你比了個現代常見的「噓」手勢，拉皇容退入斑駁神龕後。刀客踩過積水，罵罵咧咧：「黃衫女娃難道長翅膀？大哥說了，貨要在襄揚城西交，誤了玄木崖那邊魏曉寶舊識的船期，大家都別想拿分成！」腳步遠去。皇容貼近你耳邊，氣音帶笑：「公子膽小心細，倒像古暮派那種縮骨潛行的法門。」你回：「這叫風險控管。」她點頭，將一枚半舊銀錠塞進你掌心：「竊聽費。改日若走襄揚，可來找我對暗號——就說『手電筒沒電也要活』。」你愣住：她什麼時候學會這句的？她眨眼：「方才你口袋亮了一下呀。」',
    },
  ],
}

export function getPrologueEvent(): StoryEvent {
  return PROLOGUE_EVENT
}
