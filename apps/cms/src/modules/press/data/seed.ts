/**
 * SAMPLE DATA for the preview. Only brand/logo.svg and brand/wordmark.svg are known to exist; the other variants
 * start empty so the empty state shows. Photo keys and descriptions are invented placeholders (the long description
 * reuses the legacy About text). Editors and edit times are invented for review only.
 */
import { addPreviewMedia, daysAgo, PREVIEW_ME as ME } from '../../../lib/data/preview-kit';
import type { PressKit } from './types';

export const press: PressKit = {
  editedBy: ME, editedAt: daysAgo(7),
  marks: {
    logoSvgDark: 'brand/logo.svg', logoSvgLight: null, logoPngDark: null, logoPngLight: null,
    wordmarkSvgDark: 'brand/wordmark.svg', wordmarkSvgLight: null, wordmarkPngDark: null, wordmarkPngLight: null,
  },
  photos: [
    { id: 'team-2025-26', kind: 'team', file: 'press/photos/team-2025-26.webp', alt: { en: 'The BrickBot team posing with the robot', ro: 'Echipa BrickBot pozând cu robotul' } },
    { id: 'robot-2025-26', kind: 'robot', file: 'press/photos/robot-2025-26.webp', alt: { en: 'The 2025–26 competition robot', ro: 'Robotul de concurs din 2025–26' } },
  ],
  shortDescription: {
    en: 'BrickBot is FIRST Tech Challenge team #15996 from "Unirea" National College, Focșani, the first FTC team in Vrancea county.',
    ro: 'BrickBot este echipa #15996 din FIRST Tech Challenge de la Colegiul Național „Unirea” din Focșani, prima echipă FTC din județul Vrancea.',
  },
  longDescription: {
    en: 'We are team #15996, BrickBot, from "Unirea" National College, Focșani, Romania. Since 2016 we have been building robots for FIRST Tech Challenge, and we are proud to be the first robotics team in our county to take part in the competition.\n\nWe dedicate ourselves with passion to building robots and promoting STEAM education in our community, through school visits, workshops and a league meet we organise at home. The team is run by Asociația BrickBot.',
    ro: 'Noi suntem echipa #15996, BrickBot, de la Colegiul Național „Unirea”, Focșani, România. Din 2016 construim roboți pentru FIRST Tech Challenge și suntem mândri să fim prima echipă de robotică din județul nostru care participă la această competiție.\n\nNe dedicăm cu pasiune construirii de roboți și promovării educației ȘTIAM în comunitatea noastră, prin vizite în școli, ateliere și o etapă de ligă pe care o organizăm acasă. Echipa este coordonată de Asociația BrickBot.',
  },
  contactEmail: 'contact@brickbot.ro',
};

addPreviewMedia(press.photos.map((p) => p.file));
