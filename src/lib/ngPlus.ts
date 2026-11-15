import { createInitialGameState } from '../data/initialState'
import { detectEndingKey } from './ngPlusStory'
import type { GameState } from '../types/game'

/**
 * 多周目結算：保留元寶、月卡餘額、外觀、抽卡保底慣例重置、NG+ 次數與部分永久加值。
 * 劇情／地圖／裝備進度重置；保留上周目結局標籤供序章／奇遇差分。
 */
export function applyNewGamePlus(prev: GameState): GameState {
  const fresh = createInitialGameState()
  const bonusAtk = Math.min(8, prev.ngPlusCount + 1)
  const bonusDef = Math.min(6, prev.ngPlusCount + 1)
  const keepYuanbao = prev.currency.yuanbao
  const keepMonthly = prev.monthlyCardCharges
  const keepCosmetics = [...prev.cosmetics]
  const keepSpar = prev.sparWins
  const keepGachaTotal = prev.gachaTotalPulls
  const lastEnding = detectEndingKey(prev.flags)

  return {
    ...fresh,
    playerName: prev.playerName,
    playerGender: prev.playerGender,
    currency: {
      silver: 80 + prev.ngPlusCount * 20,
      yuanbao: keepYuanbao,
    },
    stats: {
      ...fresh.stats,
      attack: fresh.stats.attack + bonusAtk,
      defense: fresh.stats.defense + bonusDef,
      maxHp: fresh.stats.maxHp + prev.ngPlusCount * 10,
      hp: fresh.stats.maxHp + prev.ngPlusCount * 10,
    },
    comprehension: Math.min(90, prev.comprehension + 2),
    rootBone: Math.min(90, prev.rootBone + 2),
    ngPlusCount: prev.ngPlusCount + 1,
    gachaPityEpic: 0,
    gachaPityLegendary: 0,
    gachaTotalPulls: keepGachaTotal,
    monthlyCardCharges: keepMonthly,
    monthlyClaimedXunKey: '',
    sparWins: keepSpar,
    cosmetics: keepCosmetics,
    ngPlusReady: false,
    inspiration: 6 + prev.ngPlusCount * 2,
    potential: 8,
    combatLoseStreak: 0,
    banditFightsThisXun: 0,
    sparFightsThisXun: 0,
    travelPassCharges: prev.travelPassCharges,
    paidAtkBonus: prev.paidAtkBonus,
    paidDefBonus: prev.paidDefBonus,
    flags: {
      ...fresh.flags,
      ngPlusFrom: prev.ngPlusCount + 1,
      ...(lastEnding ? { lastEnding } : {}),
    },
  }
}

export function canSettleNgPlus(state: GameState): boolean {
  if (state.ngPlusReady) return true
  // 五年主線皆完成
  const keys = [
    'main_y1_xiangyang',
    'main_y2_huashan',
    'main_y3_tomb',
    'main_y4_xuanmu',
    'main_y5_wharf',
  ]
  return keys.every((k) => state.storyFlags[k])
}
