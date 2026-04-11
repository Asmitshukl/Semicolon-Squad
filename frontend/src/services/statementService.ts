import api from './api';

export type VictimStatementPayload = {
  rawText: string;
  translatedText?: string;
  language?: string;
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  witnessDetails?: string;
};

export const statementService = {
  async create(payload: VictimStatementPayload) {
    const { data } = await api.post('/victim/statements', payload);
    return data;
  },

  async getLatest() {
    const { data } = await api.get('/victim/statements/latest');
    return data;
  },
};
