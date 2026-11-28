import type { ModuleDef } from '../types';
import { settingsApi } from './data/api';
import { settingsRoutes } from './routes';
import './settings.css';

const settings: ModuleDef = { id: 'settings', built: true, routes: settingsRoutes, search: (q) => settingsApi.search(q) };
export default settings;
