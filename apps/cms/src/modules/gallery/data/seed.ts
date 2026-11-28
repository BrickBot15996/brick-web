/**
 * Seed for the preview. The first eight items are the website's current gallery (apps/website/src/lib/gallery.ts), with
 * its alt text and captions; their dates were "YYYY-MM" there and are stored here as the 1st of that month.
 * SAMPLE DATA: the items after "// sample" (extra photos from public/preview, a clip and a YouTube embed) and the editors
 * and edit times are invented, to exercise the grid.
 */
import { daysAgo } from '../../../lib/data/preview-kit';
import type { GalleryItem } from './types';

const ana = 'ana.popescu@brickbot.ro', matei = 'matei.ionescu@brickbot.ro', ioana = 'ioana.radu@brickbot.ro';

type Photo = Pick<GalleryItem, 'key' | 'width' | 'height' | 'season' | 'date' | 'featured'> & { alt: [string, string]; caption: [string, string] };
const photo = (id: string, p: Photo, by: string, d: number): GalleryItem => ({
  id, kind: 'photo', key: p.key, youtubeId: null, width: p.width, height: p.height, season: p.season, date: p.date, featured: p.featured,
  alt: { en: p.alt[0], ro: p.alt[1] }, caption: { en: p.caption[0], ro: p.caption[1] }, editedBy: by, editedAt: daysAgo(d),
});

export const galleryItems: GalleryItem[] = [
  photo('g1', { key: 'site/home/hero.webp', width: 1616, height: 1080, season: 'decode', date: '2026-03-01', featured: true,
    alt: ['BrickBot students in yellow shirts cheering with their arms up', 'Elevii BrickBot în tricouri galbene, aclamând cu brațele ridicate'],
    caption: ['Romania National Championship, March 2026', 'Campionatul Național, martie 2026'] }, ana, 9),
  photo('g2', { key: 'seasons/decode/team-photo.webp', width: 960, height: 640, season: 'decode', date: '2026-05-01', featured: false,
    alt: ['The team with the robot and a Romanian flag in front of the FIRST Tech Challenge stage', 'Echipa cu robotul și un steag al României în fața scenei FIRST Tech Challenge'],
    caption: ['FIRST Championship, Houston, May 2026', 'Campionatul Mondial FIRST, Houston, mai 2026'] }, ana, 9),
  photo('g3', { key: 'gallery/decode/worlds-practice-field.webp', width: 1600, height: 1069, season: 'decode', date: '2026-04-01', featured: false,
    alt: ['The robot on a practice field while the team watches from the edge', 'Robotul pe un teren de antrenament, cu echipa privind de pe margine'],
    caption: ['Practice field at the FIRST Championship', 'Teren de antrenament la Campionatul Mondial'] }, matei, 21),
  photo('g4', { key: 'site/join/sparkhope-2025.webp', width: 1280, height: 851, season: 'into-the-deep', date: '2025-08-01', featured: true,
    alt: ['The team cheering in front of the SparkHope Robotics Cup stage', 'Echipa aclamând în fața scenei SparkHope Robotics Cup'],
    caption: ['SparkHope Robotics Cup winners, August 2025', 'Câștigătorii SparkHope Robotics Cup, august 2025'] }, matei, 21),
  photo('g5', { key: 'site/home/schools-classroom.webp', width: 1280, height: 960, season: 'into-the-deep', date: '2025-05-01', featured: false,
    alt: ['Team members with a class and their teacher, showing a robot in a school classroom', 'Membri ai echipei cu o clasă și profesoara lor, prezentând un robot într-o sală de clasă'],
    caption: ['BrickBot in Schools, May 2025', 'BrickBot în școli, mai 2025'] }, ioana, 34),
  photo('g6', { key: 'site/home/schools-video.webp', width: 1280, height: 854, season: 'into-the-deep', date: '2025-05-01', featured: false,
    alt: ['Two team members presenting a robot video to a class of young pupils', 'Doi membri ai echipei prezentând un video cu robotul unei clase de elevi mici'],
    caption: ['BrickBot in Schools, May 2025', 'BrickBot în școli, mai 2025'] }, ioana, 34),
  photo('g7', { key: 'site/home/joy-in-motion.webp', width: 1680, height: 1120, season: null, date: null, featured: false,
    alt: ['Children trying the robots at the team’s outdoor stand in Focșani', 'Copii încercând roboții la standul echipei, în aer liber, în Focșani'],
    caption: ['Our stand at a public event in Focșani', 'Standul nostru la un eveniment public din Focșani'] }, ana, 40),
  photo('g8', { key: 'seasons/biobuzz/team-photo.webp', width: 1600, height: 1066, season: 'biobuzz', date: '2026-09-01', featured: false,
    alt: ['The 2026⁠–⁠27 team on the steps of “Unirea” National College', 'Echipa 2026⁠–⁠27 pe treptele Colegiului Național „Unirea”'],
    caption: ['The 2026⁠–⁠27 team', 'Echipa 2026⁠–⁠27'] }, ana, 3),

  // sample
  photo('g9', { key: 'site/team/drive-team.webp', width: 960, height: 640, season: 'decode', date: '2026-03-01', featured: false,
    alt: ['The drive team at the field, controllers in hand', 'Echipa de pilotaj la teren, cu controlerele în mână'],
    caption: ['The drive team', ''] }, matei, 12),
  photo('g10', { key: 'site/team/event-stand.webp', width: 960, height: 539, season: 'into-the-deep', date: '2025-10-01', featured: false,
    alt: ['The team’s stand at an outreach event', 'Standul echipei la un eveniment de promovare'],
    caption: ['', ''] }, ioana, 15),
  photo('g11', { key: 'site/team/repairing-the-robot.webp', width: 960, height: 640, season: 'decode', date: '2026-02-01', featured: false,
    alt: ['Two members repairing the robot in the pit', 'Doi membri reparând robotul în pit'],
    caption: ['Repairs between matches', 'Reparații între meciuri'] }, matei, 12),
  photo('g12', { key: 'site/team/sponsor-visit.webp', width: 960, height: 640, season: null, date: '2026-01-01', featured: false,
    alt: ['Members showing the robot to a sponsor', ''],
    caption: ['A visit to one of our sponsors', ''] }, ana, 7),
  photo('g13', { key: 'site/story/italy-2025.webp', width: 1680, height: 1120, season: 'into-the-deep', date: '2025-04-01', featured: false,
    alt: ['The team abroad at a competition in Italy', ''],
    caption: ['', ''] }, ioana, 28),
  {
    id: 'g14', kind: 'video', key: 'gallery/decode/pit-crew.mp4', youtubeId: null, width: 1920, height: 1080, season: 'decode', date: '2026-03-01', featured: false,
    alt: { en: 'The pit crew swapping a battery in under a minute', ro: '' }, caption: { en: 'Pit crew at work', ro: '' }, editedBy: matei, editedAt: daysAgo(5),
  },
  {
    id: 'g15', kind: 'youtube', key: null, youtubeId: 'aqz-KE-bpKQ', width: 1280, height: 720, season: 'decode', date: '2026-05-01', featured: false,
    alt: { en: '', ro: '' }, caption: { en: 'Match highlights, FIRST Championship', ro: 'Momente din meciuri, Campionatul Mondial FIRST' }, editedBy: ana, editedAt: daysAgo(2),
  },
];
