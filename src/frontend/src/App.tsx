import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastProvider } from '@/components/ui/toaster';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Layout } from '@/components/layout/Layout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { CreateProject } from '@/pages/CreateProject';
import { Deploys } from '@/pages/Deploys';
import { Billing } from '@/pages/Billing';
import { Storage } from '@/pages/Storage';
import { SeoAudit } from '@/pages/SeoAudit';
import { Settings } from '@/pages/Settings';
import { Docs } from '@/pages/Docs';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { PricingPage } from '@/pages/PricingPage';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { FaqPage } from '@/pages/FaqPage';
import { StatusPage } from '@/pages/StatusPage';
import { SecurityPage } from '@/pages/SecurityPage';
import { ProductPage } from '@/pages/ProductPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader text="Verifying session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader text="Loading..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/product" element={<ProductPage />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/architecture" element={<ArchitecturePage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projects/new" element={<CreateProject />} />
                    <Route path="deploys/:projectId" element={<Deploys />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="storage" element={<Storage />} />
                    <Route path="seo" element={<SeoAudit />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
