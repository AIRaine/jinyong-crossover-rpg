/**
 * WuxiaLife Top3：見聞錄／共鳴／窗口預告
 */
import { createInitialGameState } from '../src/data/initialState'
import {
  buildLifeScroll,
  harvestAtlasFromState,
  mergeAtlas,
  summarizeAtlas,
  syncJianghuAtlas,
  tideWindowHint,
} from '../src/lib/jianghuAtlas'
import { applyNewGamePlus } from '../src/lib/ngPlus'
import {
  activeEquippedResonances,
  resonancesForArt,
} from '../src/lib/martialResonance'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

let state = createInitialGameState()
state = {
  ...state,
  prologueDone: true,
  knownLocationIds: ['loc_broken_temple', 'loc_xiangyang'],
  locationId: 'loc_xiangyang',
  martialProgress: {
    ...state.martialProgress,
    ma_shaolin_yi: 2,
    ma_shaolin_xisui: 1,
    ma_wudang_taiji: 1,
  },
  martialLoadout: {
    ...state.martialLoadout,
    internalId: 'ma_shaolin_yi',
    heartId: 'ma_shaolin_xisui',
  },
  completedBeatIds: ['b1', 'b2'],
  affinity: { ...state.affinity, npc_huang_rong: 40 },
  time: { ...state.time, year: 4 },
}

state = syncJianghuAtlas(state)
assert(
  (state.jianghuAtlas?.martialIds.length ?? 0) >= 2,
  '見聞錄應記下已學武學',
)

const atlas = summarizeAtlas(state)
assert(atlas.martial >= 2, '摘要武學數')
assert(atlas.line.includes('江湖見聞錄'), atlas.line)

const reso = resonancesForArt(state, 'ma_shaolin_yi')
assert(reso.length >= 1, '應有共鳴線索')
assert(/共鳴/.test(reso[0]!.line), reso[0]!.line)

const active = activeEquippedResonances(state)
assert(active.some((r) => r.id === 'res_shaolin_body'), '易筋洗髓應啟動')

const hint = tideWindowHint(state)
assert(/窗口/.test(hint), hint)

const scroll = buildLifeScroll(state)
assert(scroll[0]!.includes('長卷'), scroll[0]!)

// NG+ 保留見聞錄
state = {
  ...state,
  ngPlusReady: true,
  storyFlags: { ...state.storyFlags, main_y5_wharf: true },
  flags: { ...state.flags, ending_chivalry: 1 },
}
state = syncJianghuAtlas(state)
const next = applyNewGamePlus(state)
assert(
  (next.jianghuAtlas.martialIds.length ?? 0) >= 2,
  'NG+ 應保留武學殘頁',
)
assert(
  next.jianghuAtlas.endingKeys.includes('chivalry'),
  'NG+ 應留下結局見聞',
)
const merged = mergeAtlas(next.jianghuAtlas, harvestAtlasFromState(next))
assert(merged.martialIds.length >= 2, '合併不應丟歷世')

console.log(
  JSON.stringify(
    {
      ok: true,
      atlas: atlas.line,
      resonance: active.map((r) => r.line),
      window: hint,
      scroll: scroll.slice(0, 2),
      ngPlusAtlas: summarizeAtlas(next).line,
    },
    null,
    2,
  ),
)
