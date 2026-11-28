import type { ModuleDef } from '../types';
import { seasonsApi } from './data/api';
import { seasonRoutes } from './routes';
import './seasons.css';

const seasons: ModuleDef = { id: 'seasons', built: true, routes: seasonRoutes, search: (q) => seasonsApi.search(q) };
export default seasons;
