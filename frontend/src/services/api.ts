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
  getCustomers: () => apiFetch<any[]>('/api/business/customers'),
  createCustomer: (data: any) =>
    apiFetch<any>('/api/business/customers', { method: 'POST', body: JSON.stringify(data) }),
  getProducts: () => apiFetch<any[]>('/api/business/products'),
  createProduct: (data: any) =>
    apiFetch<any>('/api/business/products', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Vocabulary ────────────────────────────────────────────────────────────────
export const vocabApi = {
  list: (params?: { category?: string; language?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.language) q.set('language', params.language);
    if (params?.search) q.set('search', params.search);
    return apiFetch<any[]>(`/api/vocab?${q}`);
  },
  create: (data: any) => apiFetch<any>('/api/vocab', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/api/vocab/${id}`, { method: 'DELETE' }),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  generate: async (data: { format: string; billIds?: string[]; allApproved?: boolean; dateFrom?: string; dateTo?: string }) => {
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
  history: () => apiFetch<any[]>('/api/export/history'),
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
