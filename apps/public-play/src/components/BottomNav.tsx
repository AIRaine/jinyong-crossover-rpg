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

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="shrink-0 border-t border-paper/10 bg-ink-950/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
      <ul className="grid grid-cols-4 gap-0.5 px-1 sm:grid-cols-8">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                className={`touch-btn flex w-full flex-col items-center rounded-lg px-0.5 py-2 text-[10px] leading-tight transition sm:text-[11px] ${
                  isActive
                    ? 'bg-cinnabar/90 text-paper shadow-sm'
                    : 'text-paper/65 active:bg-paper/10'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
