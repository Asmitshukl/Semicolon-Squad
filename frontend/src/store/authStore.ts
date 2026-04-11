import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/user.types';

/* ── State & action shapes ──────────────────────────────────────── */
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  /** Hydrate store after successful login / victim register */
  setAuthData: (user: User, token: string, refreshToken: string) => void;
  /** Patch access token (called by silent refresh) */
  setToken: (token: string) => void;
  /** Patch both tokens after refresh token rotation */
  setSessionTokens: (token: string, refreshToken: string) => void;
  /** Optimistic user update (e.g. profile edit) */
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /** Wipe all auth state */
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

/* ── Store ──────────────────────────────────────────────────────── */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      /* initial state */
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /* actions */
      setAuthData: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true, error: null }),

      setToken: (token) => set({ token }),

      setSessionTokens: (token, refreshToken) => set({ token, refreshToken }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: 'fir-auth-store',
      storage: createJSONStorage(() => localStorage),
      /* only persist session fields, never loading / error */
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
