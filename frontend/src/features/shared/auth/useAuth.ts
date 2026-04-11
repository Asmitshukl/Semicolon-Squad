import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import {
  authService,
  type LoginCredentials,
  type VictimRegisterData,
  type OfficerRegisterData,
} from '../../../services/authService';

type ApiError = { response?: { data?: { message?: string } }; message?: string };

const extractMessage = (err: unknown, fallback: string) => {
  const e = err as ApiError;
  return e?.response?.data?.message ?? e?.message ?? fallback;
};

/* ── useAuth hook ───────────────────────────────────────────────── */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    setAuthData,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore();

  const navigate = useNavigate();

  /* ── login ─────────────────────────────────────────────────────── */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const { user, token, refreshToken, redirectTo } = await authService.login(credentials);
        setAuthData(user, token, refreshToken);
        navigate(redirectTo);
      } catch (err) {
        const msg = extractMessage(err, 'Login failed. Please try again.');
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setAuthData, setError, setLoading, navigate],
  );

  /* ── victim register ────────────────────────────────────────────── */
  const victimRegister = useCallback(
    async (data: VictimRegisterData) => {
      try {
        setLoading(true);
        setError(null);
        const { user, token, refreshToken, redirectTo } = await authService.victimRegister(data);
        setAuthData(user, token, refreshToken);
        navigate(redirectTo);
      } catch (err) {
        const msg = extractMessage(err, 'Registration failed. Please try again.');
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setAuthData, setError, setLoading, navigate],
  );

  /* ── officer register ───────────────────────────────────────────── */
  const officerRegister = useCallback(
    async (data: OfficerRegisterData) => {
      try {
        setLoading(true);
        setError(null);
        await authService.officerRegister(data);
        // Officer needs admin approval — redirect to login with notice
        navigate('/login?status=pending');
      } catch (err) {
        const msg = extractMessage(err, 'Registration failed. Please try again.');
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading, navigate],
  );

  /* ── logout ─────────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // swallow — still clear local state
    } finally {
      storeLogout();
      navigate('/login', { replace: true });
    }
  }, [storeLogout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    victimRegister,
    officerRegister,
    logout,
  };
};
