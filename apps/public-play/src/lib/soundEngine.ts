/**
 * 輕量 Web Audio 音效引擎。
 * 需在使用者手勢後 unlock；未解鎖時呼叫會安靜略過。
 */

type SoundKind = 'tap' | 'success' | 'fail' | 'coin' | 'page' | 'combat'

let audioCtx: AudioContext | null = null
let unlocked = false
let muted = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  return audioCtx
}

/** 在首次點擊時呼叫，解除瀏覽器自動播放限制 */
export async function unlockAudio(): Promise<void> {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return
    }
  }
  unlocked = ctx.state === 'running'
}

export function setMuted(next: boolean): void {
  muted = next
}

export function isMuted(): boolean {
  return muted
}

export function isAudioUnlocked(): boolean {
  return unlocked
}

function beep(freq: number, durationMs: number, type: OscillatorType, gain = 0.04): void {
  if (muted || !unlocked) return
  const ctx = getCtx()
  if (!ctx || ctx.state !== 'running') return

  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(ctx.destination)

  const now = ctx.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.02)
}

export function playSound(kind: SoundKind): void {
  switch (kind) {
    case 'tap':
      beep(520, 60, 'sine', 0.03)
      break
    case 'page':
      beep(380, 80, 'triangle', 0.035)
      break
    case 'success':
      beep(523, 90, 'sine', 0.04)
      setTimeout(() => beep(659, 110, 'sine', 0.04), 70)
      break
    case 'fail':
      beep(220, 160, 'sawtooth', 0.03)
      break
    case 'coin':
      beep(880, 70, 'square', 0.025)
      setTimeout(() => beep(1175, 90, 'square', 0.02), 50)
      break
    case 'combat':
      beep(160, 100, 'square', 0.04)
      setTimeout(() => beep(120, 140, 'sawtooth', 0.035), 80)
      break
    default:
      break
  }
}

export type { SoundKind }
