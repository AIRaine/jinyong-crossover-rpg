/**
 * 故事弧註冊表（階段 B：≥7 條可體驗弧，各 ≥3 節拍）
 * libraryTag 僅內部；勿在 UI 顯示原著對照。
 */
import type { GameState, StoryArcDef, WeeklyGoalState } from '../types/game'

export type { WeeklyGoalState }

/** 主線節拍之間至少間隔幾旬 */
export const STORY_BEAT_COOLDOWN_XUN = 4

/** 日登獎勵（無課可領） */
export const DAILY_LOGIN_SILVER = 25
export const DAILY_LOGIN_POTENTIAL = 2
export const DAILY_LOGIN_AP = 1

/** 結局閘：至少完成此數量非結局節拍後才解鎖東海潮信 */
export const FINALE_MIN_BEATS = 9

export const STORY_ARCS: StoryArcDef[] = [
  {
    id: 'arc_shediao',
    title: '邊城烽煙',
    summary: '襄揚糧道、桃華人情與白駝試煉，開局立足之弧。',
    libraryTag: 'shediao',
    starterWeight: 10,
    beats: [
      { id: 'beat_shediao_1', eventId: 'main_y1_xiangyang', title: '襄揚烽煙' },
      { id: 'beat_shediao_2', eventId: 'arc_shediao_2', title: '桃華請柬' },
      { id: 'beat_shediao_3', eventId: 'arc_shediao_3', title: '糧道終裁' },
    ],
  },
  {
    id: 'arc_xiaoao',
    title: '華嶠與玄木',
    summary: '論劍預熱、崖上夜會、思過崖回音——笑傲一路。',
    libraryTag: 'xiaoao',
    starterWeight: 6,
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      { id: 'beat_xiaoao_1', eventId: 'main_y2_huashan', title: '華嶠論劍預熱' },
      { id: 'beat_xiaoao_2', eventId: 'main_y4_xuanmu', title: '玄木崖夜會' },
      { id: 'beat_xiaoao_3', eventId: 'arc_xiaoao_3', title: '思過崖回音' },
    ],
  },
  {
    id: 'arc_shendiao',
    title: '暮門寒絲',
    summary: '活死人暮異響、寒絲夜課與古暮收束。',
    libraryTag: 'shendiao',
    starterWeight: 6,
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      { id: 'beat_shendiao_1', eventId: 'main_y3_tomb', title: '活死人暮異響' },
      { id: 'beat_shendiao_2', eventId: 'arc_shendiao_2', title: '寒絲夜課' },
      { id: 'beat_shendiao_3', eventId: 'arc_shendiao_3', title: '古暮收束' },
    ],
  },
  {
    id: 'arc_yitian',
    title: '聖火與戒律',
    summary: '冰火初探、明皎與峩眉對齊、倚巔去向。',
    libraryTag: 'yitian',
    starterWeight: 4,
    unlockWhen: { minBeatsDone: 2 },
    beats: [
      { id: 'beat_yitian_1', eventId: 'arc_yitian_1', title: '冰火初探' },
      { id: 'beat_yitian_2', eventId: 'arc_yitian_2', title: '聖火與戒律' },
      { id: 'beat_yitian_3', eventId: 'arc_yitian_3', title: '倚巔去向' },
    ],
  },
  {
    id: 'arc_tianlong',
    title: '天龍雲路',
    summary: '大裡迷路、靈鷲雲約、雁門沉默。',
    libraryTag: 'tianlong',
    starterWeight: 4,
    unlockWhen: { minBeatsDone: 2 },
    beats: [
      { id: 'beat_tianlong_1', eventId: 'arc_tianlong_1', title: '大裡迷路局' },
      { id: 'beat_tianlong_2', eventId: 'arc_tianlong_2', title: '靈鷲雲約' },
      { id: 'beat_tianlong_3', eventId: 'arc_tianlong_3', title: '雁門沉默' },
    ],
  },
  {
    id: 'arc_luding',
    title: '碼頭人情',
    summary: '船票股份、妖光公關與人情收束。',
    libraryTag: 'luding',
    starterWeight: 3,
    unlockWhen: { minBeatsDone: 3 },
    beats: [
      { id: 'beat_luding_1', eventId: 'arc_luding_1', title: '碼頭股份說明會' },
      { id: 'beat_luding_2', eventId: 'arc_luding_2', title: '夜半妖光公關' },
      { id: 'beat_luding_3', eventId: 'arc_luding_3', title: '人情收束' },
    ],
  },
  {
    id: 'arc_xiake',
    title: '俠氣石壁',
    summary: '潮履引路、壁上殘譜、島信寄出。',
    libraryTag: 'xiake',
    starterWeight: 0,
    unlockWhen: { minBeatsDone: 4 },
    beats: [
      { id: 'beat_xiake_1', eventId: 'arc_xiake_1', title: '潮履引路' },
      { id: 'beat_xiake_2', eventId: 'arc_xiake_2', title: '壁上殘譜' },
      { id: 'beat_xiake_3', eventId: 'arc_xiake_3', title: '島信寄出' },
    ],
  },
  {
    id: 'arc_tide_ending',
    title: '東海潮信',
    summary: '碼頭潮起，結局分歧——需足夠江湖閱歷才開。',
    libraryTag: 'finale',
    starterWeight: 0,
    unlockWhen: { minBeatsDone: FINALE_MIN_BEATS },
    beats: [
      {
        id: 'beat_finale_1',
        eventId: 'main_y5_wharf',
        title: '東海潮信・結局',
      },
    ],
  },
]

const EVENT_TO_BEAT = new Map<string, { arcId: string; beatId: string }>()
for (const arc of STORY_ARCS) {
  for (const beat of arc.beats) {
    EVENT_TO_BEAT.set(beat.eventId, { arcId: arc.id, beatId: beat.id })
  }
}

/** 可體驗弧：非結局且節拍 ≥3 */
export function countExperienceableArcs(): number {
  return STORY_ARCS.filter(
    (a) => a.libraryTag !== 'finale' && a.beats.length >= 3,
  ).length
}

export function getArcById(id: string): StoryArcDef | undefined {
  return STORY_ARCS.find((a) => a.id === id)
}

export function beatMetaForEvent(
  eventId: string,
): { arcId: string; beatId: string } | undefined {
  return EVENT_TO_BEAT.get(eventId)
}

export function allArcEventIds(): string[] {
  return [...EVENT_TO_BEAT.keys()]
}

export function countCompletedBeats(state: GameState): number {
  return state.completedBeatIds.length
}

export function isBeatDone(state: GameState, beatId: string): boolean {
  return state.completedBeatIds.includes(beatId)
}

export function arcMeetsUnlock(state: GameState, arc: StoryArcDef): boolean {
  if (state.unlockedArcIds.includes(arc.id)) return true
  const when = arc.unlockWhen
  if (!when) return false
  if (
    when.minBeatsDone != null &&
    countCompletedBeats(state) < when.minBeatsDone
  ) {
    return false
  }
  if (when.requireArcIds?.length) {
    for (const id of when.requireArcIds) {
      const req = getArcById(id)
      if (!req) return false
      if (!req.beats.every((b) => isBeatDone(state, b.id))) return false
    }
  }
  return true
}

export function rollStarterArcs(routeSeed: number): string[] {
  const mandatory = 'arc_shediao'
  const pool = STORY_ARCS.filter(
    (a) => a.id !== mandatory && a.starterWeight > 0,
  )
  let s = Math.abs(routeSeed) % 9973
  const weights = pool.map((a) => a.starterWeight)
  const total = weights.reduce((a, b) => a + b, 0) || 1
  let roll = s % total
  let picked = pool[0]?.id
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll < 0) {
      picked = pool[i].id
      break
    }
  }
  return picked ? [mandatory, picked] : [mandatory]
}

export function refreshUnlockedArcs(state: GameState): string[] {
  const set = new Set(state.unlockedArcIds)
  if (set.size === 0) {
    for (const id of rollStarterArcs(state.routeSeed || 1)) set.add(id)
  }
  // 遷移：舊骨架曾用 arc_xiaoao_rise／cliff
  if (set.has('arc_xiaoao_rise') || set.has('arc_xiaoao_cliff')) {
    set.delete('arc_xiaoao_rise')
    set.delete('arc_xiaoao_cliff')
    set.add('arc_xiaoao')
  }
  for (const arc of STORY_ARCS) {
    if (arcMeetsUnlock(state, arc)) set.add(arc.id)
  }
  return [...set]
}

/**
 * 下一個可掛節拍：各已解鎖弧取「下一未了拍」，再依 routeSeed 亂抽一條
 * （弧內仍有序；弧與弧之間非固定流程）
 */
export function getNextStoryEventId(state: GameState): string | undefined {
  if (state.xunsSinceLastBeat < STORY_BEAT_COOLDOWN_XUN) return undefined

  const candidates: string[] = []
  for (const arcId of state.unlockedArcIds) {
    const arc = getArcById(arcId)
    if (!arc) continue
    for (const beat of arc.beats) {
      if (state.storyFlags[beat.eventId]) continue
      if (isBeatDone(state, beat.id)) continue
      candidates.push(beat.eventId)
      break
    }
  }
  if (!candidates.length) return undefined
  const idx =
    Math.abs(state.routeSeed + state.completedBeatIds.length * 17) %
    candidates.length
  return candidates[idx]
}

export function calendarDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function calendarWeekKey(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000) + 1
  const week = Math.ceil(dayOfYear / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export type WeeklyGoalKind = WeeklyGoalState['kind']

export function buildWeeklyGoals(weekKey: string): WeeklyGoalState[] {
  return [
    {
      id: `${weekKey}_xun`,
      kind: 'advance_xun',
      title: '推進旬制 6 次',
      target: 6,
      progress: 0,
      claimed: false,
    },
    {
      id: `${weekKey}_cold`,
      kind: 'visit_cold',
      title: '造訪過冷秘境 1 次',
      target: 1,
      progress: 0,
      claimed: false,
    },
    {
      id: `${weekKey}_beat`,
      kind: 'complete_beat',
      title: '了結故事節拍 1 次',
      target: 1,
      progress: 0,
      claimed: false,
    },
  ]
}

export function ensureWeeklyGoals(state: GameState, now = new Date()): GameState {
  const weekKey = calendarWeekKey(now)
  if (state.weekly.weekKey === weekKey && state.weekly.goals.length > 0) {
    return state
  }
  return {
    ...state,
    weekly: {
      weekKey,
      goals: buildWeeklyGoals(weekKey),
    },
  }
}

export function bumpWeeklyGoal(
  state: GameState,
  kind: WeeklyGoalKind,
  amount = 1,
): GameState {
  const weekly = ensureWeeklyGoals(state).weekly
  const goals = weekly.goals.map((g) =>
    g.kind === kind && !g.claimed
      ? { ...g, progress: Math.min(g.target, g.progress + amount) }
      : g,
  )
  return { ...state, weekly: { ...weekly, goals } }
}

export function listActiveArcSummaries(state: GameState): {
  arcTitle: string
  beatTitle: string
  done: boolean
}[] {
  const out: { arcTitle: string; beatTitle: string; done: boolean }[] = []
  for (const arcId of state.unlockedArcIds) {
    const arc = getArcById(arcId)
    if (!arc) continue
    for (const beat of arc.beats) {
      out.push({
        arcTitle: arc.title,
        beatTitle: beat.title,
        done:
          Boolean(state.storyFlags[beat.eventId]) || isBeatDone(state, beat.id),
      })
    }
  }
  return out
}
