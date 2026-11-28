/**
 * SAMPLE DATA for the preview. Tagline, intro and the four FAQ entries are the legacy texts (docs/legacy-content
 * en.json / ro.json: Home.Banner, Home.AboutUs, Home.FAQ). Links in answers are flattened to plain text. Editors and
 * edit times are invented for review only.
 */
import { addPreviewMedia, daysAgo, PREVIEW_ME as ME } from '../../../lib/data/preview-kit';
import type { Faq, Form230, Hero } from './types';

const matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro';

export const hero: Hero = {
  editedBy: ME, editedAt: daysAgo(2),
  tagline: { en: 'We build our future Brick by Brick!', ro: 'We build our future Brick by Brick!' },
  intro: {
    en: 'We are team #15996, BrickBot, from "Unirea" National College, Focșani, Romania. We are proud to be the first robotics team in our county to take part in FIRST Tech Challenge, and we dedicate ourselves with passion to building robots and promoting STEAM education in our community.',
    ro: 'Noi suntem echipa #15996, BrickBot, de la Colegiul Național „Unirea”, Focșani, România. Suntem mândri să fim prima echipă de robotică din județul nostru care participă la FIRST Tech Challenge și ne dedicăm cu pasiune construirii de roboți și promovării educației ȘTIAM în comunitatea noastră.',
  },
  mediaType: 'image',
  media: 'site/home/hero.webp',
  poster: null,
};

const f = (order: number, id: string, by: string, at: string, qen: string, qro: string, aen: string, aro: string): Faq => ({
  id, order, editedBy: by, editedAt: at, question: { en: qen, ro: qro }, answer: { en: aen, ro: aro },
});
export const faq: Faq[] = [
  f(0, 'what-is-first', matei, daysAgo(12), 'What is FIRST?', 'Ce este FIRST?',
    'FIRST (For Inspiration and Recognition of Science and Technology) is an organization that encourages young people to study STEAM subjects through robotics competitions.\n\nWithin FIRST Tech Challenge (FTC), teams of primary school and high school students build and program robots every year, to fulfill a series of dynamic tasks.\n\nThe competition was brought to Romania by Nație Prin Educație, partnering with BRD.',
    'FIRST (For Inspiration and Recognition of Science and Technology) este o organizație care încurajează tinerii să studieze domeniile ȘTIAM prin competiții de robotică.\n\nÎn cadrul FIRST Tech Challenge (FTC), elevi la nivel de gimnaziu și liceu construiesc și programează roboți în fiecare an, conform unei teme dinamice.\n\nCompetiția a fost adusă în România de organizația Nație Prin Educație, în parteneriat cu BRD.'),
  f(1, 'what-fields', ioana, daysAgo(12), 'What fields does the team work in?', 'Ce domenii acoperă activitatea echipei?',
    'Our team combines technical skills with non-technical ones, both branches working together frequently.\n\nThe technical side consists of the assembly, 3D design and programming departments, while the non-technical side takes on the mission of promoting the team and its social media pages (PR), graphic design, photography and attracting new sponsors.',
    'Echipa noastră îmbină competențele tehnice cu cele non-tehnice, cele două secțiuni colaborând frecvent.\n\nZona tehnică cuprinde departamentele mecanică și proiectare 3D și programare, iar cea non-tehnică se ocupă de promovarea echipei și social media (PR), design grafic, fotografie și atragerea sponsorilor.'),
  f(2, 'how-to-join', matei, daysAgo(9), 'How can I join BrickBot?', 'Cum pot face parte din echipa BrickBot?',
    'To join the team you have to be a student of "Unirea" National College of Focșani and to be over 13 years old.\n\nYou don’t need to have prior experience within your desired department. You will start off as a recruit and, with our help, you will be brought up to speed with all aspects of your chosen branch.\n\nComplete the application form at brickbot.ro/apply.',
    'Pentru a intra în echipă trebuie să fii elev al Colegiului Național „Unirea” din Focșani și să ai peste 13 ani.\n\nNu ai nevoie de experiență anterioară. Vei începe ca recrut și, alături de noi, vei învăța pas cu pas toate aspectele departamentului ales.\n\nCompletează formularul de înscriere la brickbot.ro/apply.'),
  f(3, 'how-to-help', ME, daysAgo(5), 'How can I help BrickBot?', 'Cum pot ajuta BrickBot?',
    'You can support us through sponsorships or donations, receiving appropriate benefit according to our sponsorship packages. Likewise, we are open to attending or organizing events alongside companies or institutions.\n\nYou can find more details on the Partner with Us page.',
    'Ne puteți susține prin sponsorizări sau donații, beneficiind de promovare conform pachetelor noastre de sponsorizare. De asemenea, suntem deschiși la organizarea de evenimente și activități alături de companii sau instituții.\n\nPuteți vedea mai multe detalii pe pagina Devino partener.'),
];

/** Dates are SAMPLE: the real window is the start of the year to 25 May. Wording is invented. */
export const form230: Form230 = {
  editedBy: ioana, editedAt: daysAgo(20),
  start: '2027-01-01',
  end: '2027-05-25',
  text: {
    en: 'Redirect 3.5% of your income tax to BrickBot. It costs you nothing and takes two minutes.',
    ro: 'Redirecționează 3,5% din impozitul pe venit către BrickBot. Nu te costă nimic și durează două minute.',
  },
  link: 'https://formular230.ro/asociatia-brickbot',
};

addPreviewMedia([hero.media]);
