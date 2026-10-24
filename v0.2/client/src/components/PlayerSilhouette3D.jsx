import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InscryptionCard from './InscryptionCard';
import { Skull } from './PlayerSeat';
import { cn } from '../lib/cn';

/**
 * Desenha silhuetas humanas sombrias estilo Inscryption sentadas ao redor da mesa.
 * Cada assento (0..7) possui traços sutis distintos (capuz, cartola, chifres, máscara, correntes, coroa).
 */
function SilhouetteFigure({ variant = 0, isBot, isAlive, isWalled, isReflecting, targetable }) {
  const eyeColor = !isAlive
    ? '#44403c'
    : targetable
      ? '#ef4444'
      : isReflecting
        ? '#e879f9'
        : isWalled
          ? '#38bdf8'
          : isBot
            ? '#f97316'
            : '#fbbf24';

  const rimColor = targetable
    ? '#dc2626'
    : isReflecting
      ? '#c084fc'
      : isWalled
        ? '#38bdf8'
        : 'rgba(212,175,55,0.38)';

  const v = variant % 6;

  return (
    <svg
      viewBox="0 0 120 150"
      className="w-full h-full overflow-visible drop-shadow-[0_14px_22px_rgba(0,0,0,0.95)]"
    >
      <defs>
        <radialGradient id={`aura-${variant}`} cx="50%" cy="38%" r="52%">
          <stop offset="0%" stopColor={eyeColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17100c" />
          <stop offset="65%" stopColor="#0a0604" />
          <stop offset="100%" stopColor="#030201" />
        </linearGradient>
      </defs>

      {/* Halo de luz de vela atrás da silhueta */}
      <ellipse cx="60" cy="64" rx="52" ry="58" fill={`url(#aura-${variant})`} />

      {/* Tronco e ombros da pessoa sentada à mesa */}
      <path
        d="M12 146 C 14 102, 30 84, 60 84 C 90 84, 106 102, 108 146 Z"
        fill={`url(#body-${variant})`}
        stroke={rimColor}
        strokeWidth="1.8"
      />

      {/* Gola / Manto escuro */}
      <path
        d="M32 90 L60 116 L88 90"
        fill="none"
        stroke="rgba(212,175,55,0.22)"
        strokeWidth="1.4"
      />

      {/* Silhueta da Cabeça / Acessório por variante */}
      {v === 0 && (
        /* Capuz de Cultista */
        <path
          d="M34 86 C 30 56, 40 24, 60 16 C 80 24, 90 56, 86 86 Z"
          fill={`url(#body-${variant})`}
          stroke={rimColor}
          strokeWidth="1.8"
        />
      )}
      {v === 1 && (
        /* Cartola Sombria + Cabeça */
        <g>
          <ellipse
            cx="60"
            cy="58"
            rx="21"
            ry="25"
            fill={`url(#body-${variant})`}
            stroke={rimColor}
            strokeWidth="1.6"
          />
          <ellipse cx="60" cy="36" rx="32" ry="5" fill="#090604" stroke={rimColor} strokeWidth="1.5" />
          <path
            d="M42 36 L45 10 L75 10 L78 36 Z"
            fill="#0c0806"
            stroke={rimColor}
            strokeWidth="1.5"
          />
        </g>
      )}
      {v === 2 && (
        /* Condenado com Chifres / Galhos Estilo Leshy */
        <g>
          <path
            d="M40 34 C 24 22, 18 10, 26 4 M32 20 L20 18 M80 34 C 96 22, 102 10, 94 4 M88 20 L100 18"
            fill="none"
            stroke={rimColor}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <ellipse
            cx="60"
            cy="56"
            rx="22"
            ry="26"
            fill={`url(#body-${variant})`}
            stroke={rimColor}
            strokeWidth="1.8"
          />
        </g>
      )}
      {v === 3 && (
        /* Coroa de Espinhos / Rei Condenado */
        <g>
          <ellipse
            cx="60"
            cy="58"
            rx="22"
            ry="25"
            fill={`url(#body-${variant})`}
            stroke={rimColor}
            strokeWidth="1.8"
          />
          <polygon
            points="38,38 43,20 51,33 60,15 69,33 77,20 82,38"
            fill="#140d09"
            stroke="#d4af37"
            strokeWidth="1.4"
          />
        </g>
      )}
      {v === 4 && (
        /* Gola Alta de Inquisidor + Chapéu Largo */
        <g>
          <path
            d="M24 94 L32 62 L88 62 L96 94 Z"
            fill="#0c0806"
            stroke={rimColor}
            strokeWidth="1.4"
          />
          <ellipse
            cx="60"
            cy="56"
            rx="21"
            ry="24"
            fill={`url(#body-${variant})`}
            stroke={rimColor}
            strokeWidth="1.6"
          />
          <ellipse cx="60" cy="34" rx="35" ry="6" fill="#090604" stroke={rimColor} strokeWidth="1.5" />
          <polygon points="44,34 60,12 76,34" fill="#0c0806" stroke={rimColor} strokeWidth="1.5" />
        </g>
      )}
      {v === 5 && (
        /* Silhueta Espectral / Ceifador */
        <g>
          <path
            d="M30 90 C 26 50, 38 18, 60 14 C 82 18, 94 50, 90 90 Z"
            fill={`url(#body-${variant})`}
            stroke={rimColor}
            strokeWidth="1.8"
          />
          <ellipse cx="60" cy="56" rx="16" ry="20" fill="#040201" />
        </g>
      )}

      {/* Olhos Brilhantes na Escuridão */}
      {isAlive ? (
        <g>
          <ellipse
            cx="51"
            cy="56"
            rx="3.8"
            ry="2.3"
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }}
          />
          <ellipse
            cx="69"
            cy="56"
            rx="3.8"
            ry="2.3"
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 6px ${eyeColor})` }}
          />
          <circle cx="51" cy="56" r="1.1" fill="#fff" />
          <circle cx="69" cy="56" r="1.1" fill="#fff" />
        </g>
      ) : (
        /* Olhos apagados em X quando eliminado */
        <g stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round">
          <path d="M47 53 L55 59 M55 53 L47 59" />
          <path d="M65 53 L73 59 M73 53 L65 59" />
        </g>
      )}

      {/* Grades 3D na frente da silhueta quando EMPAREDADO */}
      {isWalled && isAlive && (
        <g opacity="0.92">
          {[24, 42, 60, 78, 96].map((x) => (
            <rect
              key={x}
              x={x - 2}
              y="14"
              width="4"
              height="132"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="0.8"
            />
          ))}
          <path
            d="M16 55 Q 38 48 60 55 T 104 55 M16 105 Q 38 98 60 105 T 104 105"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * Silhueta 3D de um jogador sentado ao redor da mesa octogonal.
 * Fica posicionada em pé no espaço 3D (compensando a inclinação rotateX da mesa).
 */
export default function PlayerSilhouette3D({
  player,
  index,
  isMe,
  targetable,
  dimmed,
  onSeatClick,
  onDropCard,
  allPlayers = [],
}) {
  const [over, setOver] = useState(false);

  const fx = player.visualEffect;
  const shake = fx === 'DAMAGE' || fx === 'VACUUM';
  const knifeDmg = player.knifeDamage || 1;
  const pactPartners = (player.bloodPactWith || [])
    .map((pid) => allPlayers.find((p) => p.id === pid)?.name)
    .filter(Boolean);

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -6, 6, 0], scale: [1, 1.06, 0.96, 1] }
          : { y: [0, -3, 0] }
      }
      transition={
        shake
          ? { duration: 0.55 }
          : { duration: 3.2 + (index % 3) * 0.5, repeat: Infinity, ease: 'easeInOut' }
      }
      onDragOver={(e) => {
        if (!player.isAlive) return;
        e.preventDefault();
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (player.isAlive && onDropCard) onDropCard(player, e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSeatClick) onSeatClick(player);
      }}
      className={cn(
        'relative flex flex-col items-center select-none group transition-all',
        targetable ? 'cursor-crosshair scale-105' : 'cursor-pointer',
        over && 'scale-110',
        !player.isAlive && 'opacity-45 grayscale',
        dimmed && player.isAlive && 'opacity-55'
      )}
    >
      {/* 1. CARTAS REVELADAS (Carta REVELAR) flutuando acima da silhueta */}
      <AnimatePresence>
        {player.isHandRevealed && player.revealedHand && player.isAlive && (
          <motion.div
            key="revealed-hand"
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.8 }}
            className="mb-1 flex flex-col items-center z-40 pointer-events-none"
          >
            <span className="px-1.5 py-0.5 mb-0.5 rounded bg-amber-950/95 border border-amber-400 text-[8px] font-mono font-bold text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)] whitespace-nowrap">
              👁️ MÃO REVELADA
            </span>
            <div className="flex items-center justify-center -space-x-1.5 bg-black/80 p-1 rounded border border-gold-aged/60 shadow-xl">
              {player.revealedHand.length > 0 ? (
                player.revealedHand.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    style={{ transform: `rotate(${(idx - (player.revealedHand.length - 1) / 2) * 6}deg)` }}
                  >
                    <InscryptionCard card={c} mini />
                  </div>
                ))
              ) : (
                <span className="text-[8px] font-mono text-stone-400 px-1.5">Sem cartas</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CORPO DA SILHUETA 3D */}
      <div className="relative w-[86px] h-[106px] sm:w-[114px] sm:h-[138px] flex items-center justify-center">
        <SilhouetteFigure
          variant={index}
          isBot={player.isBot}
          isAlive={player.isAlive}
          isWalled={player.isWalled}
          isReflecting={player.isReflecting}
          targetable={targetable}
        />

        {/* Mira vermelha pulsante quando é alvo válido */}
        {targetable && (
          <svg
            viewBox="0 0 40 40"
            className="absolute inset-0 m-auto w-14 h-14 z-30 pointer-events-none animate-pulse drop-shadow-[0_0_10px_#dc2626]"
          >
            <circle cx="20" cy="20" r="14" fill="none" stroke="#dc2626" strokeWidth="2" />
            <circle cx="20" cy="20" r="3" fill="#dc2626" />
            <path d="M20 2 V10 M20 30 V38 M2 20 H10 M30 20 H38" stroke="#dc2626" strokeWidth="2" />
          </svg>
        )}

        {/* Indicador de jogada travada (Carta pronta na mão da silhueta) */}
        {player.isAlive && player.lockedIn && (
          <div
            className="absolute -right-1 bottom-3 z-20 px-1.5 py-0.5 rounded bg-gold-aged text-black font-mono font-extrabold text-[8px] shadow-[0_0_10px_rgba(212,175,55,0.8)] border border-black"
            title="Jogada travada nesta rodada"
          >
            🔒 PRONTO
          </div>
        )}

        {/* Quantidade de cartas ocultas na mão (se não reveladas) */}
        {player.isAlive && !player.isHandRevealed && !isMe && (
          <div
            className="absolute -left-1 bottom-3 z-20 px-1.5 py-0.5 rounded bg-stone-950/90 border border-gold-aged/60 text-amber-200 font-mono font-bold text-[8px] shadow"
            title={`${player.handCount ?? 0} carta(s) na mão`}
          >
            🃏 {player.handCount ?? 0}
          </div>
        )}
      </div>

      {/* 3. PLACA DE IDENTIFICAÇÃO + BARRA DE VIDA (CAVEIRAS) + STATUS */}
      <div
        className={cn(
          'relative -mt-3 z-30 min-w-[104px] sm:min-w-[132px] max-w-[155px] rounded-md border-2 px-2 py-1 bg-gradient-to-b from-[#2b1b11] via-[#1a100a] to-[#0d0805] shadow-[0_10px_24px_rgba(0,0,0,0.95)]',
          isMe
            ? 'border-gold-aged shadow-[0_0_18px_rgba(212,175,55,0.4)]'
            : targetable
              ? 'border-blood-bright aim-blink'
              : 'border-stone-700/90'
        )}
      >
        <div className="flex items-center justify-between gap-1 border-b border-stone-800 pb-0.5 mb-1">
          <span className="font-typewriter font-bold text-[10px] sm:text-xs text-[#f5e7c6] truncate">
            {player.name}
          </span>
          <span
            className={cn(
              'text-[7px] sm:text-[8px] font-mono font-extrabold px-1 rounded-sm shrink-0',
              isMe
                ? 'bg-gold-aged text-black'
                : player.isBot
                  ? 'bg-stone-700 text-stone-200'
                  : 'bg-amber-900/70 text-amber-200'
            )}
          >
            {isMe ? 'VOCÊ' : player.isBot ? 'BOT' : 'HUMANO'}
          </span>
        </div>

        {/* Barra de Vidas em Caveiras */}
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 py-0.5">
          {Array.from({ length: player.maxLives }).map((_, i) => (
            <Skull
              key={i}
              alive={i < player.lives}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            />
          ))}
        </div>

        {/* Selos de Buff de Faca (Manipulamento de Alma) e Pacto de Sangue */}
        {(knifeDmg > 1 || pactPartners.length > 0 || player.isWalled) && player.isAlive && (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-1 pt-0.5 border-t border-stone-800/80">
            {knifeDmg > 1 && (
              <span
                className="px-1 py-[1px] rounded bg-teal-950/90 border border-teal-400 text-teal-200 font-mono font-bold text-[8px]"
                title={`Faca fortalecida por Manipulamento de Alma: causa ${knifeDmg} de Dano`}
              >
                🗡️ FACA {knifeDmg}x
              </span>
            )}
            {pactPartners.length > 0 && (
              <span
                className="px-1 py-[1px] rounded bg-rose-950/90 border border-rose-500 text-rose-200 font-mono font-bold text-[8px] truncate max-w-[120px]"
                title={`Pacto de Sangue ativo com: ${pactPartners.join(', ')}`}
              >
                🩸 PACTO: {pactPartners.join(', ')}
              </span>
            )}
            {player.isWalled && (
              <span className="px-1 py-[1px] rounded bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-mono font-bold text-[8px]">
                🔒 EMPAREDADO
              </span>
            )}
          </div>
        )}

        {!player.isAlive && (
          <div className="text-center text-[8px] font-mono text-blood-bright font-bold tracking-wider mt-0.5">
            💀 ELIMINADO
          </div>
        )}
      </div>
    </motion.div>
  );
}
