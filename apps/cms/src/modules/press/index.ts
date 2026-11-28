import type { ModuleDef } from '../types';
import { pressApi } from './data/api';
import { pressRoutes } from './routes';
import './press.css';

const press: ModuleDef = { id: 'press', built: true, routes: pressRoutes, search: (q) => pressApi.search(q) };
export default press;
