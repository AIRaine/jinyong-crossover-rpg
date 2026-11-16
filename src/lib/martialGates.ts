/**
 * 武學學習／修練門檻：前置鏈、互斥、門派鎖。
 */
import { getMartialById } from '../data/martialArts'
import { getMartialGate } from '../data/martialGates'
import { getSectRule, type SectAlliance } from './sectRules'
import type { GameState } from '../types/game'

export type MartialLearnBlock =
  | { ok: true }
  | { ok: false; reason: string }

function known(state: GameState, id: string): boolean {
  return (state.martialProgress[id] ?? 0) > 0
}

function allianceOf(state: GameState): SectAlliance | null {
  if (!state.sectId) return null
  return getSectRule(state.sectId)?.alliance ?? null
}

/** 新學（等級 0→1）或繼續修練（升級）是否允許 */
export function canProgressMartial(
  state: GameState,
  artId: string,
  opts: { learning: boolean },
): MartialLearnBlock {
  const art = getMartialById(artId)
  if (!art) return { ok: false, reason: '查無此武學' }
  const gate = getMartialGate(artId)
  const lv = state.martialProgress[artId] ?? 0

  if (opts.learning && lv > 0) {
    return { ok: false, reason: '已學會' }
  }
  if (!opts.learning && lv <= 0) {
    return { ok: false, reason: '尚未學會' }
  }
  if (!opts.learning && lv >= 10) {
    return { ok: false, reason: '已達圓滿' }
  }

  if (!gate) return { ok: true }

  // 前置鏈只擋「新學」；已學會（含開局贈予）可繼續修練
  if (opts.learning && gate.requires?.length) {
    const missing = gate.requires.filter((id) => !known(state, id))
    if (missing.length) {
      const names = missing
        .map((id) => getMartialById(id)?.name ?? id)
        .join('、')
      return { ok: false, reason: `前置未齊：需先學${names}` }
    }
  }

  // 互斥：僅阻擋「新學」；已學會的可繼續修練（路線已選定）
  if (opts.learning && gate.exclusiveWith?.length) {
    const hit = gate.exclusiveWith.find((id) => known(state, id))
    if (hit) {
      const name = getMartialById(hit)?.name ?? hit
      return { ok: false, reason: `與「${name}」互斥，不可兼修` }
    }
  }

  if (gate.sectRequired) {
    if (state.sectId !== gate.sectRequired) {
      return {
        ok: false,
        reason: opts.learning
          ? '需隸屬指定門派才可學'
          : '已非該派弟子，無法再精進此傳功',
      }
    }
  }

  if (gate.allianceRequired) {
    const a = allianceOf(state)
    if (a !== gate.allianceRequired) {
      return {
        ok: false,
        reason: `需隸屬「${gate.allianceRequired}」聯盟門派`,
      }
    }
  }

  return { ok: true }
}

/** 配置時：互斥招式不應同裝主內功／主動（軟提示＋硬擋主動欄位撞車） */
export function canEquipMartial(
  state: GameState,
  artId: string,
): MartialLearnBlock {
  if (!known(state, artId)) return { ok: false, reason: '尚未學會此武學' }
  const gate = getMartialGate(artId)
  if (!gate?.exclusiveWith?.length) return { ok: true }
  const load = state.martialLoadout
  const equipped = [
    load.internalId,
    load.heartId,
    load.qinggongId,
    ...load.activeIds,
  ].filter(Boolean) as string[]
  for (const id of equipped) {
    if (gate.exclusiveWith.includes(id)) {
      const name = getMartialById(id)?.name ?? id
      return { ok: false, reason: `與已配置的「${name}」衝突` }
    }
    const other = getMartialGate(id)
    if (other?.exclusiveWith?.includes(artId)) {
      const name = getMartialById(id)?.name ?? id
      return { ok: false, reason: `與已配置的「${name}」衝突` }
    }
  }
  return { ok: true }
}

export function martialGateHint(artId: string): string | null {
  return getMartialGate(artId)?.hint ?? null
}
