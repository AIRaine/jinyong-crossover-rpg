import { getNpcById } from '../data/npcs'
import { computePanelStats } from './combatStats'
import type { CombatFighter } from './combatEngine'
import type { GameState } from '../types/game'

const ROLE_BONUS = {
  tank: { hp: 25, atk: 2, def: 8 },
  dps: { hp: 5, atk: 10, def: 2 },
  support: { hp: 10, atk: 4, def: 5 },
} as const

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
