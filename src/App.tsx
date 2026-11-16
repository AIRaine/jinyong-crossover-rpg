import { BottomNav } from './components/BottomNav'
import { CombatModal } from './components/CombatModal'
import { OriginSelect } from './components/OriginSelect'
import { QuestLogModal } from './components/QuestLogModal'
import { TopStatusBar } from './components/TopStatusBar'
import { CharacterTab } from './components/tabs/CharacterTab'
import { HeroesTab } from './components/tabs/HeroesTab'
import { LeaderboardTab } from './components/tabs/LeaderboardTab'
import { SectTab } from './components/tabs/SectTab'
import { ShopTab } from './components/tabs/ShopTab'
import { SystemTab } from './components/tabs/SystemTab'
import { TechTab } from './components/tabs/TechTab'
import { TravelTab } from './components/tabs/TravelTab'
import { useGame } from './hooks/useGame'

export default function App() {
  const game = useGame()
  const showOrigin = !game.state.originChosen
  const ngPlusGuide = Boolean(game.state.flags.ngPlusNeedsOrigin)

  return (
    <div className="app-root flex min-h-dvh justify-center bg-stage px-0 sm:px-4 sm:py-4">
      <div className="phone-shell relative flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-ink-950 shadow-2xl shadow-black/50 sm:h-[min(844px,calc(100dvh-2rem))] sm:rounded-2xl sm:ring-1 sm:ring-paper/10">
        <div className="brand-bar shrink-0 px-3 pt-2 text-center">
          <p className="font-display text-[13px] tracking-[0.18em] text-paper/90">
            穿越諧音武俠
          </p>
        </div>

        {!showOrigin && (
          <TopStatusBar
            state={game.state}
            onOpenQuests={() => {
              void game.ensureAudio()
              game.setQuestOpen(true)
            }}
          />
        )}

        <main
          id="app-main-scroll"
          className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        >
          {game.tab === 'travel' && (
            <TravelTab
              state={game.state}
              statusMsg={game.statusMsg}
              linkedLocations={game.linkedLocations}
              pendingEvent={game.pendingEvent}
              prologueEvent={game.prologueEvent}
              onChoose={game.choosePrologue}
              onTravel={game.travelTo}
              onGather={game.gatherAtLocation}
              onCraft={game.craftAlchemy}
              onAdvanceXun={game.advanceXun}
              onResolveEvent={game.resolvePendingChoice}
              onFight={game.startBanditFight}
              onUsePill={game.useConsumable}
              onClaimDaily={game.claimDailyLogin}
              onClaimWeekly={game.claimWeeklyGoal}
              onNavigateTab={game.changeTab}
              onStartChallenge={game.startChallenge}
            />
          )}
          {game.tab === 'character' && (
            <CharacterTab
              state={game.state}
              onRename={game.renamePlayer}
              onEquip={game.equipItem}
              onUnequip={game.unequipSlot}
              onRefine={game.refineEquipment}
              onQuench={game.quenchEquipment}
              onPoison={game.poisonEquipment}
            />
          )}
          {game.tab === 'heroes' && (
            <HeroesTab
              state={game.state}
              onGift={game.giftNpc}
              onRecruit={game.recruitNpc}
              onDismiss={game.dismissNpc}
              onPartner={game.makePartner}
            />
          )}
          {game.tab === 'sect' && (
            <SectTab
              state={game.state}
              onJoin={game.joinSect}
              onLeave={game.leaveSect}
              onContribute={game.contributeSect}
            />
          )}
          {game.tab === 'tech' && (
            <TechTab
              state={game.state}
              onUnlock={game.unlockTech}
              onTrain={game.trainMartial}
              onSetSlot={game.setMartialSlot}
            />
          )}
          {game.tab === 'rank' && (
            <LeaderboardTab state={game.state} onSpar={game.startSpar} />
          )}
          {game.tab === 'shop' && (
            <ShopTab
              state={game.state}
              onMockTopUp={game.mockTopUp}
              onBuySilver={game.buySilverOffer}
              onBuyYuanbao={game.buyYuanbaoOffer}
              onGacha={game.pullGacha}
              onClaimMonthly={game.claimMonthly}
              lastGacha={game.lastGacha}
            />
          )}
          {game.tab === 'system' && (
            <SystemTab
              state={game.state}
              onSave={game.manualSave}
              onLoad={game.manualLoad}
              onNewGame={game.newGame}
              canNgPlus={game.canNgPlus}
              onNgPlus={game.settleNgPlus}
            />
          )}
        </main>

        {!showOrigin && (
          <BottomNav active={game.tab} onChange={game.changeTab} />
        )}

        <QuestLogModal
          open={game.questOpen}
          state={game.state}
          onClose={() => game.setQuestOpen(false)}
        />

        {showOrigin && (
          <OriginSelect
            ngPlusGuide={ngPlusGuide}
            onSelect={(payload) => {
              void game.selectOrigin(payload)
            }}
          />
        )}

        {game.combat && (
          <CombatModal
            combat={game.combat}
            onAct={game.combatAct}
            onClose={game.closeCombat}
          />
        )}

        {game.toast && (
          <div className="pointer-events-none absolute inset-x-3 bottom-20 z-50">
            <div className="rounded-xl bg-paper px-3 py-2.5 text-center text-xs leading-relaxed text-ink-950 shadow-lg">
              {game.toast}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
