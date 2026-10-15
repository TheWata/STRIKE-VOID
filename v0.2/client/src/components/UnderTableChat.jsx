import React, { useState } from 'react';
import { ArrowUp, MessageSquare, Swords, ScrollText, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';
import { LogList, ChatInput } from './LogPanel';
import { audio } from '../lib/audio';

export default function UnderTableChat({
  logs = [],
  onSendChat,
  isDead = false,
  canAct = false,
  phase = 'PLANNING',
  onScrollToTable,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'chat' | 'combat'

  const chatCount = logs.filter((l) => l.type === 'CHAT' || l.type === 'CHAT_DEAD').length;
  const combatCount = logs.filter((l) => l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM').length;

  return (
    <section
      id="under-table-chat"
      className="w-full shrink-0 flex flex-col border-t-4 border-[#3a2616] bg-gradient-to-b from-[#180e08] via-[#100905] to-[#080402] shadow-[inset_0_24px_36px_rgba(0,0,0,0.95)] relative text-parchment pb-safe"
    >
      {/* Textura sutil de vigas de madeira na parte de baixo da mesa */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(90deg,#000_0_2px,transparent_2px_40px)]" />

      {/* Alerta quando é a vez de jogar e o jogador está olhando embaixo da mesa */}
      {canAct && phase === 'PLANNING' && (
        <div className="relative z-10 px-3 py-2 bg-gradient-to-r from-amber-950 via-blood/80 to-amber-950 border-b border-gold-aged/80 flex items-center justify-between gap-2 shadow-md animate-pulse">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-200">
            <AlertCircle size={15} className="text-gold-aged shrink-0" />
            <span>SUA VEZ DE AGIR NESTA RODADA!</span>
          </div>
          {onScrollToTable && (
            <button
              onClick={() => {
                audio.play('click');
                onScrollToTable();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/80 border border-gold-aged text-gold-aged font-mono font-bold text-[11px] hover:bg-gold-aged/20 active:scale-95"
            >
              <ArrowUp size={12} />
              <span>SUBIR À MESA</span>
            </button>
          )}
        </div>
      )}

      {/* Barra de título e controles de "Embaixo da Mesa" */}
      <div className="relative z-10 px-3 py-2.5 border-b border-stone-800/90 bg-black/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="font-grimoire font-extrabold text-xs sm:text-sm tracking-wider text-amber-200 flex items-center gap-1.5">
            <span>🪵 EMBAIXO DA MESA</span>
          </div>
          <span className="hidden sm:inline text-stone-500 font-mono text-[10px]">
            (Sussurros & Registros da Partida)
          </span>
        </div>

        {/* Abas de Filtro */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              audio.play('select');
              setFilter('all');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold transition-all',
              filter === 'all'
                ? 'bg-gold-aged/25 text-amber-200 border border-gold-aged/60 shadow-sm'
                : 'text-stone-400 hover:text-parchment'
            )}
          >
            TODOS ({logs.length})
          </button>

          <button
            onClick={() => {
              audio.play('select');
              setFilter('chat');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1',
              filter === 'chat'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/60 shadow-sm'
                : 'text-stone-400 hover:text-emerald-300'
            )}
          >
            <MessageSquare size={11} />
            <span>CHAT ({chatCount})</span>
          </button>

          <button
            onClick={() => {
              audio.play('select');
              setFilter('combat');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1',
              filter === 'combat'
                ? 'bg-blood/40 text-red-300 border border-blood-bright/60 shadow-sm'
                : 'text-stone-400 hover:text-red-300'
            )}
          >
            <Swords size={11} />
            <span>COMBATE ({combatCount})</span>
          </button>
        </div>

        {/* Botão para subir de volta à mesa */}
        {onScrollToTable && (
          <button
            id="btn-back-to-table"
            onClick={() => {
              audio.play('click');
              onScrollToTable();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-stone-600 bg-stone-900/90 text-amber-200 hover:text-white hover:border-gold-aged font-mono text-xs font-bold transition-all active:scale-95 shadow-sm ml-auto"
            title="Voltar para a mesa de jogo"
          >
            <ArrowUp size={13} />
            <span>SUBIR À MESA</span>
          </button>
        )}
      </div>

      {/* Lista de Registros com Alta Legibilidade */}
      <div className="relative z-10 flex-1 min-h-[320px] max-h-[460px] flex flex-col bg-black/40">
        <LogList logs={logs} filter={filter} id="under-table-logs-list" className="flex-1 px-3 py-2 text-xs" />
      </div>

      {/* Formulário de Envio de Chat */}
      <div className="relative z-10">
        <ChatInput onSendChat={onSendChat} isDead={isDead} />
      </div>
    </section>
  );
}
