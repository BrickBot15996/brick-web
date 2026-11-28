import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
// Core styles first: a module's own CSS (imported by its folder's index.ts, through the router) must come after them in the cascade.
import './styles.css';
import './styles/shell.css';
import './styles/jump.css';
import './styles/home.css';
import './styles/kit.css';
import { router } from './router';

const queries = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queries}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
