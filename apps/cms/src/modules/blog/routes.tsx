import { createRoute, redirect, lazyRouteComponent } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { TabbedModule } from '../../components/edit';
import type { ModuleTab } from '../../components/edit';

const TABS: ModuleTab[] = [
  { href: '/blog/posts', label: 'Posts' },
  { href: '/blog/topics', label: 'Topics' },
];

/** /blog: a tab row over Posts and Topics, each a list → edit screen. */
export function blogRoutes(parent: AnyRoute): AnyRoute[] {
  const blog = createRoute({ getParentRoute: () => parent, path: '/blog', component: () => <TabbedModule label="BrickLog sections" tabs={TABS} /> });
  const posts = createRoute({ getParentRoute: () => blog, path: 'posts', component: lazyRouteComponent(() => import('./PostsList'), 'PostsLayout') });
  const topics = createRoute({ getParentRoute: () => blog, path: 'topics', component: lazyRouteComponent(() => import('./TopicsList'), 'TopicsLayout') });
  return [blog.addChildren([
    createRoute({ getParentRoute: () => blog, path: '/', beforeLoad: () => { throw redirect({ to: '/blog/posts' }); } }),
    posts.addChildren([
      createRoute({ getParentRoute: () => posts, path: '/', component: lazyRouteComponent(() => import('./PostsList'), 'PostsIndex') }),
      createRoute({ getParentRoute: () => posts, path: 'new', component: lazyRouteComponent(() => import('./PostEditor'), 'PostNew') }),
      createRoute({ getParentRoute: () => posts, path: '$id', component: lazyRouteComponent(() => import('./PostEditor'), 'PostEdit') }),
    ]),
    topics.addChildren([
      createRoute({ getParentRoute: () => topics, path: '/', component: lazyRouteComponent(() => import('./TopicsList'), 'TopicsIndex') }),
      createRoute({ getParentRoute: () => topics, path: 'new', component: lazyRouteComponent(() => import('./TopicEditor'), 'TopicNew') }),
      createRoute({ getParentRoute: () => topics, path: '$id', component: lazyRouteComponent(() => import('./TopicEditor'), 'TopicEdit') }),
    ]),
  ])];
}
