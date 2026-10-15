import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Swords, ScrollText, ChevronDown, ChevronUp, Ghost } from 'lucide-react';
import { cn } from '../lib/cn';
import { LOG_STYLES } from '../lib/constants';
import { audio } from '../lib/audio';

/** Lista formatada de logs com alta legibilidade e contraste */
export function LogList({ logs, filter, id, className }) {
  const ref = useRef(null);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'chat') return l.type === 'CHAT' || l.type === 'CHAT_DEAD';
    if (filter === 'combat') return l.type !== 'CHAT' && l.type !== 'CHAT_DEAD' && l.type !== 'SYSTEM';
    return true;
  });

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        'overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin select-text',
        className
      )}
    >
      {filteredLogs.length === 0 ? (
        <div className="text-center py-6 text-stone-500 text-[10px] italic font-mono">
          {filter === 'chat'
            ? 'Nenhuma mensagem enviada ainda. Quebre o silêncio!'
            : 'Nenhum evento registrado nesta categoria.'}
        </div>
      ) : (
        filteredLogs.map((l) => {
          const isChat = l.type === 'CHAT' || l.type === 'CHAT_DEAD';
          return (
            <div
              key={l.id}
              className={cn(
                'text-[11px] tracking-wide break-words transition-colors',
                LOG_STYLES[l.type] || 'text-parchment pl-2 py-0.5'
              )}
            >
              {!isChat && (
                <span className="opacity-60 text-[9.5px] font-mono mr-1.5 font-bold uppercase">
                  [R{l.round}]
                </span>
              )}
              {l.text}
            </div>
          );
        })
      )}
    </div>
  );
}

/** Formulário de entrada de chat integrado */
export function ChatInput({ onSendChat, isDead }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onSendChat?.(clean);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 p-2 bg-black/90 border-t border-stone-800 shrink-0">
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          placeholder={isDead ? '💀 Falar do além (morto)...' : '💬 Falar com a mesa...'}
          className={cn(
            'w-full min-h-[36px] px-2.5 py-1 rounded bg-[#100b08] border font-typewriter text-xs text-parchment placeholder:text-stone-500 outline-none transition-colors',
            isDead
              ? 'border-purple-600/70 focus:border-purple-400 focus:shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'border-stone-700 focus:border-gold-aged focus:shadow-[0_0_10px_rgba(212,175,55,0.25)]'
          )}
        />
        {isDead && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" title="Você está falando do além">
            <Ghost size={14} />
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className={cn(
          'min-h-[36px] min-w-[36px] flex items-center justify-center rounded border font-mono text-xs transition-all active:scale-95',
          text.trim()
            ? isDead
              ? 'border-purple-500 bg-purple-900/60 text-purple-200 hover:bg-purple-800 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'border-gold-aged bg-blood/80 text-parchment hover:bg-blood shadow-[0_0_10px_rgba(220,38,38,0.4)]'
            : 'border-stone-800 bg-stone-900/50 text-stone-600 cursor-not-allowed'
        )}
        title="Enviar mensagem [Enter]"
        aria-label="Enviar mensagem"
      >
        <Send size={14} />
      </button>
    </form>
  );
}

/* Painel fixo no canto da mesa (Desktop / Tablet) com Abas, Chat e Alta Visibilidade */
export default function LogPanel({ logs = [], onSendChat, isDead = false }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'chat' | 'combat'
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => {
          audio.play('click');
          setMinimized(false);
        }}
        className="absolute bottom-3 left-3 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-stone-700 bg-gradient-to-r from-[#20140c] to-[#120a06] text-amber-200 text-xs font-mono font-bold shadow-[0_4px_15px_rgba(0,0,0,0.8)] hover:border-gold-aged transition-all active:scale-95"
      >
        <ScrollText size={15} className="text-gold-aged" />
        <span>CRÔNICA & CHAT ({logs.length})</span>
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 z-40 w-[min(26rem,30vw)] min-w-[280px] h-[270px] flex flex-col rounded-lg border-2 border-stone-700/80 bg-gradient-to-b from-[#1c120b]/95 via-[#140c07]/95 to-[#0c0704]/98 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(212,175,55,0.15)] overflow-hidden">
      {/* Header do Painel com Abas e Botão Minimizar */}
      <div className="px-2.5 py-1.5 border-b border-stone-800 bg-black/60 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              audio.play('select');
              setFilter('all');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all',
              filter === 'all'
                ? 'bg-gold-aged/25 text-amber-200 border border-gold-aged/60 shadow-sm'
                : 'text-stone-400 hover:text-parchment'
            )}
          >
            TODOS
          </button>

          <button
            onClick={() => {
              audio.play('select');
              setFilter('chat');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1',
              filter === 'chat'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/60 shadow-sm'
                : 'text-stone-400 hover:text-emerald-300'
            )}
          >
            <MessageSquare size={11} /> CHAT
          </button>

          <button
            onClick={() => {
              audio.play('select');
              setFilter('combat');
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1',
              filter === 'combat'
                ? 'bg-blood/40 text-red-300 border border-blood-bright/60 shadow-sm'
                : 'text-stone-400 hover:text-red-300'
            )}
          >
            <Swords size={11} /> COMBATE
          </button>
        </div>

        <button
          onClick={() => {
            audio.play('click');
            setMinimized(true);
          }}
          className="p-1 rounded text-stone-400 hover:text-parchment hover:bg-stone-800/60 transition-colors"
          title="Minimizar painel"
          aria-label="Minimizar painel"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Lista de Registros com Scroll e Alto Contraste */}
      <LogList logs={logs} filter={filter} id="log-panel" className="flex-1 px-2.5 py-2" />

      {/* Caixa de envio de Chat (Mesmo morto) */}
      <ChatInput onSendChat={onSendChat} isDead={isDead} />
    </div>
  );
}

/* Gaveta inferior para smartphones (Mobile Drawer) com Chat e Abas */
export function LogDrawer({ open, onClose, logs = [], onSendChat, isDead = false }) {
  const [filter, setFilter] = useState('all');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="log-drawer"
          className="fixed inset-0 z-[160] flex items-end bg-black/75 backdrop-blur-sm touch-manipulation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            id="log-drawer"
            className="w-full h-[min(65dvh,500px)] flex flex-col rounded-t-2xl border-t-2 border-x-2 border-stone-700 bg-gradient-to-b from-[#22160e] via-[#160d08] to-[#0a0604] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.95)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar da Gaveta Mobile */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-800 bg-black/60 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    audio.play('select');
                    setFilter('all');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all',
                    filter === 'all'
                      ? 'bg-gold-aged/25 text-amber-200 border border-gold-aged/60'
                      : 'text-stone-400 hover:text-parchment'
                  )}
                >
                  TODOS
                </button>

                <button
                  onClick={() => {
                    audio.play('select');
                    setFilter('chat');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1',
                    filter === 'chat'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/60'
                      : 'text-stone-400 hover:text-emerald-300'
                  )}
                >
                  <MessageSquare size={12} /> CHAT
                </button>

                <button
                  onClick={() => {
                    audio.play('select');
                    setFilter('combat');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1',
                    filter === 'combat'
                      ? 'bg-blood/40 text-red-300 border border-blood-bright/60'
                      : 'text-stone-400 hover:text-red-300'
                  )}
                >
                  <Swords size={12} /> COMBATE
                </button>
              </div>

              <button
                onClick={() => {
                  audio.play('click');
                  onClose();
                }}
                className="h-10 w-10 flex items-center justify-center rounded-md border border-stone-700 bg-stone-900/80 text-parchment-dark hover:text-white transition-colors"
                aria-label="Fechar logs"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista com Alta Visibilidade */}
            <LogList logs={logs} filter={filter} id="log-panel-mobile" className="flex-1 px-3 py-2 text-xs" />

            {/* Input de Chat no Mobile (Permitindo conversar mesmo morto) */}
            <ChatInput onSendChat={onSendChat} isDead={isDead} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
