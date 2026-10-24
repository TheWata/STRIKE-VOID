import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  MessageSquare,
  Swords,
  PenTool,
  Ghost,
  BookOpen,
  Layers,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { audio } from '../lib/audio';
import CardGrimoireBook from './CardGrimoireBook';

/**
 * Registros formatados com tinta autêntica sobre a folha pautada amarelada do caderno.
 */
function YellowNotebookLogList({ logs, filter, id }) {
  const scrollRef = useRef(null);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'chat') return l.type === 'CHAT' || l.type === 'CHAT_DEAD';
    if (filter === 'combat')
      return l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM';
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
      className="overflow-y-auto max-h-[260px] sm:max-h-[300px] min-h-[210px] py-2.5 pr-3 pl-2 sm:pl-3 font-typewriter text-[12px] leading-[28px] space-y-1 select-text scrollbar-thin"
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

          let inkStyle = 'text-[#2a1b12]';
          let tagBg = 'bg-[#e2d0ab]/70 text-[#2c1d13] border-[#9c8462]';

          if (isDeadChat) {
            inkStyle = 'text-[#4c1d95] italic font-semibold';
            tagBg = 'bg-purple-200/80 text-purple-900 border-purple-400';
          } else if (isChat) {
            inkStyle = 'text-[#1a1108] font-bold';
            tagBg = 'bg-amber-200/80 text-amber-950 border-amber-600';
          } else if (l.type === 'DAMAGE' || l.type === 'DEATH' || l.type === 'PACT') {
            inkStyle = 'text-[#881337] font-semibold';
            tagBg = 'bg-rose-200/90 text-rose-950 border-rose-500';
          } else if (l.type === 'WALL' || l.type === 'BREAK') {
            inkStyle = 'text-[#1e3a8a] font-semibold';
            tagBg = 'bg-blue-200/80 text-blue-950 border-blue-500';
          } else if (l.type === 'VACUUM' || l.type === 'REFLECT' || l.type === 'STEAL') {
            inkStyle = 'text-[#701a75] font-semibold';
            tagBg = 'bg-fuchsia-200/80 text-fuchsia-950 border-fuchsia-500';
          } else if (l.type === 'SOUL' || l.type === 'HEAL') {
            inkStyle = 'text-[#115e59] font-semibold';
            tagBg = 'bg-teal-200/80 text-teal-950 border-teal-600';
          } else if (l.type === 'CURSE') {
            inkStyle = 'text-[#365314] font-bold';
            tagBg = 'bg-lime-200/90 text-lime-950 border-lime-600';
          } else if (l.type === 'DISARM' || l.type === 'REVEAL') {
            inkStyle = 'text-[#7c2d12] font-semibold';
            tagBg = 'bg-orange-200/80 text-orange-950 border-orange-500';
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
function NotebookChatInput({ onSendChat, isDead, onFocusChange }) {
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
      className="flex items-center gap-2 p-2.5 sm:p-3 bg-gradient-to-r from-[#ebdcb9] via-[#e5d4ad] to-[#ebdcb9] border-t-2 border-[#b89f78] shadow-inner"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          maxLength={140}
          placeholder={
            isDead
              ? '💀 Sussurrar do além com tinta espectral...'
              : '✍️ Rabiscar bilhete clandestino a tinta no caderno...'
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
 * O Caderno de Anotações Clandestinas e Chat escondido sob a mesa 3D.
 * Acessado ao mover o mouse para a parte inferior da tela (ou pelo botão de câmera).
 */
export default function UnderTableChat({
  logs = [],
  onSendChat,
  isDead = false,
  canAct = false,
  phase = 'PLANNING',
  onScrollToTable,
  onFocusChange,
  className,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'chat' | 'combat'
  const [underTableView, setUnderTableView] = useState('both'); // 'both' | 'book' | 'chat'
  const prevChatCountRef = useRef(null);
  const justSentRef = useRef(false);

  const chatLogs = logs.filter((l) => l.type === 'CHAT' || l.type === 'CHAT_DEAD');
  const chatCount = chatLogs.length;
  const combatCount = logs.filter(
    (l) => l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM'
  ).length;

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

  const showBook = underTableView === 'both' || underTableView === 'book';
  const showChat = underTableView === 'both' || underTableView === 'chat';

  return (
    <section
      id="under-table-chat"
      className={cn(
        'w-full max-w-[1380px] mx-auto shrink-0 flex flex-col relative select-text px-1 sm:px-2',
        className
      )}
    >
      {/* Barra de alternância rápida sob a mesa: Livro + Chat juntos ou foco individual */}
      <div className="flex flex-wrap items-center justify-between gap-2 mx-2 mb-2 px-3 py-1.5 rounded-lg bg-black/85 border border-gold-aged/50 shadow-lg">
        <div className="flex items-center gap-1.5 font-grimoire text-xs font-bold text-amber-200 tracking-wider">
          <BookOpen size={14} className="text-gold-aged" />
          <span>EMBAIXO DA MESA: LIVRO DE CARTAS & CADERNO DE CHAT</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              audio.play('select');
              setUnderTableView('both');
            }}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all',
              underTableView === 'both'
                ? 'bg-gold-aged text-black border-gold-aged shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                : 'bg-stone-900/90 text-amber-200/80 border-stone-700 hover:border-gold-aged/60'
            )}
          >
            📖 LIVRO + 📓 CHAT
          </button>
          <button
            type="button"
            onClick={() => {
              audio.play('select');
              setUnderTableView('book');
            }}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1',
              underTableView === 'book'
                ? 'bg-gold-aged text-black border-gold-aged shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                : 'bg-stone-900/90 text-amber-200/80 border-stone-700 hover:border-gold-aged/60'
            )}
          >
            <Layers size={11} />
            <span>SÓ LIVRO DE CARTAS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              audio.play('select');
              setUnderTableView('chat');
            }}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1',
              underTableView === 'chat'
                ? 'bg-gold-aged text-black border-gold-aged shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                : 'bg-stone-900/90 text-amber-200/80 border-stone-700 hover:border-gold-aged/60'
            )}
          >
            <MessageSquare size={11} />
            <span>SÓ CHAT ({chatCount})</span>
          </button>
        </div>
      </div>

      {/* Lembrete de vez anexado ao topo do caderno */}
      {canAct && phase === 'PLANNING' && (
        <div className="relative z-20 mx-2 mb-2 px-3 py-1.5 rounded bg-gradient-to-r from-red-900 via-blood to-red-950 border-2 border-[#d4af37] text-white flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.8)] animate-pulse">
          <div className="flex items-center gap-2 font-typewriter text-xs font-bold text-amber-100">
            <span>📎</span>
            <span>SUA VEZ DE JOGAR! SUBA O OLHAR PARA AS CARTAS!</span>
          </div>
          {onScrollToTable && (
            <button
              onClick={() => {
                audio.play('click');
                onScrollToTable();
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-black/85 border border-gold-aged text-gold-aged font-mono font-bold text-[11px] hover:bg-gold-aged/20 active:scale-95 shadow-sm"
            >
              <ArrowUp size={12} />
              <span>OLHAR CARTAS</span>
            </button>
          )}
        </div>
      )}

      {/* BANCADA SOB A MESA: LIVRO DE CARTAS (GRIMÓRIO) + CADERNO DE ANOTAÇÕES & CHAT */}
      <div
        className={cn(
          'grid grid-cols-1 gap-3 items-start mx-1 sm:mx-2',
          underTableView === 'both' && 'xl:grid-cols-12'
        )}
      >
        {/* 1. O LIVRO DE CARTAS (Mostra todas as cartas numa grade + o que cada carta faz) */}
        {showBook && (
          <div className={cn(underTableView === 'both' ? 'xl:col-span-7' : 'w-full')}>
            <CardGrimoireBook />
          </div>
        )}

        {/* 2. O CADERNO DE ANOTAÇÕES VELHO 3D & CHAT */}
        {showChat && (
          <div
            className={cn(
              'relative',
              underTableView === 'both' ? 'xl:col-span-5' : 'w-full max-w-3xl mx-auto'
            )}
          >
            <div className="rounded-xl overflow-hidden shadow-[0_24px_65px_rgba(0,0,0,0.98),0_0_0_2px_rgba(69,43,25,0.9)] border-2 border-[#452b19]">
              {/* TOPO: Espiral de arame metálico 3D ligando as folhas amareladas */}
              <div className="relative z-20 bg-gradient-to-b from-[#2b1b11] via-[#1f130b] to-[#160d07] px-3 pt-2.5 pb-1.5 border-b border-[#3d2716] shadow-md">
                <div className="flex justify-around items-center px-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                    <div key={n} className="flex flex-col items-center">
                      <div className="w-2.5 h-5 rounded-full bg-gradient-to-r from-[#948168] via-[#e2d5c3] to-[#423321] shadow-[0_4px_6px_rgba(0,0,0,0.9)] border border-[#261b11] -mb-2 z-10" />
                      <div className="w-3 h-2 rounded-full bg-[#120a05] border border-[#382314] shadow-inner" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#352012]/80">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#cbb892]" />
                    <span className="font-grimoire font-black tracking-widest text-[#d8c39e] text-xs">
                      CADERNO DE ANOTAÇÕES & CHAT SOB A MESA
                    </span>
                  </div>

                  {onScrollToTable && (
                    <button
                      id="btn-notebook-back-to-table"
                      onClick={() => {
                        audio.play('click');
                        onScrollToTable();
                      }}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-gradient-to-r from-blood to-red-950 border border-gold-aged text-[#f4ebd9] font-mono text-[10px] font-bold shadow active:scale-95 transition-all"
                      title="Fechar caderno e voltar o olhar para as cartas na mesa"
                    >
                      <ArrowUp size={12} />
                      <span>OLHAR P/ CARTAS ↑</span>
                    </button>
                  )}
                </div>
              </div>

              {/* MARCADORES DE PÁGINA (Abas tipo post-it) */}
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
                  <span>CHAT & BILHETES ({chatCount})</span>
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
                  <span>CRÔNICA DE GOLPES ({combatCount})</span>
                </button>
              </div>

              {/* FOLHA AMARELADA PAUTADA */}
              <div
                className="relative bg-[#f4e8cb] shadow-[inset_0_0_40px_rgba(160,130,80,0.35)]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(transparent, transparent 27px, rgba(120, 145, 180, 0.38) 28px)',
                }}
              >
                <div className="absolute top-8 right-4 w-20 h-20 rounded-full border border-[#c4ab7e]/40 pointer-events-none opacity-40 -rotate-12" />
                <div className="absolute top-0 bottom-0 left-7 sm:left-8 w-[1.5px] bg-[#d96666]/60 pointer-events-none" />
                <div className="absolute top-10 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />
                <div className="absolute top-1/2 -translate-y-1/2 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />
                <div className="absolute bottom-10 left-2 w-2.5 h-2.5 rounded-full bg-[#1b1008] border border-[#a89069] shadow-inner pointer-events-none" />

                <div className="ml-7 sm:ml-8">
                  <YellowNotebookLogList logs={logs} filter={filter} id="notebook-logs-list" />
                </div>
              </div>

              {/* ÁREA DE ESCRITA A CANETA */}
              <NotebookChatInput
                onSendChat={handleSendChatWithSound}
                isDead={isDead}
                onFocusChange={onFocusChange}
              />
            </div>

            <div className="h-2.5 bg-[#dfcfaf] rounded-b border-x-2 border-b-2 border-[#8f7956] shadow-[2px_2px_0px_#caa877,4px_4px_0px_#ab8b5e,0_8px_20px_rgba(0,0,0,0.8)] -mt-1 mx-1" />
          </div>
        )}
      </div>
    </section>
  );
}
