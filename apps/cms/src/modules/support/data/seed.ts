/** SAMPLE DATA for the preview. Sponsors mirror docs/legacy-content/data/sponsor-data.tsx (2025–26); editors and dates are invented. */
import { daysAgo, minsAgo } from '../../../lib/data/preview-kit';
import type { Benefit, SeasonBudget, Sponsor, SupportDocs, TierDef } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro', vlad = 'vlad.stan@brickbot.ro';

type Row = [slug: string, name: string, website: string, tier: string, file: string];
const rows: Row[] = [
  ['asociatia-uniristii', 'Asociația Uniriștii', 'http://uniristii.lufo.ro/index.php', 'diamond', 'asociatia-uniristii.webp'],
  ['autovip', 'Autovip', 'https://autoviptransfer.ro', 'diamond', 'autovip.webp'],
  ['aviputna', 'Aviputna', 'https://aviputna.ro', 'silver', 'aviputna.webp'],
  ['banca-transilvania', 'Banca Transilvania', 'https://www.bancatransilvania.ro', 'silver', 'banca-transilvania.webp'],
  ['cdp-smart', 'CDP Smart', 'https://cdpsmart.ro', 'bronze', 'cdp-smart.webp'],
  ['ceproinv', 'Ceproinv', 'https://ceproinv.ro', 'silver', 'ceproinv.webp'],
  ['deepserv', 'Deepserv', 'https://deep-serv.ro/wp/', 'silver', 'deepserv.webp'],
  ['dentexcel', 'Dentexcel', 'https://www.hyperclinicadentexcel.ro', 'bronze', 'dentexcel.webp'],
  ['dentrust', 'Dentrust', 'https://dentrust.ro', 'silver', 'dentrust.webp'],
  ['dr-de-zambete', 'Dr. de Zâmbete', 'https://doctordezambete.ro/', 'silver', 'dr-de-zambete.webp'],
  ['electric-srl', 'Electric SRL', 'https://www.electricsrl.ro', 'silver', 'electric-srl.webp'],
  ['gm-extractions', 'GM Extractions', '', 'gold', 'gm-extractions.png'],
  ['il-gusto', 'Il Gusto', 'https://ilgusto.ro', 'bronze', 'il-gusto.webp'],
  ['micromet', 'Micromet', 'https://www.micromet.ro/', 'diamond', 'micromet.svg'],
  ['novagym', 'Nova Gym', 'https://www.novagym.ro/', 'bronze', 'novagym.webp'],
  ['primaria-focsani', 'Primăria Municipiului Focșani', 'https://www.focsani.info', 'ultimate', 'primaria.webp'],
  ['ravenol', 'Ravenol', 'https://www.ravenol.ro/', 'silver', 'ravenol.webp'],
  ['romans', 'Romans', 'https://romans.ro', 'gold', 'romans.png'],
  ['scorpion', 'Scorpion', 'https://scoalascorpion.ro', 'bronze', 'scorpion.webp'],
  ['termofutura', 'Termofutura', 'https://www.termofutura.ro', 'bronze', 'termofutura.webp'],
  ['unior', 'Unior', 'https://sculeserioase.ro', 'diamond', 'unior.png'],
  ['vivacredit', 'Viva Credit', 'https://vivacredit.ro', 'ultimate', 'vivacredit.webp'],
];
const sponsorEdits: Record<string, [string, string]> = {
  'banca-transilvania': [ana, minsAgo(12)], unior: [vlad, daysAgo(2, 17)], 'primaria-focsani': [matei, daysAgo(8, 12)], micromet: [ioana, daysAgo(14, 9)],
};
export const sponsors: Sponsor[] = rows.map(([id, name, website, tier, file], i) => {
  const [editedBy, editedAt] = sponsorEdits[id] ?? [[ana, matei, ioana, vlad][i % 4], daysAgo(20 + (i % 9), 10 + (i % 6))];
  return { id, name, website, tier, season: 'decode', logo: `sponsors/${file}`, editedBy, editedAt };
});

/** The five legacy tiers (docs/legacy-content/data/sponsor-tiers-data.tsx and the website's Partners page): amounts, Romanian names and how many benefits each includes. */
export const tierDefs: TierDef[] = [
  { id: 'bronze', name: { en: 'Bronze', ro: 'Bronz' }, amount: 200, benefits: 2 },
  { id: 'silver', name: { en: 'Silver', ro: 'Argint' }, amount: 500, benefits: 3 },
  { id: 'gold', name: { en: 'Gold', ro: 'Aur' }, amount: 1000, benefits: 4 },
  { id: 'diamond', name: { en: 'Diamond', ro: 'Diamant' }, amount: 2000, benefits: 5 },
  { id: 'ultimate', name: { en: 'Ultimate', ro: 'Ultimate' }, amount: 3000, benefits: 7 },
];
/** The seven ordered benefits (the website's Partners page wording, which refines legacy en.json / ro.json). */
export const benefits: Benefit[] = [
  { text: { en: 'Post on our social media', ro: 'Postare pe rețelele noastre' } },
  { text: { en: 'Logo in our engineering portfolio', ro: 'Logo în portofoliul de inginerie' } },
  { text: { en: 'Logo on our website', ro: 'Logo pe site-ul nostru' } },
  { text: { en: 'Logo on our roll-up banner', ro: 'Logo pe roll-up-ul echipei' } },
  { text: { en: 'Logo on the robot', ro: 'Logo pe robot' } },
  { text: { en: 'Logo on our team shirts', ro: 'Logo pe tricourile echipei' } },
  { text: { en: 'Merch with your logo', ro: 'Merch cu logo-ul tău' } },
];
export const tierPlanEdit = { editedBy: 'matei.ionescu@brickbot.ro', editedAt: daysAgo(31, 11) };

/** Sponsor decks. SAMPLE: the DECODE deck is not uploaded yet in reality (docs/cdn-manifest.md); the file key and editor are invented. */
export const docs: SupportDocs = {
  decks: [{ season: 'decode', file: 'documents/sponsor-deck-2025-26.pdf' }],
  contract: null,
  contractText: {
    en: 'You can support us with money, with services, or both. We put the partnership in a written contract between your company and Asociația BrickBot, with the benefits of your package spelled out.\n\n1. Tell us what you have in mind, through the contact form.\n2. We send you a contract to read.\n3. You sign it and pay into the association’s bank account.\n4. We deliver the benefits and send you an account of the season’s spending.',
    ro: 'Ne poți sprijini cu bani, cu servicii sau cu ambele. Colaborarea o formalizăm printr-un contract între firma ta și Asociația BrickBot, cu beneficiile pachetului scrise în el.\n\n1. Ne spui ce ai în minte, prin formularul de contact.\n2. Îți trimitem un contract spre citire.\n3. Îl semnezi și plătești în contul asociației.\n4. Îți oferim beneficiile și îți trimitem raportul cheltuielilor sezonului.',
  },
  editedBy: 'ioana.radu@brickbot.ro', editedAt: daysAgo(12, 16),
};

/** SAMPLE DATA: invented categories and amounts so the Budget tab has something to show. DECODE has no budget yet (the accounts are still closing). */
export const budgets: SeasonBudget[] = [
  {
    season: 'into-the-deep', remaining: 1180, editedBy: 'ana.popescu@brickbot.ro', editedAt: daysAgo(190, 14),
    categories: [
      { id: 'robot-parts', name: { en: 'Robot parts and tools', ro: 'Piese și unelte pentru robot' }, amount: 4350 },
      { id: 'travel', name: { en: 'Travel and accommodation', ro: 'Transport și cazare' }, amount: 3920 },
      { id: 'registration', name: { en: 'Event and registration fees', ro: 'Taxe de eveniment și înscriere' }, amount: 1640 },
      { id: 'outreach', name: { en: 'Outreach and workshops', ro: 'Activități și ateliere pentru comunitate' }, amount: 980 },
      { id: 'merch', name: { en: 'Team shirts and merch', ro: 'Tricouri și merch' }, amount: 720 },
    ],
  },
];
