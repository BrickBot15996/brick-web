import type { ModuleDef } from '../types';
import { blogApi } from './data/api';
import { blogRoutes } from './routes';
import './blog.css';

const blog: ModuleDef = { id: 'blog', built: true, routes: blogRoutes, search: (q) => blogApi.search(q) };
export default blog;
