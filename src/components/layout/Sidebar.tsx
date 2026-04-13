import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { PageKey } from '@/data/vcontent';
import { useAppShell } from '@/contexts/AppShellContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAV_SECTIONS, APP_PAGE_LABELS, APP_ROLE_META } from '@/lib/navigationConfig';
import { inferProductWorkflowModule, listOrdersWithProducts, listWorkflowRecords } from '@/services/vcontent';

const ROLE_META = APP_ROLE_META;

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getSidebarStatusClass(status: string | null | undefined) {
  if (['changes_requested', 'qc_fail', 'fail', 'rejected'].includes(String(status || ''))) return 'status-danger';
  if (['submitted', 'review', 'in_review', 'submitted_qc', 'submitted_video', 'claimed'].includes(String(status || ''))) return 'status-warning';
  if (['approved', 'qc_passed', 'completed', 'ready_delivery', 'done'].includes(String(status || ''))) return 'status-success';
  if (['in_progress', 'recording', 'editing', 'started'].includes(String(status || ''))) return 'status-working';
  return '';
}

function shouldShowSidebarStatus(pageKey: PageKey) {
  return pageKey !== 'smf03' && pageKey !== 'vsmf03';
}

export function Sidebar({ currentPage }: { currentPage: PageKey }) {
  const { role, isAllowed } = useAppShell();
  const { profile } = useAuth();
  const displayName = profile?.fullName || 'Tai khoan';
  const subtitle = profile?.title || APP_ROLE_META[role].title;
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', 'sidebar-nav-status'],
    queryFn: () => listWorkflowRecords({ kinds: ['slide_design'], includeReviews: false, includeQuestionLibrary: false }),
    staleTime: 1000 * 60 * 10,
  });

  const sidebarStatusByPage = new Map<PageKey, { status: string; changedAt: number }>();
  const orders = ordersQuery.data?.orders || [];
  const products = ordersQuery.data?.products || [];
  const slideDesigns = workflowQuery.data?.slideDesigns || [];

  for (const record of slideDesigns) {
    const product = products.find((item) => item.id === record.product_id);
    if (!product) continue;
    const order = orders.find((item) => item.id === product.order_id);
    if (!order) continue;
    const module = inferProductWorkflowModule(product.id, order.module);
    const pageKey = module === 'VIDEO' ? 'vsmf03' : module === 'ELN' ? 'smf03' : null;
    if (!pageKey) continue;

    const changedAt = new Date(
      String(record.updated_at || record.approved_at || record.returned_at || record.submitted_at || 0),
    ).getTime();
    const current = sidebarStatusByPage.get(pageKey);
    const next = String(record.status || '');
    if (!current || changedAt >= current.changedAt) {
      sidebarStatusByPage.set(pageKey, { status: next, changedAt });
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-badge">VC</div>
        <div>
          <div className="sidebar-title">VContent 3.0</div>
          <div className="sidebar-subtitle">{APP_ROLE_META[role].label}</div>
        </div>
      </div>

      <Link className="sidebar-profile sidebar-profile-link" to="/profile">
        <div className="sidebar-profile-avatar">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={displayName} className="profile-avatar-image" /> : <span>{getInitials(displayName || 'VC')}</span>}
        </div>
        <div>
          <div className="profile-name">{displayName} — {ROLE_META[role].label}</div>
          <div className="profile-role">{subtitle}</div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        {APP_NAV_SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <div className={`sidebar-label tone-${section.tone || 'default'}`}>{section.title}</div>
            {section.items.filter((item) => isAllowed(item.key)).map((item) => (
              <NavLink
                key={item.key}
                to={`/${item.key}`}
                className={({ isActive }) =>
                  `sidebar-link ${item.key === currentPage || isActive ? 'is-active' : ''} ${shouldShowSidebarStatus(item.key) ? getSidebarStatusClass(sidebarStatusByPage.get(item.key)?.status) : ''}`.trim()
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{APP_PAGE_LABELS[item.key]}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
