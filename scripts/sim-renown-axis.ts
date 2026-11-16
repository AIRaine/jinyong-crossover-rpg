/**
 * 群俠 Top3：聲名／傾向軸、入隊拒絕、潮信雙閘
 */
import { createInitialGameState } from '../src/data/initialState'
import { applyRewards } from '../src/lib/applyRewards'
import {
  canRecruitNpc,
  finaleDualGateOk,
  tideInviteStatus,
} from '../src/lib/renownAxis'
import { computeJourneyProfile } from '../src/lib/journeyPath'
import type { GameState } from '../src/types/game'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

let state = createInitialGameState()
state = {
  ...state,
  prologueDone: true,
  affinity: { ...state.affinity, npc_guo_jing: 40, npc_ouyang_feng: 40 },
}

// 好感夠但聲名／傾向不夠 → 婉拒一句
let check = canRecruitNpc(state, 'npc_guo_jing')
assert(!check.ok, '廓靖應因聲名／傾向拒絕')
assert(
  Boolean(check.reason && /聲名|傾向/.test(check.reason)),
  `拒絕理由應提聲名／傾向，得：${check.reason}`,
)

check = canRecruitNpc(state, 'npc_ouyang_feng')
assert(!check.ok, '歐陽豐應拒絕')
assert(Boolean(check.reason), '歐陽豐應有拒絕理由')

// 重大選擇（俠義路）升降聲名／傾向
const y1 = applyRewards(state, {
  flags: { route_y1: 'chivalry' },
  affinity: { npc_guo_jing: 5 },
})
state = y1.state
assert((state.renown ?? 0) >= 8, `俠義路應加聲名，得 ${state.renown}`)
assert((state.alignment ?? 0) >= 12, `俠義路應加傾向，得 ${state.alignment}`)
assert(
  y1.messages.some((m) => m.includes('聲名') || m.includes('俠義')),
  '應有軸升降訊息',
)

// 權謀 NPC：聲名夠但傾向太正仍拒
check = canRecruitNpc(
  {
    ...state,
    renown: 20,
    affinity: { ...state.affinity, npc_ouyang_feng: 50 },
  },
  'npc_ouyang_feng',
)
assert(!check.ok, '傾向偏正時歐陽豐仍應拒絕')
assert(/傾向/.test(check.reason ?? ''), `應提傾向，得：${check.reason}`)

// 雙閘：初始請帖未至
let tide = tideInviteStatus(state)
assert(!tide.inviteReady, '初期請帖不應就緒')
assert(!finaleDualGateOk(state), '雙閘應未過')

// 堆話本碎片＋聲名
state = {
  ...state,
  renown: 25,
  completedBeatIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  partyIds: ['npc_huang_rong'],
  lifetimeBanditWins: 5,
  sectId: 'sect_beggar',
  sectContribution: 40,
  martialLoadout: {
    ...state.martialLoadout,
    internalId: 'ma_jiuyang',
    heartId: 'ma_heart_liancheng',
    qinggongId: 'ma_qing_tomb',
    activeIds: ['ma_act_xuantie', 'ma_act_lonely'],
  },
  martialProgress: {
    ...state.martialProgress,
    ma_jiuyang: 3,
    ma_heart_liancheng: 2,
    ma_qing_tomb: 2,
    ma_act_xuantie: 2,
    ma_act_lonely: 2,
  },
} as GameState

tide = tideInviteStatus(state)
assert(tide.shardsOk, `話本應達標，得 ${tide.shards.current}/${tide.shards.need}`)
assert(tide.renownOk, '聲名應達標')
assert(tide.inviteReady, `請帖應可至：${tide.line}`)
assert(finaleDualGateOk(state), '雙閘應通過')

const journey = computeJourneyProfile(state)
// finaleEngaged 還需養成戰鬥閘；本狀態應接近可投入
console.log(
  JSON.stringify(
    {
      ok: true,
      renown: state.renown,
      alignment: state.alignment,
      tide: tide.line,
      shards: tide.shards,
      finaleEngaged: journey.finaleEngaged,
      recruitHintGuo: canRecruitNpc(state, 'npc_guo_jing'),
    },
    null,
    2,
  ),
)
