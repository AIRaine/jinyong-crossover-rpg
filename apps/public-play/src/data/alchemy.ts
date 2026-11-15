import type { InventoryItem } from '../types/game'

export const MATERIAL_IDS = {
  herb: 'mat_herb',
  ore: 'mat_ore',
  hpPill: 'item_hp_pill',
  qiPill: 'item_qi_pill',
} as const

export const MATERIAL_DEFS: Record<
  string,
  Omit<InventoryItem, 'quantity'>
> = {
  [MATERIAL_IDS.herb]: {
    id: MATERIAL_IDS.herb,
    name: '新鮮草藥',
    description: '可煉回血丹，亦可作塗毒素材。',
    kind: 'material',
  },
  [MATERIAL_IDS.ore]: {
    id: MATERIAL_IDS.ore,
    name: '粗煉礦石',
    description: '可助淬火，亦可煉內力丹的礦基。',
    kind: 'material',
  },
  [MATERIAL_IDS.hpPill]: {
    id: MATERIAL_IDS.hpPill,
    name: '回血丹',
    description: '服用後回復氣血 40。',
    kind: 'consumable',
  },
  [MATERIAL_IDS.qiPill]: {
    id: MATERIAL_IDS.qiPill,
    name: '回內丹',
    description: '服用後回復內力 30。',
    kind: 'consumable',
  },
}

export interface AlchemyRecipe {
  id: string
  name: string
  description: string
  /** 消耗材料 id → 數量 */
  costs: Record<string, number>
  resultId: string
  resultQty: number
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'recipe_hp',
    name: '煉製回血丹',
    description: '三株草藥煉一顆回血丹。',
    costs: { [MATERIAL_IDS.herb]: 3 },
    resultId: MATERIAL_IDS.hpPill,
    resultQty: 1,
  },
  {
    id: 'recipe_qi',
    name: '煉製回內丹',
    description: '兩株草藥加一塊礦石煉一顆回內丹。',
    costs: { [MATERIAL_IDS.herb]: 2, [MATERIAL_IDS.ore]: 1 },
    resultId: MATERIAL_IDS.qiPill,
    resultQty: 1,
  },
]

export function makeMaterial(id: string, quantity: number): InventoryItem | null {
  const def = MATERIAL_DEFS[id]
  if (!def) return null
  return { ...def, quantity }
}
