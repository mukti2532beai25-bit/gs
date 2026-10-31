// BahiVerse AI — API Client

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ── Token management ──────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('bv_token');
}
export function setToken(token: string): void {
  localStorage.setItem('bv_token', token);
}
export function clearToken(): void {
  localStorage.removeItem('bv_token');
  localStorage.removeItem('bv_user');
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  // Return raw response for file downloads
  if (options.headers && (options.headers as any)['Accept'] === 'blob') {
    return res.blob() as unknown as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ── Multipart fetch (for file uploads) ───────────────────────────────────────
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try { const j = await res.json(); errorMsg = j.error || errorMsg; } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

// ── Universal api wrapper ─────────────────────────────────────────────────────
export const api = {
  get: async <T = any>(path: string) => {
    const data = await apiFetch<T>(path, { method: 'GET' });
    return { data };
  },
  post: async <T = any>(path: string, body?: any, config?: { headers?: any; responseType?: string }) => {
    if (body instanceof FormData) {
      const data = await apiUpload<T>(path, body);
      return { data };
    }
    const headers = config?.responseType === 'blob' ? { Accept: 'blob' } : config?.headers || {};
    const data = await apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
    return { data };
  },
  patch: async <T = any>(path: string, body?: any) => {
    const data = await apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
    return { data };
  },
  delete: async <T = any>(path: string) => {
    const data = await apiFetch<T>(path, { method: 'DELETE' });
    return { data };
  },
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { name: string; email: string; password: string; businessName?: string }) =>
    apiFetch<{ token: string; user: any }>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch<any>('/api/auth/me'),
};

// ── Bills ─────────────────────────────────────────────────────────────────────
export const billsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return apiFetch<{ bills: any[]; total: number; page: number; pages: number }>(`/api/bills?${q}`);
  },
  stats: () => apiFetch<any>('/api/bills/stats'),
  get: (id: string) => apiFetch<any>(`/api/bills/${id}`),
  capture: (formData: FormData) => apiUpload<any>('/api/bills/capture', formData),
  review: (id: string, data: any) =>
    apiFetch<any>(`/api/bills/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id: string) =>
    apiFetch<any>(`/api/bills/${id}/approve`, { method: 'PATCH' }),
  delete: (id: string) =>
    apiFetch<any>(`/api/bills/${id}`, { method: 'DELETE' }),
  voice: (data: { transcript: string; language?: string; billId?: string }) =>
    apiFetch<any>('/api/bills/voice', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Business ──────────────────────────────────────────────────────────────────
export const businessApi = {
  get: () => apiFetch<any>('/api/business'),
  update: (data: any) => apiFetch<any>('/api/business', { method: 'PUT', body: JSON.stringify(data) }),
  analytics: (params?: { range?: string }) => {
    const q = new URLSearchParams();
    if (params?.range) q.set('range', params.range);
    return apiFetch<{ success: boolean; data: any }>(`/api/business/analytics?${q}`);
  },
  getCustomers: () => apiFetch<any[]>('/api/business/customers'),
  createCustomer: (data: any) =>
    apiFetch<any>('/api/business/customers', { method: 'POST', body: JSON.stringify(data) }),
  getProducts: () => apiFetch<any[]>('/api/business/products'),
  createProduct: (data: any) =>
    apiFetch<any>('/api/business/products', { method: 'POST', body: JSON.stringify(data) }),
};


// ── Vocabulary ────────────────────────────────────────────────────────────────
export const vocabApi = {
  list: async (params?: { category?: string; language?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.language) q.set('language', params.language);
    if (params?.search) q.set('search', params.search);
    const res = await apiFetch<any>(`/api/vocab?${q}`);
    return Array.isArray(res) ? res : res.data || [];
  },
  create: (data: any) => apiFetch<any>('/api/vocab', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/api/vocab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setStatus: (id: string, status: string) =>
    apiFetch<any>(`/api/vocab/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => apiFetch<any>(`/api/vocab/${id}`, { method: 'DELETE' }),
};

// ── Normalization & Schema ────────────────────────────────────────────────────
export const normalizationApi = {
  schema: () => apiFetch<{ success: boolean; data: any }>('/api/normalization/schema'),
  health: () => apiFetch<{ success: boolean; data: any }>('/api/normalization/health'),
  reviewDependency: (id: string, status: 'confirmed' | 'rejected' | 'hypothesis') =>
    apiFetch<any>('/api/normalization/dependencies/review', { method: 'POST', body: JSON.stringify({ id, status }) }),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  preview: (data: {
    format: string;
    entity?: string;
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiFetch<{ success: boolean; data: any }>('/api/export/preview', { method: 'POST', body: JSON.stringify(data) }),
  generate: async (data: {
    format: string;
    entity?: string;
    status?: string;
    customerId?: string;
    billIds?: string[];
    allApproved?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${API_BASE}/api/export`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Export failed');
    }
    const blob = await res.blob();
    const fileName = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') || 'export';
    return { blob, fileName };
  },
  history: async () => {
    const res = await apiFetch<any>('/api/export/history');
    return Array.isArray(res) ? res : res.data || [];
  },
};

// ── Voice & WhisperFlow ───────────────────────────────────────────────────────
export const voiceApi = {
  parse: (data: { transcript: string; language?: string; billId?: string }) =>
    apiFetch<{ success: boolean; data: any }>('/api/voice/parse', { method: 'POST', body: JSON.stringify(data) }),
  apply: (data: { billId: string; action: any }) =>
    apiFetch<{ success: boolean; data: any; offlineNotice?: string }>('/api/voice/apply', { method: 'POST', body: JSON.stringify(data) }),
  history: () =>
    apiFetch<{ success: boolean; data: any[]; offlineNotice?: string }>('/api/voice/history'),
};

// ── Natural Language Business Intelligence & AI Assistant ────────────────────
export const aiApi = {
  query: (data: { question: string; language?: string }) =>
    apiFetch<{
      success: boolean;
      type: 'analytics' | 'action_proposal' | 'security_violation' | 'unknown';
      question: string;
      language: string;
      answer: string;
      answer_hi?: string;
      answer_pa?: string;
      visualization?: any;
      actionProposal?: any;
      securityNotice?: string;
      rawSqlEquivalent?: string;
    }>('/api/ai/query', { method: 'POST', body: JSON.stringify(data) }),

  confirmAction: (data: {
    action: string;
    productId: string;
    newPrice?: number;
    newName?: string;
    newCategory?: string;
  }) =>
    apiFetch<{
      success: boolean;
      message: string;
      updatedProduct?: any;
      historicalAuditNotice?: string;
    }>('/api/ai/action/confirm', { method: 'POST', body: JSON.stringify(data) }),

  suggestions: (language?: string) => {
    const q = new URLSearchParams();
    if (language) q.set('language', language);
    return apiFetch<{ success: boolean; data: any[]; language: string }>(`/api/ai/suggestions?${q}`);
  },
};

