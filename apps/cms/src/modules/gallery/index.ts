import type { ModuleDef } from '../types';
import { galleryApi } from './data/api';
import { galleryRoutes } from './routes';
import './gallery.css';

const gallery: ModuleDef = { id: 'gallery', built: true, routes: galleryRoutes, search: (q) => galleryApi.search(q) };
export default gallery;
