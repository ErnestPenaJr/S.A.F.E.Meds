import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PAGES, mainPage } from '@/pages.config';
import { createPageUrl } from '@/utils';
import Layout from '@/Layout';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import SharedView from '@/pages/SharedView';
import NotFound from '@/pages/NotFound';

function FullScreenSpinner() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function Gate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  // Public, no-auth route: a shared list opened via access code.
  if (pathname.toLowerCase().startsWith(createPageUrl('SharedView'))) {
    return <SharedView />;
  }

  if (isLoading) return <FullScreenSpinner />;
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path={createPageUrl('Signup')} element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  return (
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Gate />
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
