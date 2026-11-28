import type { Edited } from '../../../lib/data';

/**
 * One card of the links page. Dates are inclusive calendar days ("YYYY-MM-DD", Europe/Bucharest) or empty. The
 * website checks them again in the browser, so a card disappears on its end date before the next rebuild.
 * List order is page order.
 */
export interface LinkCard {
  id: string;
  title: string;
  /** Shown under the title, e.g. "brickbot.ro/academy". Empty: the target's address without https://. */
  display: string;
  /** Where the card goes. */
  href: string;
  /** CDN key of an SVG under links/icons/. */
  icon: string | null;
  highlighted: boolean;
  start: string;
  end: string;
}
export interface Linktree extends Edited { cards: LinkCard[] }
export type LinktreeInput = { cards: LinkCard[] };

export type CardStatus = 'visible' | 'scheduled' | 'expired';
