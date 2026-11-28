/**
 * SAMPLE DATA for the preview. Text is drawn from docs/legacy-content (en.json / ro.json: Home.AboutUs, Home.FAQ,
 * OurTeam.Introduction, the carousel captions). Milestones marked "sample" are invented placeholders; editors and
 * edit times are invented for review only. Impact numbers are SAMPLE values.
 */
import { addPreviewMedia, daysAgo, PREVIEW_ME as ME } from '../../../lib/data/preview-kit';
import type { Department, Impact, JoinPage, Milestone, Mission } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro';

export const milestones: Milestone[] = [
  { id: 'founded-2016', when: '2016', editedBy: ana, editedAt: daysAgo(30), image: null,
    title: { en: 'BrickBot is founded', ro: 'Se înființează BrickBot' },
    text: { en: 'A few students at "Unirea" National College in Focșani start team #15996 and enter FIRST Tech Challenge in its very first Romanian seasons, the first team in Vrancea county to do so.', ro: 'Câțiva elevi de la Colegiul Național „Unirea” din Focșani pun bazele echipei #15996 și intră în FIRST Tech Challenge, prima echipă din județul Vrancea care o face.' } },
  { id: 'velocity-vortex-2016', when: '2016-10', editedBy: ana, editedAt: daysAgo(30), image: null,
    title: { en: 'First season: Velocity Vortex', ro: 'Primul sezon: Velocity Vortex' },
    text: { en: 'Our first robot, built brick by brick, for the 2016–17 game Velocity Vortex. (Sample wording.)', ro: 'Primul nostru robot, construit cărămidă cu cărămidă, pentru jocul din 2016–17, Velocity Vortex. (Text de probă.)' } },
  { id: 'registered-2020', when: '2020', editedBy: matei, editedAt: daysAgo(21), image: null,
    title: { en: 'Registered with FIRST', ro: 'Înscriși oficial în FIRST' },
    text: { en: 'Romanian teams are registered with FIRST from 2020, so official results start here. (Sample wording.)', ro: 'Echipele din România sunt înregistrate în FIRST din 2020, deci rezultatele oficiale încep de aici. (Text de probă.)' } },
  { id: 'regionals-2023', when: '2023-02', editedBy: ioana, editedAt: daysAgo(19), image: null,
    title: { en: 'Romania Qualifying Tournament', ro: 'Turneul de calificare al României' },
    text: { en: 'A qualifying tournament in February 2023 puts the team on the national map.', ro: 'Un turneu de calificare din februarie 2023 ne aduce în atenția întregii țări.' } },
  { id: 'bucharest-twin-cup-2024', when: '2024-08', editedBy: ioana, editedAt: daysAgo(19), image: null,
    title: { en: 'Bucharest Twin Cup', ro: 'Bucharest Twin Cup' },
    text: { en: 'Our first offseason cup in August 2024.', ro: 'Prima noastră cupă offseason, în august 2024.' } },
  { id: 'focsani-meet-2025', when: '2025-01', editedBy: matei, editedAt: daysAgo(14), image: null,
    title: { en: 'We host a league meet at home', ro: 'Găzduim o etapă de ligă acasă' },
    text: { en: 'The DIVE Into Innovation league meet brings teams from the whole area to Focșani in January 2025.', ro: 'Etapa de ligă DIVE Into Innovation aduce la Focșani echipe din toată zona, în ianuarie 2025.' } },
  { id: 'caravan-2025', when: '2025-05', editedBy: ME, editedAt: daysAgo(10), image: null,
    title: { en: 'BrickBot Caravan visits the schools', ro: 'Caravana BrickBot ajunge în școli' },
    text: { en: 'BrickBot in Schools, May 2025: presentations in the schools of our town.', ro: 'Caravana BrickBot, mai 2025: prezentări în școlile din orașul nostru.' } },
  { id: 'championship-2026', when: '2026-05', editedBy: ME, editedAt: daysAgo(6), image: null,
    title: { en: 'FIRST Championship division finalists', ro: 'Finaliști ai diviziei la FIRST Championship' },
    text: { en: 'Romania Championship finalists in March 2026, then division finalists at the FIRST Championship in May.', ro: 'Finaliști la Campionatul Național în martie 2026, apoi finaliști ai diviziei la FIRST Championship, în mai.' } },
];

export const mission: Mission = {
  editedBy: ME, editedAt: daysAgo(4),
  mission: {
    en: 'Since 2016, season after season, we have been building robots for FIRST Tech Challenge. We want STEAM education to be more accessible to young people, starting in our own community.',
    ro: 'Din 2016, în fiecare sezon, creăm roboți pentru FIRST Tech Challenge. Vrem ca educația ȘTIAM să fie mai accesibilă tinerilor, începând cu propria noastră comunitate.',
  },
  drive: {
    en: 'Every step, from the first sketch to the final tests, reflects steady progress, built brick by brick. That is how we shaped our identity.',
    ro: 'Fiecare etapă, de la prima schiță până la ultimele teste, reprezintă un progres clădit pas cu pas, cărămidă cu cărămidă. Așa ne-am consolidat identitatea.',
  },
  values: [
    { name: { en: 'Outreach', ro: 'Implicare' }, line: { en: 'We share what we learn with our town.', ro: 'Ce învățăm, împărtășim cu orașul nostru.' } },
    { name: { en: 'Creativity', ro: 'Creativitate' }, line: { en: 'A new game every year means a new idea every year.', ro: 'Un joc nou în fiecare an înseamnă o idee nouă în fiecare an.' } },
    { name: { en: 'Ambition', ro: 'Ambiție' }, line: { en: 'We aim for the finals and prepare for them.', ro: 'Țintim spre finale și ne pregătim pentru ele.' } },
    { name: { en: 'Team spirit', ro: 'Spirit de echipă' }, line: { en: 'Technical and non-technical sides work together all the time.', ro: 'Zona tehnică și cea non-tehnică colaborează constant.' } },
  ],
  studentsDo: {
    en: 'Our team combines technical skills with non-technical ones, and both sides work together often. Someone sketches a mechanism in CAD while someone else plans the next school visit; a programmer tunes the autonomous while a photographer catches the pit crew at work. (Sample wording, adapted from the legacy FAQ.)',
    ro: 'Echipa noastră îmbină competențele tehnice cu cele non-tehnice, iar cele două părți colaborează frecvent. Unul desenează un mecanism în CAD, altcineva planifică următoarea vizită într-o școală; un programator ajustează autonomul, iar un fotograf surprinde echipa din pit. (Text de probă, adaptat după FAQ-ul vechi.)',
  },
  teamPhoto: 'site/team/team-photo.webp',
};

/** SAMPLE numbers: replace with the real ones in the CMS. */
export const impact: Impact = {
  editedBy: matei, editedAt: daysAgo(8),
  numbers: [
    { id: 'years', value: 10, suffix: '', label: { en: 'Years active', ro: 'Ani de activitate' } },
    { id: 'awards', value: 24, suffix: '+', label: { en: 'Awards won', ro: 'Premii câștigate' } },
    { id: 'reached', value: 2500, suffix: '+', label: { en: 'People reached', ro: 'Persoane atinse' } },
    { id: 'events', value: 30, suffix: '+', label: { en: 'Outreach events', ro: 'Evenimente de impact' } },
  ],
};

const dep = (id: string, en: string, ro: string, den: string, dro: string): Department => ({
  id, name: { en, ro }, description: { en: den, ro: dro }, photos: [],
});
/** Names and descriptions are SAMPLE wording (CLAUDE.md §3.7 lists the departments; the legacy FAQ describes the two branches). */
export const departments: Department[] = [
  dep('assembly-3d-design', 'Assembly & 3D Design', 'Mecanică și proiectare 3D', 'Design the robot in CAD, then cut, print and assemble it.', 'Proiectezi robotul în CAD, apoi îl tai, îl printezi și îl asamblezi.'),
  dep('programming', 'Programming', 'Programare', 'Write the code that drives the robot, from driver controls to the autonomous.', 'Scrii codul care conduce robotul, de la controlul șoferului până la autonom.'),
  dep('events', 'Events', 'Evenimente', 'Plan school visits, workshops and our own league meet.', 'Planifici vizite în școli, ateliere și propria noastră etapă de ligă.'),
  dep('social-media', 'Social Media', 'Social media', 'Tell the team’s story on Instagram, TikTok and beyond.', 'Spui povestea echipei pe Instagram, TikTok și nu numai.'),
  dep('graphic-design', 'Graphic Design', 'Design grafic', 'Shape how BrickBot looks, from posters to the team shirt.', 'Dai formă imaginii BrickBot, de la afișe la tricoul echipei.'),
  dep('photo-video', 'Photo/Video', 'Foto/Video', 'Capture the build, the matches and the fun between them.', 'Surprinzi construcția, meciurile și distracția dintre ele.'),
  dep('fundraising', 'Fundraising', 'Atragere de fonduri', 'Find sponsors and partners who make the season possible.', 'Găsești sponsori și parteneri care fac sezonul posibil.'),
];

export const join: JoinPage = {
  editedBy: ioana, editedAt: daysAgo(3),
  requirements: {
    en: '- You are a student at "Unirea" National College, Focșani\n- You are over 13\n- No prior experience needed: you start as a recruit and we bring you up to speed with your chosen branch',
    ro: '- Ești elev la Colegiul Național „Unirea” din Focșani\n- Ai peste 13 ani\n- Nu ai nevoie de experiență anterioară: începi ca recrut și te ajutăm să ajungi la nivelul departamentului ales',
  },
  departments,
};

addPreviewMedia([mission.teamPhoto]);
