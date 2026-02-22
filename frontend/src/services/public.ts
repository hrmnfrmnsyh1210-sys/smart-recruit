import axios from 'axios';
import type { Job } from '../types';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/public`
    : '/api/public',
  headers: { 'Content-Type': 'application/json' },
});

export const publicService = {
  async listOpenJobs(): Promise<Job[]> {
    const response = await publicApi.get<Job[]>('/jobs');
    return response.data;
  },

  async getJobDetail(jobId: number): Promise<Job> {
    const response = await publicApi.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },

  async apply(
    data: { full_name: string; email: string; phone: string; job_id: number },
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<{ message: string; candidate_id: number; job_title: string }> {
    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('job_id', String(data.job_id));
    formData.append('file', file);

    const response = await publicApi.post('/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return response.data;
  },
};
