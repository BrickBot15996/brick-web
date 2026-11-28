import { logActivity } from '../../../lib/data/activity';
import { rankSearch } from '../../../lib/data/search';
import { nowIso, PREVIEW_ME as ME, previewDelay, previewFailSave } from '../../../lib/data/preview-kit';
import type { SettingsApi } from './api';
import { settings as seed } from './seed';
import type { SiteSettings } from './types';

let settings: SiteSettings = { ...seed, address: { ...seed.address }, association: { ...seed.association, branch: { ...seed.association.branch } }, socials: seed.socials.map((s) => ({ ...s })) };

export const SECTIONS = [
  { id: 'contact', label: 'Contact email', text: 'contact email public contact@brickbot.ro' },
  { id: 'address', label: 'Address and map', text: 'address map google maps embed street cezar bolliac focsani' },
  { id: 'association', label: 'Association details', text: 'association cif iban bank banca transilvania legal donate' },
  { id: 'socials', label: 'Social links', text: 'social links instagram facebook tiktok linkedin youtube github website icons' },
];

export const previewSettings: SettingsApi = {
  async get() { await previewDelay(); return settings; },
  async save(input) {
    await previewDelay();
    previewFailSave();
    settings = { ...input, editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'edited', targetLabel: 'site settings', module: 'Site settings', href: '/settings' });
    return settings;
  },
  async reorderSocials(order) {
    await previewDelay();
    previewFailSave();
    const rank = (n: string) => { const i = order.indexOf(n as never); return i < 0 ? order.length : i; };
    settings = { ...settings, socials: [...settings.socials].sort((a, b) => rank(a.network) - rank(b.network)), editedBy: ME, editedAt: nowIso() };
    logActivity({ action: 'reordered', targetLabel: 'social icons', module: 'Linktree', href: '/linktree' });
    return settings;
  },
  async search(query) {
    await previewDelay(60);
    return rankSearch(query, SECTIONS.map((s) => ({
      item: { id: s.id, label: s.label, hint: 'Site settings', href: `/settings#${s.id}` },
      text: `${s.label} ${s.text}`,
    })));
  },
};
