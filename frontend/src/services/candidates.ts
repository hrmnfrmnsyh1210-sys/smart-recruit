import api from './api';
import type { Candidate, PaginatedResponse } from '../types';

export interface CandidateFilters {
  page?: number;
  page_size?: number;
  search?: string;
  skills?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const candidateService = {
  async list(filters: CandidateFilters = {}): Promise<PaginatedResponse<Candidate>> {
    const response = await api.get<PaginatedResponse<Candidate>>('/candidates', {
      params: filters,
    });
    return response.data;
  },

  async getById(id: number): Promise<Candidate> {
    const response = await api.get<Candidate>(`/candidates/${id}`);
    return response.data;
  },

  async update(id: number, data: Partial<Candidate>): Promise<Candidate> {
    const response = await api.put<Candidate>(`/candidates/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/candidates/${id}`);
  },

  async exportData(id: number): Promise<Blob> {
    const response = await api.get(`/candidates/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
