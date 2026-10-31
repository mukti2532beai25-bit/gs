// ─────────────────────────────────────────────────────────────────────────────
// BahiVerse AI — Core TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'hi' | 'pa';
export type BillStatus = 'pending' | 'extracted' | 'reviewed' | 'approved' | 'exported';
export type CaptureMode = 'upload' | 'camera' | 'voice' | 'manual';
export type ExportFormat = 'csv' | 'json' | 'tally-xml';
export type VocabCategory = 'product' | 'unit' | 'customer' | 'misc';
export type UserRole = 'owner' | 'staff';

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string | null;
  business: Business | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Business ──────────────────────────────────────────────────────────────────
export interface Business {
  id: string;
  name: string;
  gstin?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  language: Language;
  currency: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bills: number;
    customers: number;
    products: number;
    vocabulary: number;
  };
}

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  _count?: { bills: number };
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  businessId: string;
  name: string;
  aliases: string; // JSON string[]
  unit: string;
  defaultPrice?: number | null;
  category?: string | null;
  createdAt: string;
}

// ── Bill ──────────────────────────────────────────────────────────────────────
export interface Bill {
  id: string;
  businessId: string;
  userId: string;
  customerId?: string | null;
  customer?: Customer | null;
  imageUrl?: string | null;
  captureMode: CaptureMode;
  rawText?: string | null;
  language: Language;
  billNumber?: string | null;
  billDate?: string | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  subtotal?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  status: BillStatus;
  confidence: number;
  processingMs: number;
  createdAt: string;
  updatedAt: string;
  items?: BillItem[];
  corrections?: Correction[];
  processingJob?: ProcessingJob | null;
  _count?: { items: number };
}

// ── Bill Item ─────────────────────────────────────────────────────────────────
export interface BillItem {
  id: string;
  billId: string;
  productId?: string | null;
  rawDescription: string;
  normalizedName?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  confidence: number;
  isEdited: boolean;
}

// ── Correction ────────────────────────────────────────────────────────────────
export interface Correction {
  id: string;
  billId: string;
  userId: string;
  fieldName: string;
  originalValue?: string | null;
  correctedValue: string;
  source: 'manual' | 'voice';
  createdAt: string;
}

// ── Processing Job ────────────────────────────────────────────────────────────
export interface ProcessingJob {
  id: string;
  billId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  provider: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

// ── Vocabulary ────────────────────────────────────────────────────────────────
export interface VocabularyEntry {
  id: string;
  businessId: string;
  rawTerm: string;
  normalizedTerm: string;
  category: VocabCategory;
  language: Language;
  usageCount: number;
  createdAt: string;
}

// ── Export ────────────────────────────────────────────────────────────────────
export interface ExportRecord {
  id: string;
  userId: string;
  format: ExportFormat;
  fileName: string;
  fileUrl?: string | null;
  billCount: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  createdAt: string;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export interface DashboardStats {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  totalRevenue: number;
  avgConfidence: number;
}

// ── API Response wrappers ─────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ── UI State ──────────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
