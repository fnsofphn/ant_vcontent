import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { PageKey, RoleKey } from '@/data/vcontent';
import { getAllowedPagesForRole } from '@/lib/navigationConfig';

type AppShellContextValue = {
  role: RoleKey;
  setRole: (role: RoleKey) => void;
  isAllowed: (page: PageKey) => boolean;
  fallbackPage: PageKey;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<RoleKey>('admin');

  const value = useMemo<AppShellContextValue>(() => {
    const allowed = getAllowedPagesForRole(role);
    return {
      role,
      setRole,
      isAllowed: (page) => allowed.includes(page),
      fallbackPage: allowed[0] ?? 'dashboard',
    };
  }, [role]);

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
}
