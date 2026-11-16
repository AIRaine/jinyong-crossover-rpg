import { useRef } from 'react'
import type { TabId } from '../types/game'

const TABS: { id: TabId; label: string }[] = [
  { id: 'travel', label: '遊歷' },
  { id: 'character', label: '人物' },
  { id: 'heroes', label: '群英' },
  { id: 'sect', label: '門派' },
  { id: 'tech', label: '科技' },
  { id: 'rank', label: '榜單' },
  { id: 'shop', label: '商城' },
  { id: 'system', label: '系統' },
]

/** 同 tab 連點判定（手機拇指節奏） */
const DOUBLE_TAP_MS = 420

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

/** 只捲該分頁主內容區（#app-main-scroll），不動 App 外層／視窗 */
function scrollTabContentToTop() {
  const el = document.getElementById('app-main-scroll')
  if (!el) return
  el.scrollTo({ top: 0, behavior: 'smooth' })
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const lastTapRef = useRef<{ id: TabId; at: number } | null>(null)

  return (
    <nav
      className="shrink-0 border-t border-paper/10 bg-ink-950/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="底部分頁；同頁連點兩下可回該分頁內容頂部"
    >
      <ul className="grid grid-cols-4 gap-0.5 px-1 sm:grid-cols-8">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => {
                  const now = Date.now()
                  const last = lastTapRef.current
                  if (
                    isActive &&
                    last &&
                    last.id === tab.id &&
                    now - last.at <= DOUBLE_TAP_MS
                  ) {
                    lastTapRef.current = null
                    scrollTabContentToTop()
                    return
                  }
                  lastTapRef.current = { id: tab.id, at: now }
                  if (!isActive) onChange(tab.id)
                }}
                className={`touch-btn flex w-full flex-col items-center rounded-lg px-0.5 py-1.5 text-[10px] leading-tight transition sm:text-[11px] ${
                  isActive
                    ? 'bg-cinnabar/90 text-paper shadow-sm'
                    : 'text-paper/65 active:bg-paper/10'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                <span
                  className={`mt-0.5 text-[8px] leading-none tracking-wide ${
                    isActive ? 'text-paper/70' : 'text-paper/35'
                  }`}
                >
                  連點回頂
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
