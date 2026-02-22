import api from './api';
import type { Ranking } from '../types';

export const rankingService = {
  async runRanking(jobId: number): Promise<{ task_id: string; message: string }> {
    const response = await api.post('/ranking/run', { job_id: jobId });
    return response.data;
  },

  async getByJob(jobId: number): Promise<Ranking[]> {
    const response = await api.get<Ranking[]>(`/ranking/job/${jobId}`);
    return response.data;
  },

  async compare(candidateIds: number[], jobId: number): Promise<Ranking[]> {
    const response = await api.get('/ranking/compare', {
      params: { candidate_ids: candidateIds.join(','), job_id: jobId },
    });
    return response.data;
  },

  async exportRanking(jobId: number, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await api.get(`/ranking/export/${jobId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
