/**
 * 故事弧註冊表（階段 A 骨架）
 * 先把既有五年主線包成可亂數／條件解鎖的弧；內部 libraryTag 勿顯示給玩家。
 */
import type { GameState, StoryArcDef, WeeklyGoalState } from '../types/game'

export type { WeeklyGoalState }

/** 主線節拍之間至少間隔幾旬（取代「了結即傳奇加速跨年」） */
export const STORY_BEAT_COOLDOWN_XUN = 4

/** 日登獎勵（無課可領） */
export const DAILY_LOGIN_SILVER = 25
export const DAILY_LOGIN_POTENTIAL = 2
export const DAILY_LOGIN_AP = 1

export const STORY_ARCS: StoryArcDef[] = [
  {
    id: 'arc_shediao',
    title: '邊城烽煙',
    summary: '襄揚糧道與桃華人情交錯，適合開局立足。',
    libraryTag: 'shediao',
    starterWeight: 10,
    beats: [
      {
        id: 'beat_shediao_1',
        eventId: 'main_y1_xiangyang',
        title: '襄揚烽煙',
      },
    ],
  },
  {
    id: 'arc_xiaoao_rise',
    title: '華嶠劍議',
    summary: '論劍預熱，酒劍與君子面具同台。',
    libraryTag: 'xiaoao',
    starterWeight: 6,
    /** 未抽中開局時，完成 1 節拍後仍可解鎖 */
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      {
        id: 'beat_xiaoao_1',
        eventId: 'main_y2_huashan',
        title: '華嶠論劍預熱',
      },
    ],
  },
  {
    id: 'arc_shendiao',
    title: '暮門異響',
    summary: '活死人暮封石有裂，古暮一脈波動。',
    libraryTag: 'shendiao',
    starterWeight: 6,
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      {
        id: 'beat_shendiao_1',
        eventId: 'main_y3_tomb',
        title: '活死人暮異響',
      },
    ],
  },
  {
    id: 'arc_xiaoao_cliff',
    title: '玄木夜會',
    summary: '崖上契約與劍氣，日月餘波未歇。',
    libraryTag: 'xiaoao',
    starterWeight: 0,
    unlockWhen: { minBeatsDone: 2 },
    beats: [
      {
        id: 'beat_xiaoao_2',
        eventId: 'main_y4_xuanmu',
        title: '玄木崖夜會',
      },
    ],
  },
  {
    id: 'arc_tide_ending',
    title: '東海潮信',
    summary: '碼頭潮起，結局分歧——需足夠江湖閱歷才開。',
    libraryTag: 'finale',
    starterWeight: 0,
    unlockWhen: { minBeatsDone: 3 },
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

export function getArcById(id: string): StoryArcDef | undefined {
  return STORY_ARCS.find((a) => a.id === id)
}

export function beatMetaForEvent(
  eventId: string,
): { arcId: string; beatId: string } | undefined {
  return EVENT_TO_BEAT.get(eventId)
}

export function countCompletedBeats(state: GameState): number {
  return state.completedBeatIds.length
}

export function isBeatDone(state: GameState, beatId: string): boolean {
  return state.completedBeatIds.includes(beatId)
}

/** 依條件判斷弧是否應解鎖 */
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

/** 開局／遷移：擲 routeSeed，抽出 2 條開場弧（必含邊城） */
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

/** 補齊因條件新解鎖的弧 */
export function refreshUnlockedArcs(state: GameState): string[] {
  const set = new Set(state.unlockedArcIds)
  if (set.size === 0) {
    for (const id of rollStarterArcs(state.routeSeed || 1)) set.add(id)
  }
  for (const arc of STORY_ARCS) {
    if (arcMeetsUnlock(state, arc)) set.add(arc.id)
  }
  return [...set]
}

/** 下一個可掛上的主線事件（冷卻內不給新節拍） */
export function getNextStoryEventId(state: GameState): string | undefined {
  if (state.xunsSinceLastBeat < STORY_BEAT_COOLDOWN_XUN) return undefined

  for (const arcId of state.unlockedArcIds) {
    const arc = getArcById(arcId)
    if (!arc) continue
    for (const beat of arc.beats) {
      if (state.storyFlags[beat.eventId]) continue
      if (isBeatDone(state, beat.id)) continue
      return beat.eventId
    }
  }
  return undefined
}

export function calendarDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 簡易週鍵：年 + 該年日序／7 */
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

/** 進行中弧摘要（UI） */
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
        done: Boolean(state.storyFlags[beat.eventId]) || isBeatDone(state, beat.id),
      })
    }
  }
  return out
}
