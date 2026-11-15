import { getMartialById } from '../data/martialArts'
import type { GameState } from '../types/game'

/** 門派入門／晉升對應傳功武學 */
export const SECT_MARTIAL_GRANTS: Record<
  string,
  { onJoin: string[]; onRank: Record<number, string[]> }
> = {
  sect_shaolin: {
    onJoin: ['ma_shaolin_yi'],
    onRank: { 2: ['ma_shaolin_xisui'], 3: ['ma_act_dragon'] },
  },
  sect_wudang: {
    onJoin: ['ma_wudang_taiji'],
    onRank: { 2: ['ma_act_taiji_sword'], 3: ['ma_qing_cloud'] },
  },
  sect_huashan: {
    onJoin: ['ma_qing_huashan'],
    onRank: { 2: ['ma_act_lonely'], 3: ['ma_heart_yue'] },
  },
  sect_beggar: {
    onJoin: ['ma_act_dog'],
    onRank: { 2: ['ma_heart_wine'], 3: ['ma_act_xiangyang'] },
  },
  sect_mingjiao: {
    onJoin: ['ma_mingjiao_fire'],
    onRank: { 2: ['ma_jiuyang'], 3: ['ma_qing_icefire'] },
  },
  sect_gumupo: {
    onJoin: ['ma_gumupo_jade'],
    onRank: { 2: ['ma_qing_tomb'], 3: ['ma_act_xuantie'] },
  },
  sect_riyue: {
    onJoin: ['ma_kuiying'],
    onRank: { 2: ['ma_act_needle'], 3: ['ma_heart_zhao'] },
  },
  sect_emei: {
    onJoin: ['ma_heart_emei'],
    onRank: { 2: ['ma_qing_emei'], 3: ['ma_act_emei_sword'] },
  },
  sect_taohua: {
    onJoin: ['ma_heart_peach'],
    onRank: { 2: ['ma_act_luoying'], 3: ['ma_qing_wave'] },
  },
}

/** 地點採集／初訪可能發現的武學書冊 */
export const LOCATION_MARTIAL_FINDS: Record<string, string[]> = {
  loc_lingjiu: ['ma_heart_xuzhu', 'ma_qing_lingbo', 'ma_beiming'],
  loc_peach_island: ['ma_heart_peach', 'ma_act_luoying', 'ma_hua_gong'],
  loc_dead_tomb: ['ma_gumupo_jade', 'ma_qing_tomb', 'ma_act_xuantie'],
  loc_huashan: ['ma_qing_huashan', 'ma_act_lonely', 'ma_heart_yue'],
  loc_emei_gate: ['ma_heart_emei', 'ma_qing_emei', 'ma_act_emei_sword'],
  loc_icefire_isle: ['ma_qing_icefire', 'ma_jiuyang', 'ma_mingjiao_fire'],
  loc_xuanmu: ['ma_kuiying', 'ma_act_needle', 'ma_heart_zhao'],
  loc_shaolin: ['ma_shaolin_yi', 'ma_shaolin_xisui'],
  loc_wudang: ['ma_wudang_taiji', 'ma_act_taiji_sword'],
  loc_beggar_hall: ['ma_act_dog', 'ma_heart_wine'],
  loc_yanmen: ['ma_qing_yanmen', 'ma_act_dragon', 'ma_heart_azhu'],
  loc_east_wharf: ['ma_qing_wharf', 'ma_qing_wave'],
  loc_dali: ['ma_act_liumei', 'ma_qing_lingbo'],
  loc_suhang: ['ma_heart_tianji', 'ma_act_liumei'],
  loc_tianji_hall: ['ma_heart_tianji', 'ma_heart_azhu'],
}

/** 戰鬥勝利可能掉落的招式（非開局那五招） */
export const COMBAT_MARTIAL_POOL = [
  'ma_act_xiangyang',
  'ma_act_first_aid',
  'ma_qing_swallow',
  'ma_qing_yanmen',
  'ma_heart_poison',
  'ma_act_dog',
  'ma_wudang_taiji',
  'ma_shaolin_yi',
  'ma_act_liumei',
  'ma_qing_wharf',
  'ma_heart_wine',
  'ma_act_taiji_sword',
] as const

export function grantMartialArts(
  state: GameState,
  martialIds: string[],
): { state: GameState; learned: string[] } {
  const martialProgress = { ...state.martialProgress }
  const learned: string[] = []
  for (const id of martialIds) {
    if (!getMartialById(id)) continue
    if ((martialProgress[id] ?? 0) > 0) continue
    martialProgress[id] = 1
    learned.push(id)
  }
  if (!learned.length) return { state, learned }
  return { state: { ...state, martialProgress }, learned }
}

export function pickUnknownMartial(
  state: GameState,
  pool: string[],
  rng: () => number = Math.random,
): string | null {
  const unknown = pool.filter((id) => (state.martialProgress[id] ?? 0) <= 0)
  if (!unknown.length) return null
  return unknown[Math.floor(rng() * unknown.length)] ?? null
}
