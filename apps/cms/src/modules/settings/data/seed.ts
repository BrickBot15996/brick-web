/** Real values: CLAUDE.md §3.9, §3.11, §4 and the association facts of §9 (site.ts of the website). Only the editor and date are sample data. */
import { daysAgo } from '../../../lib/data/preview-kit';
import type { SiteSettings } from './types';

export const settings: SiteSettings = {
  email: 'contact@brickbot.ro',
  address: {
    en: '15 Cezar Bolliac Street, Focșani, Vrancea, Romania',
    ro: 'Str. Cezar Bolliac nr. 15, Focșani, Vrancea, România',
  },
  // The website's own fallback (an address search), until the Business Profile's embed address is pasted in.
  mapsEmbed: 'https://www.google.com/maps?q=Strada%20Cezar%20Bolliac%2015%2C%20Foc%C8%99ani%2C%20Romania&output=embed',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Strada%20Cezar%20Bolliac%2015%2C%20Foc%C8%99ani%2C%20Romania',
  association: {
    name: 'Asociația BrickBot',
    cif: '50846996',
    bank: 'Banca Transilvania',
    branch: { en: 'Focșani branch', ro: 'Sucursala Focșani' },
    iban: 'RO05BTRLEURCRT0690572901',
  },
  socials: [
    { network: 'website', url: 'https://brickbot.ro/en' },
    { network: 'instagram', url: 'https://instagram.com/brickbotcnu' },
    { network: 'facebook', url: 'https://facebook.com/brickbotcnu' },
    { network: 'tiktok', url: 'https://tiktok.com/@brickbotcnu' },
    { network: 'linkedin', url: 'https://linkedin.com/company/brickbot' },
    { network: 'email', url: 'mailto:contact@brickbot.ro' },
    { network: 'youtube', url: 'https://youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew' },
    { network: 'github', url: 'https://github.com/BrickBot15996' },
  ],
  editedBy: 'matei.ionescu@brickbot.ro',
  editedAt: daysAgo(9, 13),
};
