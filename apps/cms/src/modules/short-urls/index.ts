import type { ModuleDef } from '../types';
import { shortUrlsApi } from './data/api';
import { shortUrlRoutes } from './routes';
import './short-urls.css';

const shortUrls: ModuleDef = { id: 'short-urls', built: true, routes: shortUrlRoutes, search: (q) => shortUrlsApi.search(q) };
export default shortUrls;
