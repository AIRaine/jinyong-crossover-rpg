/**
 * 門派加入／退出／互斥與戰鬥傾向（可執行規則）。
 */
import { getSectById, SECTS } from '../data/sects'
import type { GameState } from '../types/game'

export type SectAlliance =
  | 'orthodox'
  | 'heretic'
  | 'tomb'
  | 'neutral'
  | 'island'

export type SectCombatProfile = {
  /** 面板攻加成 */
  atkFlat: number
  /** 面板防加成 */
  defFlat: number
  /** 絕招倍率加成 */
  skillPowerFlat: number
  /** 敵方強度倍率（>1 更難） */
  enemyScale: number
  /** 路遇勝獎銀兩加減 */
  banditSilverFlat: number
}

export type SectRuleDef = {
  alliance: SectAlliance
  /** 曾隸屬並叛出後，永久不可加入的聯盟 */
  rivalAlliances: SectAlliance[]
  leave: {
    silverCost: number
    cooldownXuns: number
    allowRejoin: boolean
    label: string
  }
  betray: {
    silverCost: number
    hpLossRatio: number
    foreverBan: boolean
    banRivalAlliances: boolean
    label: string
  }
  combat: SectCombatProfile
  /** UI 一句話 */
  ruleSummary: string
}

/** 聯盟中文 */
export const ALLIANCE_LABEL: Record<SectAlliance, string> = {
  orthodox: '名門正派',
  heretic: '旁門／教門',
  tomb: '古暮一系',
  neutral: '江湖中立',
  island: '海外奇門',
}

/**
 * 互斥大原則：
 * - 同時僅能隸屬一派
 * - 正派 ↔ 教門：叛出後互相永禁
 * - 古暮 ↔ 教門：理念不合，叛出後互禁
 * - 中立丐幇可退可再入（同派），但叛出仍永禁同派
 */
export const SECT_RULES: Record<string, SectRuleDef> = {
  sect_shaolin: {
    alliance: 'orthodox',
    rivalAlliances: ['heretic'],
    leave: {
      silverCost: 40,
      cooldownXuns: 3,
      allowRejoin: true,
      label: '退派：40 銀、冷卻 3 旬，可再入',
    },
    betray: {
      silverCost: 80,
      hpLossRatio: 0.25,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：80 銀、氣血大損，永禁本派與教門',
    },
    combat: {
      atkFlat: 0,
      defFlat: 3,
      skillPowerFlat: 0.02,
      enemyScale: 0.96,
      banditSilverFlat: -2,
    },
    ruleSummary: '守勢穩、敵略弱；叛出則與教門兩不往來',
  },
  sect_wudang: {
    alliance: 'orthodox',
    rivalAlliances: ['heretic'],
    leave: {
      silverCost: 45,
      cooldownXuns: 3,
      allowRejoin: true,
      label: '退派：45 銀、冷卻 3 旬，可再入',
    },
    betray: {
      silverCost: 90,
      hpLossRatio: 0.22,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：90 銀、氣血損，永禁本派與教門',
    },
    combat: {
      atkFlat: 1,
      defFlat: 2,
      skillPowerFlat: 0.04,
      enemyScale: 0.98,
      banditSilverFlat: 0,
    },
    ruleSummary: '圓轉取勝，絕招略強',
  },
  sect_huashan: {
    alliance: 'orthodox',
    rivalAlliances: ['heretic'],
    leave: {
      silverCost: 50,
      cooldownXuns: 4,
      allowRejoin: true,
      label: '退派：50 銀、冷卻 4 旬，可再入',
    },
    betray: {
      silverCost: 100,
      hpLossRatio: 0.28,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：100 銀、氣血重創，永禁本派與教門',
    },
    combat: {
      atkFlat: 3,
      defFlat: 0,
      skillPowerFlat: 0.05,
      enemyScale: 1.06,
      banditSilverFlat: 4,
    },
    ruleSummary: '攻強敵亦強——論劍之路風險高',
  },
  sect_beggar: {
    alliance: 'neutral',
    rivalAlliances: [],
    leave: {
      silverCost: 15,
      cooldownXuns: 1,
      allowRejoin: true,
      label: '退派：15 銀、冷卻 1 旬，可再入',
    },
    betray: {
      silverCost: 40,
      hpLossRatio: 0.15,
      foreverBan: true,
      banRivalAlliances: false,
      label: '叛出：40 銀、輕傷，永禁本派（仍可入他派）',
    },
    combat: {
      atkFlat: 1,
      defFlat: 1,
      skillPowerFlat: 0,
      enemyScale: 1,
      banditSilverFlat: 6,
    },
    ruleSummary: '門檻低、跑腿多銀；叛出只鎖本舵',
  },
  sect_mingjiao: {
    alliance: 'heretic',
    rivalAlliances: ['orthodox', 'tomb'],
    leave: {
      silverCost: 55,
      cooldownXuns: 4,
      allowRejoin: true,
      label: '退派：55 銀、冷卻 4 旬，可再入',
    },
    betray: {
      silverCost: 110,
      hpLossRatio: 0.3,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：110 銀、氣血重創，永禁本教與正派／古暮',
    },
    combat: {
      atkFlat: 2,
      defFlat: 0,
      skillPowerFlat: 0.06,
      enemyScale: 1.05,
      banditSilverFlat: 3,
    },
    ruleSummary: '火系爆發；叛出則正邪古暮皆不容',
  },
  sect_gumupo: {
    alliance: 'tomb',
    rivalAlliances: ['heretic'],
    leave: {
      silverCost: 60,
      cooldownXuns: 5,
      allowRejoin: false,
      label: '退派：60 銀、冷卻 5 旬，墓門難再開（不可再入）',
    },
    betray: {
      silverCost: 120,
      hpLossRatio: 0.32,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：120 銀、氣血重創，永禁本派與教門',
    },
    combat: {
      atkFlat: 1,
      defFlat: 2,
      skillPowerFlat: 0.03,
      enemyScale: 1.04,
      banditSilverFlat: 0,
    },
    ruleSummary: '寒意護體；退出即永別墓門',
  },
  sect_riyue: {
    alliance: 'heretic',
    rivalAlliances: ['orthodox', 'tomb'],
    leave: {
      silverCost: 55,
      cooldownXuns: 4,
      allowRejoin: true,
      label: '退派：55 銀、冷卻 4 旬，可再入',
    },
    betray: {
      silverCost: 115,
      hpLossRatio: 0.3,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：115 銀、氣血重創，永禁本教與正派／古暮',
    },
    combat: {
      atkFlat: 2,
      defFlat: 1,
      skillPowerFlat: 0.05,
      enemyScale: 1.07,
      banditSilverFlat: 5,
    },
    ruleSummary: '暗器與詭路；風險報酬皆高',
  },
  sect_emei: {
    alliance: 'orthodox',
    rivalAlliances: ['heretic'],
    leave: {
      silverCost: 40,
      cooldownXuns: 3,
      allowRejoin: true,
      label: '退派：40 銀、冷卻 3 旬，可再入',
    },
    betray: {
      silverCost: 85,
      hpLossRatio: 0.24,
      foreverBan: true,
      banRivalAlliances: true,
      label: '叛出：85 銀、氣血損，永禁本派與教門',
    },
    combat: {
      atkFlat: 1,
      defFlat: 2,
      skillPowerFlat: 0.03,
      enemyScale: 0.97,
      banditSilverFlat: -1,
    },
    ruleSummary: '戒律穩守，敵壓略低',
  },
  sect_taohua: {
    alliance: 'island',
    rivalAlliances: [],
    leave: {
      silverCost: 70,
      cooldownXuns: 5,
      allowRejoin: true,
      label: '退派：70 銀、冷卻 5 旬，可再入',
    },
    betray: {
      silverCost: 140,
      hpLossRatio: 0.2,
      foreverBan: true,
      banRivalAlliances: false,
      label: '叛出：140 銀、氣血損，永禁本島（不株連他派）',
    },
    combat: {
      atkFlat: 1,
      defFlat: 1,
      skillPowerFlat: 0.07,
      enemyScale: 1.02,
      banditSilverFlat: 2,
    },
    ruleSummary: '奇門絕招強；島規嚴、退派貴',
  },
}

export function getSectRule(sectId: string): SectRuleDef | undefined {
  return SECT_RULES[sectId]
}

export function lifetimeXunsOf(state: GameState): number {
  if (typeof state.lifetimeXuns === 'number') return state.lifetimeXuns
  const y = Math.max(1, state.time.year)
  const m = Math.max(1, state.time.month)
  const x = Math.max(0, state.time.xun)
  return (y - 1) * 36 + (m - 1) * 3 + x
}

export type SectBlockReason =
  | 'already_in'
  | 'unknown'
  | 'not_visited'
  | 'level'
  | 'silver'
  | 'comprehension'
  | 'banned'
  | 'rival_ban'
  | 'cooldown'
  | 'ok'

export function describeJoinBlock(reason: SectBlockReason, detail?: string): string {
  switch (reason) {
    case 'already_in':
      return '已有門派，請先退派或叛出'
    case 'unknown':
      return '查無此派'
    case 'not_visited':
      return '尚未踏足該派駐地'
    case 'level':
      return detail ?? '等級不足'
    case 'silver':
      return detail ?? '銀兩不足'
    case 'comprehension':
      return detail ?? '悟性不足'
    case 'banned':
      return detail ?? '你已永禁此派'
    case 'rival_ban':
      return detail ?? '正邪／古暮舊怨未消，此派不收'
    case 'cooldown':
      return detail ?? '退派冷卻中'
    default:
      return '可申請入門'
  }
}

export function canJoinSect(
  state: GameState,
  sectId: string,
): { ok: boolean; reason: SectBlockReason; detail?: string } {
  const sect = getSectById(sectId)
  const rule = getSectRule(sectId)
  if (!sect || !rule) return { ok: false, reason: 'unknown' }
  if (state.sectId) return { ok: false, reason: 'already_in' }
  if (!state.knownLocationIds.includes(sect.homeLocationId)) {
    return { ok: false, reason: 'not_visited' }
  }
  if (state.stats.level < sect.entry.minLevel) {
    return {
      ok: false,
      reason: 'level',
      detail: `等級不足（需等級 ${sect.entry.minLevel}）`,
    }
  }
  if (state.currency.silver < sect.entry.minSilver) {
    return {
      ok: false,
      reason: 'silver',
      detail: `銀兩不足（需 ${sect.entry.minSilver} 銀兩）`,
    }
  }
  if (
    sect.entry.minComprehension &&
    state.comprehension < sect.entry.minComprehension
  ) {
    return {
      ok: false,
      reason: 'comprehension',
      detail: `悟性不足（需 ${sect.entry.minComprehension} 悟性）`,
    }
  }
  const bans = state.sectBanIds ?? []
  if (bans.includes(sectId)) {
    return { ok: false, reason: 'banned', detail: `你已永禁「${sect.name}」` }
  }
  const bannedAlliances = state.sectBannedAlliances ?? []
  if (bannedAlliances.includes(rule.alliance)) {
    return {
      ok: false,
      reason: 'rival_ban',
      detail: `${ALLIANCE_LABEL[rule.alliance]}與你有舊怨，拒收`,
    }
  }
  const now = lifetimeXunsOf(state)
  if (state.sectJoinCooldownUntilXun && now < state.sectJoinCooldownUntilXun) {
    const left = state.sectJoinCooldownUntilXun - now
    return {
      ok: false,
      reason: 'cooldown',
      detail: `退派冷卻中（尚餘約 ${left} 旬）`,
    }
  }
  // 古暮：退派後 allowRejoin=false → 已寫入 ban
  return { ok: true, reason: 'ok' }
}

export function applyJoinSect(state: GameState, sectId: string): GameState {
  const sect = getSectById(sectId)
  if (!sect) return state
  return {
    ...state,
    sectId,
    sectContribution: 0,
    currency: {
      ...state.currency,
      silver: state.currency.silver - sect.entry.minSilver,
    },
    sectHistory: [
      ...(state.sectHistory ?? []),
      {
        sectId,
        mode: 'join',
        atXun: lifetimeXunsOf(state),
      },
    ],
  }
}

export type LeaveMode = 'leave' | 'betray'

export function canLeaveSect(
  state: GameState,
  mode: LeaveMode,
): { ok: boolean; message: string } {
  if (!state.sectId) return { ok: false, message: '尚未入門' }
  const rule = getSectRule(state.sectId)
  if (!rule) return { ok: false, message: '門派資料異常' }
  const cost = mode === 'leave' ? rule.leave.silverCost : rule.betray.silverCost
  if (state.currency.silver < cost) {
    return { ok: false, message: `銀兩不足（需 ${cost} 銀兩）` }
  }
  return { ok: true, message: mode === 'leave' ? rule.leave.label : rule.betray.label }
}

export function applyLeaveSect(
  state: GameState,
  mode: LeaveMode,
): GameState {
  const sectId = state.sectId
  if (!sectId) return state
  const rule = getSectRule(sectId)
  if (!rule) return state
  const now = lifetimeXunsOf(state)
  const cost = mode === 'leave' ? rule.leave.silverCost : rule.betray.silverCost
  let banIds = [...(state.sectBanIds ?? [])]
  let bannedAlliances = [...(state.sectBannedAlliances ?? [])]
  let cooldown = state.sectJoinCooldownUntilXun ?? 0

  if (mode === 'leave') {
    cooldown = Math.max(cooldown, now + rule.leave.cooldownXuns)
    if (!rule.leave.allowRejoin && !banIds.includes(sectId)) {
      banIds.push(sectId)
    }
  } else {
    if (rule.betray.foreverBan && !banIds.includes(sectId)) {
      banIds.push(sectId)
    }
    if (rule.betray.banRivalAlliances) {
      for (const a of rule.rivalAlliances) {
        if (!bannedAlliances.includes(a)) bannedAlliances.push(a)
      }
      // 叛出也鎖住自己聯盟？通常只 ban 本派 id；聯盟互禁用 rival
    }
  }

  const hp =
    mode === 'betray'
      ? Math.max(
          1,
          Math.floor(state.stats.hp * (1 - rule.betray.hpLossRatio)),
        )
      : state.stats.hp

  return {
    ...state,
    sectId: null,
    sectContribution: 0,
    currency: {
      ...state.currency,
      silver: state.currency.silver - cost,
    },
    stats: { ...state.stats, hp },
    sectBanIds: banIds,
    sectBannedAlliances: bannedAlliances,
    sectJoinCooldownUntilXun: cooldown,
    sectHistory: [
      ...(state.sectHistory ?? []),
      { sectId, mode, atXun: now },
    ],
  }
}

export function listAllianceSects(alliance: SectAlliance): string[] {
  return SECTS.filter((s) => getSectRule(s.id)?.alliance === alliance).map(
    (s) => s.id,
  )
}
