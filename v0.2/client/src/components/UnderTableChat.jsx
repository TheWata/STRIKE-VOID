import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  MessageSquare,
  Swords,
  ScrollText,
  AlertCircle,
  PenTool,
  Send,
  Ghost,
  BookOpen,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';

/**
 * Registros formatados com tinta autêntica (tinteiro, grafite e carimbo)
 * sobre a folha pautada amarelada de um caderno antigo.
 */
function YellowNotebookLogList({ logs, filter, id }) {
  const scrollRef = useRef(null);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'chat') return l.type === 'CHAT' || l.type === 'CHAT_DEAD';
    if (filter === 'combat') return l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM';
    return true;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  return (
    <div
      ref={scrollRef}
      id={id}
      className="overflow-y-auto max-h-[390px] min-h-[300px] py-3 pr-3 pl-2 sm:pl-3 font-typewriter text-[12px] leading-[28px] space-y-1 select-text scrollbar-thin"
    >
      {filteredLogs.length === 0 ? (
        <div className="text-center py-10 text-[#8c785b] text-xs italic font-typewriter">
          {filter === 'chat'
            ? '— Nenhuma anotação clandestina ainda. Rabisque um bilhete abaixo... —'
            : '— Folha limpa. Nenhum acontecimento registrado neste caderno ainda. —'}
        </div>
      ) : (
        filteredLogs.map((l) => {
          const isChat = l.type === 'CHAT';
          const isDeadChat = l.type === 'CHAT_DEAD';

          // Tinta sobre papel amarelado autêntico
          let inkStyle = 'text-[#2a1b12]'; // Tinta padrão (sépia escuro)
          let tagBg = 'bg-[#e2d0ab]/70 text-[#2c1d13] border-[#9c8462]';

          if (isDeadChat) {
            inkStyle = 'text-[#4c1d95] italic font-semibold';
            tagBg = 'bg-purple-200/80 text-purple-900 border-purple-400';
          } else if (isChat) {
            inkStyle = 'text-[#1a1108] font-bold';
            tagBg = 'bg-amber-200/80 text-amber-950 border-amber-600';
          } else if (l.type === 'DAMAGE' || l.type === 'DEATH') {
            inkStyle = 'text-[#881337] font-semibold';
            tagBg = 'bg-rose-200/90 text-rose-950 border-rose-500';
          } else if (l.type === 'WALL' || l.type === 'BREAK') {
            inkStyle = 'text-[#1e3a8a] font-semibold';
            tagBg = 'bg-blue-200/80 text-blue-950 border-blue-500';
          } else if (l.type === 'VACUUM' || l.type === 'REFLECT') {
            inkStyle = 'text-[#701a75] font-semibold';
            tagBg = 'bg-fuchsia-200/80 text-fuchsia-950 border-fuchsia-500';
          } else if (l.type === 'SYSTEM') {
            inkStyle = 'text-[#57534e] italic';
            tagBg = 'bg-stone-300/80 text-stone-900 border-stone-500';
          }

          return (
            <div
              key={l.id}
              className={cn(
                'relative pl-2 py-0.5 rounded transition-colors break-words',
                inkStyle
              )}
            >
              {!isChat && !isDeadChat && (
                <span
                  className={cn(
                    'inline-block text-[9.5px] font-mono mr-1.5 px-1 py-0 rounded border font-bold uppercase tracking-wider',
                    tagBg
                  )}
                >
                  R{l.round}
                </span>
              )}
              {isDeadChat && <Ghost size={13} className="inline mr-1 text-[#6b21a8]" />}
              <span>{l.text}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** Formulário estilizado como caneta tinteiro escrevendo na margem do caderno */
function NotebookChatInput({ onSendChat, isDead }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSendChat?.(clean);
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#ebdcb9] via-[#e5d4ad] to-[#ebdcb9] border-t-2 border-[#b89f78] shadow-inner"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          placeholder={
            isDead
              ? '💀 Sussurrar do além com tinta espectral...'
              : '✍️ Rabiscar bilhete clandestino a tinta...'
          }
          className={cn(
            'w-full min-h-[38px] px-3 py-1.5 rounded-sm bg-[#fbf5e6] border-2 font-typewriter text-xs text-[#1e1107] placeholder:text-[#8f7b5f] outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
            isDead
              ? 'border-purple-600 focus:border-purple-700 focus:bg-purple-50/90'
              : 'border-[#9e835e] focus:border-[#523318] focus:bg-white'
          )}
        />
        {isDead && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-700 pointer-events-none">
            <Ghost size={16} />
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className={cn(
          'min-h-[38px] px-3.5 flex items-center justify-center gap-1.5 rounded-sm border-2 font-typewriter text-xs font-bold transition-all active:scale-95 shadow-md',
          text.trim()
            ? isDead
              ? 'border-purple-800 bg-purple-900 text-purple-100 hover:bg-purple-950'
              : 'border-[#4a2e16] bg-gradient-to-b from-[#3a2211] to-[#241308] text-[#f4ebd9] hover:bg-[#1a0c04]'
            : 'border-[#c4b394] bg-[#ded0b6] text-[#9c896d] cursor-not-allowed shadow-none'
        )}
        title="Enviar anotação clandestina [Enter]"
        aria-label="Enviar anotação"
      >
        <PenTool size={13} className="shrink-0" />
        <span>RABISCAR</span>
      </button>
    </form>
  );
}

/**
 * UnderTableChat:
 * Visual autêntico de um Caderno de Anotações Velho com Folhas Amareladas,
 * argolas espirais no topo, pautas de caderno, margem vermelha e efeitos táteis.
 * EXCLUSIVO PARA O CELULAR (sm:hidden).
 * Reproduz som de rabisco no mobile apenas quando jogadores enviam mensagens.
 */
export default function UnderTableChat({
  logs = [],
  onSendChat,
  isDead = false,
  canAct = false,
  phase = 'PLANNING',
  onScrollToTable,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'chat' | 'combat'
  const prevChatCountRef = useRef(null);
  const justSentRef = useRef(false);

  const chatLogs = logs.filter((l) => l.type === 'CHAT' || l.type === 'CHAT_DEAD');
  const chatCount = chatLogs.length;
  const combatCount = logs.filter((l) => l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM').length;

  // Toca o som de rabiscar no papel APENAS quando JOGADORES mandam mensagem
  useEffect(() => {
    if (prevChatCountRef.current !== null && chatCount > prevChatCountRef.current) {
      if (!justSentRef.current) {
        audio.play('scribble');
      }
      justSentRef.current = false;
    }
    prevChatCountRef.current = chatCount;
  }, [chatCount]);

  const handleSendChatWithSound = (clean) => {
    justSentRef.current = true;
    audio.play('scribble');
    onSendChat?.(clean);
  };

  return (
    <section
      id="under-table-chat"
      className="sm:hidden w-full shrink-0 flex flex-col relative pb-safe bg-[#0a0604] select-text"
    >
      {/* 1. O ESPAÇO ESCURO SOB A MESA (Vigas de madeira e sombra do tampo) */}
      <div className="w-full bg-[#120a06] px-3 py-2 border-t-4 border-[#2c1a0e] shadow-[inset_0_16px_28px_rgba(0,0,0,0.95)] flex items-center justify-between text-[11px] font-mono text-stone-400">
        <span className="flex items-center gap-1.5 text-amber-200/90 font-bold">
          <span>🪵 ESCONDIDO SOB A MESA CERIMONIAL</span>
        </span>
        <span className="text-[10px] text-amber-400/80 font-mono tracking-wider">
          CADERNO DE CAMPO
        </span>
      </div>

      {/* 2. LEMBRETE DE VEZ: Bilhete urgente anexado ao topo do caderno com clipe */}
      {canAct && phase === 'PLANNING' && (
        <div className="relative z-20 mx-3 mt-2 px-3 py-2.5 rounded bg-gradient-to-r from-red-900 via-blood to-red-950 border-2 border-[#d4af37] text-white flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.8)] animate-pulse">
          <div className="flex items-center gap-2 font-typewriter text-xs font-bold text-amber-100">
            <span className="text-base">📎</span>
            <span>SUA VEZ DE JOGAR! SUBA PARA A MESA!</span>
          </div>
          {onScrollToTable && (
            <button
              onClick={() => {
                audio.play('click');
                onScrollToTable();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/85 border border-gold-aged text-gold-aged font-mono font-bold text-[11px] hover:bg-gold-aged/20 active:scale-95 shadow-sm"
            >
              <ArrowUp size={12} />
              <span>SUBIR</span>
            </button>
          )}
        </div>
      )}

      {/* 2.1 STATUS DO ALÉM (ESPECTADOR MORTO) */}
      {isDead && (
        <div className="relative z-20 mx-3 mt-2 px-3 py-2 rounded bg-gradient-to-r from-purple-950 via-[#230f35] to-purple-950 border-2 border-purple-500/80 text-purple-200 flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2 font-typewriter text-xs font-semibold text-purple-200">
            <Ghost size={16} className="text-purple-400 shrink-0 animate-pulse" />
            <span>VOCÊ ESTÁ NO ALÉM: SUAS ANOTAÇÕES TÊM TINTA ESPECTRAL</span>
          </div>
          {onScrollToTable && (
            <button
              onClick={() => {
                audio.play('click');
                onScrollToTable();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 border border-purple-400 text-purple-300 font-mono text-[10px] font-bold shrink-0 hover:bg-purple-950/60 active:scale-95"
            >
              <ArrowUp size={11} />
              <span>VER MESA</span>
            </button>
          )}
        </div>
      )}

      {/* 3. O CADERNO DE ANOTAÇÕES VELHO (Físico: Capa de couro, folhas amareladas e espiral 3D) */}
      <div className="mx-2.5 my-3 relative">
        {/* Sombra realista projetada pelo caderno sobre a madeira escura */}
        <div className="rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_0_1px_rgba(40,25,15,0.8)] border-2 border-[#452b19]">
          
          {/* TOPO: Espiral de arame metálico 3D ligando as folhas amareladas */}
          <div className="relative z-20 bg-gradient-to-b from-[#2b1b11] via-[#1f130b] to-[#160d07] px-3 pt-3 pb-2 border-b border-[#3d2716] shadow-md">
            {/* Argolas espirais com furos na folha */}
            <div className="flex justify-around items-center px-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                <div key={n} className="flex flex-col items-center">
                  {/* Fio espiral metálico em arco 3D */}
                  <div className="w-2.5 h-6 rounded-full bg-gradient-to-r from-[#948168] via-[#e2d5c3] to-[#423321] shadow-[0_4px_6px_rgba(0,0,0,0.9)] border border-[#261b11] -mb-2 z-10" />
                  {/* Furo oval recortado no papel */}
                  <div className="w-3 h-2.5 rounded-full bg-[#120a05] border border-[#382314] shadow-inner" />
                </div>
              ))}
            </div>

            {/* Título gravado a ferro quente no topo da capa */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#352012]/80">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#cbb892]" />
                <span className="font-grimoire font-black tracking-widest text-[#d8c39e] text-xs">
                  DIÁRIO DE NOTAS CLANDESTINAS
                </span>
              </div>

              {/* Marcador de fita / Subir para a mesa */}
              {onScrollToTable && (
                <button
                  id="btn-notebook-back-to-table"
                  onClick={() => {
                    audio.play('click');
                    onScrollToTable();
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-gradient-to-r from-blood to-red-950 border border-gold-aged text-[#f4ebd9] font-mono text-[10px] font-bold shadow active:scale-95 transition-all"
                  title="Fechar caderno e voltar para as cartas na mesa"
                >
                  <ArrowUp size={12} />
                  <span>SUBIR À MESA</span>
                </button>
              )}
            </div>
          </div>

          {/* MARCADORES DE PÁGINA (Abas tipo papel post-it presas no topo da folha) */}
          <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 bg-[#23150d] border-b border-[#3d2716] overflow-x-auto select-none">
            <button
              onClick={() => {
                audio.play('select');
                setFilter('all');
              }}
              className={cn(
                'px-3 py-1 rounded-t-sm text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2 shadow-sm',
                filter === 'all'
                  ? 'bg-[#f4e8cb] text-[#1c1208] border-[#9c8462] -mb-[1px] z-10'
                  : 'bg-[#ab9776]/70 text-[#2b1c11] border-[#7d694b] hover:bg-[#c2b090]'
              )}
            >
              📜 TODAS ({logs.length})
            </button>

            <button
              onClick={() => {
                audio.play('select');
                setFilter('chat');
              }}
              className={cn(
                'px-3 py-1 rounded-t-sm text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2 shadow-sm flex items-center gap-1',
                filter === 'chat'
                  ? 'bg-[#f4e8cb] text-[#1c1208] border-amber-600 -mb-[1px] z-10'
                  : 'bg-[#ab9776]/70 text-[#2b1c11] border-[#7d694b] hover:bg-[#c2b090]'
              )}
            >
              <MessageSquare size={11} className="text-amber-800" />
              <span>BILHETES ({chatCount})</span>
            </button>

            <button
              onClick={() => {
                audio.play('select');
                setFilter('combat');
              }}
              className={cn(
                'px-3 py-1 rounded-t-sm text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2 shadow-sm flex items-center gap-1',
                filter === 'combat'
                  ? 'bg-[#f4e8cb] text-[#881337] border-rose-600 -mb-[1px] z-10'
                  : 'bg-[#ab9776]/70 text-[#2b1c11] border-[#7d694b] hover:bg-[#c2b090]'
              )}
            >
              <Swords size={11} className="text-rose-800" />
              <span>GOLPES ({combatCount})</span>
            </button>
          </div>

          {/* 4. A FOLHA AMARELADA REAL (Parchment pautado, margem vermelha e textura) */}
          <div
            className="relative bg-[#f4e8cb] shadow-[inset_0_0_40px_rgba(160,130,80,0.35)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(transparent, transparent 27px, rgba(120, 145, 180, 0.38) 28px)',
            }}
          >
            {/* Mancha d'água / envelhecimento de xícara de café sutil no papel */}
            <div className="absolute top-10 right-4 w-24 h-24 rounded-full border border-[#c4ab7e]/40 pointer-events-none opacity-40 -rotate-12" />

            {/* Linha de Margem Vermelha de caderno escolar antigo */}
            <div className="absolute top-0 bottom-0 left-7 sm:left-8 w-[1.5px] bg-[#d96666]/60 pointer-events-none" />

            {/* Furos de fichário tradicionais na margem esquerda */}
            <div className="absolute top-12 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />
            <div className="absolute bottom-12 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />

            {/* Lista de anotações com tinta sobre a folha amarelada */}
            <div className="ml-7 sm:ml-8">
              <YellowNotebookLogList logs={logs} filter={filter} id="notebook-logs-list" />
            </div>
          </div>

          {/* 5. ÁREA DE ESCRITA A CANETA (Input de chat no pé da página) */}
          <NotebookChatInput onSendChat={handleSendChatWithSound} isDead={isDead} />
        </div>

        {/* 6. PILHA DE PÁGINAS VISÍVEIS (Efeito 3D de espessura de 50 folhas no canto inferior e direito) */}
        <div className="h-2.5 bg-[#dfcfaf] rounded-b border-x-2 border-b-2 border-[#8f7956] shadow-[2px_2px_0px_#caa877,4px_4px_0px_#ab8b5e,0_8px_20px_rgba(0,0,0,0.8)] -mt-1 mx-1" />
      </div>
    </section>
  );
}
