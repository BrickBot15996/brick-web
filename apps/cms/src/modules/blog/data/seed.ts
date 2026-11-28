/**
 * SAMPLE DATA for the preview. The topics are the website's starting set (apps/website/src/lib/blog.ts, Romanian names
 * included). The five posts are invented to exercise every status and the missing-Romanian state: none of them is real
 * BrickBot news. Editors and dates are invented too.
 */
import { daysAgo } from '../../../lib/data/preview-kit';
import { emptyDoc } from './doc';
import type { RichDoc, RichNode } from './doc';
import type { Post, Topic } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro', maria = 'maria.popescu@brickbot.ro';

// ───────── Tiptap document builders ─────────
const t = (text: string, mark?: 'bold' | 'italic'): RichNode => ({ type: 'text', text, ...(mark ? { marks: [{ type: mark }] } : {}) });
const p = (...c: (string | RichNode)[]): RichNode => ({ type: 'paragraph', content: c.map((x) => (typeof x === 'string' ? t(x) : x)) });
const h2 = (s: string): RichNode => ({ type: 'heading', attrs: { level: 2 }, content: [t(s)] });
const quote = (s: string): RichNode => ({ type: 'blockquote', content: [p(s)] });
const ul = (...items: string[]): RichNode => ({ type: 'bulletList', content: items.map((s) => ({ type: 'listItem', content: [p(s)] })) });
const doc = (...content: RichNode[]): RichDoc => ({ type: 'doc', content });

const topicRows: [string, string, string][] = [
  ['competition', 'Competition recaps', 'Competiții'],
  ['engineering', 'Engineering', 'Inginerie'],
  ['programming', 'Programming', 'Programare'],
  ['design', 'Design', 'Design'],
  ['outreach', 'Outreach', 'Outreach'],
  ['sponsors', 'Sponsors', 'Sponsori'],
  ['media', 'Media', 'Media'],
  ['team-life', 'Team life', 'Viața în echipă'],
  ['announcements', 'Announcements', 'Anunțuri'],
];
export const topics: Topic[] = topicRows.map(([id, en, ro], order) => ({
  id, slug: id, name: { en, ro }, order, editedBy: [ana, matei, ioana, vlad][order % 4], editedAt: daysAgo(30 + order, 12),
}));

const seo = () => ({ title: { en: '', ro: '' }, description: { en: '', ro: '' } });
const inDays = (d: number, h = 9) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };

export const posts: Post[] = [
  {
    id: 'decode-regional-recap', slug: 'decode-regional-recap',
    title: { en: 'Our DECODE season so far: a regional recap', ro: 'Sezonul DECODE până acum: povestea unui regional' },
    excerpt: { en: 'Two long days, one wobbling intake and a lot of lessons. Here is how the weekend went.', ro: 'Două zile lungi, un intake capricios și multe lecții. Așa a decurs weekendul.' },
    body: {
      en: doc(
        p('We arrived on Friday with a robot that worked perfectly in the workshop and a plan that fell apart in the first practice match.'),
        h2('What went well'),
        p('The autonomous routine scored every time we ran it, and our drive team made ', t('fewer mistakes', 'bold'), ' than at any event before.'),
        ul('A reliable four-ball autonomous', 'Clean cycle times in the second half of qualification', 'Our pit crew swapped a drivetrain motor in under four minutes'),
        h2('What we learned'),
        p('The intake jammed twice on the red alliance side. We now test every mechanism against the real field tiles, not only the practice mat.'),
        quote('Every event is a free week of testing, if you write the lessons down.'),
      ),
      ro: doc(
        p('Am ajuns vineri cu un robot care mergea perfect în atelier și cu un plan care s-a spulberat în primul meci de antrenament.'),
        h2('Ce a mers bine'),
        p('Rutina autonomă a punctat de fiecare dată, iar echipa de pilotaj a greșit ', t('mai puțin', 'bold'), ' ca la orice concurs de până acum.'),
        ul('Un autonom sigur, cu patru bile', 'Timpi buni de ciclu în a doua jumătate a calificărilor', 'Echipa din pit a schimbat un motor de șasiu în mai puțin de patru minute'),
        h2('Ce am învățat'),
        p('Intake-ul s-a blocat de două ori pe partea alianței roșii. Acum testăm fiecare mecanism pe plăcile terenului real, nu doar pe covorul de antrenament.'),
        quote('Fiecare concurs este o săptămână gratuită de testare, dacă scrii lecțiile.'),
      ),
    },
    cover: null, topics: ['competition', 'engineering'], projects: [], season: 'decode', status: 'published', publishAt: null, publishedAt: daysAgo(18, 10),
    seo: { title: { en: 'DECODE regional recap | BrickBot', ro: '' }, description: { en: '', ro: '' } },
    createdBy: ana, createdAt: daysAgo(21), editedBy: ana, editedAt: daysAgo(18, 9),
  },
  {
    id: 'rebuilding-our-intake', slug: 'rebuilding-our-intake',
    title: { en: 'Rebuilding our intake in three iterations', ro: 'Cum am reconstruit intake-ul în trei iterații' },
    excerpt: { en: 'From a roller that crushed balls to a compliant design that never jams. A short engineering diary.', ro: 'De la un rulou care strivea mingile la un design flexibil care nu se mai blochează. Un scurt jurnal de inginerie.' },
    body: {
      en: doc(
        p('The first intake was fast and brutal. It scored, but it also ', t('flattened', 'italic'), ' about one ball in five.'),
        h2('Iteration two'),
        p('We swapped rigid rollers for compliant wheels and added a funnel plate, printed in PETG, to guide balls toward the centre.'),
        h2('Iteration three'),
        p('A small ramp inside the channel stopped the last jam. The change cost us one afternoon and a spool of filament.'),
      ),
      ro: doc(
        p('Primul intake era rapid și brutal. Punctam, dar ', t('turtea', 'italic'), ' cam una din cinci mingi.'),
        h2('A doua iterație'),
        p('Am înlocuit rolele rigide cu roți flexibile și am adăugat o placă-pâlnie, tipărită din PETG, care ghidează mingile spre centru.'),
        h2('A treia iterație'),
        p('O mică rampă în interiorul canalului a oprit ultimul blocaj. Schimbarea ne-a costat o după-amiază și o bobină de filament.'),
      ),
    },
    cover: null, topics: ['engineering', 'design'], projects: ['brick-by-brick-school'], season: 'decode', status: 'published', publishAt: null, publishedAt: daysAgo(40, 14),
    seo: seo(), createdBy: matei, createdAt: daysAgo(44), editedBy: vlad, editedAt: daysAgo(39, 16),
  },
  {
    id: 'focsani-tech-challenge-registration', slug: 'focsani-tech-challenge-registration',
    title: { en: 'Focșani Tech Challenge: registration is open', ro: 'Focșani Tech Challenge: înscrierile sunt deschise' },
    excerpt: { en: 'Teams from the region are invited to our league meet. Here is what to expect and how to sign up.', ro: 'Echipele din regiune sunt invitate la etapa noastră de ligă. Iată la ce să te aștepți și cum te înscrii.' },
    body: {
      en: doc(
        p('We are hosting our league meet again this year, and every FTC team in the area is welcome.'),
        h2('How to sign up'),
        p('Register through the FTC Events page of the meet, then write to us so we can plan the pits.'),
      ),
      ro: doc(
        p('Găzduim din nou etapa noastră de ligă anul acesta, iar orice echipă FTC din zonă este binevenită.'),
        h2('Cum te înscrii'),
        p('Înscrie-te prin pagina FTC Events a etapei, apoi scrie-ne ca să putem planifica zona de pit.'),
      ),
    },
    cover: null, topics: ['outreach', 'announcements'], projects: ['focsani-tech-challenge'], season: 'decode', status: 'scheduled', publishAt: inDays(5, 9), publishedAt: null,
    seo: seo(), createdBy: ioana, createdAt: daysAgo(3), editedBy: ioana, editedAt: daysAgo(1, 13),
  },
  {
    id: 'thank-you-to-our-sponsors', slug: 'thank-you-to-our-sponsors',
    title: { en: 'A thank you to our sponsors', ro: '' },
    excerpt: { en: 'None of this happens without the businesses around Focșani that believe in the team.', ro: '' },
    body: {
      en: doc(
        p('Every part on the robot, every roll-up banner and every trip to a competition was paid for by someone who believed in a group of teenagers.'),
        h2('What your support became'),
        ul('A second drivetrain for practice', 'Travel to two events', 'Materials for the Brick By Brick School'),
      ),
      ro: emptyDoc(),
    },
    cover: null, topics: ['sponsors'], projects: [], season: null, status: 'draft', publishAt: null, publishedAt: null,
    seo: seo(), createdBy: vlad, createdAt: daysAgo(2), editedBy: vlad, editedAt: daysAgo(2, 18),
  },
  {
    id: 'a-day-with-the-caravan', slug: 'a-day-with-the-caravan',
    title: { en: 'A day with the BrickBot Caravan', ro: 'O zi cu Caravana BrickBot' },
    excerpt: { en: '', ro: '' },
    body: { en: doc(p('Draft notes: the bus left at eight, three classes, one demo robot that refused to drive until a loose cable showed itself.')), ro: emptyDoc() },
    cover: null, topics: [], projects: ['brickbot-caravan'], season: null, status: 'draft', publishAt: null, publishedAt: null,
    seo: seo(), createdBy: maria, createdAt: daysAgo(1, 10), editedBy: maria, editedAt: daysAgo(0, 8),
  },
];
