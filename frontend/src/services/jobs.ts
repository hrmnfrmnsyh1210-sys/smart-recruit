import api from './api';
import type { Job, PaginatedResponse } from '../types';

export interface JobFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateJobRequest {
  title: string;
  department: string;
  description: string;
  requirements: string;
  skills_required: string[];
  min_experience_years: number;
  education_level: string;
  status?: 'open' | 'closed' | 'draft';
}

export const jobService = {
  async list(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
    const response = await api.get<PaginatedResponse<Job>>('/jobs', { params: filters });
    return response.data;
  },

  async getById(id: number): Promise<Job> {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  async create(data: CreateJobRequest): Promise<Job> {
    const response = await api.post<Job>('/jobs', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateJobRequest>): Promise<Job> {
    const response = await api.put<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },
};
