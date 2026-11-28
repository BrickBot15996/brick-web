import type { ModuleDef } from '../types';
import { mediaApi } from '../../lib/data/media';
import { mediaRoutes } from './routes';
import './data/preview-files';
import './media.css';

const media: ModuleDef = { id: 'media', built: true, routes: mediaRoutes, search: (q) => mediaApi.search(q) };
export default media;
