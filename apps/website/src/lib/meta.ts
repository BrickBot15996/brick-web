/** Page titles and descriptions per route and locale (SEO overrides later come from the CMS). */
import type { Locale, RouteId } from './site';
type M = Record<Locale, { title: string; description: string }>;
const s = (en: [string, string], ro: [string, string]): M => ({ en: { title: `${en[0]} · BrickBot`, description: en[1] }, ro: { title: `${ro[0]} · BrickBot`, description: ro[1] } });

export const meta: Partial<Record<RouteId, M>> = {
  about: s(['Our story', 'How a team of students in Focșani went from the first FTC team in Vrancea to the FIRST Championship.'], ['Povestea noastră', 'Cum o echipă de elevi din Focșani a ajuns de la prima echipă FTC din Vrancea la Campionatul Mondial FIRST.']),
  team: s(['The team', 'Who BrickBot are, what drives us, and every award we’ve won since 2016.'], ['Echipa', 'Cine suntem, ce ne motivează și fiecare premiu câștigat din 2016 încoace.']),
  gallery: s(['Gallery', 'Photos from competitions, classrooms and life on team BrickBot.'], ['Galerie', 'Fotografii de la competiții, din săli de clasă și din viața echipei BrickBot.']),
  seasons: s(['Seasons', 'Every BrickBot season since 2016: events, results and awards.'], ['Sezoane', 'Fiecare sezon BrickBot din 2016: competiții, rezultate și premii.']),
  projects: s(['Projects', 'The events, programmes and platforms BrickBot runs beyond the competition season.'], ['Proiecte', 'Evenimentele, programele și platformele pe care BrickBot le derulează dincolo de competiții.']),
  blog: s(['BrickLog', 'Competition recaps, engineering notes and team life from BrickBot.'], ['BrickLog', 'Povești de la competiții, note de inginerie și viața în echipa BrickBot.']),
  join: s(['Join', 'Study at “Unirea” National College in Focșani? Join the robotics team. No experience needed.'], ['Alătură-te', 'Înveți la Colegiul Național „Unirea” din Focșani? Intră în echipa de robotică. Nu ai nevoie de experiență.']),
  partners: s(['Partner with us', 'Sponsorship packages from €200 to €3,000 for a team that finished 2025⁠–⁠26 in the world’s top 10.'], ['Devino partener', 'Pachete de sponsorizare între 200 € și 3.000 € pentru o echipă din top 10 mondial în 2025⁠–⁠26.']),
  donate: s(['Donate', 'Support BrickBot with Form 230, a Stripe donation or a bank transfer to Asociația BrickBot.'], ['Donează', 'Susține BrickBot prin Formularul 230, o donație Stripe sau un transfer bancar către Asociația BrickBot.']),
  sponsors: s(['Our sponsors', 'The companies and institutions behind BrickBot’s 2025⁠–⁠26 season.'], ['Sponsorii noștri', 'Companiile și instituțiile din spatele sezonului 2025⁠–⁠26 al BrickBot.']),
  press: s(['Press kit', 'BrickBot logos, photos and team descriptions for the press.'], ['Kit de presă', 'Logo-uri, fotografii și descrieri ale echipei BrickBot pentru presă.']),
  contact: s(['Contact', 'Write to BrickBot about sponsorship, events, press or anything else.'], ['Contact', 'Scrie-i echipei BrickBot despre sponsorizare, evenimente, presă sau orice altceva.']),
  terms: s(['Terms and conditions', 'Terms for donations and sponsorships to Asociația BrickBot.'], ['Termeni și condiții', 'Termenii pentru donațiile și sponsorizările către Asociația BrickBot.']),
  privacy: s(['Privacy policy', 'What personal data BrickBot collects and how we use it.'], ['Politica de confidențialitate', 'Ce date personale colectează BrickBot și cum le folosim.']),
};
