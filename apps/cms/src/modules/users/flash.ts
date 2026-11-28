import { useCallback, useEffect, useRef, useState } from 'react';

/** A short confirmation line ("Invite sent to …") that clears itself. */
export function useFlash(ms = 7000) {
  const [text, setText] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const show = useCallback((msg: string) => {
    setText(msg);
    clearTimeout(t.current);
    t.current = setTimeout(() => setText(null), ms);
  }, [ms]);
  return [text, show, () => setText(null)] as const;
}
