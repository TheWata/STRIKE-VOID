import { useEffect, useState } from 'react';

export function useMediaQuery(query) {
  const read = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(read);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/**
 * Layout compacto (smartphones): largura < 640px (retrato) OU altura <= 520px (paisagem).
 * Acima disso mantém a mesa octogonal de desktop/tablet.
 */
export const COMPACT_QUERY = '(max-width: 639px), (max-height: 520px)';

export function useCompactLayout() {
  return useMediaQuery(COMPACT_QUERY);
}
