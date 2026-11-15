/**
 * 故事弧註冊表（階段 C：≥11 條可體驗弧，各 ≥3～5 節拍）
 * libraryTag 僅內部；勿在 UI 顯示原著對照。
 */
import type {
  GameState,
  StoryArcDef,
  WeeklyGoalKind,
  WeeklyGoalState,
} from '../types/game'

export type { WeeklyGoalState, WeeklyGoalKind }

/** 主線節拍之間至少間隔幾旬（階段 C 略拉長，贴近數週節奏） */
export const STORY_BEAT_COOLDOWN_XUN = 5

/** 日登基礎獎勵（無課可領；另加季節／連登） */
export const DAILY_LOGIN_SILVER = 30
export const DAILY_LOGIN_POTENTIAL = 3
export const DAILY_LOGIN_AP = 1
/** 連登銀兩加成上限（日） */
export const DAILY_STREAK_SILVER_CAP = 24
export const DAILY_STREAK_SILVER_PER_DAY = 3

/** 結局閘：至少完成此數量非結局節拍後才解鎖東海潮信 */
export const FINALE_MIN_BEATS = 12

export const STORY_ARCS: StoryArcDef[] = [
  {
    id: 'arc_shediao',
    title: '邊城烽煙',
    summary: '襄揚糧道、桃華人情、白駝餘波——開局立足之弧。',
    libraryTag: 'shediao',
    starterWeight: 10,
    beats: [
      { id: 'beat_shediao_1', eventId: 'main_y1_xiangyang', title: '襄揚烽煙' },
      { id: 'beat_shediao_2', eventId: 'arc_shediao_2', title: '桃華請柬' },
      { id: 'beat_shediao_3', eventId: 'arc_shediao_3', title: '糧道終裁' },
      { id: 'beat_shediao_4', eventId: 'arc_shediao_4', title: '白駝餘波' },
    ],
  },
  {
    id: 'arc_xiaoao',
    title: '華嶠與玄木',
    summary: '論劍預熱、崖上夜會、思過崖、琴劍同盟。',
    libraryTag: 'xiaoao',
    starterWeight: 6,
    ngPlusWeightBonus: 1,
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      { id: 'beat_xiaoao_1', eventId: 'main_y2_huashan', title: '華嶠論劍預熱' },
      { id: 'beat_xiaoao_2', eventId: 'main_y4_xuanmu', title: '玄木崖夜會' },
      { id: 'beat_xiaoao_3', eventId: 'arc_xiaoao_3', title: '思過崖回音' },
      { id: 'beat_xiaoao_4', eventId: 'arc_xiaoao_4', title: '琴劍同盟' },
    ],
  },
  {
    id: 'arc_shendiao',
    title: '暮門寒絲',
    summary: '活死人暮異響、寒絲夜課、古暮收束與玄鐵再遇。',
    libraryTag: 'shendiao',
    starterWeight: 6,
    ngPlusWeightBonus: 1,
    unlockWhen: { minBeatsDone: 1 },
    beats: [
      { id: 'beat_shendiao_1', eventId: 'main_y3_tomb', title: '活死人暮異響' },
      { id: 'beat_shendiao_2', eventId: 'arc_shendiao_2', title: '寒絲夜課' },
      { id: 'beat_shendiao_3', eventId: 'arc_shendiao_3', title: '古暮收束' },
      { id: 'beat_shendiao_4', eventId: 'arc_shendiao_4', title: '玄鐵再遇' },
    ],
  },
  {
    id: 'arc_yitian',
    title: '聖火與戒律',
    summary: '冰火初探、對齊會、倚巔去向與屠朧影。',
    libraryTag: 'yitian',
    starterWeight: 4,
    ngPlusWeightBonus: 2,
    unlockWhen: { minBeatsDone: 2 },
    beats: [
      { id: 'beat_yitian_1', eventId: 'arc_yitian_1', title: '冰火初探' },
      { id: 'beat_yitian_2', eventId: 'arc_yitian_2', title: '聖火與戒律' },
      { id: 'beat_yitian_3', eventId: 'arc_yitian_3', title: '倚巔去向' },
      { id: 'beat_yitian_4', eventId: 'arc_yitian_4', title: '屠朧影' },
    ],
  },
  {
    id: 'arc_tianlong',
    title: '天龍雲路',
    summary: '大裡迷路、靈鷲雲約、雁門沉默。',
    libraryTag: 'tianlong',
    starterWeight: 4,
    ngPlusWeightBonus: 2,
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
    ngPlusWeightBonus: 2,
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
    ngPlusWeightBonus: 4,
    unlockWhen: { minBeatsDone: 4 },
    beats: [
      { id: 'beat_xiake_1', eventId: 'arc_xiake_1', title: '潮履引路' },
      { id: 'beat_xiake_2', eventId: 'arc_xiake_2', title: '壁上殘譜' },
      { id: 'beat_xiake_3', eventId: 'arc_xiake_3', title: '島信寄出' },
    ],
  },
  {
    id: 'arc_liancheng',
    title: '連城空匣',
    summary: '殘圖、機關與空匣真相——貪念自困。',
    libraryTag: 'liancheng',
    starterWeight: 0,
    ngPlusWeightBonus: 3,
    unlockWhen: { minBeatsDone: 3 },
    beats: [
      { id: 'beat_liancheng_1', eventId: 'arc_liancheng_1', title: '殘圖夜拍' },
      { id: 'beat_liancheng_2', eventId: 'arc_liancheng_2', title: '血字機關' },
      { id: 'beat_liancheng_3', eventId: 'arc_liancheng_3', title: '空匣真相' },
    ],
  },
  {
    id: 'arc_feihu',
    title: '雪蒼刀名',
    summary: '嶺上刀痕、仇冊夜讀、刀名放下。',
    libraryTag: 'feihu',
    starterWeight: 0,
    ngPlusWeightBonus: 3,
    unlockWhen: { minBeatsDone: 3 },
    beats: [
      { id: 'beat_feihu_1', eventId: 'arc_feihu_1', title: '嶺上刀痕' },
      { id: 'beat_feihu_2', eventId: 'arc_feihu_2', title: '仇冊夜讀' },
      { id: 'beat_feihu_3', eventId: 'arc_feihu_3', title: '刀名放下' },
    ],
  },
  {
    id: 'arc_shujian',
    title: '紅華密信',
    summary: '河燈密信、酒樓對席、夜雨分途。',
    libraryTag: 'shujian',
    starterWeight: 0,
    ngPlusWeightBonus: 3,
    unlockWhen: { minBeatsDone: 4 },
    beats: [
      { id: 'beat_shujian_1', eventId: 'arc_shujian_1', title: '河燈密信' },
      { id: 'beat_shujian_2', eventId: 'arc_shujian_2', title: '酒樓對席' },
      { id: 'beat_shujian_3', eventId: 'arc_shujian_3', title: '夜雨分途' },
    ],
  },
  {
    id: 'arc_bixue',
    title: '碧血問心',
    summary: '殘鋒問心、洛邑義莊、鋒收如諾。',
    libraryTag: 'bixue',
    starterWeight: 0,
    ngPlusWeightBonus: 3,
    unlockWhen: { minBeatsDone: 4 },
    beats: [
      { id: 'beat_bixue_1', eventId: 'arc_bixue_1', title: '殘鋒問心' },
      { id: 'beat_bixue_2', eventId: 'arc_bixue_2', title: '洛邑義莊' },
      { id: 'beat_bixue_3', eventId: 'arc_bixue_3', title: '鋒收如諾' },
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

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 9973
  }
  return Math.abs(h)
}

/** 真實日曆季節修飾（日登／週獎） */
export function seasonalModifier(d = new Date()): {
  silverMul: number
  potentialBonus: number
  label: string
} {
  const m = d.getMonth() + 1
  if (m >= 3 && m <= 5) {
    return { silverMul: 1.1, potentialBonus: 0, label: '春潮' }
  }
  if (m >= 6 && m <= 8) {
    return { silverMul: 1.15, potentialBonus: 1, label: '盛夏' }
  }
  if (m >= 9 && m <= 11) {
    return { silverMul: 1.1, potentialBonus: 0, label: '秋斂' }
  }
  return { silverMul: 1.2, potentialBonus: 1, label: '冬藏' }
}

/** 遊戲月份修飾週目標標題／目標量 */
export function gameMonthModifier(month: number): {
  xunTargetBonus: number
  label: string
} {
  if (month >= 3 && month <= 5) return { xunTargetBonus: 0, label: '春耕' }
  if (month >= 6 && month <= 8) return { xunTargetBonus: 1, label: '暑行' }
  if (month >= 9 && month <= 11) return { xunTargetBonus: 0, label: '秋收' }
  return { xunTargetBonus: 2, label: '冬藏' }
}

export function effectiveArcWeight(
  arc: StoryArcDef,
  ngPlusCount: number,
): number {
  const base = arc.starterWeight
  if (ngPlusCount <= 0) return Math.max(0, base)
  const bonus = arc.ngPlusWeightBonus ?? 0
  // NG+：壓低射鵰必開感，抬高冷門弧
  const shediaoPenalty = arc.libraryTag === 'shediao' ? Math.min(4, ngPlusCount) : 0
  return Math.max(1, base + bonus * ngPlusCount - shediaoPenalty)
}

export function rollStarterArcs(
  routeSeed: number,
  ngPlusCount = 0,
): string[] {
  const mandatory = 'arc_shediao'
  const pool = STORY_ARCS.filter((a) => {
    if (a.id === mandatory) return false
    if (a.libraryTag === 'finale') return false
    return effectiveArcWeight(a, ngPlusCount) > 0 || (a.ngPlusWeightBonus ?? 0) > 0
  })
  let s = Math.abs(routeSeed) % 9973
  const weights = pool.map((a) => effectiveArcWeight(a, ngPlusCount))
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
  // NG+ 再開一條冷門弧（若池夠）
  const unlocked = new Set<string>([mandatory])
  if (picked) unlocked.add(picked)
  if (ngPlusCount > 0 && pool.length > 1) {
    s = (s * 17 + 23) % 9973
    const rest = pool.filter((a) => !unlocked.has(a.id))
    const w2 = rest.map((a) => effectiveArcWeight(a, ngPlusCount) + 2)
    const t2 = w2.reduce((a, b) => a + b, 0) || 1
    let r2 = s % t2
    for (let i = 0; i < rest.length; i++) {
      r2 -= w2[i]
      if (r2 < 0) {
        unlocked.add(rest[i].id)
        break
      }
    }
  }
  return [...unlocked]
}

export function refreshUnlockedArcs(state: GameState): string[] {
  const set = new Set(state.unlockedArcIds)
  if (set.size === 0) {
    for (const id of rollStarterArcs(state.routeSeed || 1, state.ngPlusCount)) {
      set.add(id)
    }
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
 * 下一個可掛節拍：各已解鎖弧取「下一未了拍」，再依 routeSeed＋NG+ 權重亂抽
 */
export function getNextStoryEventId(state: GameState): string | undefined {
  if (state.xunsSinceLastBeat < STORY_BEAT_COOLDOWN_XUN) return undefined

  const candidates: { eventId: string; weight: number }[] = []
  for (const arcId of state.unlockedArcIds) {
    const arc = getArcById(arcId)
    if (!arc) continue
    for (const beat of arc.beats) {
      if (state.storyFlags[beat.eventId]) continue
      if (isBeatDone(state, beat.id)) continue
      const doneInArc = arc.beats.filter((b) => isBeatDone(state, b.id)).length
      const rarity =
        1 +
        (state.ngPlusCount > 0
          ? (arc.ngPlusWeightBonus ?? 0) + state.ngPlusCount
          : 0) +
        Math.max(0, 3 - doneInArc)
      candidates.push({ eventId: beat.eventId, weight: rarity })
      break
    }
  }
  if (!candidates.length) return undefined
  const total = candidates.reduce((a, c) => a + c.weight, 0)
  let roll =
    Math.abs(state.routeSeed + state.completedBeatIds.length * 17) % total
  for (const c of candidates) {
    roll -= c.weight
    if (roll < 0) return c.eventId
  }
  return candidates[candidates.length - 1]?.eventId
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

interface WeeklyGoalTemplate {
  kind: WeeklyGoalKind
  title: (target: number, seasonLabel: string) => string
  baseTarget: number
}

const WEEKLY_GOAL_POOL: WeeklyGoalTemplate[] = [
  {
    kind: 'advance_xun',
    title: (t, s) => `【${s}】推進旬制 ${t} 次`,
    baseTarget: 8,
  },
  {
    kind: 'visit_cold',
    title: (t, s) => `【${s}】造訪過冷秘境 ${t} 次`,
    baseTarget: 2,
  },
  {
    kind: 'complete_beat',
    title: (t, s) => `【${s}】了結故事節拍 ${t} 次`,
    baseTarget: 2,
  },
  {
    kind: 'gather',
    title: (t, s) => `【${s}】採集資源 ${t} 次`,
    baseTarget: 4,
  },
  {
    kind: 'train',
    title: (t, s) => `【${s}】修練／學招 ${t} 次`,
    baseTarget: 3,
  },
  {
    kind: 'affinity',
    title: (t, s) => `【${s}】贈禮拉好感 ${t} 次`,
    baseTarget: 2,
  },
  {
    kind: 'visit_sect',
    title: (t, s) => `【${s}】拜訪門派駐地 ${t} 次`,
    baseTarget: 2,
  },
]

/** 每週從池中抽 4～5 條；目標量受遊戲月修飾 */
export function buildWeeklyGoals(
  weekKey: string,
  gameMonth = 3,
): WeeklyGoalState[] {
  const season = gameMonthModifier(gameMonth)
  const seed = hashSeed(weekKey)
  const count = 4 + (seed % 2) // 4 或 5
  const order = WEEKLY_GOAL_POOL.map((_, i) => i)
  // 洗牌
  for (let i = order.length - 1; i > 0; i--) {
    const j = (seed * (i + 3) + i * 17) % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const picked = order.slice(0, count).map((idx) => WEEKLY_GOAL_POOL[idx])
  return picked.map((tpl, i) => {
    let target = tpl.baseTarget
    if (tpl.kind === 'advance_xun') target += season.xunTargetBonus
    if (tpl.kind === 'complete_beat' && season.xunTargetBonus > 0) {
      target = Math.min(3, target + 1)
    }
    return {
      id: `${weekKey}_${tpl.kind}_${i}`,
      kind: tpl.kind,
      title: tpl.title(target, season.label),
      target,
      progress: 0,
      claimed: false,
    }
  })
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
      goals: buildWeeklyGoals(weekKey, state.time.month || 3),
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

/** 週目標領獎數值（受季節修飾） */
export function weeklyGoalReward(
  kind: WeeklyGoalKind,
  d = new Date(),
): { silver: number; potential: number; inspiration: number } {
  const season = seasonalModifier(d)
  const base =
    kind === 'complete_beat'
      ? { silver: 55, potential: 6, inspiration: 3 }
      : kind === 'advance_xun'
        ? { silver: 45, potential: 4, inspiration: 2 }
        : { silver: 40, potential: 4, inspiration: 2 }
  return {
    silver: Math.round(base.silver * season.silverMul),
    potential: base.potential + season.potentialBonus,
    inspiration: base.inspiration,
  }
}

/** 日登獎勵結算 */
export function dailyLoginReward(
  streak: number,
  d = new Date(),
): { silver: number; potential: number; ap: number; seasonLabel: string } {
  const season = seasonalModifier(d)
  const streakSilver = Math.min(
    DAILY_STREAK_SILVER_CAP,
    Math.max(0, streak - 1) * DAILY_STREAK_SILVER_PER_DAY,
  )
  const silver = Math.round(
    (DAILY_LOGIN_SILVER + streakSilver) * season.silverMul,
  )
  // 連登滿 7 日額外潛能
  const weekBonus = streak > 0 && streak % 7 === 0 ? 2 : 0
  return {
    silver,
    potential: DAILY_LOGIN_POTENTIAL + season.potentialBonus + weekBonus,
    ap: DAILY_LOGIN_AP + (streak >= 3 ? 1 : 0),
    seasonLabel: season.label,
  }
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
