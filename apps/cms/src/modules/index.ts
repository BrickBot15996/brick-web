import { setSearchProviders } from '../lib/data/search';
import type { ModuleDef } from './types';

// One import per module folder. A module agent replaces its folder's index.ts; this file never changes.
import blog from './blog';
import seasons from './seasons';
import team from './team';
import gallery from './gallery';
import projects from './projects';
import support from './support';
import homeFaq from './home-faq';
import press from './press';
import settings from './settings';
import linktree from './linktree';
import shortUrls from './short-urls';
import media from './media';
import users from './users';
import permissions from './permissions';
import audit from './audit';

/** Every module of lib/modules.ts except Home (a core screen), in rail order. */
export const registry: ModuleDef[] = [blog, seasons, team, gallery, projects, support, homeFaq, press, settings, linktree, shortUrls, media, users, permissions, audit];

// The jump palette searches through whatever the modules offer.
setSearchProviders(registry.flatMap((m) => (m.search ? [{ module: m.id, search: m.search }] : [])));
