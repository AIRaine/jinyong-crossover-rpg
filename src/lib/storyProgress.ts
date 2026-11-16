/**
 * 主線／弧進度共用邏輯（useGame 與模擬腳本皆可引用）
 * 階段 A：取消「了結即傳奇加速跨年」，改旬冷卻後軟進年。
 */
import {
  allArcEventIds,
  beatMetaForEvent,
  bumpWeeklyGoal,
  countCompletedBeats,
  ensureWeeklyGoals,
  FINALE_MIN_BEATS,
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
import {
  applyBeatPathExposure,
  canScheduleFinaleWithPath,
  computeJourneyProfile,
  effectiveBeatCooldown,
  endingBranchLabel,
} from './journeyPath'
import type { GameState, GameTime } from '../types/game'

/** 結局閘：節拍數＋旅程投入（門派／同伴／勝仗／非開局招） */
export function canScheduleFinale(state: GameState): boolean {
  return canScheduleFinaleWithPath(
    state,
    FINALE_MIN_BEATS,
    countCompletedBeats(state),
  )
}

/**
 * 推旬掛載後備：取「最早尚未了結」的主線年事件。
 * 避免日曆／軟進年已到較高年份時，跳過未了結的較早主線；結局另受 FINALE_MIN_BEATS 約束。
 */
export function pickFallbackMainEventId(state: GameState): string | undefined {
  for (const y of [1, 2, 3, 4, 5] as const) {
    const main = getMainEventForYear(y)
    if (!main || state.storyFlags[main.id]) continue
    if (main.id === 'main_y5_wharf' && !canScheduleFinale(state)) {
      return undefined
    }
    return main.id
  }
  return undefined
}

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
    unlockedArcIds = rollStarterArcs(routeSeed, next.ngPlusCount)
  }
  unlockedArcIds = refreshUnlockedArcs({
    ...next,
    routeSeed,
    unlockedArcIds,
  })
  // 遷移：已寫入 storyFlags 的弧／主線事件視為節拍完成
  let completedBeatIds = [...next.completedBeatIds]
  for (const key of allArcEventIds()) {
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

/** 結局閘：東海潮信了結即可結算 NG+（前置靠弧節拍數解鎖） */
export function allMainBeatsDone(storyFlags: Record<string, boolean>): boolean {
  return Boolean(storyFlags.main_y5_wharf)
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

  // 節拍了結 → 揭露冷門駐地／輕推冷門 NPC，創作路線才有露出
  next = applyBeatPathExposure(
    next,
    completedBeatIds.length + (next.routeSeed % 7),
  )

  if (eventId === 'main_y5_wharf') {
    const profile = computeJourneyProfile(next)
    next = {
      ...next,
      flags: {
        ...next.flags,
        ending_branch: profile.endingBranch,
        ending_label: endingBranchLabel(profile.endingBranch),
      },
      lastOutcomeText:
        (next.lastOutcomeText ? `${next.lastOutcomeText}\n` : '') +
        `【${endingBranchLabel(profile.endingBranch)}】旅程分 ${profile.diversityScore}｜${profile.labels.join('、')}`,
    }
  }

  if (eventId.startsWith('main_') || eventId.startsWith('arc_')) {
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
  const path = computeJourneyProfile(routed)
  const combatBias =
    typeof routed.flags.combat_beat_bias === 'number'
      ? routed.flags.combat_beat_bias
      : 0
  // combat_beat_bias：勝仗可為負（加速）、敗仗為正（拖慢）
  const softNeed =
    STORY_BEAT_COOLDOWN_XUN + path.softYearExtra + Math.max(0, combatBias)
  const beatNeed =
    effectiveBeatCooldown(routed, STORY_BEAT_COOLDOWN_XUN) + combatBias

  // 軟進年：冷卻滿＋當年主線已了＋未滿五年；空轉旅程需多捱幾旬
  if (
    year < 5 &&
    yearMainDone &&
    xunsSinceLastBeat >= softNeed &&
    !getUnfinishedMainForYear(year, storyFlags)
  ) {
    year += 1
    month = 1
    xun = 0
    day = Math.max(day, (year - 1) * 360 + 1)
    softYearNote =
      path.pathTier === 'hollow'
        ? `歲月流轉：已至${year}年（空轉旅程，潮信仍遠）。`
        : `歲月流轉：已至${year}年（節拍冷卻後）。`
    xunsSinceLastBeat = STORY_BEAT_COOLDOWN_XUN
  }

  const unlockedArcIds = refreshUnlockedArcs({
    ...routed,
    time: { year, month, day, period, xun },
    xunsSinceLastBeat,
  })

  let nextPending = pendingEventId
  const routedForPick: GameState = {
    ...routed,
    unlockedArcIds,
    xunsSinceLastBeat,
    time: { year, month, day, period, xun },
  }
  // 空轉：拉長節拍間隔，逼出研究／組隊／戰鬥才加速
  const cooledEnough = xunsSinceLastBeat >= beatNeed
  const nextEvent = cooledEnough
    ? getNextStoryEventId({
        ...routedForPick,
        // getNext 內部仍看 STORY_BEAT_COOLDOWN；已過 beatNeed 時強制視為可掛
        xunsSinceLastBeat: Math.max(
          routedForPick.xunsSinceLastBeat,
          STORY_BEAT_COOLDOWN_XUN,
        ),
      }) ?? pickFallbackMainEventId(routedForPick)
    : undefined

  if (nextEvent && !nextPending) {
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
