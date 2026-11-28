import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useShell } from '../lib/shell';

/**
 * What a page contributes to the shell's header row: a sub line under the module's name (a count, "Last edited by…")
 * and the page's own actions (New, Upload, View on site). The shell draws the row itself (title, then these, then the
 * Publish group), so every module's header sits in the same place. Render it anywhere in the page; it renders nothing
 * where it is. Pages do not draw their own page title.
 */
export function PageHeader({ sub, actions }: { sub?: ReactNode; actions?: ReactNode }) {
  const { headerSub, headerActions } = useShell();
  return (
    <>
      {sub != null && sub !== false && headerSub && createPortal(sub, headerSub)}
      {actions != null && actions !== false && headerActions && createPortal(actions, headerActions)}
    </>
  );
}
