/** Gallery items (CLAUDE.md §3.4), later from the CMS "Gallery" module. `season` is a season slug, or undefined for general. */
import type { Locale } from './site';

export interface GalleryItem {
  key: string; width: number; height: number;
  season?: string; date?: string; featured?: boolean;
  alt: Record<Locale, string>;
  caption?: Record<Locale, string>;
}

export const gallery: GalleryItem[] = [
  {
    key: 'site/home/hero.webp', width: 1616, height: 1080, season: 'decode', date: '2026-03', featured: true,
    alt: { en: 'BrickBot students in yellow shirts cheering with their arms up', ro: 'Elevii BrickBot în tricouri galbene, aclamând cu brațele ridicate' },
    caption: { en: 'Romania National Championship, March 2026', ro: 'Campionatul Național, martie 2026' },
  },
  {
    key: 'seasons/decode/team-photo.webp', width: 960, height: 640, season: 'decode', date: '2026-05',
    alt: { en: 'The team with the robot and a Romanian flag in front of the FIRST Tech Challenge stage', ro: 'Echipa cu robotul și un steag al României în fața scenei FIRST Tech Challenge' },
    caption: { en: 'FIRST Championship, Houston, May 2026', ro: 'Campionatul Mondial FIRST, Houston, mai 2026' },
  },
  {
    key: 'gallery/decode/worlds-practice-field.webp', width: 1600, height: 1069, season: 'decode', date: '2026-04',
    alt: { en: 'The robot on a practice field while the team watches from the edge', ro: 'Robotul pe un teren de antrenament, cu echipa privind de pe margine' },
    caption: { en: 'Practice field at the FIRST Championship', ro: 'Teren de antrenament la Campionatul Mondial' },
  },
  {
    key: 'site/join/sparkhope-2025.webp', width: 1280, height: 851, season: 'into-the-deep', date: '2025-08', featured: true,
    alt: { en: 'The team cheering in front of the SparkHope Robotics Cup stage', ro: 'Echipa aclamând în fața scenei SparkHope Robotics Cup' },
    caption: { en: 'SparkHope Robotics Cup winners, August 2025', ro: 'Câștigătorii SparkHope Robotics Cup, august 2025' },
  },
  {
    key: 'site/home/schools-classroom.webp', width: 1280, height: 960, season: 'into-the-deep', date: '2025-05',
    alt: { en: 'Team members with a class and their teacher, showing a robot in a school classroom', ro: 'Membri ai echipei cu o clasă și profesoara lor, prezentând un robot într-o sală de clasă' },
    caption: { en: 'BrickBot in Schools, May 2025', ro: 'BrickBot în școli, mai 2025' },
  },
  {
    key: 'site/home/schools-video.webp', width: 1280, height: 854, season: 'into-the-deep', date: '2025-05',
    alt: { en: 'Two team members presenting a robot video to a class of young pupils', ro: 'Doi membri ai echipei prezentând un video cu robotul unei clase de elevi mici' },
    caption: { en: 'BrickBot in Schools, May 2025', ro: 'BrickBot în școli, mai 2025' },
  },
  {
    key: 'site/home/joy-in-motion.webp', width: 1680, height: 1120,
    alt: { en: 'Children trying the robots at the team’s outdoor stand in Focșani', ro: 'Copii încercând roboții la standul echipei, în aer liber, în Focșani' },
    caption: { en: 'Our stand at a public event in Focșani', ro: 'Standul nostru la un eveniment public din Focșani' },
  },
  {
    key: 'seasons/biobuzz/team-photo.webp', width: 1600, height: 1066, season: 'biobuzz', date: '2026-09',
    alt: { en: 'The 2026⁠–⁠27 team on the steps of “Unirea” National College', ro: 'Echipa 2026⁠–⁠27 pe treptele Colegiului Național „Unirea”' },
    caption: { en: 'The 2026⁠–⁠27 team', ro: 'Echipa 2026⁠–⁠27' },
  },
];
