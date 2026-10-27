import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';
import {
  CHARACTER_ARCHETYPES,
  EXPRESSION_KEYS,
  getExpressionTileData,
} from '../models/expressionAtlas';

/**
 * Componente reutilizável de Retrato de Personagem via Tilemap / Spritesheet.
 *
 * Renderiza exclusivamente o recorte interno de cada célula do spritesheet
 * `/assets/characters/expressions-spritesheet.jpg` dentro de uma máscara circular
 * (`rounded-full overflow-hidden`), sem dividir o arquivo em imagens separadas e
 * sem vazar títulos, rótulos de texto ou bordas dos quadros vizinhos.
 *
 * Utiliza crossfade entre camadas para suavizar a troca de expressão sem deslizar
 * o `background-position` por cima de células intermediárias do atlas.
 */
export default function CharacterPortrait({
  character = CHARACTER_ARCHETYPES.FEMALE,
  expression = EXPRESSION_KEYS.NORMAL,
  isAlive = true,
  filterStyle = '',
  className = '',
  ariaLabel,
}) {
  const tile = getExpressionTileData(character, expression);
  const compositeKey = `${tile.character}-${tile.canonicalKey}`;

  return (
    <div
      data-character={tile.character}
      data-expression={tile.requestedKey}
      data-canonical-tile={tile.canonicalKey}
      data-tile-col={tile.col}
      data-tile-row={tile.row}
      role="img"
      aria-label={ariaLabel || `Retrato (${tile.label})`}
      className={cn(
        'relative w-full h-full rounded-full overflow-hidden select-none pointer-events-none bg-[#0b0604]',
        !isAlive && 'grayscale contrast-125 brightness-75',
        className
      )}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={compositeKey}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full rounded-full"
          style={{
            ...tile.style,
            filter: filterStyle || undefined,
          }}
        />
      </AnimatePresence>

      {/* Vinheta circular interna sutil para fundir a arte do tile à moldura gótica */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_16px_rgba(0,0,0,0.88)]"
      />
    </div>
  );
}
