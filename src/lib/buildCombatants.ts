import { getNpcById } from '../data/npcs'
import { computePanelStats } from './combatStats'
import type { CombatFighter } from './combatEngine'
import type { GameState } from '../types/game'

const ROLE_BONUS = {
  tank: { hp: 25, atk: 2, def: 8 },
  dps: { hp: 5, atk: 10, def: 2 },
  support: { hp: 10, atk: 4, def: 5 },
} as const

/**
 * 絕招倍率：配置武學等級越高越強。
 * 鼓勵玩家研究科技樹／修練與欄位配置，而非只連點普攻。
 */
export function computeSkillPower(state: GameState): number {
  const load = state.martialLoadout
  const lvOf = (id: string | null | undefined) =>
    id ? Math.max(0, state.martialProgress[id] ?? 0) : 0
  let levels = 0
  levels += lvOf(load.internalId)
  levels += lvOf(load.heartId)
  levels += lvOf(load.qinggongId)
  for (const id of load.activeIds) levels += lvOf(id)
  // 起步約 1.32；認真修練可逼近 1.75
  return Math.max(1.2, Math.min(1.75, 1.2 + levels * 0.028))
}

export function buildPlayerCombatant(
  state: GameState,
): Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'> {
  const panel = computePanelStats(state)
  return {
    id: 'player',
    name: state.playerName,
    hp: panel.hp,
    maxHp: panel.maxHp,
    atk: panel.attack,
    def: panel.defense,
    internal: Math.max(10, panel.internalForce),
    isPlayer: true,
    skillPower: computeSkillPower(state),
  }
}

export function buildPartyCombatants(
  state: GameState,
): Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[] {
  const panel = computePanelStats(state)
  return state.partyIds.slice(0, 2).map((id) => {
    const npc = getNpcById(id)
    const bonus = ROLE_BONUS[npc?.role ?? 'support']
    const aff = state.affinity[id] ?? 0
    return {
      id,
      name: npc?.name ?? id,
      hp: 50 + bonus.hp + Math.floor(aff / 5),
      maxHp: 50 + bonus.hp + Math.floor(aff / 5),
      atk: 10 + bonus.atk + Math.floor(panel.attack * 0.15),
      def: 6 + bonus.def,
      internal: 20 + Math.floor(aff / 4),
    }
  })
}
