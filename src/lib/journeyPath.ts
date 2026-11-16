/**
 * 旅程路徑品質：讓門派／武學／組隊／戰鬥「有意義」
 * - 空轉點敘事 → 節拍冷卻變長、結局閘更嚴、結局分支偏薄
 * - 研究／入派／組隊／勝仗 → 推進更順、潮信結局有血色
 */
import { getMartialById } from '../data/martialArts'
import { finaleCombatCultivationOk } from './growthStage'
import { finaleDualGateOk } from './renownAxis'
import type { GameState, MartialLoadout } from '../types/game'

export const STARTER_MARTIAL_IDS = [
  'ma_jiuyin',
  'ma_heart_calm',
  'ma_qing_cloud',
  'ma_act_flashlight',
  'ma_act_luoying',
] as const

export const COLD_SECT_IDS = [
  'sect_riyue',
  'sect_huashan',
  'sect_taohua',
  'sect_gumupo',
  'sect_emei',
  'sect_mingjiao',
] as const

/** 先前通關配置率極低的武學——優先掉落／露出 */
export const COLD_MARTIAL_IDS = [
  'ma_qing_icefire',
  'ma_qing_tomb',
  'ma_act_xuantie',
  'ma_qing_emei',
  'ma_act_emei_sword',
  'ma_act_needle',
  'ma_act_xiangyang',
  'ma_jiuyang',
  'ma_kuiying',
  'ma_heart_liancheng',
  'ma_qing_yanmen',
  'ma_qing_swallow',
  'ma_heart_wine',
  'ma_beiming',
  'ma_mingjiao_fire',
  'ma_act_lonely',
  'ma_heart_yue',
  'ma_qing_huashan',
] as const

export const COLD_SECT_HOME_IDS = [
  'loc_huashan',
  'loc_xuanmu',
  'loc_peach_island',
  'loc_dead_tomb',
  'loc_emei_gate',
  'loc_icefire_isle',
] as const

export type PathTier = 'hollow' | 'walked' | 'forged'

export type EndingBranch =
  | 'hollow_tide'
  | 'blade_tide'
  | 'companions_tide'
  | 'sect_tide'

export type JourneyProfile = {
  nonStarterEquipped: number
  coldMartialEquipped: number
  starterOnlyLoadout: boolean
  hasSect: boolean
  coldSect: boolean
  partyCount: number
  combatWins: number
  diversityScore: number
  pathTier: PathTier
  /** 相對基礎冷卻額外旬數（空轉＋2） */
  beatCooldownExtra: number
  /** 軟進年是否被空轉拖慢 */
  softYearExtra: number
  finaleEngaged: boolean
  endingBranch: EndingBranch
  labels: string[]
}

function equippedMartialIds(state: GameState): string[] {
  const L = state.martialLoadout
  return [
    L.internalId,
    L.heartId,
    L.qinggongId,
    ...L.activeIds,
  ].filter((x): x is string => Boolean(x))
}

export function computeJourneyProfile(state: GameState): JourneyProfile {
  const equipped = equippedMartialIds(state)
  const nonStarterEquipped = equipped.filter(
    (id) => !(STARTER_MARTIAL_IDS as readonly string[]).includes(id),
  ).length
  const coldMartialEquipped = equipped.filter((id) =>
    (COLD_MARTIAL_IDS as readonly string[]).includes(id),
  ).length
  const starterOnlyLoadout =
    equipped.length > 0 &&
    equipped.every((id) =>
      (STARTER_MARTIAL_IDS as readonly string[]).includes(id),
    )

  const hasSect = Boolean(state.sectId)
  const coldSect = Boolean(
    state.sectId &&
      (COLD_SECT_IDS as readonly string[]).includes(state.sectId),
  )
  const partyCount = state.partyIds.length
  const combatWins = Math.max(0, state.lifetimeBanditWins ?? 0)

  let diversityScore = 0
  diversityScore += Math.min(28, nonStarterEquipped * 7)
  diversityScore += Math.min(18, coldMartialEquipped * 6)
  if (hasSect) diversityScore += coldSect ? 18 : 10
  diversityScore += Math.min(16, partyCount * 8)
  diversityScore += Math.min(20, combatWins * 4)
  if (starterOnlyLoadout) diversityScore = Math.max(0, diversityScore - 12)
  diversityScore = Math.max(0, Math.min(100, diversityScore))

  const pathTier: PathTier =
    diversityScore >= 55 ? 'forged' : diversityScore >= 28 ? 'walked' : 'hollow'

  const labels: string[] = []
  if (pathTier === 'hollow') labels.push('旅程·空轉')
  else if (pathTier === 'walked') labels.push('旅程·踐履')
  else labels.push('旅程·鑄鋒')
  if (coldSect) labels.push('冷門門派')
  if (coldMartialEquipped > 0) labels.push(`冷門招×${coldMartialEquipped}`)
  if (partyCount > 0) labels.push(`同伴×${partyCount}`)
  if (combatWins > 0) labels.push(`路遇勝×${combatWins}`)

  // 結局投入：養成戰鬥閘 ∧ 潮信雙閘（話本碎片＋聲名）
  const finaleEngaged =
    finaleCombatCultivationOk(state) && finaleDualGateOk(state)

  let endingBranch: EndingBranch = 'hollow_tide'
  if (finaleEngaged && hasSect && (coldSect || nonStarterEquipped >= 2)) {
    endingBranch = 'sect_tide'
  } else if (finaleEngaged && partyCount >= 1 && combatWins >= 3) {
    endingBranch = 'companions_tide'
  } else if (finaleEngaged && combatWins >= 5) {
    endingBranch = 'blade_tide'
  }

  return {
    nonStarterEquipped,
    coldMartialEquipped,
    starterOnlyLoadout,
    hasSect,
    coldSect,
    partyCount,
    combatWins,
    diversityScore,
    pathTier,
    beatCooldownExtra: pathTier === 'hollow' ? 2 : pathTier === 'walked' ? 0 : -1,
    softYearExtra: pathTier === 'hollow' ? 3 : 0,
    finaleEngaged,
    endingBranch,
    labels,
  }
}

/** 節拍冷卻（空轉更慢，鑄鋒略快） */
export function effectiveBeatCooldown(state: GameState, base: number): number {
  const p = computeJourneyProfile(state)
  return Math.max(3, base + p.beatCooldownExtra)
}

/** 結局閘：節拍數夠＋必須有「研究／選擇」痕跡 */
export function canScheduleFinaleWithPath(
  state: GameState,
  minBeats: number,
  beatsDone: number,
): boolean {
  if (beatsDone < minBeats) return false
  if (state.unlockedArcIds.includes('arc_tide_ending')) return true
  return computeJourneyProfile(state).finaleEngaged
}

/**
 * 新學武學後：優先塞進空欄；主動欄滿時替換開局招，製造配置壓力。
 */
export function preferEquipLearnedArts(
  state: GameState,
  learnedIds: string[],
): GameState {
  if (!learnedIds.length) return state
  let loadout: MartialLoadout = {
    ...state.martialLoadout,
    activeIds: [...state.martialLoadout.activeIds] as MartialLoadout['activeIds'],
  }
  for (const id of learnedIds) {
    const art = getMartialById(id)
    if (!art) continue
    if (art.kind === 'internal' && !loadout.internalId) {
      loadout.internalId = id
    } else if (art.kind === 'internal' && loadout.internalId === 'ma_jiuyin') {
      // 學到非開局內功：鼓勵換下久隱，研究才有感
      if (id !== 'ma_jiuyin') loadout.internalId = id
    } else if (art.kind === 'heart' && !loadout.heartId) {
      loadout.heartId = id
    } else if (art.kind === 'heart' && loadout.heartId === 'ma_heart_calm' && id !== 'ma_heart_calm') {
      loadout.heartId = id
    } else if (art.kind === 'qinggong' && !loadout.qinggongId) {
      loadout.qinggongId = id
    } else if (
      art.kind === 'qinggong' &&
      loadout.qinggongId === 'ma_qing_cloud' &&
      id !== 'ma_qing_cloud'
    ) {
      loadout.qinggongId = id
    } else if (art.kind === 'active') {
      if (loadout.activeIds.includes(id)) continue
      const empty = loadout.activeIds.findIndex((x) => x === null)
      if (empty >= 0) {
        loadout.activeIds[empty] = id
      } else {
        const starterIdx = loadout.activeIds.findIndex((x) =>
          x === 'ma_act_flashlight' || x === 'ma_act_luoying',
        )
        if (starterIdx >= 0) loadout.activeIds[starterIdx] = id
        else loadout.activeIds[0] = id
      }
    }
  }
  return { ...state, martialLoadout: loadout }
}

/** 節拍了結時：露出冷門門派駐地＋輕推當地 NPC 好 */
export function applyBeatPathExposure(
  state: GameState,
  beatIndexSeed: number,
): GameState {
  const known = new Set(state.knownLocationIds)
  const homes = [...COLD_SECT_HOME_IDS]
  const pick = homes[(beatIndexSeed + state.completedBeatIds.length) % homes.length]!
  known.add(pick)
  // 再揭露一處，加速冷門門派可達
  const pick2 = homes[(beatIndexSeed + 3) % homes.length]!
  known.add(pick2)

  const affinity = { ...state.affinity }
  const bumpNpcs = [
    'npc_mie_jue',
    'npc_yue_buqun',
    'npc_ouyang_feng',
    'npc_dongfang_bubai',
    'npc_qiao_feng',
    'npc_xie_xun',
    'npc_linghu_chong',
    'npc_feng_qingyang',
  ]
  const npc = bumpNpcs[beatIndexSeed % bumpNpcs.length]!
  affinity[npc] = Math.min(100, (affinity[npc] ?? 0) + 10)

  const profile = computeJourneyProfile(state)
  const flags = {
    ...state.flags,
    path_tier: profile.pathTier,
    path_score: String(profile.diversityScore),
  }

  return {
    ...state,
    knownLocationIds: [...known],
    affinity,
    flags,
  }
}

export function endingBranchLabel(branch: EndingBranch): string {
  switch (branch) {
    case 'sect_tide':
      return '潮信·門牆有影'
    case 'companions_tide':
      return '潮信·並肩而渡'
    case 'blade_tide':
      return '潮信·刀光未冷'
    default:
      return '潮信·空舟獨渡'
  }
}
