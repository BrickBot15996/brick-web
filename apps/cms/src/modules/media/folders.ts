import type { MediaFile } from '../../lib/data/media';
import { folderOf } from '../../lib/data/media';

/** The §11 tree, so folders show up before they hold a file. Season and other entity folders appear as files arrive. */
const SEASONS = ['velocity-vortex', 'relic-recovery', 'rover-ruckus', 'skystone', 'ultimate-goal', 'freight-frenzy', 'powerplay', 'centerstage', 'into-the-deep', 'decode', 'biobuzz'];
export const CANONICAL_FOLDERS: string[] = [
  'brand/', 'brand/graphics/', 'brand/fonts/',
  'site/', 'site/home/', 'site/story/', 'site/story/timeline/', 'site/team/', 'site/join/', 'site/og/',
  'seasons/', ...SEASONS.map((s) => `seasons/${s}/`),
  'gallery/', 'gallery/general/', ...SEASONS.map((s) => `gallery/${s}/`),
  'blog/', 'sponsors/', 'documents/', 'press/', 'press/photos/', 'projects/', 'links/', 'links/icons/', 'external/',
];

export interface FolderNode { path: string; name: string; depth: number; parent: string | null; count: number; children: FolderNode[] }

const ancestors = (path: string): string[] => {
  const parts = path.replace(/\/$/, '').split('/');
  return parts.map((_, i) => `${parts.slice(0, i + 1).join('/')}/`);
};

/** Builds the folder tree from the canonical list plus every folder a file lives in. `count` is files inside, subfolders included. */
export function buildTree(files: MediaFile[]): FolderNode[] {
  const paths = new Set<string>();
  for (const p of CANONICAL_FOLDERS) ancestors(p).forEach((a) => paths.add(a));
  for (const f of files) { const d = folderOf(f.key); if (d) ancestors(d).forEach((a) => paths.add(a)); }
  const order = new Map(CANONICAL_FOLDERS.map((p, i) => [p, i]));
  const nodes = new Map<string, FolderNode>();
  for (const path of paths) {
    const parts = path.replace(/\/$/, '').split('/');
    nodes.set(path, { path, name: parts[parts.length - 1], depth: parts.length - 1, parent: parts.length > 1 ? `${parts.slice(0, -1).join('/')}/` : null, count: 0, children: [] });
  }
  for (const f of files) { const d = folderOf(f.key); if (d) for (const a of ancestors(d)) nodes.get(a)!.count++; }
  const cmp = (a: FolderNode, b: FolderNode) => (order.get(a.path) ?? 1e6) - (order.get(b.path) ?? 1e6) || a.name.localeCompare(b.name);
  const roots: FolderNode[] = [];
  for (const n of nodes.values()) (n.parent ? nodes.get(n.parent)!.children : roots).push(n);
  for (const n of nodes.values()) n.children.sort(cmp);
  return roots.sort(cmp);
}

/** Visible rows of the rail: a node's children show when it is expanded. */
export function visibleNodes(roots: FolderNode[], open: Set<string>): FolderNode[] {
  const out: FolderNode[] = [];
  const walk = (n: FolderNode) => { out.push(n); if (open.has(n.path)) n.children.forEach(walk); };
  roots.forEach(walk);
  return out;
}
export { ancestors };
