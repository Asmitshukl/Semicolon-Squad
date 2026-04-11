import api from './api';

export const bnsService = {
  async classify(statementId?: string) {
    const { data } = await api.post('/victim/classify', statementId ? { statementId } : {});
    return data;
  },

  async getRights(statementId?: string) {
    const { data } = await api.post('/victim/rights', statementId ? { statementId } : {});
    return data;
  },

  async getResolution(statementId: string) {
    const { data } = await api.post('/victim/resolution', { statementId });
    return data;
  },
};
