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
import { LOG_STYLES } from '../lib/constants';
import { audio } from '../lib/audio';

/** Lista formatada como páginas pautadas de um caderno de anotações antigo */
function NotebookLogList({ logs, filter, id }) {
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
      className="overflow-y-auto max-h-[380px] min-h-[300px] p-3 pl-8 sm:pl-10 font-typewriter text-xs leading-relaxed space-y-2 select-text scrollbar-thin"
    >
      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-stone-500 text-xs italic font-typewriter">
          {filter === 'chat'
            ? 'Nenhum bilhete rabiscado ainda. Passe um recado sob a mesa...'
            : 'Páginas em branco. Nenhum acontecimento registrado ainda.'}
        </div>
      ) : (
        filteredLogs.map((l) => {
          const isChat = l.type === 'CHAT' || l.type === 'CHAT_DEAD';
          const isDeadChat = l.type === 'CHAT_DEAD';

          return (
            <div
              key={l.id}
              className={cn(
                'relative pl-2.5 py-1 text-xs break-words rounded transition-colors',
                isDeadChat
                  ? 'text-purple-300 italic bg-purple-950/25 border-l-2 border-purple-500/80 shadow-sm'
                  : isChat
                    ? 'text-amber-200 font-medium bg-[#1d140d]/60 border-l-2 border-gold-aged/70'
                    : LOG_STYLES[l.type] || 'text-parchment border-l-2 border-stone-600 pl-2'
              )}
            >
              {!isChat && (
                <span className="opacity-60 text-[10px] font-mono mr-1.5 font-bold uppercase tracking-wider">
                  [R{l.round}]
                </span>
              )}
              {isDeadChat && <Ghost size={12} className="inline mr-1 text-purple-400" />}
              {l.text}
            </div>
          );
        })
      )}
    </div>
  );
}

/** Input estilizado como anotação a caneta/tinteiro */
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
      className="flex items-center gap-2 p-2.5 bg-[#170f09] border-t-2 border-[#382415] shrink-0"
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
              : '✍️ Rabiscar bilhete clandestino sob a mesa...'
          }
          className={cn(
            'w-full min-h-[38px] px-3 py-1.5 rounded bg-[#100a06] border font-typewriter text-xs text-amber-100 placeholder:text-stone-500 outline-none transition-colors shadow-inner',
            isDead
              ? 'border-purple-600/70 focus:border-purple-400 focus:shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'border-[#4a3220] focus:border-gold-aged focus:shadow-[0_0_10px_rgba(212,175,55,0.25)]'
          )}
        />
        {isDead && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
            <Ghost size={15} />
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className={cn(
          'min-h-[38px] px-3.5 flex items-center justify-center gap-1.5 rounded border font-mono text-xs font-bold transition-all active:scale-95 shadow-sm',
          text.trim()
            ? isDead
              ? 'border-purple-500 bg-purple-900/70 text-purple-200 hover:bg-purple-800 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'border-gold-aged bg-gradient-to-r from-blood/90 to-amber-900/90 text-parchment hover:bg-blood shadow-[0_0_12px_rgba(212,175,55,0.3)]'
            : 'border-stone-800 bg-stone-900/40 text-stone-600 cursor-not-allowed'
        )}
        title="Enviar anotação clandestina [Enter]"
        aria-label="Enviar mensagem"
      >
        <PenTool size={13} className="shrink-0" />
        <span className="hidden xs:inline">RABISCAR</span>
      </button>
    </form>
  );
}

/**
 * UnderTableChat: Caderno de anotações velho exclusivo para celular.
 * Mostra o chat e as ações logo abaixo das cartas ao rolar a página para baixo.
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

  const chatCount = logs.filter((l) => l.type === 'CHAT' || l.type === 'CHAT_DEAD').length;
  const combatCount = logs.filter((l) => l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM').length;

  return (
    <section
      id="under-table-chat"
      className="sm:hidden w-full shrink-0 flex flex-col relative pb-safe bg-[#0d0704] text-parchment select-text"
    >
      {/* 1. TRANSIÇÃO: A Espiadela Embaixo da Madeira */}
      <div className="w-full bg-[#160d07] px-3 py-1.5 border-t-4 border-[#301c10] shadow-[inset_0_12px_20px_rgba(0,0,0,0.9)] flex items-center justify-between text-[11px] font-mono text-stone-400">
        <span className="flex items-center gap-1.5 text-amber-200/90 font-bold">
          <span>🪵 SOB A MESA CERIMONIAL</span>
        </span>
        <span className="text-[10px] text-stone-500 italic">"caderno de notas clandestinas"</span>
      </div>

      {/* 2. ALERTA DE VEZ: Bilhete urgente anexado ao caderno quando for hora de jogar */}
      {canAct && phase === 'PLANNING' && (
        <div className="relative z-20 mx-2 mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-950 via-blood/90 to-red-950 border-2 border-gold-aged flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">
          <div className="flex items-center gap-1.5 font-typewriter text-xs font-bold text-amber-100">
            <AlertCircle size={15} className="text-gold-aged shrink-0" />
            <span>SUA VEZ DE AGIR! COLOQUE SUA CARTA!</span>
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
              <span>SUBIR À MESA</span>
            </button>
          )}
        </div>
      )}

      {/* 3. O CADERNO VELHO (Encadernação, argolas e capa de couro desgastado) */}
      <div className="mx-2 my-2.5 rounded-xl border-4 border-[#382315] bg-[#1a110a] shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        {/* Espiral / Argolas do topo do caderno */}
        <div className="flex justify-between items-center px-4 py-1.5 bg-[#25180f] border-b-2 border-[#120a05] shadow-inner select-none">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-gold-aged" />
            <span className="font-grimoire font-extrabold text-xs tracking-wider text-amber-200">
              DIÁRIO DE ANOTAÇÕES
            </span>
          </div>

          {/* Furos e Argolas Metálicas do Caderno */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2 h-4 rounded-full bg-gradient-to-b from-[#8c7457] via-[#4a3a2a] to-[#1a120b] border border-[#26170d] shadow-sm"
              />
            ))}
          </div>

          {/* Botão de Fechar Caderno / Subir para a Mesa */}
          {onScrollToTable && (
            <button
              id="btn-notebook-back-to-table"
              onClick={() => {
                audio.play('click');
                onScrollToTable();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 border border-gold-aged/80 text-gold-aged font-mono text-[10px] font-bold hover:bg-gold-aged/20 active:scale-95 transition-all shadow-sm"
              title="Voltar para a mesa de cartas"
            >
              <ArrowUp size={12} />
              <span>SUBIR</span>
            </button>
          )}
        </div>

        {/* Abas do Caderno (Marcadores de página tipo post-it rústicos) */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 bg-[#1e130c] border-b border-[#301c10] overflow-x-auto select-none">
          <button
            onClick={() => {
              audio.play('select');
              setFilter('all');
            }}
            className={cn(
              'px-2.5 py-1 rounded-t-md text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2',
              filter === 'all'
                ? 'bg-[#18110b] text-amber-200 border-gold-aged shadow-sm'
                : 'bg-black/50 text-stone-400 border-stone-800 hover:text-parchment'
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
              'px-2.5 py-1 rounded-t-md text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2 flex items-center gap-1',
              filter === 'chat'
                ? 'bg-[#18110b] text-emerald-300 border-emerald-500 shadow-sm'
                : 'bg-black/50 text-stone-400 border-stone-800 hover:text-emerald-300'
            )}
          >
            <MessageSquare size={11} />
            <span>BILHETES ({chatCount})</span>
          </button>

          <button
            onClick={() => {
              audio.play('select');
              setFilter('combat');
            }}
            className={cn(
              'px-2.5 py-1 rounded-t-md text-[11px] font-typewriter font-bold transition-all border-t-2 border-x-2 flex items-center gap-1',
              filter === 'combat'
                ? 'bg-[#18110b] text-red-300 border-blood-bright shadow-sm'
                : 'bg-black/50 text-stone-400 border-stone-800 hover:text-red-300'
            )}
          >
            <Swords size={11} />
            <span>GOLPES ({combatCount})</span>
          </button>
        </div>

        {/* 4. A FOLHA PAUTADA (Textura de papel envelhecido com pautas e margem vermelha) */}
        <div
          className="relative flex-1 bg-[#18110b] shadow-[inset_0_0_30px_rgba(0,0,0,0.85)]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent 27px, rgba(212, 175, 55, 0.08) 28px)',
          }}
        >
          {/* Linha de margem vermelha de caderno escolar antigo */}
          <div className="absolute top-0 bottom-0 left-6 sm:left-7 w-[1.5px] bg-red-800/40 pointer-events-none" />

          {/* Furos de fichário na margem esquerda */}
          <div className="absolute top-8 left-2 w-2.5 h-2.5 rounded-full bg-[#0a0604] border border-[#3e2717] shadow-inner pointer-events-none" />
          <div className="absolute top-1/2 -translate-y-1/2 left-2 w-2.5 h-2.5 rounded-full bg-[#0a0604] border border-[#3e2717] shadow-inner pointer-events-none" />
          <div className="absolute bottom-8 left-2 w-2.5 h-2.5 rounded-full bg-[#0a0604] border border-[#3e2717] shadow-inner pointer-events-none" />

          {/* Conteúdo das mensagens e acontecimentos */}
          <NotebookLogList logs={logs} filter={filter} id="notebook-logs-list" />
        </div>

        {/* 5. ÁREA DE ESCRITA A CANETA / TINTEIRO */}
        <NotebookChatInput onSendChat={onSendChat} isDead={isDead} />
      </div>
    </section>
  );
}
