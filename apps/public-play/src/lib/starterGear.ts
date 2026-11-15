import { createOwnedEquipment } from '../data/equipments'
import type { EquipSlot, GameState } from '../types/game'

/** 序章結束後發放起步裝備與基礎武學 */
export function grantStarterGear(state: GameState): GameState {
  let seq = state.equipUidSeq
  const owned = [...state.ownedEquipment]
  const equipped = { ...state.equipped }
  const add = (defId: string, slot: EquipSlot) => {
    const uid = `eq_${seq++}`
    owned.push(createOwnedEquipment(defId, uid))
    equipped[slot] = uid
  }
  if (owned.length === 0) {
    add('eq_wood_sword', 'weapon')
    add('eq_travel_robe', 'body')
    add('eq_straw_shoes', 'feet')
  }

  const martialProgress = { ...state.martialProgress }
  const starters = [
    'ma_jiuyin',
    'ma_heart_calm',
    'ma_qing_cloud',
    'ma_act_flashlight',
    'ma_act_luoying',
  ]
  for (const id of starters) {
    if (!martialProgress[id]) martialProgress[id] = 1
  }

  return {
    ...state,
    equipUidSeq: seq,
    ownedEquipment: owned,
    equipped,
    martialProgress,
    martialLoadout: {
      internalId: martialProgress.ma_jiuyin ? 'ma_jiuyin' : null,
      heartId: martialProgress.ma_heart_calm ? 'ma_heart_calm' : null,
      qinggongId: martialProgress.ma_qing_cloud ? 'ma_qing_cloud' : null,
      activeIds: [
        martialProgress.ma_act_flashlight ? 'ma_act_flashlight' : null,
        martialProgress.ma_act_luoying ? 'ma_act_luoying' : null,
        null,
        null,
      ],
    },
    potential: state.potential + (state.ownedEquipment.length === 0 ? 16 : 0),
    actionPoints: state.maxActionPoints || 8,
    maxActionPoints: state.maxActionPoints || 8,
  }
}
