import api from './api';
import type { User } from '../types/user.types';

/* ── Payload shapes ─────────────────────────────────────────────── */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface VictimRegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender?: string;
  language?: string;
}

export interface OfficerRegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  badgeNumber: string;
  stationCode: string;
  rank?: string;
}

/* ── Response shapes ────────────────────────────────────────────── */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface OfficerRegisterResponse {
  message: string;
}

/* ── Service ────────────────────────────────────────────────────── */
export const authService = {
  /** Role-aware login — backend determines portal from user.role */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  /** Victim self-registration — returns token immediately */
  async victimRegister(payload: VictimRegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/victim/register', payload);
    return data;
  },

  /** Officer registration — account pends admin approval, no token returned */
  async officerRegister(payload: OfficerRegisterData): Promise<OfficerRegisterResponse> {
    const { data } = await api.post<OfficerRegisterResponse>(
      '/auth/officer/register',
      payload,
    );
    return data;
  },

  /** Exchange refresh token for new access token */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const { data } = await api.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  /** Invalidate session on server */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /** Fetch current user profile */
  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};