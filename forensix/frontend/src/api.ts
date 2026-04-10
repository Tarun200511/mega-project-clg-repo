import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s for AI analysis
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fx_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Auth ───────────────────────────────────────────────────────────────────────
export const login = (badge_number: string, access_key: string) =>
  api.post('/api/auth/login', { badge_number, access_key });

// ── Cases ──────────────────────────────────────────────────────────────────────
export const getCases = (params?: { status?: string; priority?: string }) =>
  api.get('/api/cases', { params });

export const getCase = (id: number) =>
  api.get(`/api/case/${id}`);

export const createCase = (data: {
  title: string;
  description?: string;
  location?: string;
  investigator?: string;
  priority?: string;
  evidence_image_url?: string;
  ai_results?: Record<string, unknown>;
}) => api.post('/api/create-case', data);

export const updateCase = (id: number, data: Record<string, string>) =>
  api.patch(`/api/case/${id}`, data);

export const deleteCase = (id: number) =>
  api.delete(`/api/case/${id}`);

export const getCaseStats = () =>
  api.get('/api/cases/stats');

// ── Analysis ───────────────────────────────────────────────────────────────────
export const analyzeEvidence = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ── Reports ────────────────────────────────────────────────────────────────────
export const generateReport = (caseId: number) =>
  api.post(`/api/reports/${caseId}/generate`, {}, { responseType: 'blob' });

export default api;
