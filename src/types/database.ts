// src/types/database.ts

// ============================================
// Core Database Types
// ============================================

export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'failed';
export type ChunkType = 'text' | 'image' | 'table' | 'equation' | 'video_segment' | 'audio';
export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'CONCEPT' | 'TECHNOLOGY' | 'PRODUCT' | 'DATE';
export type QueryMode = 'naive' | 'local' | 'global' | 'hybrid' | 'mix';

// ============================================
// Document Types
// ============================================

export interface Document {
  id: string;
  user_id: string | null; // Owner of document
  organization_id: string | null;
  workspace: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_path: string | null;
  status: DocumentStatus;
  chunks_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentInsert {
  id?: string;
  user_id?: string; // CRITICAL: Required for data isolation
  organization_id?: string;
  workspace?: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_path?: string;
  status?: DocumentStatus;
  metadata?: Record<string, unknown>;
}

// ============================================
// Chunk Types
// ============================================

export interface Chunk {
  id: string;
  workspace: string;
  document_id: string;
  chunk_order_index: number;
  content: string;
  content_vector: number[] | null;
  tokens: number | null;
  chunk_type: ChunkType;
  page_idx: number | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChunkInsert {
  id?: string;
  user_id?: string; // CRITICAL: Required for data isolation
  workspace?: string;
  document_id: string;
  chunk_order_index: number;
  content: string;
  // content_vector can be number[] or string (pgvector format '[x,y,z,...]')
  content_vector?: number[] | string;
  tokens?: number;
  chunk_type?: ChunkType;
  page_idx?: number;
  timestamp_start?: number;
  timestamp_end?: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkWithScore extends Chunk {
  similarity: number;
}

// ============================================
// Entity Types
// ============================================

export interface Entity {
  id: string;
  workspace: string;
  entity_name: string;
  entity_type: EntityType | string;
  description: string | null;
  content_vector: number[] | null;
  source_chunk_ids: string[];
  created_at: string;
}

export interface EntityInsert {
  id?: string;
  user_id?: string; // CRITICAL: Required for data isolation
  workspace?: string;
  entity_name: string;
  entity_type: EntityType | string;
  description?: string;
  content_vector?: number[];
  source_chunk_ids?: string[];
}

export interface EntityWithScore extends Entity {
  similarity: number;
}

// ============================================
// Relation Types
// ============================================

export interface Relation {
  id: string;
  workspace: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  description: string | null;
  content_vector: number[] | null;
  source_chunk_ids: string[];
  created_at: string;
}

export interface RelationInsert {
  id?: string;
  user_id?: string; // CRITICAL: Required for data isolation
  workspace?: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  description?: string;
  content_vector?: number[];
  source_chunk_ids?: string[];
}

export interface RelationWithScore extends Relation {
  similarity: number;
}

// ============================================
// Processing Types
// ============================================

export interface ContentItem {
  type: 'text' | 'image' | 'table' | 'equation';
  content: string;
  page_idx?: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessingResult {
  chunks: ChunkInsert[];
  entities: EntityInsert[];
  relations: RelationInsert[];
}

export interface ExtractionResult {
  entities: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  relations: Array<{
    source: string;
    target: string;
    type: string;
    description: string;
  }>;
}

// ============================================
// Query Types
// ============================================

export interface QueryRequest {
  query: string;
  mode?: QueryMode;
  workspace?: string;
  top_k?: number;
}

export interface QueryResponse {
  response: string;
  sources: Array<{
    id: string;
    content: string;
    document_id: string;
    document_name?: string;
    document_type?: string;
    chunk_type?: ChunkType;
    similarity: number;
  }>;
  entities: Array<{
    name: string;
    type: string;
  }>;
}

export interface RetrievalResult {
  chunks: ChunkWithScore[];
  entities: EntityWithScore[];
  relations: RelationWithScore[];
  context: string;
}

// ============================================
// API Types
// ============================================

export interface UploadResponse {
  documentId: string;
  status: DocumentStatus;
  message: string;
}

export interface ProcessingStatus {
  status: DocumentStatus;
  progress: number;
  error?: string;
}

// ============================================
// Component Props Types
// ============================================

export interface DocumentUploaderProps {
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: Error) => void;
  maxFileSizeMB?: number;
}

export interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
  isLoading?: boolean;
}

export interface ChatInterfaceProps {
  onQueryModeChange?: (mode: QueryMode) => void;
  defaultMode?: QueryMode;
}

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: QueryResponse['sources'];
  timestamp?: Date;
}

export interface SourceReferencesProps {
  sources: QueryResponse['sources'];
  onSourceClick?: (documentId: string) => void;
}

// ============================================
// Organization / Multi-Tenant Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  gemini_api_key_encrypted: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInsert {
  id?: string;
  name: string;
  slug: string;
  gemini_api_key_encrypted?: string;
  settings?: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  org_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export interface ApiKeyInsert {
  id?: string;
  org_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  scopes?: string[];
  expires_at?: string;
}

export interface UsageStats {
  id: string;
  org_id: string;
  date: string;
  api_requests: number;
  llm_input_tokens: number;
  llm_output_tokens: number;
  embedding_requests: number;
  storage_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface UsageSummary {
  total_api_requests: number;
  total_llm_input_tokens: number;
  total_llm_output_tokens: number;
  total_embedding_requests: number;
  total_storage_bytes: number;
  daily_breakdown: Array<{
    date: string;
    api_requests: number;
    llm_input_tokens: number;
    llm_output_tokens: number;
    embedding_requests: number;
  }>;
}

export type AdminRole = 'owner' | 'admin' | 'viewer';

export interface AdminUser {
  id: string;
  org_id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserInsert {
  id?: string;
  org_id: string;
  email: string;
  password_hash: string;
  role?: AdminRole;
}

export interface AdminSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// ============================================
// API v1 Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMITED' | 'INVALID_REQUEST' | 'SERVER_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    request_id: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

// ============================================
// Subscription & Billing Types
// ============================================

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused';

export type BillingCycle = 'monthly' | 'yearly';

export type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

export interface Subscription {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_name: PlanName;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInsert {
  id?: string;
  user_id?: string;
  organization_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  plan_name?: PlanName;
  status?: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  updated_at?: string;
}

export interface UsageRecord {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  documents_count: number;
  queries_count: number;
  storage_bytes: number;
  api_calls_count: number;
  llm_tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface UsageRecordInsert {
  id?: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  documents_count?: number;
  queries_count?: number;
  storage_bytes?: number;
  api_calls_count?: number;
  llm_tokens_used?: number;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Invoice {
  id: string;
  organization_id: string;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: InvoiceStatus;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceInsert {
  id?: string;
  organization_id: string;
  stripe_invoice_id?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  status: InvoiceStatus;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  period_start?: string;
  period_end?: string;
  paid_at?: string;
}

// ============================================
// Promo Code Types
// ============================================

export type DiscountType = 'percent' | 'amount';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  payhip_coupon_id: string | null;
  stripe_coupon_id: string | null;
  stripe_promo_code_id: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  valid_from: string;
  valid_until: string | null;
  applies_to_plans: string[] | null;
  minimum_amount: number | null;
  first_time_only: boolean;
  campaign_name: string | null;
  campaign_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeInsert {
  id?: string;
  code: string;
  description?: string;
  discount_type?: DiscountType;
  discount_value: number;
  payhip_coupon_id?: string;
  stripe_coupon_id?: string;
  stripe_promo_code_id?: string;
  max_redemptions?: number;
  valid_until?: string;
  applies_to_plans?: string[];
  minimum_amount?: number;
  first_time_only?: boolean;
  campaign_name?: string;
  campaign_notes?: string;
  is_active?: boolean;
}

export interface PromoCodeRedemption {
  id: string;
  promo_code_id: string;
  user_id: string | null;
  payhip_sale_id: string | null;
  stripe_invoice_id: string | null;
  stripe_checkout_session_id: string | null;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  currency: string;
  plan_name: string | null;
  redeemed_at: string;
}

export interface PromoCodeRedemptionInsert {
  id?: string;
  promo_code_id: string;
  user_id?: string;
  payhip_sale_id?: string;
  stripe_invoice_id?: string;
  stripe_checkout_session_id?: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  currency?: string;
  plan_name?: string;
}
