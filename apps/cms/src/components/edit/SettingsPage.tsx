import type { ReactNode } from 'react';
import type { FormApi } from '../../lib/form';
import { EditorFrame } from './Editor';
import { EditorSkeleton } from './List';

/**
 * A single-record editor with no list column: Site settings, Home & FAQ, the Team & story singletons. It is
 * EditorFrame (header, "last edited", ⌘S, leave-without-saving guard, the sticky save bar) laid out as a page.
 *
 *   const q = useSettings();
 *   if (q.isPending) return <SettingsSkeleton />;
 *   if (q.isError) return <SettingsError onRetry={() => void q.refetch()} />;
 *   return <SettingsEditor settings={q.data} />;       // useEditForm lives in here, seeded from q.data
 *
 * and SettingsEditor renders <SettingsPage form title edited>…fields in <Section>s…</SettingsPage>.
 */
export function SettingsPage<T>({ form, title, edited, viewHref, children }: {
  form: FormApi<T>;
  title: string;
  /** Who saved it last and when; null if it has never been saved. */
  edited: { by: string; at: string } | null;
  /** The public page this controls, when there is one. */
  viewHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="sp">
      <EditorFrame form={form} title={title} edited={edited} viewHref={viewHref} inHeader>{children}</EditorFrame>
    </div>
  );
}

export function SettingsSkeleton() {
  return <div className="sp"><EditorSkeleton /></div>;
}

export function SettingsError({ onRetry, text = 'Couldn’t load these settings.' }: { onRetry?: () => void; text?: string }) {
  return (
    <div className="sp">
      <div className="ed">
        <div className="notice" role="alert"><span>{text}</span>{onRetry && <button type="button" className="link" onClick={onRetry}>Try again</button>}</div>
      </div>
    </div>
  );
}
