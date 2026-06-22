import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { PAGES, mainPage } from '@/pages.config';
import { createPageUrl } from '@/utils';
import Layout from '@/Layout';
import NotFound from '@/pages/NotFound';

/*
  Phase 0 router: registry-driven routes, no auth gating yet.
  Phase 1 wraps this in <AuthProvider> (Stack Auth) + <ThemeProvider> and
  swaps the temporary Layout for the themed bottom-nav shell.
*/
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            {Object.entries(PAGES).map(([name, Page]) => (
              <Route
                key={name}
                path={name === mainPage ? '/' : createPageUrl(name)}
                element={<Page />}
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
