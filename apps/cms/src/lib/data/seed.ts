/** Core SAMPLE DATA for the preview client: the season reference list. Each module seeds its own data in modules/<id>/data/seed.ts. */
import type { SeasonSummary } from './types';

export const seasons: SeasonSummary[] = [
  { id: 'biobuzz', game: 'BioBuzz', years: '2026–27', current: false },
  { id: 'decode', game: 'DECODE', years: '2025–26', current: true },
  { id: 'into-the-deep', game: 'INTO THE DEEP', years: '2024–25', current: false },
  { id: 'centerstage', game: 'CENTERSTAGE', years: '2023–24', current: false },
  { id: 'powerplay', game: 'POWERPLAY', years: '2022–23', current: false },
  { id: 'freight-frenzy', game: 'FREIGHT FRENZY', years: '2021–22', current: false },
  { id: 'ultimate-goal', game: 'ULTIMATE GOAL', years: '2020–21', current: false },
  { id: 'skystone', game: 'SKYSTONE', years: '2019–20', current: false },
  { id: 'rover-ruckus', game: 'ROVER RUCKUS', years: '2018–19', current: false },
  { id: 'relic-recovery', game: 'RELIC RECOVERY', years: '2017–18', current: false },
  { id: 'velocity-vortex', game: 'VELOCITY VORTEX', years: '2016–17', current: false },
];
