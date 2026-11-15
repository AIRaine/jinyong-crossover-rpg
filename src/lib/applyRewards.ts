import { getMartialById } from '../data/martialArts'
import type {
  ApplyRewardsResult,
  EventRewards,
  GameState,
  InventoryItem,
  Quest,
} from '../types/game'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function mergeItems(
  inventory: InventoryItem[],
  incoming: InventoryItem[],
): InventoryItem[] {
  const next = inventory.map((i) => ({ ...i }))
  for (const item of incoming) {
    const found = next.find((i) => i.id === item.id)
    if (found) {
      found.quantity += item.quantity
    } else {
      next.push({ ...item })
    }
  }
  return next
}

function markQuestObjectivesDone(quest: Quest): Quest {
  return {
    ...quest,
    status: 'completed',
    objectives: quest.objectives.map((o) => ({ ...o, done: true })),
  }
}

export function applyRewards(
  state: GameState,
  rewards: EventRewards,
): ApplyRewardsResult {
  const messages: string[] = []
  let next: GameState = {
    ...state,
    stats: { ...state.stats },
    currency: { ...state.currency },
    flags: { ...state.flags },
    affinity: { ...state.affinity },
    inventory: state.inventory.map((i) => ({ ...i })),
    quests: state.quests.map((q) => ({
      ...q,
      objectives: q.objectives.map((o) => ({ ...o })),
    })),
    completedEvents: [...state.completedEvents],
  }

  if (rewards.silver) {
    next.currency.silver = Math.max(0, next.currency.silver + rewards.silver)
    messages.push(
      rewards.silver > 0 ? `銀兩 +${rewards.silver}` : `銀兩 ${rewards.silver}`,
    )
  }
  if (rewards.yuanbao) {
    next.currency.yuanbao = Math.max(
      0,
      next.currency.yuanbao + rewards.yuanbao,
    )
    messages.push(
      rewards.yuanbao > 0
        ? `元寶 +${rewards.yuanbao}（體驗）`
        : `元寶 ${rewards.yuanbao}（體驗）`,
    )
  }
  if (rewards.hpDelta) {
    // 氣血下限 1，避免事件扣血後卡在 0 的非法／半死狀態
    next.stats.hp = clamp(
      next.stats.hp + rewards.hpDelta,
      1,
      next.stats.maxHp,
    )
    messages.push(
      rewards.hpDelta > 0
        ? `氣血 +${rewards.hpDelta}`
        : `氣血 ${rewards.hpDelta}`,
    )
  }
  if (rewards.staminaDelta) {
    next.stats.stamina = clamp(
      next.stats.stamina + rewards.staminaDelta,
      0,
      next.stats.maxStamina,
    )
    messages.push(
      rewards.staminaDelta > 0
        ? `精力 +${rewards.staminaDelta}`
        : `精力 ${rewards.staminaDelta}`,
    )
  }
  if (rewards.exp) {
    next.stats.exp += rewards.exp
    messages.push(`閱歷 +${rewards.exp}`)
  }
  if (rewards.inspiration) {
    next.inspiration = (next.inspiration ?? 0) + rewards.inspiration
    messages.push(`靈感 +${rewards.inspiration}`)
  }
  if (rewards.potential) {
    next.potential = (next.potential ?? 0) + rewards.potential
    messages.push(`潛能 +${rewards.potential}`)
  }
  if (rewards.affinity) {
    for (const [npcId, delta] of Object.entries(rewards.affinity)) {
      const before = next.affinity[npcId] ?? 0
      const after = clamp(before + delta, 0, 100)
      next.affinity[npcId] = after
      const applied = after - before
      if (applied !== 0) {
        messages.push(
          `好感（${npcId === 'npc_huang_rong' ? '皇容' : npcId}）${applied > 0 ? '+' : ''}${applied}`,
        )
      } else if (delta !== 0) {
        messages.push(
          `好感（${npcId === 'npc_huang_rong' ? '皇容' : npcId}）已達界限`,
        )
      }
    }
  }
  if (rewards.flags) {
    next.flags = { ...next.flags, ...rewards.flags }
  }
  if (rewards.items?.length) {
    next.inventory = mergeItems(next.inventory, rewards.items)
    for (const item of rewards.items) {
      messages.push(`獲得「${item.name}」×${item.quantity}`)
    }
  }
  if (rewards.martialIds?.length) {
    const martialProgress = { ...next.martialProgress }
    for (const id of rewards.martialIds) {
      const art = getMartialById(id)
      if (!art) continue
      if ((martialProgress[id] ?? 0) > 0) continue
      martialProgress[id] = 1
      messages.push(`學會武學「${art.name}」`)
    }
    next = { ...next, martialProgress }
  }
  if (rewards.questsToComplete?.length) {
    next.quests = next.quests.map((q) =>
      rewards.questsToComplete!.includes(q.id) ? markQuestObjectivesDone(q) : q,
    )
    for (const id of rewards.questsToComplete) {
      const q = next.quests.find((x) => x.id === id)
      if (q) messages.push(`任務完成：${q.title}`)
    }
  }
  if (rewards.questsToAdd?.length) {
    for (const q of rewards.questsToAdd) {
      if (!next.quests.some((x) => x.id === q.id)) {
        next.quests.push({
          ...q,
          objectives: q.objectives.map((o) => ({ ...o })),
        })
        messages.push(`新任務：${q.title}`)
      }
    }
  }
  if (rewards.combatPlaceholder) {
    next.lastCombatResult = rewards.combatPlaceholder
    messages.push(
      rewards.combatPlaceholder.victory ? '危局化解（戰鬥佔位）' : '受挫（戰鬥佔位）',
    )
  }

  return { state: next, messages }
}
