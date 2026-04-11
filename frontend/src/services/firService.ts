import api from './api';

export const firService = {
  async listVictimCases() {
    const { data } = await api.get('/victim/cases');
    return data;
  },

  async trackByAcknowledgment(acknowledgmentNo: string) {
    const { data } = await api.get('/victim/cases/track', {
      params: { acknowledgmentNo },
    });
    return data;
  },
};
