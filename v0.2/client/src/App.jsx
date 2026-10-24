import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Skull as SkullIcon,
  Trophy,
  Copy,
  Check,
  LogOut,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from './lib/cn';
import { PHASE_LABELS } from './models/gameModel';
import { useGameController } from './controllers/useGameController';
import { audioService } from './services/socketService';
import HomeHubView from './views/HomeHubView';
import RoomLobbyView from './views/RoomLobbyView';
import GameTable3DView from './views/GameTable3DView';
import SettingsModal from './components/SettingsModal';
import AudioControls from './components/AudioControls';
import { LogDrawer } from './components/LogPanel';
import DamageOverlay from './components/DamageOverlay';
import GameGuideModal from './components/GameGuideModal';
import MobileHeaderMenu from './components/MobileHeaderMenu';

const HEADER_ICON_BTN =
  'flex items-center justify-center gap-1.5 h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-md border text-[11px] font-mono font-medium transition-all shadow-sm active:scale-95';

export default function App() {
  const ctrl = useGameController();
  const {
    gameState,
    publicRooms,
    players,
    me,
    isHost,
    phase,
    roomStatus,
    aliveCount,
    myHp,
    myMaxHp,
    inAnyRoom,
    inGame,
    isDead,
    overlayActive,
    compact,
    shakeControls,
    hitKey,
    nickname,
    setNickname,
    logs,
    toast,
    showToast,
    copiedCode,
    handleCopyHeaderCode,
    showSettings,
    setShowSettings,
    showGuide,
    setShowGuide,
    showLogs,
    setShowLogs,
    showMobileMenu,
    setShowMobileMenu,
    handleJoinRoom,
    handleCreateRoom,
    handleLeaveRoom,
    handleSendChat,
    onTogglePrivacy,
    onAddBot,
    onRemoveBot,
    onKickPlayer,
    onStartGame,
    onRestartGame,
    onRefreshRooms,
    onUpdateSettings,
  } = ctrl;

  return (
    <>
      <motion.div
        animate={shakeControls}
        className="h-full flex flex-col relative overflow-hidden overflow-x-hidden bg-void-bg text-parchment"
      >
        <div className="candle pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.07),transparent_60%)]" />

        {/* Em partida (inGame): Sem barra de aplicativo — apenas controles discretos e orgânicos nos cantos */}
        {inGame ? (
          <div className="pointer-events-none fixed top-0 inset-x-0 z-[70] flex items-center justify-between px-3 sm:px-5 py-2.5">
            {/* Canto superior esquerdo: Sussurro discreto da rodada e código da mesa */}
            <div
              className="pointer-events-auto flex items-center gap-2.5 text-[11px] font-grimoire tracking-[0.18em] text-parchment/55 hover:text-parchment/90 transition-colors"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
            >
              <span>R{gameState.round}</span>
              <span className="text-stone-600">·</span>
              <button
                type="button"
                onClick={handleCopyHeaderCode}
                className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-amber-200/50 hover:text-amber-200 transition-colors cursor-pointer"
                title="Copiar código da mesa"
              >
                <span>#{gameState.roomCode}</span>
                {copiedCode && <Check size={11} className="text-emerald-400" />}
              </button>
            </div>

            {/* Canto superior direito: Ícones discretos sem caixas pesadas */}
            <div className="pointer-events-auto flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <AudioControls minimal />
              <button
                id="btn-guide"
                type="button"
                onClick={() => {
                  audioService.play('click');
                  setShowGuide(true);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-black/45 hover:bg-black/80 text-parchment/70 hover:text-amber-200 transition-all active:scale-95"
                aria-label="Grimório e Regras"
                title="Grimório e Regras"
              >
                <HelpCircle size={15} />
              </button>
              <button
                id="btn-settings"
                type="button"
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-black/45 hover:bg-black/80 text-parchment/70 hover:text-amber-200 transition-all active:scale-95"
                aria-label="Tempos da Partida"
                title="Tempos da Partida"
              >
                <Settings size={15} />
              </button>
              <button
                id="btn-leave-room"
                type="button"
                onClick={handleLeaveRoom}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-black/45 hover:bg-red-950/80 text-parchment/70 hover:text-red-300 transition-all active:scale-95"
                title="Deixar a mesa"
                aria-label="Deixar a mesa"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Fora da partida (Menu / Lobby): Cabeçalho padrão */
          <header className="relative z-[70] flex items-center justify-between gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 border-b border-stone-800/70 bg-gradient-to-r from-[#24170e] via-[#1c110b] to-[#160d08] shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="font-grimoire font-extrabold tracking-[0.18em] sm:tracking-[0.25em] text-amber-100 text-sm sm:text-base whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center">
                STRIKE
                <span className="text-blood-bright font-black mx-0.5 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                  /
                </span>
                VOID
              </div>

              {inAnyRoom && (
                <button
                  onClick={handleCopyHeaderCode}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md border border-gold-aged/80 bg-[#160e08]/90 font-mono text-[11px] sm:text-xs text-amber-300 font-bold hover:bg-gold-aged/25 hover:border-gold-aged transition-all"
                  title="Clique para copiar código da sala"
                >
                  <strong className="tracking-wider">{gameState.roomCode}</strong>
                  {copiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
              <AudioControls />
              <button
                id="btn-guide"
                onClick={() => {
                  audioService.play('click');
                  setShowGuide(true);
                }}
                className={cn(
                  HEADER_ICON_BTN,
                  'border-blood-bright bg-blood/60 text-white hover:bg-blood hover:border-red-500'
                )}
                aria-label="Como Jogar / Guia de Regras"
                title="Como Jogar / Guia de Regras"
              >
                <HelpCircle size={16} className="text-red-300 shrink-0" />
                <span className="hidden sm:inline font-bold">GUIA</span>
              </button>
              {inAnyRoom && (
                <button
                  id="btn-settings"
                  onClick={() => setShowSettings(true)}
                  className={cn(
                    HEADER_ICON_BTN,
                    'border-gold-aged/80 bg-gold-aged/20 text-amber-300 hover:bg-gold-aged/35 hover:text-white'
                  )}
                  aria-label="Ajustar tempos da partida"
                  title="Ajustar tempos da partida"
                >
                  <Settings size={16} /> <span className="hidden sm:inline">TEMPOS</span>
                </button>
              )}
              {inAnyRoom && (
                <button
                  onClick={handleLeaveRoom}
                  className={cn(
                    HEADER_ICON_BTN,
                    'border-stone-600 bg-stone-900/90 text-stone-200 hover:text-white hover:bg-blood/70 hover:border-blood-bright'
                  )}
                  title="Sair da sala"
                  aria-label="Sair da sala"
                >
                  <LogOut size={16} /> <span className="hidden sm:inline">SAIR</span>
                </button>
              )}
            </div>

            <div className="flex sm:hidden items-center gap-2 shrink-0">
              {inAnyRoom && (
                <button
                  id="btn-mobile-leave"
                  onClick={handleLeaveRoom}
                  className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-md border border-blood-bright/70 bg-blood/30 hover:bg-blood/50 text-red-200 text-xs font-mono font-bold active:scale-95"
                  title="Sair da sala"
                  aria-label="Sair da sala"
                >
                  <LogOut size={14} />
                  <span>SAIR</span>
                </button>
              )}

              <button
                id="btn-mobile-menu"
                onClick={() => {
                  audioService.play('click');
                  setShowMobileMenu((v) => !v);
                }}
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-md border transition-all active:scale-95',
                  showMobileMenu
                    ? 'border-gold-aged bg-gold-aged/30 text-white'
                    : 'border-stone-600 bg-stone-900/90 text-amber-200 hover:border-gold-aged'
                )}
                title="Menu de Opções"
                aria-label="Menu de Opções"
              >
                {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </header>
        )}

        {/* Roteamento MVC de Views */}
        {!inAnyRoom ? (
          <HomeHubView
            nickname={nickname}
            setNickname={setNickname}
            publicRooms={publicRooms}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onRefreshRooms={onRefreshRooms}
            onOpenGuide={() => setShowGuide(true)}
          />
        ) : !inGame ? (
          <RoomLobbyView
            roomState={gameState}
            me={me}
            isHost={isHost}
            onLeaveRoom={handleLeaveRoom}
            onTogglePrivacy={onTogglePrivacy}
            onAddBot={onAddBot}
            onRemoveBot={onRemoveBot}
            onKickPlayer={onKickPlayer}
            onStartGame={onStartGame}
            onOpenSettings={() => setShowSettings(true)}
            onOpenGuide={() => setShowGuide(true)}
            onCopyCode={(code) => showToast(`Código ${code} copiado!`, 'success')}
            onSendChat={handleSendChat}
          />
        ) : (
          <GameTable3DView {...ctrl} />
        )}

        {compact && (
          <LogDrawer
            open={showLogs}
            onClose={() => setShowLogs(false)}
            logs={logs}
            onSendChat={handleSendChat}
            isDead={isDead}
          />
        )}

        <MobileHeaderMenu
          open={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          gameState={gameState}
          isHost={isHost}
          inGame={inGame}
          inAnyRoom={inAnyRoom}
          onOpenGuide={() => setShowGuide(true)}
          onOpenSettings={() => setShowSettings(true)}
          onLeaveRoom={handleLeaveRoom}
          onScrollToUnderTable={() => {
            const btn = document.getElementById('btn-scroll-under-table');
            if (btn) btn.click();
          }}
        />

        <GameGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

        {gameState?.settings && (
          <SettingsModal
            open={showSettings}
            settings={gameState.settings}
            aliveCount={aliveCount || players.length}
            isHost={isHost}
            isLobby={roomStatus === 'LOBBY' || phase === 'LOBBY'}
            onClose={() => setShowSettings(false)}
            onSave={onUpdateSettings}
          />
        )}

        {/* Fim de jogo */}
        <AnimatePresence>
          {phase === 'GAME_OVER' && (
            <motion.div
              key="gameover"
              className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="rounded-lg border-4 border-gold-aged bg-wood-dark px-5 sm:px-10 py-6 sm:py-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.4)] max-w-md w-full"
              >
                {gameState?.winner ? (
                  <Trophy className="mx-auto text-gold-aged mb-2" size={48} />
                ) : (
                  <SkullIcon className="mx-auto text-blood-bright mb-2" size={48} />
                )}
                <div className="font-grimoire font-extrabold text-2xl sm:text-3xl tracking-widest text-parchment break-words">
                  {gameState?.winner ? gameState.winner.name : 'NINGUÉM'}
                </div>
                <div className="font-typewriter text-sm sm:text-base text-parchment-dark mt-1 mb-6">
                  {gameState?.winner ? 'sobreviveu ao Void.' : 'foi engolido pelo Void. Empate.'}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    id="btn-restart"
                    onClick={onRestartGame}
                    className="w-full min-h-[48px] py-2.5 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood text-parchment font-grimoire font-bold tracking-wider text-sm transition-colors shadow-[0_0_15px_rgba(139,0,0,0.5)]"
                  >
                    VOLTAR AO LOBBY DA SALA
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full min-h-[44px] py-2 rounded border border-iron/80 bg-black/60 hover:bg-black text-parchment-dark hover:text-white font-mono text-xs transition-colors"
                  >
                    SAIR PARA O MENU PRINCIPAL
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              className={`absolute top-14 left-1/2 -translate-x-1/2 z-[300] max-w-[92vw] text-center px-4 py-2 rounded border-2 font-mono text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'border-emerald-500 bg-black/95 text-emerald-400'
                  : toast.type === 'info'
                    ? 'border-gold-aged bg-black/95 text-gold-aged'
                    : 'border-blood-bright bg-black/95 text-blood-bright'
              }`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DamageOverlay hp={myHp} maxHp={myMaxHp} active={overlayActive} hitKey={hitKey} />
    </>
  );
}
