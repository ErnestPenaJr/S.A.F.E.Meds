import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PAGES, mainPage } from '@/pages.config';
import { createPageUrl } from '@/utils';
import Layout from '@/Layout';
import Login from '@/pages/Login';
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
  if (isLoading) return <FullScreenSpinner />;
  if (!isAuthenticated) return <Login />;
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
