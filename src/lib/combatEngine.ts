import { calcDamage } from './combatMath'

export type CombatStatus = 'none' | 'poison' | 'stun'

export interface CombatFighter {
  id: string
  name: string
  side: 'ally' | 'enemy'
  hp: number
  maxHp: number
  atk: number
  def: number
  internal: number
  status: CombatStatus
  poisonTurns: number
  stunned: boolean
  isPlayer?: boolean
  /** 絕招傷害倍率（由武學配置推導；未設則用預設） */
  skillPower?: number
}

export type CombatActionKind =
  | 'attack'
  | 'skill'
  | 'tactic_flash'
  | 'tactic_aid'
  | 'defend'

/** 每場戰鬥急救上限（防無限奶穩贏） */
export const TACTIC_AID_MAX_PER_FIGHT = 2

/** 急救回復比例（相對自身最大氣血） */
export const TACTIC_AID_HEAL_RATIO = 0.2

export interface CombatLogEntry {
  text: string
}

export interface CombatState {
  allies: CombatFighter[]
  enemies: CombatFighter[]
  turn: number
  logs: CombatLogEntry[]
  finished: boolean
  victory: boolean | null
  /** 本場剩餘可急救次數 */
  aidUsesLeft: number
}

function living(list: CombatFighter[]): CombatFighter[] {
  return list.filter((f) => f.hp > 0)
}

function cloneFighter(f: CombatFighter): CombatFighter {
  return { ...f }
}

function applyPoisonTick(f: CombatFighter, logs: CombatLogEntry[]): void {
  if (f.hp <= 0 || f.poisonTurns <= 0) return
  const dmg = Math.max(3, Math.floor(f.maxHp * 0.06))
  f.hp = Math.max(0, f.hp - dmg)
  f.poisonTurns -= 1
  if (f.poisonTurns <= 0 && f.status === 'poison') f.status = 'none'
  logs.push({ text: `${f.name} 受到劇毒侵蝕，失血 ${dmg}` })
}

function checkEnd(state: CombatState): void {
  if (living(state.allies).length === 0) {
    state.finished = true
    state.victory = false
    state.logs.push({ text: '全軍覆沒……此戰失利。' })
  } else if (living(state.enemies).length === 0) {
    state.finished = true
    state.victory = true
    state.logs.push({ text: '敵陣潰散，險勝一場！' })
  }
}

function pickLowestHp(foes: CombatFighter[], preferredId?: string): CombatFighter | null {
  if (foes.length === 0) return null
  if (preferredId) {
    const t = foes.find((f) => f.id === preferredId)
    if (t) return t
  }
  return foes.reduce((a, b) => (a.hp <= b.hp ? a : b))
}

function basicStrike(
  state: CombatState,
  actor: CombatFighter,
  target: CombatFighter,
  multiplier: number,
  label: string,
): void {
  const dmg = calcDamage({
    atk: actor.atk,
    def: target.def,
    multiplier,
    attackerInternal: actor.internal,
    defenderInternal: target.internal,
  })
  target.hp = Math.max(0, target.hp - dmg)
  state.logs.push({
    text: `${actor.name} ${label}${target.name}，造成 ${dmg} 傷害`,
  })
}

function actOne(
  state: CombatState,
  actor: CombatFighter,
  foes: CombatFighter[],
  preferredId?: string,
): void {
  if (actor.hp <= 0) return
  if (actor.stunned) {
    actor.stunned = false
    if (actor.status === 'stun') actor.status = 'none'
    state.logs.push({ text: `${actor.name} 眩暈未消，動彈不得` })
    return
  }
  applyPoisonTick(actor, state.logs)
  if (actor.hp <= 0) return
  const target = pickLowestHp(living(foes), preferredId)
  if (!target) return
  basicStrike(state, actor, target, 1, '攻向')
}

/** 建立 3v3 遭遇 */
export function createCombatEncounter(params: {
  player: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>
  allies: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[]
  enemies: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[]
}): CombatState {
  const wrap = (
    f: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>,
    side: 'ally' | 'enemy',
  ): CombatFighter => ({
    ...f,
    side,
    status: 'none',
    poisonTurns: 0,
    stunned: false,
  })

  const allies = [
    wrap({ ...params.player, isPlayer: true }, 'ally'),
    ...params.allies.slice(0, 2).map((a) => wrap(a, 'ally')),
  ]
  while (allies.length < 3) {
    const n = allies.length + 1
    // 臨時幫手偏弱，避免無隊友時仍碾壓；鼓勵俠侶／配置
    allies.push(
      wrap(
        {
          id: `ally_pad_${n}`,
          name: `臨時幫手${n}`,
          hp: 32,
          maxHp: 32,
          atk: 7,
          def: 4,
          internal: 12,
        },
        'ally',
      ),
    )
  }

  const enemies = params.enemies.slice(0, 3).map((e) => wrap(e, 'enemy'))
  while (enemies.length < 3) {
    const n = enemies.length + 1
    enemies.push(
      wrap(
        {
          id: `enemy_pad_${n}`,
          name: `刀客${n}`,
          hp: 36 + n * 6,
          maxHp: 36 + n * 6,
          atk: 11 + n,
          def: 5,
          internal: 12,
        },
        'enemy',
      ),
    )
  }

  return {
    allies,
    enemies,
    turn: 1,
    logs: [
      {
        text: `戰局展開——三對三對決。本場急救至多 ${TACTIC_AID_MAX_PER_FIGHT} 次。`,
      },
    ],
    finished: false,
    victory: null,
    aidUsesLeft: TACTIC_AID_MAX_PER_FIGHT,
  }
}

/**
 * 玩家操作主角一動 → 隊友自動攻擊 → 敵方回合。
 */
export function performPlayerAction(
  prev: CombatState,
  action: CombatActionKind,
  targetEnemyId?: string,
): CombatState {
  if (prev.finished) return prev
  const state: CombatState = {
    ...prev,
    allies: prev.allies.map(cloneFighter),
    enemies: prev.enemies.map(cloneFighter),
    logs: [...prev.logs],
  }

  const player = state.allies.find((a) => a.isPlayer) ?? state.allies[0]
  if (!player || player.hp <= 0) {
    // 主角倒下即判負，避免「主角已死、墊刀隊友仍活」造成操作死鎖
    state.finished = true
    state.victory = false
    state.logs.push({ text: '你已無法作戰——此戰失利。' })
    return state
  }

  if (player.stunned) {
    player.stunned = false
    if (player.status === 'stun') player.status = 'none'
    state.logs.push({ text: `${player.name} 眩暈中，本回合無法主動出手` })
  } else {
    applyPoisonTick(player, state.logs)
    if (player.hp > 0) {
      if (action === 'tactic_aid') {
        const left = state.aidUsesLeft ?? 0
        if (left <= 0) {
          state.logs.push({
            text: '急救包材已用盡——本場無法再急救（每場有限次）。',
          })
        } else {
          const heal = Math.floor(player.maxHp * TACTIC_AID_HEAL_RATIO)
          player.hp = Math.min(player.maxHp, player.hp + heal)
          state.aidUsesLeft = left - 1
          state.logs.push({
            text: `${player.name} 施展現代急救，回復 ${heal} 氣血（本場尚餘 ${state.aidUsesLeft} 次）`,
          })
        }
      } else if (action === 'defend') {
        player.def += 5
        state.logs.push({ text: `${player.name} 持守防禦，防禦暫時提高` })
      } else {
        const target = pickLowestHp(living(state.enemies), targetEnemyId)
        if (target) {
          if (action === 'tactic_flash') {
            target.stunned = true
            target.status = 'stun'
            basicStrike(state, player, target, 0.65, '以妖光照射')
          } else if (action === 'skill') {
            const mul = Math.max(1.15, Math.min(1.85, player.skillPower ?? 1.35))
            basicStrike(state, player, target, mul, '使出絕招攻向')
            if (Math.random() < 0.5) {
              target.status = 'poison'
              target.poisonTurns = Math.max(target.poisonTurns, 2)
              state.logs.push({ text: `${target.name} 中了劇毒！` })
            }
          } else {
            basicStrike(state, player, target, 1, '攻向')
          }
        }
      }
    }
  }

  checkEnd(state)
  if (state.finished) return state

  // 隊友自動
  for (const ally of state.allies) {
    if (ally.isPlayer || ally.hp <= 0) continue
    actOne(state, ally, state.enemies)
    if (living(state.enemies).length === 0) break
  }

  checkEnd(state)
  if (state.finished) return state

  // 敵方
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue
    actOne(state, enemy, state.allies)
    if (living(state.allies).length === 0) break
  }

  // 回合結束：撤回玩家臨時防禦（簡化：def 不永久疊加——用基準難以回滾，改為小幅衰減）
  if (action === 'defend' && player.hp > 0) {
    player.def = Math.max(0, player.def - 5)
  }

  state.turn += 1
  checkEnd(state)
  return state
}

/**
 * 路遇刀客。
 * @param opts.loseStreak 連敗次數 → 敵人變弱（連敗保護）
 * @param opts.year 主線年分 → 輕微抬難度，避免永遠碾壓
 */
export function makeBanditEncounter(
  player: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>,
  allyExtras: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[],
  opts: { loseStreak?: number; year?: number; enemyScale?: number } = {},
): CombatState {
  const streak = Math.max(0, opts.loseStreak ?? 0)
  const year = Math.max(1, opts.year ?? 1)
  // 連敗：每層約 -12% 敵方面板；年分：每年 +6%（上限 +30%）——普攻可過早期，後期需絕招／修練
  // enemyScale：門派／路線／招式鏈額外倍率（可測難度分叉）
  const soften = Math.max(0.62, 1 - streak * 0.12)
  const yearScale = Math.min(1.3, 1 + (year - 1) * 0.06)
  const pathScale = Math.max(0.85, Math.min(1.35, opts.enemyScale ?? 1))
  const scale = soften * yearScale * pathScale

  const mk = (
    id: string,
    name: string,
    base: { hp: number; atk: number; def: number; internal: number },
  ) => ({
    id,
    name: streak >= 2 ? `${name}（強弩之末）` : name,
    hp: Math.max(28, Math.floor(base.hp * scale)),
    maxHp: Math.max(28, Math.floor(base.hp * scale)),
    atk: Math.max(6, Math.floor(base.atk * scale)),
    def: Math.max(2, Math.floor(base.def * scale)),
    internal: Math.max(8, Math.floor(base.internal * scale)),
  })

  const encounter = createCombatEncounter({
    player,
    allies: allyExtras,
    enemies: [
      mk('bandit_1', '黑衣刀客', { hp: 64, atk: 15, def: 7, internal: 19 }),
      mk('bandit_2', '斷橋槍匪', { hp: 56, atk: 13, def: 8, internal: 17 }),
      mk('bandit_3', '蒙面弓手', { hp: 48, atk: 17, def: 5, internal: 15 }),
    ],
  })
  if (streak >= 2) {
    encounter.logs = [
      {
        text: `連敗 ${streak} 場後，對手氣勢已衰——這是重整旗鼓的機會。`,
      },
    ]
  }
  return encounter
}

/** 榜單切磋：依對手強度縮放三名陪練 */
export function makeSparEncounter(
  player: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>,
  allyExtras: Omit<CombatFighter, 'side' | 'status' | 'poisonTurns' | 'stunned'>[],
  sparPower: number,
  rivalName: string,
): CombatState {
  const scale = Math.max(0.7, Math.min(1.8, sparPower / 70))
  const mk = (
    id: string,
    name: string,
    base: { hp: number; atk: number; def: number; internal: number },
  ) => ({
    id,
    name,
    hp: Math.floor(base.hp * scale),
    maxHp: Math.floor(base.hp * scale),
    atk: Math.floor(base.atk * scale),
    def: Math.floor(base.def * scale),
    internal: Math.floor(base.internal * scale),
  })
  const encounter = createCombatEncounter({
    player,
    allies: allyExtras,
    enemies: [
      mk('spar_1', rivalName, { hp: 62, atk: 15, def: 7, internal: 20 }),
      mk('spar_2', `${rivalName}的副手`, { hp: 48, atk: 13, def: 6, internal: 16 }),
      mk('spar_3', `${rivalName}的暗哨`, { hp: 42, atk: 14, def: 5, internal: 14 }),
    ],
  })
  encounter.logs = [
    { text: `與「${rivalName}」切磋開場——點到為止，亦是真刀真槍。` },
  ]
  return encounter
}
