import api from './api';
import type { AnalyticsOverview } from '../types';

export interface TrendData {
  date: string;
  count: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export interface BiasReport {
  job_id: number;
  total_candidates: number;
  demographic_distribution: Record<string, number>;
  score_by_demographic: Record<string, number>;
  four_fifths_compliant: boolean;
  details: string;
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>('/analytics/overview');
    return response.data;
  },

  async getApplicantsTrend(days: number = 30): Promise<TrendData[]> {
    const response = await api.get<TrendData[]>('/analytics/applicants-trend', {
      params: { days },
    });
    return response.data;
  },

  async getScoreDistribution(jobId?: number): Promise<ScoreDistribution[]> {
    const response = await api.get<ScoreDistribution[]>('/analytics/score-distribution', {
      params: jobId ? { job_id: jobId } : {},
    });
    return response.data;
  },

  async getSourceBreakdown(): Promise<SourceBreakdown[]> {
    const response = await api.get<SourceBreakdown[]>('/analytics/source-breakdown');
    return response.data;
  },

  async getBiasReport(jobId: number): Promise<BiasReport> {
    const response = await api.get<BiasReport>(`/analytics/bias-report/${jobId}`);
    return response.data;
  },
};
