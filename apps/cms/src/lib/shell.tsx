import { createContext, useContext } from 'react';
import type { Session } from './data';

export interface ShellApi {
  session: Session;
  openPalette: () => void;
  publishOpen: boolean;
  setPublishOpen: (open: boolean) => void;
  /** The page header row's slots (see components/PageHeader). Null until the shell has mounted them. */
  headerSub: HTMLElement | null;
  headerActions: HTMLElement | null;
}

export const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const v = useContext(ShellContext);
  if (!v) throw new Error('useShell outside the Shell');
  return v;
}
