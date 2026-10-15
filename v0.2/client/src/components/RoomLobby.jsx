import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Send,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { LOG_STYLES } from '../lib/constants';
import { audio } from '../lib/audio';

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
  onOpenGuide,
  onCopyCode,
  onSendChat,
}) {
  const [hideCode, setHideCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatBottomRef = useRef(null);

  const players = roomState?.players || [];
  const minPlayers = roomState?.minPlayers || 2;
  const maxPlayers = roomState?.maxPlayers || 8;
  const canStart = isHost && players.length >= minPlayers && players.length <= maxPlayers;

  const logs = roomState?.logs || [];
  const chatLogs = logs.filter((l) => l.type === 'CHAT' || l.type === 'SYSTEM');

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
    }
  }, [chatLogs.length]);

  const handleCopy = () => {
    if (roomState?.roomCode) {
      navigator.clipboard?.writeText(roomState.roomCode);
      setCopied(true);
      onCopyCode?.(roomState.roomCode);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const clean = chatText.trim();
    if (!clean) return;
    onSendChat?.(clean);
    setChatText('');
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-y-auto overflow-x-hidden p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="m-auto w-full max-w-5xl rounded-xl border-4 border-stone-900 bg-gradient-to-b from-wood-mid via-[#1e130c] to-wood-dark p-3 sm:p-6 shadow-[0_0_80px_rgba(139,0,0,0.5),inset_0_0_50px_rgba(0,0,0,0.85)] relative flex flex-col gap-4"
      >
        {/* 1. TOPO: Nome da Sala, Código, Privacidade e Sair */}
        <div className="flex items-start justify-between gap-3 border-b border-iron/40 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-grimoire font-extrabold text-base sm:text-xl text-parchment truncate max-w-full">
                {roomState?.roomName || 'SALA'}
              </span>
              {isHost ? (
                <button
                  onClick={onTogglePrivacy}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider border transition-all ${
                    roomState?.isPublic
                      ? 'bg-gold-aged/20 text-gold-aged border-gold-aged/60 hover:bg-gold-aged/30'
                      : 'bg-blood/30 text-blood-bright border-blood-bright/60 hover:bg-blood/50'
                  }`}
                  title="Alternar entre Pública e Privada"
                >
                  {roomState?.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  {roomState?.isPublic ? 'PÚBLICA (Mudar)' : 'PRIVADA (Mudar)'}
                </button>
              ) : (
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
              )}
            </div>

            {/* Código da sala */}
            <div className="flex items-center gap-2 mt-2">
              <div className="font-mono text-xs text-parchment-dark">CÓDIGO:</div>
              <div className="flex items-center gap-1 bg-black/80 border border-gold-aged/60 px-3 py-1 rounded-md shadow-inner">
                <span className="font-mono text-base sm:text-lg font-black tracking-widest text-gold-aged">
                  {hideCode ? '••••' : roomState?.roomCode}
                </span>
                <button
                  onClick={() => setHideCode(!hideCode)}
                  className="p-1 text-parchment-dark hover:text-parchment transition-colors ml-1"
                  title={hideCode ? 'Mostrar código' : 'Ocultar código'}
                >
                  {hideCode ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1 text-gold-aged hover:text-white transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Botões de topo à direita: Guia, Configurações e Sair */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 min-h-[40px] px-3 rounded border border-blood-bright/70 bg-blood/30 hover:bg-blood/60 text-parchment text-xs font-mono font-bold transition-all shadow-sm"
              title="Abrir Guia do Jogo"
            >
              <BookOpen size={14} className="text-blood-bright" />
              <span className="hidden sm:inline">GUIA</span>
            </button>

            <button
              id="btn-lobby-settings"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 min-h-[40px] px-3 rounded border border-gold-aged/80 bg-gold-aged/20 hover:bg-gold-aged/35 text-amber-200 text-xs font-mono font-bold transition-all shadow-sm"
              title="Abrir Configurações da Mesa"
            >
              <Settings size={14} className="text-gold-aged" />
              <span>CONFIGURAÇÕES</span>
            </button>

            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 min-h-[40px] px-3 rounded border border-iron/80 bg-black/60 hover:bg-blood/50 hover:border-blood-bright text-parchment-dark hover:text-white text-xs font-mono transition-colors"
              title="Sair desta sala"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">SAIR</span>
            </button>
          </div>
        </div>

        {/* 2. CORPO DO LOBBY: CONECTADOS (ESQUERDA) + CHAT (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-[320px]">
          {/* COLUNA ESQUERDA: LISTA DE JOGADORES CONECTADOS (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-lg border-2 border-stone-800 bg-black/60 p-3 sm:p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-iron/40 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gold-aged" />
                  <span className="font-grimoire font-extrabold text-sm tracking-wider text-parchment">
                    JOGADORES NA MESA
                  </span>
                  <span className="text-[11px] font-mono text-parchment-dark">
                    ({players.length}/{maxPlayers} · mínimo: {minPlayers})
                  </span>
                </div>

                {isHost && players.length < maxPlayers && (
                  <button
                    onClick={onAddBot}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-iron/80 bg-black/50 hover:bg-gold-aged/20 hover:border-gold-aged text-parchment hover:text-gold-aged text-[11px] font-mono font-bold transition-colors"
                    title="Adicionar bot à sala"
                  >
                    <Plus size={12} /> Adicionar Bot
                  </button>
                )}
              </div>

              {/* Grid de assentos de jogadores conectados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {players.map((p) => {
                  const isPlayerHost = p.id === roomState.hostId;
                  const isMe = p.id === me?.id;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded border transition-all',
                        isMe
                          ? 'border-gold-aged bg-gold-aged/10 text-parchment shadow-sm'
                          : 'border-iron/60 bg-wood-dark/70 text-parchment-light'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div
                          className={cn(
                            'w-7 h-7 rounded flex items-center justify-center shrink-0 border',
                            p.isBot
                              ? 'border-stone-700 bg-stone-900 text-stone-300'
                              : isPlayerHost
                                ? 'border-gold-aged/80 bg-gold-aged/20 text-amber-300'
                                : 'border-iron bg-black/60 text-parchment'
                          )}
                        >
                          {p.isBot ? <Bot size={15} /> : isPlayerHost ? <Crown size={15} /> : <User size={15} />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-typewriter text-xs font-bold truncate">{p.name}</div>
                          <div className="flex items-center gap-1 font-mono text-[9px] text-parchment-dark">
                            {isPlayerHost && <span className="text-amber-300 font-bold">LÍDER</span>}
                            {isPlayerHost && (isMe || p.isBot) && <span>·</span>}
                            {isMe && <span className="text-gold-aged font-bold">VOCÊ</span>}
                            {p.isBot && <span className="text-stone-400">BOT</span>}
                          </div>
                        </div>
                      </div>

                      {/* Botão de expulsar / remover bot (apenas host) */}
                      {isHost && !isMe && (
                        <button
                          onClick={() => (p.isBot ? onRemoveBot(p.id) : onKickPlayer(p.id))}
                          className="shrink-0 p-1 text-stone-500 hover:text-red-400 hover:bg-blood/20 rounded transition-colors"
                          title={p.isBot ? 'Remover bot' : 'Expulsar jogador'}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botão INICIAR PARTIDA / Alerta */}
            <div className="pt-2 border-t border-iron/40 space-y-2">
              {isHost ? (
                <>
                  <button
                    id="btn-start-game"
                    onClick={onStartGame}
                    disabled={!canStart}
                    className="w-full flex items-center justify-center gap-2 min-h-[48px] py-2.5 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood disabled:opacity-40 disabled:hover:bg-blood/80 text-parchment font-grimoire font-extrabold tracking-widest text-sm sm:text-base shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-[0.99]"
                  >
                    <Play size={18} /> INICIAR PARTIDA
                  </button>
                  {!canStart && (
                    <div className="flex items-center justify-center gap-1.5 text-center text-[11px] font-mono text-amber-300 bg-black/60 py-1.5 px-3 rounded border border-amber-800/50">
                      <ShieldAlert size={14} className="shrink-0 text-amber-400" />
                      Mínimo de {minPlayers} jogadores para iniciar. Adicione bots ou convide amigos!
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2 px-3 rounded border border-iron/60 bg-black/60 font-mono text-xs text-parchment-dark flex items-center justify-center gap-2">
                  <Crown size={14} className="text-amber-400 animate-pulse" />
                  Aguardando o líder iniciar a partida...
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: CHAT DO LOBBY (5 cols) */}
          <div className="lg:col-span-5 flex flex-col rounded-lg border-2 border-stone-800 bg-black/75 overflow-hidden">
            <div className="px-3 py-2 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between">
              <span className="font-grimoire font-extrabold text-xs tracking-wider text-parchment flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-400" /> CHAT DO LOBBY
              </span>
              <span className="text-[10px] font-mono text-stone-500">Ao vivo</span>
            </div>

            {/* Lista de mensagens do Chat */}
            <div
              ref={chatBottomRef}
              className="flex-1 p-2.5 overflow-y-auto space-y-1.5 font-mono text-xs max-h-[260px] min-h-[160px] scrollbar-thin select-text"
            >
              {chatLogs.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-[11px] italic font-mono">
                  Nenhuma mensagem ainda no lobby. Converse com os outros jogadores!
                </div>
              ) : (
                chatLogs.map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      'text-[11px] tracking-wide break-words py-0.5 transition-colors',
                      LOG_STYLES[l.type] || 'text-parchment pl-2'
                    )}
                  >
                    {l.text}
                  </div>
                ))
              )}
            </div>

            {/* Input de envio do Chat */}
            <form onSubmit={handleSend} className="p-2 border-t border-stone-800 bg-stone-900/80 flex items-center gap-1.5">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                maxLength={140}
                placeholder="Falar no lobby..."
                className="flex-1 min-h-[36px] bg-black/80 border border-stone-700 rounded px-2.5 py-1 font-typewriter text-xs text-parchment placeholder:text-stone-500 outline-none focus:border-gold-aged transition-colors"
              />
              <button
                type="submit"
                disabled={!chatText.trim()}
                onClick={() => audio.play('click')}
                className={cn(
                  'min-h-[36px] min-w-[36px] flex items-center justify-center rounded border font-mono text-xs transition-all active:scale-95',
                  chatText.trim()
                    ? 'border-gold-aged bg-blood/80 text-parchment hover:bg-blood shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                    : 'border-stone-800 bg-stone-900/40 text-stone-600 cursor-not-allowed'
                )}
                title="Enviar mensagem"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
