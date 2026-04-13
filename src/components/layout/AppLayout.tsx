import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { PAGE_LABELS, getAllowedPages, normalizeAppRole, type PageKey } from '@/data/vcontent';
import { useAppShell } from '@/contexts/AppShellContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  const { pageId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAppShell();
  const { loading, profile } = useAuth();
  const effectiveRole = profile?.role ? normalizeAppRole(profile.role) : role;
  const allowedPages = getAllowedPages(effectiveRole);
  const fallbackPage = allowedPages[0] ?? 'dashboard';

  useEffect(() => {
    if (profile?.role) {
      setRole(normalizeAppRole(profile.role));
    }
  }, [profile?.role, setRole]);

  useEffect(() => {
    if (loading) return;

    const current = (pageId || 'dashboard') as PageKey;
    if (!allowedPages.includes(current)) {
      navigate(`/${fallbackPage}`, { replace: true });
    }
  }, [allowedPages, fallbackPage, loading, navigate, pageId, location.pathname]);

  const currentPage = (pageId || 'dashboard') as PageKey;

  return (
    <div className="shell-frame">
      <Sidebar currentPage={currentPage} />
      <div className="shell-main">
        <TopBar currentPage={currentPage} title={PAGE_LABELS[currentPage] || 'VContent'} />
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
