import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Plus,
  Play,
  Settings,
  X,
  Crown,
  Bot,
  User,
  LogOut,
  Users,
  ShieldAlert,
  Heart,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { MIN_MAX_HP, MAX_MAX_HP, DEFAULT_MAX_HP } from '../lib/constants';

const HP_OPTIONS = Array.from({ length: MAX_MAX_HP - MIN_MAX_HP + 1 }, (_, i) => MIN_MAX_HP + i);

/** Seletor da Quantidade de Vida Inicial: editável só pelo Host, somente leitura para os demais. */
function HpSelector({ value, isHost, onChange }) {
  return (
    <div id="hp-selector" className="rounded-lg border border-iron/60 bg-black/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 font-grimoire font-bold text-xs sm:text-sm tracking-wider text-parchment">
          <Heart size={15} className="text-blood-bright fill-blood-bright" />
          VIDA INICIAL
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] text-parchment-dark">
          {isHost ? 'Você define para toda a mesa' : 'Definido pelo líder'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label="Quantidade de vida inicial">
          {HP_OPTIONS.map((n) => {
            const selected = n === value;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!isHost}
                onClick={() => isHost && onChange(n)}
                className={cn(
                  'flex-1 min-h-[44px] rounded border-2 font-mono font-extrabold text-base transition-all touch-manipulation',
                  'flex items-center justify-center gap-1',
                  selected
                    ? 'border-blood-bright bg-blood/60 text-white shadow-[0_0_14px_rgba(220,38,38,0.55)]'
                    : 'border-iron/70 bg-black/60 text-parchment-dark',
                  isHost && !selected && 'hover:border-gold-aged hover:text-gold-aged active:bg-blood/30',
                  !isHost && 'cursor-default'
                )}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Prévia de corações com a quantidade escolhida */}
        <div className="hidden min-[400px]:flex items-center gap-0.5 shrink-0" aria-hidden>
          {Array.from({ length: value }).map((_, i) => (
            <Heart key={i} size={value >= 5 ? 12 : 14} className="text-blood-bright fill-blood-bright" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoomLobby({
  roomState,
  me,
  isHost,
  onLeaveRoom,
  onTogglePrivacy,
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  onStartGame,
  onOpenSettings,
  onCopyCode,
  onSetMaxHp,
}) {
  const [hideCode, setHideCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const players = roomState?.players || [];
  const minPlayers = roomState?.minPlayers || 4;
  const maxPlayers = roomState?.maxPlayers || 8;
  const maxHp = roomState?.settings?.maxHp ?? roomState?.maxHp ?? DEFAULT_MAX_HP;
  const canStart = isHost && players.length >= minPlayers && players.length <= maxPlayers;

  const handleCopy = () => {
    if (roomState?.roomCode) {
      navigator.clipboard?.writeText(roomState.roomCode);
      setCopied(true);
      onCopyCode?.(roomState.roomCode);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-y-auto overflow-x-hidden p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="m-auto w-full max-w-[640px] rounded-xl border-4 border-stone-900 bg-gradient-to-b from-wood-mid to-wood-dark p-3 sm:p-6 shadow-[0_0_70px_rgba(139,0,0,0.4),inset_0_0_50px_rgba(0,0,0,0.8)] relative"
      >
        {/* Barra Superior da Sala: Nome, Privacidade e Sair */}
        <div className="flex items-start justify-between gap-2 border-b border-iron/40 pb-3 mb-3 sm:mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-grimoire font-extrabold text-base sm:text-lg text-parchment truncate max-w-full">
                {roomState?.roomName || 'SALA'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                  roomState?.isPublic
                    ? 'bg-gold-aged/20 text-gold-aged border border-gold-aged/50'
                    : 'bg-blood/30 text-blood-bright border border-blood-bright/50'
                }`}
              >
                {roomState?.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                {roomState?.isPublic ? 'PÚBLICA' : 'PRIVADA'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-parchment-dark mt-0.5">
              {players.length}/{maxPlayers} na mesa (mínimo: {minPlayers})
            </p>
          </div>

          <button
            onClick={onLeaveRoom}
            className="shrink-0 flex items-center justify-center gap-1.5 min-h-[40px] min-w-[40px] px-2.5 sm:px-3 rounded border border-iron/80 bg-black/50 hover:bg-blood/40 hover:border-blood-bright text-parchment-dark hover:text-white text-xs font-mono transition-colors"
            title="Sair desta sala e voltar ao menu"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* Banner com Código de Convite da Sala */}
        <div className="rounded-lg border-2 border-gold-aged/50 bg-black/70 p-3 sm:p-4 mb-3 sm:mb-5 text-center shadow-[0_0_25px_rgba(212,175,55,0.15)]">
          <span className="text-[10px] font-mono text-parchment-dark tracking-widest uppercase block mb-1">
            CÓDIGO DE ACESSO DA SALA
          </span>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span
              id="room-code-display"
              className="font-mono font-extrabold text-3xl sm:text-4xl tracking-[0.25em] sm:tracking-[0.3em] pl-[0.25em] text-gold-aged drop-shadow-[0_0_12px_rgba(212,175,55,0.5)] select-all"
            >
              {hideCode ? '••••' : roomState?.roomCode}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="h-11 w-11 flex items-center justify-center rounded border border-gold-aged/60 bg-gold-aged/10 hover:bg-gold-aged/30 text-gold-aged transition-colors"
                title="Copiar código da sala"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => setHideCode(!hideCode)}
                className="h-11 w-11 flex items-center justify-center rounded border border-iron bg-black/60 hover:border-parchment-dark text-parchment-dark transition-colors"
                title={hideCode ? 'Mostrar código' : 'Ocultar código (para live stream)'}
              >
                {hideCode ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
          <div className="text-[10px] font-mono text-stone-500 mt-1">
            Compartilhe este código de 4 letras com quem deseja convidar.
          </div>
        </div>

        {/* Configuração: Quantidade de Vida Inicial (2 a 5) */}
        <div className="mb-3 sm:mb-5">
          <HpSelector value={maxHp} isHost={isHost} onChange={onSetMaxHp} />
        </div>

        {/* Lista de Jogadores na Mesa */}
        <div className="space-y-2 mb-3 sm:mb-5">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-parchment-dark px-1">
            <span className="flex items-center gap-1">
              <Users size={13} /> CONDENADOS CONECTADOS
            </span>
            <span>
              {players.length}/{maxPlayers}
            </span>
          </div>

          <div className="space-y-1.5 max-h-[32dvh] sm:max-h-56 overflow-y-auto pr-1">
            {players.map((p) => {
              const isPlayerHost = p.id === roomState?.hostId;
              const isMe = p.id === me?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 rounded border px-2 sm:px-3 py-1.5 sm:py-2 transition-all ${
                    isMe
                      ? 'border-gold-aged/80 bg-gold-aged/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : 'border-iron/60 bg-black/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                    {p.isBot ? (
                      <span className="p-1 rounded bg-stone-900 border border-iron text-stone-400">
                        <Bot size={14} />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-black border border-stone-700 text-parchment">
                        <User size={14} />
                      </span>
                    )}

                    <span className="font-typewriter text-xs sm:text-sm text-parchment truncate max-w-[40vw] sm:max-w-none">
                      {p.name}
                    </span>

                    {isMe && (
                      <span className="text-[10px] font-mono text-gold-aged bg-black/60 px-1.5 py-0.5 rounded border border-gold-aged/40">
                        VOCÊ
                      </span>
                    )}

                    {isPlayerHost && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/50">
                        <Crown size={11} /> LÍDER
                      </span>
                    )}
                  </div>

                  {/* Ações do Host para expulsar jogador humano ou remover bot */}
                  {isHost && (
                    <div className="flex items-center gap-1 shrink-0">
                      {p.isBot ? (
                        <button
                          onClick={() => onRemoveBot(p.id)}
                          className="h-10 w-10 flex items-center justify-center text-blood-bright hover:text-white hover:bg-blood/40 active:bg-blood/40 rounded transition-colors"
                          title="Remover bot"
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        !isMe && (
                          <button
                            onClick={() => onKickPlayer(p.id)}
                            className="h-10 w-10 flex items-center justify-center text-blood-bright hover:text-white hover:bg-blood/40 active:bg-blood/40 rounded transition-colors"
                            title="Expulsar jogador da sala"
                          >
                            <X size={16} />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel de Controles e Inicialização */}
        {isHost ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-add-bot"
                onClick={onAddBot}
                disabled={players.length >= maxPlayers}
                className="sm:flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded border-2 border-iron hover:border-gold-aged font-grimoire font-bold text-xs text-parchment disabled:opacity-40 transition-colors"
              >
                <Plus size={14} /> ADICIONAR BOT
              </button>

              <div className="flex gap-2">
                <button
                  onClick={onTogglePrivacy}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded border border-iron text-xs font-mono text-parchment-dark hover:text-gold-aged transition-colors"
                  title="Mudar visibilidade da sala"
                >
                  {roomState?.isPublic ? <Lock size={13} /> : <Globe size={13} />}
                  <span className="whitespace-nowrap">{roomState?.isPublic ? 'TORNAR PRIVADA' : 'TORNAR PÚBLICA'}</span>
                </button>

                <button
                  onClick={onOpenSettings}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded border border-iron text-xs font-mono text-parchment-dark hover:text-gold-aged transition-colors"
                  title="Ajustar regras e tempos da partida"
                >
                  <Settings size={13} /> REGRAS
                </button>
              </div>
            </div>

            <button
              id="btn-start-game"
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] py-3 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood disabled:opacity-40 disabled:hover:bg-blood/80 text-parchment font-grimoire font-extrabold tracking-widest text-sm sm:text-base shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all"
            >
              <Play size={18} /> INICIAR PARTIDA
            </button>

            {!canStart && (
              <div className="flex items-center justify-center gap-1.5 text-center text-[11px] font-mono text-amber-400/90 bg-black/40 py-1.5 px-3 rounded border border-amber-900/40">
                <ShieldAlert size={13} className="shrink-0" />
                Mínimo de {minPlayers} jogadores para iniciar. Adicione bots ou convide amigos!
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-3 sm:p-4 rounded border border-iron/60 bg-black/60 space-y-2">
            <div className="font-grimoire text-xs sm:text-sm tracking-wider text-parchment animate-pulse flex items-center justify-center gap-2">
              <Crown size={15} className="text-amber-400 shrink-0" />
              Aguardando o líder da sala iniciar a partida...
            </div>
            <div className="text-[11px] font-mono text-parchment-dark">
              O líder da sala pode adicionar bots ou mudar as regras antes de começar.
            </div>
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 min-h-[40px] text-[11px] font-mono text-gold-aged hover:underline"
            >
              <Settings size={12} /> Ver regras atuais
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
