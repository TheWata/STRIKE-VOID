import React, { useState } from 'react';
import { getIconAsset } from '../models/assetCatalog';
import { cn } from '../lib/cn';

/**
 * Componente reutilizável para renderizar ícones artísticos SVG externos
 * do catálogo (`public/assets/icons/*.svg`), substituindo emojis improvisados
 * e mantendo fallback seguro caso um arquivo não carregue.
 */
export default function GameIcon({
  name,
  size = 13,
  className,
  alt = '',
  fallback = '❖',
}) {
  const [failed, setFailed] = useState(false);
  const src = getIconAsset(name);

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn('inline-flex items-center justify-center leading-none select-none', className)}
        style={{ fontSize: Math.max(9, size - 2) }}
      >
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        'inline-block shrink-0 select-none pointer-events-none object-contain',
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
