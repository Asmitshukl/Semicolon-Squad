import api from './api';
import type { OfficerRegisterData } from './authService';

export type AdminStationPayload = {
  name: string;
  stationCode: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  jurisdictionArea?: string;
};

export type AdminDashboardResponse = {
  stats: {
    pendingOfficerActions: number;
    policeStations: number;
    firsFiled24h: number;
    bnsSectionsLive: number;
  };
  recentOfficers: Array<{
    id: string;
    badgeNumber: string;
    verificationStatus: string;
    submittedAt: string;
    name: string;
    stationName: string;
  }>;
  systemStatus: {
    lastSync: string;
    apiGateway: string;
    auditLogStream: string;
  };
};

export const adminService = {
  async getDashboard(): Promise<AdminDashboardResponse> {
    const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard');
    return data;
  },

  async listOfficers(status?: string) {
    const { data } = await api.get('/admin/officers', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async reviewOfficer(officerId: string, action: 'approve' | 'reject') {
    const { data } = await api.post('/admin/officers/review', {
      officerId,
      action,
    });
    return data;
  },

  async createOfficer(payload: OfficerRegisterData) {
    const { data } = await api.post('/admin/officers/create', payload);
    return data;
  },

  async listStations() {
    const { data } = await api.get('/admin/stations');
    return data;
  },

  async createStation(payload: AdminStationPayload) {
    const { data } = await api.post('/admin/stations', payload);
    return data;
  },

  async listBns(query?: string) {
    const { data } = await api.get('/admin/bns', {
      params: query ? { query } : undefined,
    });
    return data;
  },
};
