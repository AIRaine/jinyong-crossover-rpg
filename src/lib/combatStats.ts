import {
  getEquipmentById,
  refineBonus,
} from '../data/equipments'
import { getMartialById } from '../data/martialArts'
import { softCapBonus } from './combatMath'
import { resonancePanelBonus } from './martialResonance'
import type { GameState, PlayerStats } from '../types/game'

/** 依裝備＋武學配置計算面板屬性（含精煉／淬火／塗毒加成＋攻防軟上限） */
export function computePanelStats(state: GameState): PlayerStats {
  const base = { ...state.stats }
  let atkBonus = 0
  let defBonus = 0
  let maxHp = base.maxHp
  let maxInternalForce = base.maxInternalForce
  let maxStamina = base.maxStamina

  for (const slot of Object.keys(state.equipped) as (keyof typeof state.equipped)[]) {
    const uid = state.equipped[slot]
    if (!uid) continue
    const owned = state.ownedEquipment.find((e) => e.uid === uid)
    if (!owned) continue
    const def = getEquipmentById(owned.defId)
    if (!def) continue
    const rb = refineBonus(owned.refineLevel)
    atkBonus +=
      def.attack + rb.attack + (owned.quenched ? 3 : 0) + (owned.poisoned ? 2 : 0)
    defBonus += def.defense + rb.defense
    maxHp += def.maxHp ?? 0
    maxInternalForce += def.maxInternalForce ?? 0
    maxStamina += def.maxStamina ?? 0
  }

  const load = state.martialLoadout
  const applyArt = (id: string | null) => {
    if (!id) return
    const art = getMartialById(id)
    const lv = state.martialProgress[id] ?? 0
    if (!art || lv <= 0) return
    atkBonus += (art.attackPerLevel ?? 0) * lv
    defBonus += (art.defensePerLevel ?? 0) * lv
    maxInternalForce += (art.maxInternalPerLevel ?? 0) * lv
    maxHp += (art.maxHpPerLevel ?? 0) * lv
    maxStamina += (art.maxStaminaPerLevel ?? 0) * lv
  }

  applyArt(load.internalId)
  applyArt(load.heartId)
  applyArt(load.qinggongId)
  for (const aid of load.activeIds) applyArt(aid)

  // 俠侶雙修簡化加成
  if (state.partnerId) {
    atkBonus += 3
    defBonus += 2
    maxInternalForce += 8
  }

  // 課金永久加值（商店軟上限，數值刻意小）
  atkBonus += Math.min(6, state.paidAtkBonus ?? 0)
  defBonus += Math.min(6, state.paidDefBonus ?? 0)

  // 武學成對共鳴（配置齊全時微幅加值）
  const reso = resonancePanelBonus(state)
  atkBonus += reso.atk
  defBonus += reso.def

  const attack = base.attack + Math.floor(softCapBonus(atkBonus))
  const defense = base.defense + Math.floor(softCapBonus(defBonus, 40, 0.5))

  return {
    ...base,
    attack,
    defense,
    maxHp,
    maxInternalForce,
    maxStamina,
    hp: Math.min(base.hp, maxHp),
    stamina: Math.min(base.stamina, maxStamina),
    internalForce: Math.min(base.internalForce, maxInternalForce),
  }
}
