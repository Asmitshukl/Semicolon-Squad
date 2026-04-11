import { useEffect, useState, type ReactNode } from 'react';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';

export const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!token && !refreshToken) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [logout, refreshToken, setUser, token]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Restoring session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
