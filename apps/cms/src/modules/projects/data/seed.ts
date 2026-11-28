/** SAMPLE DATA for the preview. Mirrors the real list (apps/website/src/lib/projects.ts); editors and dates are invented for review only. */
import { daysAgo, PREVIEW_ME as ME } from '../../../lib/data/preview-kit';
import type { Project } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro';

type ProjectSeed = Pick<Project, 'id' | 'name' | 'summary' | 'external'> & { editedBy: string; editedAt: string };
const projectRows: ProjectSeed[] = [
  { id: 'focsani-tech-challenge', external: null, editedBy: ioana, editedAt: daysAgo(9),
    name: { en: 'Focșani Tech Challenge', ro: 'Focșani Tech Challenge' },
    summary: { en: 'A league meet we organise every year to bring the teams from our area to our town.', ro: 'O etapă de ligă pe care o organizăm în fiecare an, ca să aducem echipele din zonă în orașul nostru.' } },
  { id: 'brick-by-brick-school', external: null, editedBy: matei, editedAt: daysAgo(6, 11),
    name: { en: 'Brick By Brick School', ro: 'Brick By Brick School' },
    summary: { en: 'Our structured preparation programme for new recruits.', ro: 'Programul nostru structurat de pregătire pentru recruți.' } },
  { id: 'brickbot-caravan', external: null, editedBy: ME, editedAt: daysAgo(1, 14),
    name: { en: 'BrickBot Caravan', ro: 'BrickBot Caravan' },
    summary: { en: 'A series of visits and presentations in the schools of our town.', ro: 'O serie de vizite și prezentări în școlile din orașul nostru.' } },
  { id: 'first-steps-into-steam', external: null, editedBy: vlad, editedAt: daysAgo(12, 18),
    name: { en: 'FIRST Steps Into STEAM', ro: 'FIRST Steps Into STEAM' },
    summary: { en: 'Technical and non-technical workshops that introduce secondary school students from rural areas to STEAM education.', ro: 'Ateliere tehnice și non-tehnice prin care le prezentăm educația STEAM elevilor de gimnaziu din mediul rural.' } },
  { id: 'ftc-sparks', external: null, editedBy: ana, editedAt: daysAgo(15, 16),
    name: { en: 'FTC Sparks', ro: 'FTC Sparks' },
    summary: { en: 'Online meetups with teams from all over the world, where we share our experiences and perspectives.', ro: 'Întâlniri online cu echipe din toată lumea, în care ne împărtășim experiențele și perspectivele.' } },
  { id: 'brickdocs', external: 'https://docs.brickbot.ro', editedBy: matei, editedAt: daysAgo(20, 10),
    name: { en: 'BrickDocs', ro: 'BrickDocs' },
    summary: { en: 'Our documentation platform, where we collect everything we know.', ro: 'Platforma noastră de documentație, unde adunăm tot ce știm.' } },
];
// apps/website/src/lib/projects.ts has no stats, body, facts, photos or partners yet (its sample content is dev-only), so none are seeded.
export const projects: Project[] = projectRows.map((p, order) => ({ ...p, slug: p.id, logo: null, stats: [], body: { en: [], ro: [] }, facts: [], photos: [], partners: [], order }));
