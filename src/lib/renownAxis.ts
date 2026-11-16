/**
 * 江湖聲名／正邪傾向軸＋潮信雙閘＋隊友拒絕理由
 * （對照群俠「道德／聲望」模式；產品文案用諧音世界白話）
 */
import { computeGrowthProfile } from './growthStage'
import type { GameFlags, GameState } from '../types/game'

/** 與 journeyPath 同步（避免循環依賴） */
const STARTER_MARTIAL_IDS = [
  'ma_jiuyin',
  'ma_heart_calm',
  'ma_qing_cloud',
  'ma_act_flashlight',
  'ma_act_luoying',
] as const

/** 聲名 0～100 */
export function clampRenown(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** 傾向 -50（權謀）～+50（俠義） */
export function clampAlignment(n: number): number {
  return Math.max(-50, Math.min(50, Math.round(n)))
}

export function alignmentLabel(alignment: number): string {
  if (alignment >= 18) return '傾向·俠義'
  if (alignment >= 6) return '傾向·偏正'
  if (alignment <= -18) return '傾向·權謀'
  if (alignment <= -6) return '傾向·偏邪'
  return '傾向·中道'
}

export function renownLabel(renown: number): string {
  if (renown >= 60) return '聲名·遠播'
  if (renown >= 35) return '聲名·漸起'
  if (renown >= 15) return '聲名·初聞'
  return '聲名·無名'
}

/** 路線旗 → 一次性格／聲名（用 mark 旗防重複） */
const ROUTE_AXIS: {
  flagKey: string
  value: string
  mark: string
  renown: number
  alignment: number
  note: string
}[] = [
  {
    flagKey: 'route_y1',
    value: 'chivalry',
    mark: 'axis_mark_y1',
    renown: 8,
    alignment: 12,
    note: '俠義路',
  },
  {
    flagKey: 'route_y1',
    value: 'scheme',
    mark: 'axis_mark_y1',
    renown: 6,
    alignment: -12,
    note: '權謀路',
  },
  {
    flagKey: 'route_y1',
    value: 'intel',
    mark: 'axis_mark_y1',
    renown: 5,
    alignment: 2,
    note: '情報路',
  },
  {
    flagKey: 'route_y2',
    value: 'sword',
    mark: 'axis_mark_y2',
    renown: 7,
    alignment: 4,
    note: '劍意',
  },
  {
    flagKey: 'route_y2',
    value: 'scholar',
    mark: 'axis_mark_y2',
    renown: 5,
    alignment: 6,
    note: '書生',
  },
  {
    flagKey: 'route_y2',
    value: 'scheme',
    mark: 'axis_mark_y2',
    renown: 6,
    alignment: -8,
    note: '權謀續',
  },
  {
    flagKey: 'route_y3',
    value: 'battle',
    mark: 'axis_mark_y3',
    renown: 8,
    alignment: -2,
    note: '鏖戰',
  },
  {
    flagKey: 'route_y3',
    value: 'ally',
    mark: 'axis_mark_y3',
    renown: 7,
    alignment: 8,
    note: '結盟',
  },
  {
    flagKey: 'route_y3',
    value: 'seal',
    mark: 'axis_mark_y3',
    renown: 4,
    alignment: 0,
    note: '封鎮',
  },
  {
    flagKey: 'route_y4',
    value: 'battle',
    mark: 'axis_mark_y4',
    renown: 8,
    alignment: -4,
    note: '決戰',
  },
  {
    flagKey: 'route_y4',
    value: 'oath',
    mark: 'axis_mark_y4',
    renown: 9,
    alignment: 10,
    note: '誓約',
  },
  {
    flagKey: 'route_y4',
    value: 'contract',
    mark: 'axis_mark_y4',
    renown: 7,
    alignment: -6,
    note: '契約',
  },
]

export function applyRouteAxisMarks(state: GameState): {
  state: GameState
  notes: string[]
} {
  const notes: string[] = []
  let renown = state.renown ?? 0
  let alignment = state.alignment ?? 0
  const flags: GameFlags = { ...state.flags }
  for (const rule of ROUTE_AXIS) {
    if (flags[rule.mark]) continue
    if (flags[rule.flagKey] !== rule.value) continue
    flags[rule.mark] = true
    renown = clampRenown(renown + rule.renown)
    alignment = clampAlignment(alignment + rule.alignment)
    notes.push(
      `${rule.note}：聲名 ${rule.renown >= 0 ? '+' : ''}${rule.renown}、傾向 ${
        rule.alignment >= 0 ? '+' : ''
      }${rule.alignment}`,
    )
  }
  return {
    state: { ...state, renown, alignment, flags },
    notes,
  }
}

export type RecruitCheck = {
  ok: boolean
  reason?: string
  /** 給 UI 預覽的門檻提示 */
  hint: string
}

type Gate = {
  minAffinity: number
  minRenown: number
  alignmentMin?: number
  alignmentMax?: number
  requireFlag?: string
  /** 共事條件說明（顯示用） */
  sharedLabel?: string
}

const DEFAULT_GATE: Gate = {
  minAffinity: 30,
  minRenown: 8,
}

/** 部分諧音 NPC 的可讀門檻（其餘走預設） */
const GATES: Record<string, Gate> = {
  npc_huang_rong: { minAffinity: 25, minRenown: 0 },
  npc_guo_jing: {
    minAffinity: 30,
    minRenown: 12,
    alignmentMin: 0,
  },
  npc_hong_qigong: { minAffinity: 28, minRenown: 10, alignmentMin: -5 },
  npc_ouyang_feng: {
    minAffinity: 35,
    minRenown: 16,
    alignmentMax: -4,
  },
  npc_xiaolongnu: { minAffinity: 40, minRenown: 14, alignmentMin: -8 },
  npc_yang_guo: { minAffinity: 32, minRenown: 14 },
  npc_linghu_chong: { minAffinity: 30, minRenown: 12, alignmentMin: -10 },
  npc_ren_yingying: { minAffinity: 35, minRenown: 12 },
  npc_mie_jue: {
    minAffinity: 40,
    minRenown: 22,
    alignmentMin: 8,
  },
  npc_yue_buqun: {
    minAffinity: 35,
    minRenown: 18,
    alignmentMin: 0,
    requireFlag: 'yue_secret',
    sharedLabel: '華嶠密辛（共事）',
  },
  npc_dongfang_bubai: {
    minAffinity: 40,
    minRenown: 20,
    alignmentMax: 5,
  },
  npc_qiao_feng: { minAffinity: 35, minRenown: 20, alignmentMin: -8 },
  npc_xie_xun: { minAffinity: 38, minRenown: 18, alignmentMax: 10 },
  npc_feng_qingyang: { minAffinity: 45, minRenown: 25, alignmentMin: -5 },
}

function gateFor(npcId: string): Gate {
  return GATES[npcId] ?? DEFAULT_GATE
}

export function recruitHint(npcId: string): string {
  const g = gateFor(npcId)
  const parts = [`好感≥${g.minAffinity}`, `聲名≥${g.minRenown}`]
  if (g.alignmentMin != null) parts.push(`傾向≥${g.alignmentMin}（偏俠義）`)
  if (g.alignmentMax != null) parts.push(`傾向≤${g.alignmentMax}（偏權謀）`)
  if (g.sharedLabel) parts.push(g.sharedLabel)
  return parts.join('｜')
}

export function canRecruitNpc(state: GameState, npcId: string): RecruitCheck {
  const g = gateFor(npcId)
  const hint = recruitHint(npcId)
  if (state.partyIds.includes(npcId)) {
    return { ok: false, reason: '已在隊伍中', hint }
  }
  if (state.partyIds.length >= 2) {
    return { ok: false, reason: '隊伍最多 2 人', hint }
  }
  const aff = state.affinity[npcId] ?? 0
  if (aff < g.minAffinity) {
    return {
      ok: false,
      reason: `好感不足（需 ${g.minAffinity}，目前 ${aff}）`,
      hint,
    }
  }
  const renown = state.renown ?? 0
  if (renown < g.minRenown) {
    return {
      ok: false,
      reason: `聲名不足——江湖還不夠識你（需聲名 ${g.minRenown}，目前 ${renown}）`,
      hint,
    }
  }
  const alignment = state.alignment ?? 0
  if (g.alignmentMin != null && alignment < g.alignmentMin) {
    return {
      ok: false,
      reason: `傾向不合——對方嫌你不夠「正」（需傾向≥${g.alignmentMin}，目前 ${alignment}）`,
      hint,
    }
  }
  if (g.alignmentMax != null && alignment > g.alignmentMax) {
    return {
      ok: false,
      reason: `傾向不合——對方嫌你太「正派」（需傾向≤${g.alignmentMax}，目前 ${alignment}）`,
      hint,
    }
  }
  if (g.requireFlag && !state.flags[g.requireFlag]) {
    return {
      ok: false,
      reason: `尚未共事——${g.sharedLabel ?? '共同經歷'}未了`,
      hint,
    }
  }
  return { ok: true, hint }
}

export type TideShardBreakdown = {
  current: number
  need: number
  parts: string[]
}

/** 潮信「經歷碎片／話本」進度（原創代稱，非原著書名） */
export function computeTideShards(state: GameState): TideShardBreakdown {
  const parts: string[] = []
  let n = 0
  const beats = state.completedBeatIds?.length ?? 0
  const beatPart = Math.min(4, Math.floor(beats / 2))
  if (beatPart > 0) {
    n += beatPart
    parts.push(`話本節拍 ${beatPart}`)
  }
  const L = state.martialLoadout
  const equipped = [
    L.internalId,
    L.heartId,
    L.qinggongId,
    ...L.activeIds,
  ].filter(Boolean) as string[]
  const nonStarter = equipped.filter(
    (id) => !(STARTER_MARTIAL_IDS as readonly string[]).includes(id),
  ).length
  if (nonStarter >= 2) {
    n += 1
    parts.push('非開局招配置')
  }
  if (state.sectId && (state.sectContribution ?? 0) >= 30) {
    n += 1
    parts.push('門牆紮根')
  }
  if ((state.lifetimeBanditWins ?? 0) >= 3) {
    n += 1
    parts.push('路遇勝績')
  }
  if (state.partyIds.length >= 1) {
    n += 1
    parts.push('並肩同伴')
  }
  const growth = computeGrowthProfile(state)
  if (growth.cultivationScore >= 24) {
    n += 1
    parts.push('養成達標')
  }
  const need = 5
  return { current: Math.min(8, n), need, parts }
}

export type TideInviteStatus = {
  shards: TideShardBreakdown
  renown: number
  needRenown: number
  alignment: number
  shardsOk: boolean
  renownOk: boolean
  inviteReady: boolean
  /** 給遊歷的一行文案 */
  line: string
}

export function tideInviteStatus(state: GameState): TideInviteStatus {
  const shards = computeTideShards(state)
  const renown = state.renown ?? 0
  const needRenown = 22
  const alignment = state.alignment ?? 0
  const shardsOk = shards.current >= shards.need
  const renownOk = renown >= needRenown
  const inviteReady = shardsOk && renownOk
  const line = inviteReady
    ? `潮信請帖可至｜話本 ${shards.current}/${shards.need}｜聲名 ${renown}/${needRenown}｜${alignmentLabel(alignment)}`
    : `潮信請帖未至｜話本 ${shards.current}/${shards.need}${
        shardsOk ? '✓' : ''
      }｜聲名 ${renown}/${needRenown}${renownOk ? '✓' : ''}｜${alignmentLabel(
        alignment,
      )}`
  return {
    shards,
    renown,
    needRenown,
    alignment,
    shardsOk,
    renownOk,
    inviteReady,
    line,
  }
}

/** 終局投入：原養成戰鬥閘 ∧ 請帖雙閘 */
export function finaleDualGateOk(state: GameState): boolean {
  return tideInviteStatus(state).inviteReady
}
