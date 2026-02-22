export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'recruiter' | 'viewer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  skills_required: string[];
  min_experience_years: number;
  education_level: string;
  status: 'open' | 'closed' | 'draft';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  company: string;
  title: string;
  duration: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Candidate {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: string[];
  summary: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: number;
  candidate_id: number;
  file_path: string;
  file_type: 'pdf' | 'docx';
  file_size: number;
  raw_text: string;
  parsed_data: Record<string, unknown>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
}

export interface Ranking {
  id: number;
  job_id: number;
  candidate_id: number;
  candidate?: Candidate;
  overall_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  certification_score: number;
  semantic_similarity: number;
  rank_position: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_candidates: number;
  total_jobs: number;
  open_positions: number;
  avg_score: number;
  recent_uploads: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UploadStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}
