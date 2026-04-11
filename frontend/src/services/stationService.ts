import api from './api';

export const stationService = {
  async list(query?: string) {
    const { data } = await api.get('/victim/stations', {
      params: query ? { query } : undefined,
    });
    return data;
  },
};
