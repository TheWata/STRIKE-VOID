import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Settings, LogOut, Copy, Check, MessageSquare, Volume2, Shield } from 'lucide-react';
import { AudioSettingsPanel } from './AudioControls';
import { audio } from '../lib/audio';
import { PHASE_LABELS } from '../lib/constants';

export default function MobileHeaderMenu({
  open,
  onClose,
  gameState,
  isHost,
  inGame,
  inAnyRoom,
  onOpenGuide,
  onOpenSettings,
  onLeaveRoom,
  onScrollToUnderTable,
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (gameState?.roomCode) {
      navigator.clipboard?.writeText(gameState.roomCode);
      setCopied(true);
      audio.play('select');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-header-menu"
          className="fixed inset-0 z-[180] flex flex-col justify-start bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-h-[85dvh] overflow-y-auto bg-gradient-to-b from-[#251810] via-[#1a100a] to-[#100905] border-b-4 border-gold-aged/70 shadow-[0_15px_40px_rgba(0,0,0,0.95)] p-4 pt-3 flex flex-col gap-4 text-parchment"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar do Menu Mobile */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-grimoire font-extrabold tracking-widest text-amber-100 text-sm">
                  STRIKE<span className="text-blood-bright mx-0.5">/</span>VOID
                </span>
                <span className="text-stone-500 font-mono text-xs">· MENU</span>
              </div>

              <button
                id="btn-close-mobile-menu"
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-700 bg-black/60 text-parchment-dark hover:text-white transition-colors active:scale-95"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informações da Sala (se estiver em sala) */}
            {inAnyRoom && gameState && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gold-aged/40 bg-black/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-parchment-dark">SALA:</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gold-aged/20 border border-gold-aged/60 text-amber-300 font-mono font-bold text-xs hover:bg-gold-aged/30"
                    title="Copiar código da sala"
                  >
                    <span>{gameState.roomCode}</span>
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                {inGame && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-amber-200 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                      R{gameState.round}
                    </span>
                    <span className="text-amber-400 font-bold text-[11px] truncate max-w-[120px]">
                      {PHASE_LABELS[gameState.phase] || gameState.phase}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ações Primárias: Regras, Configurações, Ir para Chat */}
            <div className="flex flex-col gap-2">
              <button
                id="btn-menu-rules"
                onClick={() => {
                  audio.play('click');
                  onClose();
                  onOpenGuide();
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-blood-bright/70 bg-gradient-to-r from-blood/40 to-blood/20 text-parchment hover:border-red-500 font-mono text-xs font-bold transition-all active:scale-98 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={17} className="text-blood-bright" />
                  <span>LER REGRAS & COMO JOGAR</span>
                </span>
                <span className="text-[10px] text-red-300 bg-black/40 px-2 py-0.5 rounded">GUIA</span>
              </button>

              {inAnyRoom && (
                <button
                  id="btn-menu-settings"
                  onClick={() => {
                    audio.play('click');
                    onClose();
                    onOpenSettings();
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gold-aged/70 bg-gradient-to-r from-gold-aged/25 to-gold-aged/10 text-amber-200 hover:text-white font-mono text-xs font-bold transition-all active:scale-98 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Settings size={17} className="text-gold-aged" />
                    <span>CONFIGURAÇÕES DA PARTIDA</span>
                  </span>
                  <span className="text-[10px] text-gold-aged bg-black/40 px-2 py-0.5 rounded">TEMPOS</span>
                </button>
              )}

              {inGame && onScrollToUnderTable && (
                <button
                  id="btn-menu-chat-scroll"
                  onClick={() => {
                    audio.play('click');
                    onClose();
                    onScrollToUnderTable();
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-emerald-600/70 bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-bold transition-all active:scale-98 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={17} className="text-emerald-400" />
                    <span>EMBAIXO DA MESA (CHAT & LOGS)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-black/40 px-2 py-0.5 rounded">ROLAR ↓</span>
                </button>
              )}
            </div>

            {/* Seção de Ajuste de Volume */}
            <div className="rounded-lg border border-stone-800 bg-black/70 p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-grimoire font-bold text-xs tracking-wider text-amber-300 border-b border-stone-800 pb-1.5">
                <Volume2 size={15} className="text-gold-aged" />
                <span>AJUSTAR VOLUME & ÁUDIO</span>
              </div>
              <AudioSettingsPanel className="pt-1" />
            </div>

            {/* Botão de Sair da Sala */}
            {inAnyRoom && (
              <button
                id="btn-menu-leave"
                onClick={() => {
                  audio.play('click');
                  onClose();
                  onLeaveRoom();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blood-bright/70 bg-black/70 text-red-300 hover:bg-blood/40 hover:text-white font-mono text-xs font-bold transition-all active:scale-98 mt-1"
              >
                <LogOut size={16} />
                <span>SAIR DA SALA</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
