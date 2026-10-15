import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { LOG_STYLES } from '../lib/constants';

function LogList({ logs, id, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);

  return (
    <div ref={ref} id={id} className={cn('overflow-y-auto font-mono leading-snug space-y-0.5', className)}>
      {logs.map((l) => (
        <div key={l.id} className={cn(LOG_STYLES[l.type] || 'text-parchment')}>
          <span className="opacity-50">R{l.round} </span>
          {l.text}
        </div>
      ))}
    </div>
  );
}

/* Painel fixo no canto da mesa (desktop / tablet) */
export default function LogPanel({ logs }) {
  return (
    <div className="absolute bottom-3 left-3 z-40 w-[min(22rem,26vw)] min-w-[220px] h-[190px] flex flex-col rounded border-2 border-iron/70 bg-black/70 backdrop-blur-sm">
      <div className="px-2 py-1 border-b border-iron/60 font-grimoire font-extrabold text-[11px] tracking-widest text-gold-aged">
        CRÔNICA DA MESA (LOGS)
      </div>
      <LogList logs={logs} id="log-panel" className="flex-1 px-2 py-1 text-[10.5px]" />
    </div>
  );
}

/* Gaveta inferior (mobile): abre sob demanda para não roubar espaço da mesa */
export function LogDrawer({ open, onClose, logs }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="log-drawer"
          className="fixed inset-0 z-[160] flex items-end bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            id="log-drawer"
            className="w-full h-[min(58dvh,460px)] flex flex-col rounded-t-xl border-t-2 border-x-2 border-iron/80 bg-stone-950/95 pb-safe"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-iron/60">
              <span className="font-grimoire font-extrabold text-xs tracking-widest text-gold-aged">
                CRÔNICA DA MESA (LOGS)
              </span>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded border border-iron/70 text-parchment-dark active:bg-blood/40"
                aria-label="Fechar logs"
              >
                <X size={16} />
              </button>
            </div>
            <LogList logs={logs} id="log-panel" className="flex-1 px-3 py-2 text-xs" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
