/**
 * 江湖見聞錄（輪迴圖鑑）：歷世收集可見進度
 * 未通關／失敗亦會累積；NG+ 保留。
 */
import { getLocationById } from '../data/locations'
import { getMartialById } from '../data/martialArts'
import { NPCS } from '../data/npcs'
import type { GameState } from '../types/game'
import { challengeCleared, CHALLENGE_TRIALS } from './challengeTrials'
import { detectEndingKey, ENDING_LABEL } from './ngPlusStory'
import { tideInviteStatus } from './renownAxis'

export type JianghuAtlas = {
  martialIds: string[]
  locationIds: string[]
  npcIds: string[]
  beatIds: string[]
  endingKeys: string[]
  challengeIds: string[]
}

export function emptyJianghuAtlas(): JianghuAtlas {
  return {
    martialIds: [],
    locationIds: [],
    npcIds: [],
    beatIds: [],
    endingKeys: [],
    challengeIds: [],
  }
}

function uniq(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))]
}

function mergeLists(a: string[] | undefined, b: string[]): string[] {
  return uniq([...(a ?? []), ...b])
}

/** 自當前周目狀態抽出本世見聞 */
export function harvestAtlasFromState(state: GameState): JianghuAtlas {
  const martialIds = Object.entries(state.martialProgress ?? {})
    .filter(([, lv]) => (lv ?? 0) > 0)
    .map(([id]) => id)
  const locationIds = [...(state.knownLocationIds ?? [])]
  if (state.locationId) locationIds.push(state.locationId)
  const npcIds = NPCS.filter(
    (n) => (state.affinity[n.id] ?? 0) > n.startingAffinity,
  ).map((n) => n.id)
  for (const id of state.partyIds) npcIds.push(id)
  if (state.partnerId) npcIds.push(state.partnerId)

  const endingKeys: string[] = []
  const end = detectEndingKey(state.flags)
  if (end) endingKeys.push(end)

  const challengeIds = CHALLENGE_TRIALS.filter((t) =>
    challengeCleared(state, t),
  ).map((t) => t.id)

  return {
    martialIds: uniq(martialIds),
    locationIds: uniq(locationIds),
    npcIds: uniq(npcIds),
    beatIds: uniq([...(state.completedBeatIds ?? [])]),
    endingKeys: uniq(endingKeys),
    challengeIds: uniq(challengeIds),
  }
}

export function mergeAtlas(
  base: JianghuAtlas | undefined,
  extra: JianghuAtlas,
): JianghuAtlas {
  const b = base ?? emptyJianghuAtlas()
  return {
    martialIds: mergeLists(b.martialIds, extra.martialIds),
    locationIds: mergeLists(b.locationIds, extra.locationIds),
    npcIds: mergeLists(b.npcIds, extra.npcIds),
    beatIds: mergeLists(b.beatIds, extra.beatIds),
    endingKeys: mergeLists(b.endingKeys, extra.endingKeys),
    challengeIds: mergeLists(b.challengeIds, extra.challengeIds),
  }
}

/** 每次存檔前併入見聞錄（未通關也留下） */
export function syncJianghuAtlas(state: GameState): GameState {
  const harvested = harvestAtlasFromState(state)
  const jianghuAtlas = mergeAtlas(state.jianghuAtlas, harvested)
  const prev = state.jianghuAtlas
  if (
    prev &&
    prev.martialIds.length === jianghuAtlas.martialIds.length &&
    prev.locationIds.length === jianghuAtlas.locationIds.length &&
    prev.npcIds.length === jianghuAtlas.npcIds.length &&
    prev.beatIds.length === jianghuAtlas.beatIds.length &&
    prev.endingKeys.length === jianghuAtlas.endingKeys.length &&
    prev.challengeIds.length === jianghuAtlas.challengeIds.length
  ) {
    return state
  }
  return { ...state, jianghuAtlas }
}

export type AtlasSummary = {
  martial: number
  location: number
  npc: number
  beat: number
  ending: number
  challenge: number
  total: number
  line: string
  detailLines: string[]
}

export function summarizeAtlas(state: GameState): AtlasSummary {
  const a = mergeAtlas(state.jianghuAtlas, harvestAtlasFromState(state))
  const martial = a.martialIds.length
  const location = a.locationIds.length
  const npc = a.npcIds.length
  const beat = a.beatIds.length
  const ending = a.endingKeys.length
  const challenge = a.challengeIds.length
  const total = martial + location + npc + beat + ending + challenge
  const line = `江湖見聞錄｜武學 ${martial}｜地點 ${location}｜故人 ${npc}｜話本 ${beat}｜結局 ${ending}｜旗標 ${challenge}`
  const detailLines = [
    martial
      ? `武學殘頁：${a.martialIds
          .slice(0, 6)
          .map((id) => getMartialById(id)?.name ?? id)
          .join('、')}${martial > 6 ? '…' : ''}`
      : '武學殘頁：尚未留下',
    location
      ? `足迹：${a.locationIds
          .slice(0, 5)
          .map((id) => getLocationById(id)?.name ?? id)
          .join('、')}${location > 5 ? '…' : ''}`
      : '足迹：尚在起點附近',
    ending
      ? `曾聞結局：${a.endingKeys
          .map((k) => ENDING_LABEL[k as keyof typeof ENDING_LABEL] ?? k)
          .join('、')}`
      : '曾聞結局：尚未銘刻',
  ]
  return {
    martial,
    location,
    npc,
    beat,
    ending,
    challenge,
    total,
    line,
    detailLines,
  }
}

/** 通關／潮信將至時的生平摘要 */
export function buildLifeScroll(state: GameState): string[] {
  const atlas = summarizeAtlas(state)
  const year = state.time?.year ?? 1
  const sect = state.sectId ? '門牆有籍' : '遊俠無門'
  const party =
    state.partyIds.length > 0 ? `同伴 ${state.partyIds.length} 人` : '獨行'
  const lines = [
    `《${state.playerName || '無名'}》江湖長卷（第 ${state.ngPlusCount + 1} 世・${year} 年）`,
    `${sect}｜${party}｜聲名 ${state.renown ?? 0}｜傾向 ${state.alignment ?? 0}`,
    atlas.line,
    ...atlas.detailLines.slice(0, 2),
  ]
  if (state.ngPlusReady || state.storyFlags?.main_y5_wharf) {
    lines.push('潮信已近或主線可結——此卷可帶入下一世見聞錄。')
  } else if (year >= 4) {
    lines.push('窗口將盡：宜補話本碎片與聲名，勿虛耗硬剛。')
  }
  return lines
}

/** 年旬／潮信「窗口將盡」預告 */
export function tideWindowHint(state: GameState): string {
  const year = Math.max(1, state.time?.year ?? 1)
  const tide = tideInviteStatus(state)
  if (tide.inviteReady) {
    return '潮信窗口已開——請帖可至，宜赴終局抉擇'
  }
  if (year >= 5) {
    return `五年窗口將盡｜話本 ${tide.shards.current}/${tide.shards.need}｜聲名 ${tide.renown}/${tide.needRenown}——優先補齊，勿空耗硬剛`
  }
  if (year >= 4) {
    return `潮信窗口將近｜話本 ${tide.shards.current}/${tide.shards.need}｜聲名 ${tide.renown}/${tide.needRenown}`
  }
  if (year >= 3) {
    return `中盤窗口｜話本 ${tide.shards.current}/${tide.shards.need}｜聲名 ${tide.renown}/${tide.needRenown}｜宜定路線`
  }
  return `早年窗口尚寬｜話本 ${tide.shards.current}/${tide.shards.need}｜聲名 ${tide.renown}/${tide.needRenown}`
}
