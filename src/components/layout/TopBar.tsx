import { Link } from 'react-router-dom';
import { ROLE_META, normalizeAppRole, type PageKey, type RoleKey } from '@/data/vcontent';
import { useAppShell } from '@/contexts/AppShellContext';
import { useAuth } from '@/contexts/AuthContext';

const roles = Object.keys(ROLE_META) as RoleKey[];

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function TopBar({ currentPage: _currentPage, title }: { currentPage: PageKey; title: string }) {
  const { role, setRole } = useAppShell();
  const { profile, signOut } = useAuth();
  const effectiveRole = profile?.role ? normalizeAppRole(profile.role) : role;
  const displayName = profile?.fullName || 'T\u00e0i kho\u1ea3n';
  const displayTitle = _currentPage === 'profile' ? 'H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n' : title;
  const profileLabel = 'H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n';
  const signOutLabel = '\u0110\u0103ng xu\u1ea5t';

  return (
    <header className="topbar">
      <div>
        <div className="topbar-eyebrow">PeopleOne / {displayTitle}</div>
        <h1 className="topbar-title">{displayTitle}</h1>
      </div>
      <div className="topbar-actions">
        <div className="topbar-control-cluster">
          <span className="session-chip session-chip-primary">
            <span className="session-chip-label">{profile ? profile.fullName : 'Auth'}</span>
            <span className="session-chip-meta">{profile ? profile.accessScope : 'scope hoa RLS'}</span>
          </span>
          <select
            className="role-switcher"
            value={effectiveRole}
            onChange={(event) => setRole(event.target.value as RoleKey)}
            aria-label="Chon vai tro"
            disabled={Boolean(profile?.role)}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {ROLE_META[item].label}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost topbar-signout" onClick={() => void signOut()}>
            {signOutLabel}
          </button>
        </div>
        <Link className="topbar-avatar" to="/profile" aria-label={profileLabel}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={displayName} className="topbar-avatar-image" />
          ) : (
            <span>{getInitials(displayName || ROLE_META[effectiveRole].label)}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
