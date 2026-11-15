/**
 * 主線／弧進度共用邏輯（useGame 與模擬腳本皆可引用）
 * 階段 A：取消「了結即傳奇加速跨年」，改旬冷卻後軟進年。
 */
import {
  beatMetaForEvent,
  bumpWeeklyGoal,
  ensureWeeklyGoals,
  getNextStoryEventId,
  refreshUnlockedArcs,
  rollStarterArcs,
  STORY_BEAT_COOLDOWN_XUN,
} from '../data/storyArcs'
import {
  getMainEventForYear,
  getUnfinishedMainForYear,
  pickEncounter,
  pickRumors,
} from '../data/events'
import type { GameState, GameTime } from '../types/game'

const MAIN_KEYS = [
  'main_y1_xiangyang',
  'main_y2_huashan',
  'main_y3_tomb',
  'main_y4_xuanmu',
  'main_y5_wharf',
] as const

export function ensureStoryRoute(state: GameState): GameState {
  let next = ensureWeeklyGoals(state)
  let routeSeed = next.routeSeed
  if (!routeSeed || routeSeed < 1) {
    routeSeed =
      (Date.now() % 900000) +
      next.ngPlusCount * 97 +
      (next.playerName.length || 1) * 13
  }
  let unlockedArcIds = next.unlockedArcIds
  if (!unlockedArcIds.length) {
    unlockedArcIds = rollStarterArcs(routeSeed)
  }
  unlockedArcIds = refreshUnlockedArcs({
    ...next,
    routeSeed,
    unlockedArcIds,
  })
  // 遷移：已寫入 storyFlags 的主線視為節拍完成
  let completedBeatIds = [...next.completedBeatIds]
  for (const key of MAIN_KEYS) {
    if (!next.storyFlags[key]) continue
    const meta = beatMetaForEvent(key)
    if (meta && !completedBeatIds.includes(meta.beatId)) {
      completedBeatIds.push(meta.beatId)
    }
  }
  unlockedArcIds = refreshUnlockedArcs({
    ...next,
    routeSeed,
    unlockedArcIds,
    completedBeatIds,
  })
  return {
    ...next,
    routeSeed,
    unlockedArcIds,
    completedBeatIds,
  }
}

export function allMainBeatsDone(storyFlags: Record<string, boolean>): boolean {
  return MAIN_KEYS.every((k) => storyFlags[k])
}

/** 了結主線節拍後：不瞬跳年份；重置冷卻並記節拍 */
export function applyMainBeatResolved(
  state: GameState,
  eventId: string,
): GameState {
  let next = ensureStoryRoute(state)
  const meta = beatMetaForEvent(eventId)
  const completedBeatIds = meta
    ? next.completedBeatIds.includes(meta.beatId)
      ? next.completedBeatIds
      : [...next.completedBeatIds, meta.beatId]
    : next.completedBeatIds

  next = {
    ...next,
    completedBeatIds,
    xunsSinceLastBeat: 0,
    unlockedArcIds: refreshUnlockedArcs({
      ...next,
      completedBeatIds,
    }),
  }

  if (eventId.startsWith('main_y')) {
    next = bumpWeeklyGoal(next, 'complete_beat', 1)
  }
  return next
}

export interface AdvanceXunStoryResult {
  time: GameTime
  pendingEventId: string | null
  xunsSinceLastBeat: number
  unlockedArcIds: string[]
  rumors: string[]
  accelNote: string | null
  softYearNote: string | null
}

/**
 * 推旬後的故事掛載：
 * - 不再因「當年主線已了」立刻跳年
 * - 節拍冷卻滿且當年主線已了 → 軟進下一年（仍可體驗加長）
 * - 優先掛弧節拍／未了結主線，否則機率奇遇
 */
export function resolveAdvanceXunStory(
  state: GameState,
  timeAfterTick: GameTime,
  pendingEventId: string | null,
  encounterRoll: number,
): AdvanceXunStoryResult {
  const routed = ensureStoryRoute(state)
  let { year, month, xun, day, period } = timeAfterTick
  let xunsSinceLastBeat = routed.xunsSinceLastBeat + 1
  let accelNote: string | null = null
  let softYearNote: string | null = null
  const storyFlags = routed.storyFlags

  const yearMain = getMainEventForYear(year)
  const yearMainDone = Boolean(yearMain && storyFlags[yearMain.id])

  // 軟進年：冷卻滿＋當年主線已了＋未滿五年
  if (
    year < 5 &&
    yearMainDone &&
    xunsSinceLastBeat >= STORY_BEAT_COOLDOWN_XUN &&
    !getUnfinishedMainForYear(year, storyFlags)
  ) {
    year += 1
    month = 1
    xun = 0
    day = Math.max(day, (year - 1) * 360 + 1)
    softYearNote = `歲月流轉：已至${year}年（節拍冷卻後）。`
    xunsSinceLastBeat = STORY_BEAT_COOLDOWN_XUN
  }

  const unlockedArcIds = refreshUnlockedArcs({
    ...routed,
    time: { year, month, day, period, xun },
    xunsSinceLastBeat,
  })

  let nextPending = pendingEventId
  const nextEvent =
    getNextStoryEventId({
      ...routed,
      unlockedArcIds,
      xunsSinceLastBeat,
      time: { year, month, day, period, xun },
    }) ?? getUnfinishedMainForYear(year, storyFlags)?.id

  if (nextEvent && !nextPending) {
    // 冷卻未滿時 getNext 可能仍回傳「同年未了結」；允許掛上
    nextPending = nextEvent
  } else if (!nextPending && encounterRoll < 0.45) {
    nextPending = pickEncounter(
      year * 30 + month * 3 + xun + routed.ngPlusCount * 17,
      routed.knownLocationIds,
      {
        currentLocationId: routed.locationId,
        ngPlusCount: routed.ngPlusCount,
      },
    ).id
  }

  const rumors = pickRumors(year * 100 + month * 10 + xun, 3)

  return {
    time: { year, month, day, period, xun },
    pendingEventId: nextPending,
    xunsSinceLastBeat,
    unlockedArcIds,
    rumors,
    accelNote,
    softYearNote,
  }
}

export { STORY_BEAT_COOLDOWN_XUN }
