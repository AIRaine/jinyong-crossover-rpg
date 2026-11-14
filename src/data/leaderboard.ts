import { computePanelStats } from '../lib/combatStats'
import type { GameState } from '../types/game'
import { getEquipmentById } from './equipments'

export type BoardKind = 'heaven' | 'earth' | 'weapon' | 'rich'

export const BOARD_LABEL: Record<BoardKind, string> = {
  heaven: '天榜（武力）',
  earth: '地榜（聲望近似）',
  weapon: '神兵榜',
  rich: '富豪榜',
}

export interface BoardEntry {
  id: string
  name: string
  score: number
  note: string
  isPlayer?: boolean
  /** 切磋用戰鬥強度 */
  sparPower: number
}

const HEAVEN_NPCS: Omit<BoardEntry, 'isPlayer'>[] = [
  { id: 'lb_df', name: '東芳不敗', score: 980, note: '玄木崖劍氣', sparPower: 95 },
  { id: 'lb_qf', name: '橋峰', score: 960, note: '降朧掌力', sparPower: 92 },
  { id: 'lb_yg', name: '揚過', score: 910, note: '玄鐵沉劍', sparPower: 88 },
  { id: 'lb_lhc', name: '凌狐沖', score: 880, note: '酒劍飄忽', sparPower: 84 },
  { id: 'lb_gj', name: '廓靖', score: 860, note: '禦守如城', sparPower: 82 },
  { id: 'lb_zwj', name: '章無忌', score: 840, note: '明皎內息', sparPower: 80 },
  { id: 'lb_hr', name: '皇容', score: 800, note: '落影奇謀', sparPower: 78 },
  { id: 'lb_xln', name: '宵朧女', score: 820, note: '古暮寒絲', sparPower: 81 },
]

const EARTH_NPCS: Omit<BoardEntry, 'isPlayer'>[] = [
  { id: 'lb_bxs', name: '百曉笙', score: 990, note: '天機閣掛名', sparPower: 70 },
  { id: 'lb_wxb', name: '魏曉寶', score: 920, note: '碼頭人情', sparPower: 65 },
  { id: 'lb_zm', name: '兆敏', score: 900, note: '契約之齒', sparPower: 75 },
  { id: 'lb_ryy', name: '壬盈盈', score: 870, note: '聖姑琴心', sparPower: 72 },
  { id: 'lb_wyy', name: '望語嫣', score: 850, note: '武學博聞', sparPower: 68 },
  ...HEAVEN_NPCS.slice(0, 3).map((e) => ({
    ...e,
    id: `e_${e.id}`,
    score: e.score - 80,
    sparPower: e.sparPower - 10,
  })),
]

const RICH_NPCS: Omit<BoardEntry, 'isPlayer'>[] = [
  { id: 'lb_rich_1', name: '洛邑驛大商', score: 5000, note: '駝鈴與賬冊', sparPower: 55 },
  { id: 'lb_rich_2', name: '東海船幫幫主', score: 4200, note: '船票行情', sparPower: 60 },
  { id: 'lb_wxb_r', name: '魏曉寶', score: 3800, note: '友情價股份', sparPower: 65 },
  { id: 'lb_bxs_r', name: '百曉笙', score: 3500, note: '賣消息致富', sparPower: 70 },
  { id: 'lb_rich_3', name: '襄揚糧行掌櫃', score: 3000, note: '邊城糧道', sparPower: 50 },
  { id: 'lb_zm_r', name: '兆敏', score: 2800, note: '郡主私庫', sparPower: 75 },
]

function playerHeavenScore(state: GameState): number {
  const p = computePanelStats(state)
  return p.attack * 12 + p.defense * 8 + p.level * 40 + state.sparWins * 15
}

function playerEarthScore(state: GameState): number {
  const affSum = Object.values(state.affinity).reduce((a, b) => a + b, 0)
  return (
    affSum * 2 +
    state.sectContribution * 3 +
    state.tradeRouteLevel * 80 +
    state.ngPlusCount * 100
  )
}

function playerWeaponScore(state: GameState): { score: number; note: string } {
  let best = 0
  let note = '尚無稱手兵器'
  for (const owned of state.ownedEquipment) {
    const def = getEquipmentById(owned.defId)
    if (!def || def.slot !== 'weapon') continue
    const q =
      def.quality === 'legendary'
        ? 1000
        : def.quality === 'epic'
          ? 700
          : def.quality === 'rare'
            ? 400
            : def.quality === 'uncommon'
              ? 200
              : 80
    const s = q + owned.refineLevel * 20 + (owned.quenched ? 50 : 0)
    if (s > best) {
      best = s
      note = `${def.name}+${owned.refineLevel}`
    }
  }
  return { score: best, note }
}

function playerRichScore(state: GameState): number {
  return state.currency.silver + state.currency.yuanbao * 5
}

function mergePlayer(
  npcs: Omit<BoardEntry, 'isPlayer'>[],
  player: BoardEntry,
): BoardEntry[] {
  const list = [...npcs.map((n) => ({ ...n })), player]
  list.sort((a, b) => b.score - a.score)
  return list.slice(0, 10)
}

export function buildBoard(kind: BoardKind, state: GameState): BoardEntry[] {
  const playerBase = {
    id: 'player',
    name: state.playerName,
    isPlayer: true as const,
  }
  if (kind === 'heaven') {
    const score = playerHeavenScore(state)
    return mergePlayer(HEAVEN_NPCS, {
      ...playerBase,
      score,
      note: '穿越客戰力',
      sparPower: Math.floor(score / 12),
    })
  }
  if (kind === 'earth') {
    const score = playerEarthScore(state)
    return mergePlayer(EARTH_NPCS, {
      ...playerBase,
      score,
      note: '人情與門派',
      sparPower: Math.floor(score / 15) + 40,
    })
  }
  if (kind === 'weapon') {
    const { score, note } = playerWeaponScore(state)
    const weaponNpcs = HEAVEN_NPCS.map((e, i) => ({
      id: `w_${e.id}`,
      name: e.name,
      score: 900 - i * 70,
      note: i === 0 ? '倚巔劍傳聞' : i === 1 ? '屠朧刀影' : '名刃在握',
      sparPower: e.sparPower,
    }))
    return mergePlayer(weaponNpcs, {
      ...playerBase,
      score,
      note,
      sparPower: Math.floor(score / 10) + 30,
    })
  }
  const score = playerRichScore(state)
  return mergePlayer(RICH_NPCS, {
    ...playerBase,
    score,
    note: '銀兩＋元寶折算',
    sparPower: 50,
  })
}
