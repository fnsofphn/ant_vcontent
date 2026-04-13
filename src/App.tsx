import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
import { AppShellProvider } from '@/contexts/AppShellContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/system/ToastProvider';
import { recordTelemetry } from '@/lib/telemetry';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const PublicGamePage = lazy(() => import('@/pages/PublicGamePage').then((module) => ({ default: module.PublicGamePage })));
const PublicLecturerAssessmentPage = lazy(() => import('@/pages/PublicLecturerAssessmentPage').then((module) => ({ default: module.PublicLecturerAssessmentPage })));
const WorkspacePage = lazy(() => import('@/pages/WorkspacePage').then((module) => ({ default: module.WorkspacePage })));

const QUERY_CACHE_STORAGE_KEY = 'vcontent.query-cache';
const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 15;
const QUERY_CACHE_MAX_PERSIST_BYTES = 350 * 1024;

function shouldPersistQuery(queryKey: readonly unknown[]) {
  const rootKey = String(queryKey[0] || '');
  return rootKey === 'orders' || rootKey === 'notifications';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

function restorePersistedQueryCache() {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { savedAt?: number; state?: unknown };
    if (!parsed?.savedAt || !parsed.state) return;
    if (Date.now() - parsed.savedAt > QUERY_CACHE_MAX_AGE_MS) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return;
    }
    hydrate(queryClient, parsed.state);
    recordTelemetry('query_cache.restored', { age_ms: Date.now() - parsed.savedAt });
  } catch (error) {
    recordTelemetry('query_cache.restore_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

restorePersistedQueryCache();

function QueryCachePersistence() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }

      saveTimer = window.setTimeout(() => {
        try {
          const state = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' && shouldPersistQuery(query.queryKey),
          });
          const nextPayload = JSON.stringify({
            savedAt: Date.now(),
            state,
          });
          if (nextPayload.length > QUERY_CACHE_MAX_PERSIST_BYTES) {
            recordTelemetry('query_cache.persist_skipped', {
              reason: 'payload_too_large',
              bytes: nextPayload.length,
            });
            return;
          }
          window.localStorage.setItem(QUERY_CACHE_STORAGE_KEY, nextPayload);
        } catch (error) {
          recordTelemetry('query_cache.persist_failed', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }, 250);
    });

    return () => {
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      unsubscribe();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryCachePersistence />
      <AuthProvider>
        <ToastProvider>
          <AppShellProvider>
            <BrowserRouter>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/play/evnspc" element={<PublicGamePage />} />
                  <Route path="/apply/lecturer/:formId" element={<PublicLecturerAssessmentPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path=":pageId" element={<WorkspacePage />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AppShellProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
