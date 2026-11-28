import { useMemo } from 'react';
import { cdn } from '../../lib/cdn';
import { mediaUrl } from '../../lib/data/media';
import type { FormApi } from '../../lib/form';
import { Icon } from '../../components/icons';
import { icons } from './icons';
import type { LinktreeForm } from './LinktreeScreen';
import { cardStatus, displayOf, todayKey } from './status';

/**
 * The links page as a phone shows it, drawn from the form's live values: black ground, the yellow logo and wordmark
 * (with the §12 optical nudge for a centred wordmark), the social icons in the chosen order, and the cards that are
 * visible today. It mirrors apps/links/src/styles/links.css in a smaller size; it is a preview, not the real page.
 */
export function PhonePreview({ form }: { form: FormApi<LinktreeForm> }) {
  const { cards, order } = form.values;
  const today = todayKey();
  const shown = useMemo(() => cards.filter((c) => c.title.trim() && cardStatus(c, today) === 'visible'), [cards, today]);
  const hidden = cards.filter((c) => cardStatus(c, today) !== 'visible').length;
  const year = new Date().getFullYear();

  return (
    <aside className="lt__side" aria-label="Preview of the links page">
      <div className="lt__cap">
        <h2 className="lt__capt">Live preview</h2>
        <p className="lt__capn">{hidden ? `${hidden} ${hidden === 1 ? 'card is' : 'cards are'} hidden by dates today.` : 'As visitors see it today.'}</p>
      </div>
      <div className="lt-phone">
        <div className="lt-screen">
          <div className="lt-head">
            <span className="lt-head__mark" style={{ ['--m' as string]: `url(${cdn('brand/logo.svg')})` }} role="img" aria-label="BrickBot logo" />
            <span className="lt-head__word" style={{ ['--m' as string]: `url(${cdn('brand/wordmark.svg')})` }} role="img" aria-label="BrickBot" />
            <p className="lt-head__team">FTC Team 15996</p>
          </div>
          <ul className="lt-socials" aria-label="Social icons">
            {order.map((n) => {
              const ic = icons[n];
              if (!ic) return null;
              return (
                <li key={n} className="lt-ico">
                  <svg viewBox={ic.vb} aria-hidden="true" fill={ic.stroke ? 'none' : 'currentColor'} stroke={ic.stroke ? 'currentColor' : undefined} strokeWidth={ic.stroke ? 2 : undefined} strokeLinecap="round" strokeLinejoin="round"><path d={ic.d} /></svg>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 ? (
            <p className="lt-empty">No cards are visible today.</p>
          ) : (
            <ul className="lt-cards">
              {shown.map((c) => (
                <li key={c.k} className={`lt-card ${c.highlighted ? 'lt-card--hi' : ''}`}>
                  {c.icon && <span className="lt-card__icon" style={{ ['--m' as string]: `url(${mediaUrl(c.icon)})` }} aria-hidden="true" />}
                  <span className="lt-card__text">
                    <span className="lt-card__title">{c.title}</span>
                    {displayOf(c) && <small>{displayOf(c)}</small>}
                  </span>
                  <Icon name="arrow" className="i lt-card__arr" />
                </li>
              ))}
            </ul>
          )}
          <p className="lt-foot">BrickBot © {year}</p>
        </div>
      </div>
    </aside>
  );
}
