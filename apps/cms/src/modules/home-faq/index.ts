import type { ModuleDef } from '../types';
import { homeFaqApi } from './data/api';
import { homeFaqRoutes } from './routes';
import './home-faq.css';

const homeFaq: ModuleDef = { id: 'home-faq', built: true, routes: homeFaqRoutes, search: (q) => homeFaqApi.search(q) };
export default homeFaq;
