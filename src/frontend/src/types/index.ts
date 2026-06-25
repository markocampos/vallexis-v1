// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  storage_used_bytes: number;
  storage_limit: number;
  created_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  git_repo: string;
  git_branch: string;
  subdomain: string;
  status: 'idle' | 'building' | 'deployed' | 'failed';
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  git_repo: string;
  git_branch: string;
}

export interface UpdateProjectRequest {
  name?: string;
  git_repo?: string;
  git_branch?: string;
}

// Deploy types
export interface Deploy {
  id: string;
  project_id: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  commit_hash?: string;
  commit_message?: string;
  created_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface CreateDeployRequest {
  project_id: string;
}

// Storage types
export interface StorageFile {
  id: string;
  project_id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
}

export interface UploadRequest {
  file: File;
  project_id: string;
}

// Billing types
export interface Subscription {
  id: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  due_date?: string;
  invoice_url?: string;
}

// SEO types
export interface SEOAudit {
  id: string;
  project_id: string;
  status: 'pending' | 'completed' | 'failed';
  overall_score: number;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  created_at: string;
  completed_at?: string;
}

export interface SEOIssue {
  id: string;
  audit_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'accessibility' | 'best_practices' | 'seo';
  title: string;
  description: string;
  recommendation: string;
}

// Settings types
export interface UserSettings {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    deploy: boolean;
    billing: boolean;
    security: boolean;
  };
}

export interface StorageStats {
  used: number;
  limit: number;
  file_count: number;
}

// Common API response types
export interface APIError {
  errors: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
