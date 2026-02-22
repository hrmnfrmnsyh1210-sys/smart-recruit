import api from './api';
import type { UploadStatus } from '../types';

export const uploadService = {
  async uploadResumes(
    files: File[],
    jobId?: number,
    onProgress?: (progress: number) => void
  ): Promise<{ task_ids: string[]; message: string }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (jobId) formData.append('job_id', String(jobId));

    const response = await api.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return response.data;
  },

  async getStatus(taskId: string): Promise<UploadStatus> {
    const response = await api.get<UploadStatus>(`/upload/status/${taskId}`);
    return response.data;
  },
};
