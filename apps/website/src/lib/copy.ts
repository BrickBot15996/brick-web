/**
 * Interface and home page copy, EN + RO. Seed text: the CMS ("Home & FAQ", "Site settings")
 * takes these over later (CLAUDE.md §5).
 */
import type { Locale } from './site';

const en = {
  meta: {
    title: 'BrickBot · FTC team #15996 from Focșani, Romania',
    description:
      'BrickBot is a FIRST Tech Challenge robotics team of high-school students from Focșani, Romania, top 10 in the world in 2025⁠–⁠26. Sponsor or partner with our next season.',
  },
  skip: 'Skip to content',
  menu: { open: 'Open menu', close: 'Close menu', back: 'Back' },
  langSwitch: { short: 'RO', label: 'Română' },
  nav: {
    about: 'About',
    story: 'Our story',
    team: 'The team',
    gallery: 'Gallery',
    seasons: 'Seasons',
    projects: 'Projects',
    blog: 'BrickLog',
    join: 'Join',
    support: 'Support Us',
    partners: 'Partner with us',
    donate: 'Donate',
    sponsors: 'Our sponsors',
    press: 'Press kit',
    contact: 'Contact',
    cta: 'Support us',
  },
  hero: {
    name: 'BrickBot',
    mottoA: 'We build our future',
    mottoB: 'brick by brick!',
    primary: 'Support us',
    secondary: 'Contact us',
    strip: [
      { hi: '', text: 'From Focșani, Romania' },
      { hi: 'Top 10 in the world', text: 'in the 2025⁠–⁠26 season' },
      { hi: '', text: 'FIRST Tech Challenge team #15996' },
    ],
    stripPlain: 'FIRST Tech Challenge team #15996 from Focșani, Romania. Top 10 in the world in the 2025⁠–⁠26 season.',
    photoAlt: 'BrickBot students in yellow team shirts cheering with their arms up at the 2026 Romania National Championship',
  },
  intro: {
    heading: 'Putting Focșani on the World Map',
    body: 'BrickBot is the robotics team of “Unirea” National College in Focșani, and the first FIRST Tech Challenge team in Vrancea county. Every season we design, build and program a new robot, and we run everything around it ourselves: events, design, photo and video, fundraising.',
    ftcQ: 'What’s FIRST Tech Challenge?',
    ftcA: 'A worldwide robotics competition for students aged 12 to 18. Each September a new game is announced, and teams get a few months to build a robot that plays it. In Romania, it’s run by Nație prin Educație.',
    facts: [
      { k: 'Team', v: '#15996' },
      { k: 'Competing since', v: '2016' },
      { k: 'Based in', v: 'Focșani, Vrancea' },
    ],
    photoAlt: 'The BrickBot team with their robot and a Romanian flag in front of the FIRST Tech Challenge stage at the 2026 FIRST Championship',
  },
  season: {
    heading: '2025⁠–⁠26, our best season yet.',
    body: 'Our DECODE robot took us all the way to the FIRST Championship, where we reached our division’s final and our engineering portfolio won 2nd place for the Design Award. We ended the season in the world’s top 10.',
    cols: { event: 'Event', result: 'Result' },
    rows: [
      { event: 'World ranking, 2025⁠–⁠26', result: 'Top 10 in the world', hi: true },
      { event: 'FIRST Championship', result: 'Division finalists' },
      { event: 'FIRST Championship', result: 'Design Award, 2nd place' },
      { event: 'Romania National Championship', result: 'Finalist alliance' },
      { event: 'East League Tournament', result: 'Think Award, 2nd place' },
      { event: 'Bucharest Twin Cup', result: 'Finalist alliance' },
    ],
    link: 'See the full season',
    photoAlt: 'The BrickBot robot on a practice field at the 2026 FIRST Championship while the team watches from the edge',
  },
  outreach: {
    heading: 'FIRST is about more than robots.',
    body: 'A robot in a box teaches nobody anything. So we take ours where people are.',
    items: [
      { t: 'BrickBot in Schools', d: 'We teach robotics lessons in Focșani primary schools and hand the kids the controller.' },
      { t: 'Public events', d: 'Stands at fairs and festivals, where anyone can drive the robot and ask us how it works.' },
      { t: 'Other teams', d: 'Meetups with FTC teams across Romania to swap what we’ve learned.' },
    ],
    ask: 'Running a school program, a fair or a company event? Bring us along.',
    cta: 'Plan something with us',
    photoA: 'BrickBot members with a class of students and their teacher, showing a robot in a school classroom',
    photoB: 'Children trying out BrickBot’s robots at the team’s outdoor stand during a public event in Focșani',
  },
  support: {
    heading: 'Put your name on the board.',
    lede: 'A season costs parts, field elements, registration fees and travel to competitions abroad. Here’s how you can be part of the next one.',
    board: 'Your logo here',
    sponsor: {
      title: 'Sponsor a season',
      body: 'Packages from €200 to €3,000. Your logo goes on our social media and in our engineering portfolio; from €2,000 it goes on the robot, and at €3,000 on our team shirts too. Every sponsorship is a contract with Asociația BrickBot.',
      cta: 'See sponsorship packages',
    },
    donate: {
      title: 'Donate',
      body: 'Give once through Stripe. Paying income tax in Romania? Redirect 3.5% of it to us with Form 230, until 25 May.',
      cta: 'Ways to donate',
    },
    collab: {
      title: 'Partner without money',
      body: 'Products, services, a workshop for our team, or a spot for the robot at your event. Not every partnership is a payment.',
      cta: 'Get in touch',
    },
  },
  sponsors: {
    heading: '22 partners powered our 2025⁠–⁠26 season.',
    link: 'Meet our sponsors',
  },
  faq: {
    heading: 'Questions sponsors ask us.',
    items: [
      {
        q: 'Who are we signing with?',
        a: 'Asociația BrickBot, the NGO that runs the team (CIF 50846996). Every sponsorship and donation goes to the association, under a written contract.',
      },
      {
        q: 'How does a sponsorship work?',
        a: 'You pick a package, or offer products or services instead, and we sign a sponsorship contract between your company and Asociația BrickBot. Write to contact@brickbot.ro and we’ll send you the details.',
      },
      {
        q: 'Where does the money go?',
        a: 'Into the season: robot parts and tools, field elements to practise on, competition registration fees, and travel to events in Romania and abroad. Our Partner page breaks down last season’s spending, category by category.',
      },
      {
        q: 'Can we help without money?',
        a: 'Yes. You can sponsor with products or services, host a workshop for our team, or invite us and the robot to your school or event.',
      },
      {
        q: 'What is FIRST Tech Challenge?',
        a: 'A worldwide robotics competition for students aged 12 to 18. Each September a new game is announced, and teams have a few months to design, build and program a robot to play it. In Romania, FTC is run by Nație prin Educație.',
      },
    ],
  },
  close: {
    heading: 'Got an idea? We’re one email away.',
    cta: 'Write to us',
  },
  footer: {
    lede: 'FIRST Tech Challenge team #15996\n“Unirea” National College',
    cols: { about: 'About', team: 'Team', support: 'Support Us', contact: 'Contact' },
    form: 'Contact form',
    terms: 'Terms',
    privacy: 'Privacy',
    natie: 'FIRST Tech Challenge Romania, run by Nație prin Educație',
    sal: 'ANPC: alternative dispute resolution (SAL)',
    sol: 'EU online dispute resolution (SOL)',
  },
};

type Copy = typeof en;

const ro: Copy = {
  meta: {
    title: 'BrickBot · Echipa FTC #15996 din Focșani',
    description:
      'BrickBot este o echipă de robotică FIRST Tech Challenge formată din elevi din Focșani, în top 10 mondial în sezonul 2025⁠–⁠26. Sponsorizează sau devino partenerul următorului nostru sezon.',
  },
  skip: 'Sari la conținut',
  menu: { open: 'Deschide meniul', close: 'Închide meniul', back: 'Înapoi' },
  langSwitch: { short: 'EN', label: 'English' },
  nav: {
    about: 'Despre',
    story: 'Povestea noastră',
    team: 'Echipa',
    gallery: 'Galerie',
    seasons: 'Sezoane',
    projects: 'Proiecte',
    blog: 'BrickLog',
    join: 'Alătură-te',
    support: 'Susține-ne',
    partners: 'Devino partener',
    donate: 'Donează',
    sponsors: 'Sponsorii noștri',
    press: 'Presă',
    contact: 'Contact',
    cta: 'Susține-ne',
  },
  hero: {
    name: 'BrickBot',
    mottoA: 'Ne construim viitorul',
    mottoB: 'cărămidă cu cărămidă!',
    primary: 'Susține-ne',
    secondary: 'Contactează-ne',
    strip: [
      { hi: '', text: 'Din Focșani, România' },
      { hi: 'Top 10 mondial', text: 'în sezonul 2025⁠–⁠26' },
      { hi: '', text: 'Echipa FIRST Tech Challenge #15996' },
    ],
    stripPlain: 'Echipa FIRST Tech Challenge #15996 din Focșani, România. Top 10 mondial în sezonul 2025⁠–⁠26.',
    photoAlt: 'Elevii BrickBot în tricouri galbene, aclamând cu brațele ridicate la Campionatul Național de Robotică 2026',
  },
  intro: {
    heading: 'Aducem Focșanii pe harta lumii',
    body: 'BrickBot este echipa de robotică a Colegiului Național „Unirea” din Focșani și prima echipă FIRST Tech Challenge din județul Vrancea. În fiecare sezon proiectăm, construim și programăm un robot nou și ne ocupăm singuri de tot ce ține de el: evenimente, design, foto-video, strângere de fonduri.',
    ftcQ: 'Ce este FIRST Tech Challenge?',
    ftcA: 'O competiție internațională de robotică pentru elevi între 12 și 18 ani. În fiecare septembrie se anunță un joc nou, iar echipele au câteva luni să construiască un robot care să-l joace. În România, competiția este organizată de Nație prin Educație.',
    facts: [
      { k: 'Echipa', v: '#15996' },
      { k: 'Concurăm din', v: '2016' },
      { k: 'Suntem din', v: 'Focșani, Vrancea' },
    ],
    photoAlt: 'Echipa BrickBot cu robotul și un steag al României în fața scenei FIRST Tech Challenge, la Campionatul Mondial FIRST 2026',
  },
  season: {
    heading: '2025⁠–⁠26, cel mai bun sezon al nostru de până acum.',
    body: 'Robotul nostru DECODE ne-a dus până la Campionatul Mondial FIRST, unde am ajuns în finala diviziei, iar portofoliul nostru de inginerie a luat locul 2 la Design Award. Am încheiat sezonul în top 10 mondial.',
    cols: { event: 'Competiție', result: 'Rezultat' },
    rows: [
      { event: 'Clasamentul mondial, 2025⁠–⁠26', result: 'Top 10 mondial', hi: true },
      { event: 'Campionatul Mondial FIRST', result: 'Finaliști de divizie' },
      { event: 'Campionatul Mondial FIRST', result: 'Design Award, locul 2' },
      { event: 'Campionatul Național al României', result: 'Alianța finalistă' },
      { event: 'East League Tournament', result: 'Think Award, locul 2' },
      { event: 'Bucharest Twin Cup', result: 'Alianța finalistă' },
    ],
    link: 'Vezi tot sezonul',
    photoAlt: 'Robotul BrickBot pe un teren de antrenament la Campionatul Mondial FIRST 2026, cu echipa privind de pe margine',
  },
  outreach: {
    heading: 'FIRST înseamnă mai mult decât roboți.',
    body: 'Un robot ținut în cutie nu învață pe nimeni nimic. Așa că îl ducem acolo unde sunt oamenii.',
    items: [
      { t: 'BrickBot în școli', d: 'Ținem lecții de robotică în școlile primare din Focșani și le dăm copiilor telecomanda.' },
      { t: 'Evenimente publice', d: 'Standuri la târguri și festivaluri, unde oricine poate conduce robotul și ne poate întreba cum funcționează.' },
      { t: 'Alte echipe', d: 'Întâlniri cu echipe FTC din toată țara, ca să ne împărtășim ce am învățat.' },
    ],
    ask: 'Organizezi un program școlar, un târg sau un eveniment de firmă? Ia-ne cu tine.',
    cta: 'Hai să plănuim ceva',
    photoA: 'Membri BrickBot alături de o clasă de elevi și profesoara lor, prezentând un robot într-o sală de clasă',
    photoB: 'Copii încercând roboții BrickBot la standul echipei, în aer liber, la un eveniment public din Focșani',
  },
  support: {
    heading: 'Pune-ți numele pe tabelă.',
    lede: 'Un sezon înseamnă piese, elemente de teren, taxe de înscriere și drumuri la competiții în străinătate. Iată cum poți face parte din următorul.',
    board: 'Logo-ul tău aici',
    sponsor: {
      title: 'Sponsorizează un sezon',
      body: 'Pachete între 200 € și 3.000 €. Logo-ul tău apare pe rețelele noastre și în portofoliul de inginerie; de la 2.000 € ajunge pe robot, iar la 3.000 € și pe tricourile echipei. Fiecare sponsorizare are la bază un contract cu Asociația BrickBot.',
      cta: 'Vezi pachetele de sponsorizare',
    },
    donate: {
      title: 'Donează',
      body: 'Donează o singură dată prin Stripe. Plătești impozit pe venit în România? Redirecționează-ne 3,5% din el prin Formularul 230, până pe 25 mai.',
      cta: 'Cum poți dona',
    },
    collab: {
      title: 'Parteneriat fără bani',
      body: 'Produse, servicii, un atelier pentru echipa noastră sau un loc pentru robot la evenimentul tău. Nu orice parteneriat înseamnă o plată.',
      cta: 'Scrie-ne',
    },
  },
  sponsors: {
    heading: '22 de parteneri ne-au susținut în sezonul 2025⁠–⁠26.',
    link: 'Vezi sponsorii noștri',
  },
  faq: {
    heading: 'Întrebări pe care ni le pun sponsorii.',
    items: [
      {
        q: 'Cu cine semnăm?',
        a: 'Cu Asociația BrickBot, ONG-ul care administrează echipa (CIF 50846996). Fiecare sponsorizare și donație merge către asociație, pe bază de contract scris.',
      },
      {
        q: 'Cum funcționează o sponsorizare?',
        a: 'Alegi un pachet sau oferi produse ori servicii, iar noi semnăm un contract de sponsorizare între firma ta și Asociația BrickBot. Scrie-ne la contact@brickbot.ro și îți trimitem detaliile.',
      },
      {
        q: 'Pe ce se duc banii?',
        a: 'Pe sezon: piese și scule pentru robot, elemente de teren pentru antrenamente, taxe de înscriere la competiții și drumuri la evenimente din țară și din străinătate. Pe pagina de parteneriate găsești cheltuielile sezonului trecut, pe categorii.',
      },
      {
        q: 'Putem ajuta și fără bani?',
        a: 'Da. Poți sponsoriza cu produse sau servicii, poți ține un atelier pentru echipa noastră sau ne poți invita cu robotul la școala sau evenimentul tău.',
      },
      {
        q: 'Ce este FIRST Tech Challenge?',
        a: 'O competiție internațională de robotică pentru elevi între 12 și 18 ani. În fiecare septembrie se anunță un joc nou, iar echipele au câteva luni să proiecteze, să construiască și să programeze un robot care să-l joace. În România, FTC este organizat de Nație prin Educație.',
      },
    ],
  },
  close: {
    heading: 'Ai o idee? Suntem la un e-mail distanță.',
    cta: 'Scrie-ne',
  },
  footer: {
    lede: 'Echipa FIRST Tech Challenge #15996\nColegiul Național „Unirea”',
    cols: { about: 'Despre', team: 'Echipă', support: 'Susține-ne', contact: 'Contact' },
    form: 'Formular de contact',
    terms: 'Termeni',
    privacy: 'Confidențialitate',
    natie: 'FIRST Tech Challenge România, organizat de Nație prin Educație',
    sal: 'ANPC: soluționarea alternativă a litigiilor (SAL)',
    sol: 'Soluționarea online a litigiilor în UE (SOL)',
  },
};

export const copy: Record<Locale, Copy> = { en, ro };
