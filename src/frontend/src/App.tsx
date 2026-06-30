import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastProvider } from '@/components/ui/toaster';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Layout } from '@/components/layout/Layout';

const Landing = lazy(() => import('@/pages/Landing').then(module => ({ default: module.Landing })));
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('@/pages/Register').then(module => ({ default: module.Register })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Projects = lazy(() => import('@/pages/Projects').then(module => ({ default: module.Projects })));
const CreateProject = lazy(() => import('@/pages/CreateProject').then(module => ({ default: module.CreateProject })));
const Deploys = lazy(() => import('@/pages/Deploys').then(module => ({ default: module.Deploys })));
const Billing = lazy(() => import('@/pages/Billing').then(module => ({ default: module.Billing })));
const Storage = lazy(() => import('@/pages/Storage').then(module => ({ default: module.Storage })));
const SeoAudit = lazy(() => import('@/pages/SeoAudit').then(module => ({ default: module.SeoAudit })));
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));
const Docs = lazy(() => import('@/pages/Docs').then(module => ({ default: module.Docs })));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage').then(module => ({ default: module.FeaturesPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const ArchitecturePage = lazy(() => import('@/pages/ArchitecturePage').then(module => ({ default: module.ArchitecturePage })));
const FaqPage = lazy(() => import('@/pages/FaqPage').then(module => ({ default: module.FaqPage })));
const StatusPage = lazy(() => import('@/pages/StatusPage').then(module => ({ default: module.StatusPage })));
const SecurityPage = lazy(() => import('@/pages/SecurityPage').then(module => ({ default: module.SecurityPage })));
const ProductPage = lazy(() => import('@/pages/ProductPage').then(module => ({ default: module.ProductPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFound })));

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

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Vallexis';

    if (path === '/') {
      title = 'Vallexis - PaaS for Solo Founders';
    } else {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const formatted = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
        title = `${formatted} - Vallexis`;
      }
    }
    document.title = title;
  }, [location]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <TitleUpdater />
                <Suspense fallback={<PageLoader text="Loading page..." />}>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
