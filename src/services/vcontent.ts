import { supabase } from '@/lib/supabaseClient';
import type { ImportedModuleCode } from '@/lib/orderImport';
import { measureTelemetry } from '@/lib/telemetry';

export type OrderRow = {
  id: string;
  client: string;
  company_id: string | null;
  title: string;
  module: string;
  project_code?: string | null;
  priority?: string | null;
  order_type?: string | null;
  deadline: string;
  status: string;
  created_by_profile_id: string | null;
  intake_note: string | null;
  rejection_reason: string | null;
  change_request_reason: string | null;
  stage_sla_overrides: Record<string, unknown> | null;
  submitted_at: string | null;
  launched_at: string | null;
  assignees: Record<string, unknown> | null;
};

export type ProductRow = {
  id: string;
  order_id: string;
  name: string;
  product_note?: string | null;
  current_stage_index: number;
  progress: number;
  ready_for_delivery: boolean;
  finished: boolean;
  delivered_at: string | null;
};

export type OrderBundleCounts = {
  eln: number;
  video: number;
  game: number;
};

export type ManualOrderProductInput = {
  module: 'ELN' | 'VIDEO' | 'GAME';
  name: string;
  code?: string;
  note?: string;
};

export type ImportedOrderProductSeed = {
  module: ImportedModuleCode;
  sourceCode: string;
  detail: string;
  productType?: string;
};

export type ImportedOrderSeed = {
  title: string;
  client: string;
  deadline: string;
  companyId: string | null;
  createdByProfileId: string;
  intakeNote?: string;
  status?: string;
  priority?: string | null;
  orderType?: string | null;
  products: ImportedOrderProductSeed[];
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  company_id: string | null;
  organization_id: string | null;
  title: string | null;
  active: boolean;
  access_scope: string;
  auth_user_id?: string | null;
  avatar_initials?: string | null;
};

export type TaskRow = {
  id: string;
  order_id: string;
  product_id: string;
  stage_index: number;
  status: string;
  progress: number;
  due_date: string | null;
  assignee: string | null;
  assignee_profile_id?: string | null;
  assignee_account_id?: string | null;
  archived: boolean;
};

export type ActivityLogRow = {
  id: string;
  happened_at: string;
  actor_profile_id: string | null;
  action_type: string;
  object_type: string;
  object_id: string;
  summary: string;
  metadata: Record<string, unknown>;
};

export type DeliveryRow = {
  id: string;
  sent_at: string;
  status: string;
  note: string | null;
  document_name: string | null;
  sent_by_profile_id: string | null;
  items: Array<{ orderId: string; productId: string; productName?: string }>;
};

export type PaymentRequestRow = {
  id: string;
  order_id: string;
  delivery_id: string | null;
  title: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  sent_at: string | null;
  created_by_profile_id: string | null;
  client_confirmed_at: string | null;
  note: string | null;
  receipt_required: boolean;
};

export type PaymentReceiptRow = {
  id: string;
  payment_request_id: string;
  order_id: string;
  amount: number;
  paid_at: string;
  method: string;
  receipt_file_name: string | null;
  note: string | null;
  confirmed_by_profile_id: string | null;
  confirmed_at: string | null;
};

export type StoryboardRow = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  current_version: number;
  total_scenes: number;
  estimated_minutes: number;
  status: string;
  assignee_profile_id: string | null;
  reviewer_profile_id: string | null;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  file_name: string | null;
  notes: string | null;
};

export type StoryboardReviewRow = {
  id: string;
  storyboard_id: string;
  reviewer_profile_id: string | null;
  decision: string;
  comment: string | null;
  criteria: Record<string, boolean>;
  created_at: string;
};

export type SlideDesignRow = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  current_version: number;
  target_slides: number;
  completed_slides: number;
  status: string;
  designer_profile_id: string | null;
  qc_reviewer_profile_id: string | null;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  updated_at?: string | null;
  file_name: string | null;
  brand_spec: string | null;
  notes: string | null;
  checklist?: Record<string, boolean>;
};

export type SlideDesignReviewRow = {
  id: string;
  slide_design_id: string;
  reviewer_profile_id: string | null;
  decision: string;
  comment: string | null;
  criteria: Record<string, boolean | number | string>;
  created_at: string;
};

export type VoiceOverRow = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  current_version: number;
  estimated_minutes: number;
  recorded_minutes: number;
  status: string;
  talent_profile_id: string | null;
  handoff_profile_id: string | null;
  due_date: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  returned_at: string | null;
  file_name: string | null;
  voice_style: string | null;
  notes: string | null;
  checklist?: Record<string, boolean>;
};

export type VoiceReviewRow = {
  id: string;
  voice_over_id: string;
  reviewer_profile_id: string | null;
  decision: string;
  comment: string | null;
  criteria: Record<string, boolean | number | string>;
  created_at: string;
};

export type VideoEditRow = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  current_version: number;
  target_minutes: number;
  render_progress: number;
  status: string;
  editor_profile_id: string | null;
  qc_reviewer_profile_id: string | null;
  due_date: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  file_name: string | null;
  subtitle_file: string | null;
  render_preset: string | null;
  notes: string | null;
  checklist?: Record<string, boolean>;
};

export type VideoReviewRow = {
  id: string;
  video_edit_id: string;
  reviewer_profile_id: string | null;
  decision: string;
  comment: string | null;
  criteria: Record<string, boolean | number | string>;
  created_at: string;
};

export type ScormPackageRow = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  current_version: number;
  status: string;
  owner_profile_id: string | null;
  due_date: string | null;
  selected_question_ids: string[];
  pass_score: number;
  randomize_questions: boolean;
  completion_rule: string;
  manifest_status: string;
  package_file_name: string | null;
  notes: string | null;
};

export type ScormReviewRow = {
  id: string;
  scorm_package_id: string;
  reviewer_profile_id: string | null;
  decision: string;
  comment: string | null;
  criteria: Record<string, boolean | number | string>;
  created_at: string;
};

export type QuestionLibraryRow = {
  id: string;
  module: string;
  prompt: string;
  difficulty: string;
  tags: string[];
  correct_answer: string;
  distractors: string[];
  active: boolean;
};

export type WorkflowRecordKind = 'storyboard' | 'slide_design' | 'voice_over' | 'video_edit' | 'scorm_package';
export type InputItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  module: string;
  item_code: string;
  label: string;
  item_type: string;
  required: boolean;
  status: 'missing' | 'submitted' | 'approved' | 'changes_requested';
  file_name: string | null;
  file_url: string | null;
  notes: string | null;
  owner_profile_id: string | null;
  due_date: string | null;
  updated_at?: string | null;
};

export type IntakeTemplateItem = {
  code: string;
  label: string;
  type: string;
  required: boolean;
};

export type IntakeUploadResult = {
  fileName: string;
  fileUrl: string;
  bucket: string;
  path: string;
};

export type WorkflowUploadResult = IntakeUploadResult;

export type GameBriefConfig = {
  projectName: string;
  topicName: string;
  gameTitle: string;
  gameDescription: string;
  gameLogic: string;
  targetSkill: string;
  durationMinutes: number;
  platform: string;
  deviceTarget: string;
  exportResultRequired: boolean;
  excelTemplateUrl: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
};

const DEFAULT_GAME_BRIEF_CONFIG: GameBriefConfig = {
  projectName: '',
  topicName: '',
  gameTitle: '',
  gameDescription: '',
  gameLogic: '',
  targetSkill: '',
  durationMinutes: 15,
  platform: 'web',
  deviceTarget: 'desktop',
  exportResultRequired: false,
  excelTemplateUrl: '',
  startDate: '',
  endDate: '',
  status: 'draft',
  notes: '',
};

export function getInputTemplate(moduleCode: 'ELN' | 'VIDEO' | 'GAME'): IntakeTemplateItem[] {
  const sharedTemplate: IntakeTemplateItem[] = [
    { code: 'content_doc', label: '01. Giáo án gốc / Content Document', type: 'document', required: true },
    { code: 'brand_guidelines', label: '02. Brand Guidelines', type: 'brand', required: true },
    { code: 'logo_files', label: '03. Logo files (PNG + SVG)', type: 'asset', required: true },
    { code: 'colour_palette', label: '04. Colour Palette', type: 'color', required: true },
    { code: 'lesson_script', label: '05. Lesson Script', type: 'script', required: true },
    { code: 'learning_objectives', label: '06. Learning Objectives', type: 'scope', required: true },
    { code: 'scorm_spec', label: '07. Brief kỹ thuật (SCORM spec)', type: 'scorm', required: true },
    { code: 'typography', label: '08. Typography', type: 'font', required: false },
    { code: 'extended_reference', label: '09. Kiến thức / Tư liệu mở rộng', type: 'reference', required: false },
  ];

  const gameTemplate: IntakeTemplateItem[] = [
    { code: 'game_objective', label: '01. Muc tieu game / Learning Objective', type: 'objective', required: true },
    { code: 'gameplay_reference', label: '02. Gameplay reference / Flow mau', type: 'gameplay', required: true },
    { code: 'scoring_rule', label: '03. Scoring / Rule expectation', type: 'rule', required: true },
    { code: 'brand_assets', label: '04. Brand guideline + visual assets', type: 'brand', required: true },
    { code: 'content_assets', label: '05. Content / Asset source', type: 'asset', required: true },
    { code: 'player_sample', label: '06. Player list / Data sample', type: 'player', required: true },
    { code: 'export_template', label: '07. Export result template', type: 'template', required: true },
    { code: 'technical_constraints', label: '08. Technical constraints', type: 'technical', required: true },
    { code: 'extended_reference', label: '09. Reference mo rong', type: 'reference', required: false },
  ];

  if (moduleCode === 'GAME') return gameTemplate;
  return moduleCode === 'VIDEO'
    ? sharedTemplate.map((item) => (item.code === 'lesson_script' ? { ...item, label: '05. Kịch bản video / Video Script', type: 'script' } : item))
    : sharedTemplate;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

export function inferProductWorkflowModule(productId: string, fallbackModule?: string | null) {
  const normalized = String(productId || '').toLowerCase();
  if (normalized.includes('-eln-')) return 'ELN';
  if (normalized.includes('-video-')) return 'VIDEO';
  if (normalized.includes('-game-')) return 'GAME';
  if (fallbackModule === 'VIDEO') return 'VIDEO';
  if (fallbackModule === 'GAME') return 'GAME';
  return 'ELN';
}

function sanitizeGameBriefConfig(input: Partial<GameBriefConfig> | null | undefined): GameBriefConfig {
  return {
    projectName: String(input?.projectName || ''),
    topicName: String(input?.topicName || ''),
    gameTitle: String(input?.gameTitle || ''),
    gameDescription: String(input?.gameDescription || ''),
    gameLogic: String(input?.gameLogic || ''),
    targetSkill: String(input?.targetSkill || ''),
    durationMinutes: Math.max(1, Number(input?.durationMinutes) || DEFAULT_GAME_BRIEF_CONFIG.durationMinutes),
    platform: String(input?.platform || DEFAULT_GAME_BRIEF_CONFIG.platform),
    deviceTarget: String(input?.deviceTarget || DEFAULT_GAME_BRIEF_CONFIG.deviceTarget),
    exportResultRequired: Boolean(input?.exportResultRequired),
    excelTemplateUrl: String(input?.excelTemplateUrl || ''),
    startDate: String(input?.startDate || ''),
    endDate: String(input?.endDate || ''),
    status: String(input?.status || DEFAULT_GAME_BRIEF_CONFIG.status),
    notes: String(input?.notes || ''),
  };
}

export function parseGameBriefConfig(item: InputItemRow | null | undefined): GameBriefConfig {
  if (!item?.notes) return { ...DEFAULT_GAME_BRIEF_CONFIG };
  try {
    return sanitizeGameBriefConfig(JSON.parse(item.notes));
  } catch {
    return { ...DEFAULT_GAME_BRIEF_CONFIG };
  }
}

export function isGameBriefReady(config: GameBriefConfig) {
  return Boolean(
    config.projectName.trim() &&
      config.topicName.trim() &&
      config.gameTitle.trim() &&
      config.gameDescription.trim() &&
      config.gameLogic.trim() &&
      config.platform.trim() &&
      config.deviceTarget.trim() &&
      config.startDate &&
      config.endDate,
  );
}

async function getNextClientOrderId() {
  const client = requireSupabase();
  const { data, error } = await client.from('vcontent_orders').select('id').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const numericIds = (data || [])
    .map((item: { id: string }) => /^ord-(\d{4})$/i.exec(String(item.id || '').trim()))
    .filter(Boolean)
    .map((match) => Number(match?.[1] || 0));
  const nextNumber = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
  return `ord-${String(nextNumber).padStart(4, '0')}`;
}

function clampBundleCount(value: number | undefined) {
  return Math.max(0, Math.min(20, Number(value) || 0));
}

function normalizeIdentifier(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function normalizePriority(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'low') return 'low';
  return 'medium';
}

function mapOrderTypeToModule(orderType: string | null | undefined): 'ELN' | 'VIDEO' | 'GAME' {
  const normalized = String(orderType || '')
    .trim()
    .toUpperCase();
  if (normalized === 'G') return 'GAME';
  if (normalized === 'H' || normalized === 'M') return 'VIDEO';
  return 'ELN';
}

function deriveLegacyOrderType(bundleCounts: OrderBundleCounts) {
  if (bundleCounts.game > 0 && bundleCounts.eln === 0 && bundleCounts.video === 0) return 'G';
  if (bundleCounts.video > 0 && bundleCounts.eln === 0 && bundleCounts.game === 0) return 'H';
  return 'E';
}

async function ensureOrderIdAvailable(orderId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('vcontent_orders').select('id').eq('id', orderId).maybeSingle();
  if (error) throw error;
  if (data?.id) {
    throw new Error(`Mã đơn hàng "${orderId}" đã tồn tại.`);
  }
}

function mapImportedModuleToBundleKey(module: ImportedModuleCode) {
  if (module === 'VIDEO') return 'video';
  if (module === 'GAME') return 'game';
  return 'eln';
}

function getOrderModuleLabel(bundleCounts: OrderBundleCounts, orderType?: string | null) {
  if (orderType) return mapOrderTypeToModule(orderType);
  const activeModules = [
    bundleCounts.eln > 0 ? 'ELN' : null,
    bundleCounts.video > 0 ? 'VIDEO' : null,
    bundleCounts.game > 0 ? 'GAME' : null,
  ].filter(Boolean);
  if (activeModules.length === 1) return activeModules[0] as string;
  return activeModules.length > 1 ? 'MIXED' : 'ELN';
}

function buildProductBundlePayload(orderId: string, title: string, bundleCounts: OrderBundleCounts) {
  const specs = [
    { key: 'eln', code: 'eln', label: 'E-learning', count: bundleCounts.eln },
    { key: 'video', code: 'video', label: 'Video', count: bundleCounts.video },
    { key: 'game', code: 'game', label: 'Gamification', count: bundleCounts.game },
  ] as const;

  return specs.flatMap((spec) =>
    Array.from({ length: spec.count }, (_value, index) => {
      const itemNo = String(index + 1).padStart(2, '0');
      return {
        id: `${orderId}-${spec.code}-${itemNo}`,
        order_id: orderId,
        name: `${title} / ${spec.label} ${itemNo}`,
        product_note: null,
        current_stage_index: 0,
        progress: 0,
        ready_for_delivery: false,
        finished: false,
        delivered_at: null,
      };
    }),
  );
}

function buildManualProductPayload(orderId: string, title: string, products: ManualOrderProductInput[]) {
  const counters: Record<'eln' | 'video' | 'game', number> = {
    eln: 0,
    video: 0,
    game: 0,
  };

  return products.map((product) => {
    const bundleKey = product.module === 'VIDEO' ? 'video' : product.module === 'GAME' ? 'game' : 'eln';
    counters[bundleKey] += 1;
    const itemNo = String(counters[bundleKey]).padStart(2, '0');
    const normalizedProductCode = normalizeIdentifier(product.code);
    return {
      id: normalizedProductCode || `${orderId}-${bundleKey}-${itemNo}`,
      order_id: orderId,
      name: product.name.trim() || `${title} / ${product.module} ${itemNo}`,
      product_note: String(product.note || '').trim() || null,
      current_stage_index: 0,
      progress: 0,
      ready_for_delivery: false,
      finished: false,
      delivered_at: null,
    };
  });
}

function buildImportedProductPayload(orderId: string, orderTitle: string, products: ImportedOrderProductSeed[]) {
  const counters: Record<'eln' | 'video' | 'game', number> = {
    eln: 0,
    video: 0,
    game: 0,
  };

  return products.map((product) => {
    const bundleKey = mapImportedModuleToBundleKey(product.module);
    counters[bundleKey] += 1;
    const itemNo = String(counters[bundleKey]).padStart(2, '0');
    return {
      id: `${orderId}-${bundleKey}-${itemNo}`,
      order_id: orderId,
      name: `${product.sourceCode} - ${product.detail}`,
      product_note: product.productType || null,
      current_stage_index: 0,
      progress: 0,
      ready_for_delivery: false,
      finished: false,
      delivered_at: null,
    };
  });
}

async function getAccessToken() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Missing session token.');
  }
  return token;
}

async function requestAppApi(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  return payload;
}

export async function requestPlanningAi(input: {
  orderId: string;
  planningContext: string;
  teamCapacity: {
    pm: number;
    storyboard: number;
    design: number;
    qc: number;
    voice: number;
    video: number;
    scorm: number;
    game: number;
  };
  bottlenecks: string;
}) {
  return requestAppApi('/api/planning-ai', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

async function fileToBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  const commaIndex = dataUrl.indexOf(',');
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}

const INTAKE_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_INTAKE_BUCKET || 'vcontent-intake';
const WORKFLOW_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_WORKFLOW_BUCKET || import.meta.env.VITE_SUPABASE_INTAKE_BUCKET || 'vcontent-intake';
const AVATAR_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || 'vcontent-avatars';

function slugifyStoragePath(value: string) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function extractStorageObjectPath(fileUrl: string | null | undefined, bucket: string) {
  if (!fileUrl) return null;
  const publicSegment = `/storage/v1/object/public/${bucket}/`;
  const signedSegment = `/storage/v1/object/sign/${bucket}/`;

  if (fileUrl.includes(publicSegment)) {
    return decodeURIComponent(fileUrl.split(publicSegment)[1].split('?')[0]);
  }
  if (fileUrl.includes(signedSegment)) {
    return decodeURIComponent(fileUrl.split(signedSegment)[1].split('?')[0]);
  }
  if (fileUrl.startsWith(`storage://${bucket}/`)) {
    return fileUrl.slice(`storage://${bucket}/`.length);
  }

  return null;
}

async function uploadStorageFileDirect(input: {
  bucket: string;
  file: File;
  previousUrl?: string | null;
  segments: string[];
}): Promise<IntakeUploadResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const objectPath = input.segments.filter(Boolean).join('/');
  const previousObjectPath = extractStorageObjectPath(input.previousUrl, input.bucket);

  if (previousObjectPath) {
    const deleteResult = await supabase.storage.from(input.bucket).remove([previousObjectPath]);
    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  const uploadResult = await supabase.storage.from(input.bucket).upload(objectPath, input.file, {
    contentType: input.file.type || 'application/octet-stream',
    upsert: true,
  });
  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const publicUrl = supabase.storage.from(input.bucket).getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) {
    throw new Error('Failed to resolve uploaded file URL.');
  }

  return {
    fileName: input.file.name,
    fileUrl: publicUrl,
    bucket: input.bucket,
    path: objectPath,
  };
}

async function deleteStorageFileDirect(input: { bucket: string; fileUrl: string }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const objectPath = extractStorageObjectPath(input.fileUrl, input.bucket);
  if (!objectPath) return;

  const deleteResult = await supabase.storage.from(input.bucket).remove([objectPath]);
  if (deleteResult.error) {
    throw deleteResult.error;
  }
}

const ORDER_SELECT =
  'id,client,company_id,title,module,project_code,priority,order_type,deadline,status,created_by_profile_id,intake_note,rejection_reason,change_request_reason,stage_sla_overrides,submitted_at,launched_at,assignees';
const ORDER_SELECT_LEGACY =
  'id,client,company_id,title,module,deadline,status,created_by_profile_id,intake_note,rejection_reason,change_request_reason,stage_sla_overrides,submitted_at,launched_at,assignees';
const PRODUCT_SELECT = 'id,order_id,name,product_note,current_stage_index,progress,ready_for_delivery,finished,delivered_at';
const PRODUCT_SELECT_LEGACY = 'id,order_id,name,current_stage_index,progress,ready_for_delivery,finished,delivered_at';
const TASK_SELECT = 'id,order_id,product_id,stage_index,status,progress,due_date,assignee,assignee_profile_id,assignee_account_id,archived';
const TASK_SELECT_LEGACY = 'id,order_id,product_id,stage_index,status,progress,due_date,assignee,archived';

function hasMissingColumnsError(error: unknown, columns: string[]) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /column/i.test(message) && columns.some((column) => new RegExp(column, 'i').test(message));
}

function isMissingTaskColumnError(error: unknown) {
  return hasMissingColumnsError(error, ['assignee_profile_id', 'assignee_account_id']);
}

function normalizeOrderRows(data: any[]) {
  return (data || []).map((item) => ({
    ...item,
    project_code: 'project_code' in item ? item.project_code : null,
    priority: 'priority' in item ? item.priority : null,
    order_type: 'order_type' in item ? item.order_type : null,
  })) as OrderRow[];
}

function normalizeProductRows(data: any[]) {
  return (data || []).map((item) => ({
    ...item,
    product_note: 'product_note' in item ? item.product_note : null,
  })) as ProductRow[];
}

function normalizeTaskRows(data: any[]) {
  return (data || []).map((item) => ({
    ...item,
    assignee_profile_id: 'assignee_profile_id' in item ? item.assignee_profile_id : null,
    assignee_account_id: 'assignee_account_id' in item ? item.assignee_account_id : null,
  })) as TaskRow[];
}
const INPUT_ITEM_SELECT = 'id,order_id,product_id,module,item_code,label,item_type,required,status,file_name,file_url,notes,owner_profile_id,due_date,updated_at';
const STORYBOARD_SELECT = 'id,order_id,product_id,title,current_version,total_scenes,estimated_minutes,status,assignee_profile_id,reviewer_profile_id,due_date,submitted_at,approved_at,returned_at,file_name,notes';
const STORYBOARD_REVIEW_SELECT = 'id,storyboard_id,reviewer_profile_id,decision,comment,criteria,created_at';
const SLIDE_DESIGN_SELECT = 'id,order_id,product_id,title,current_version,target_slides,completed_slides,status,designer_profile_id,qc_reviewer_profile_id,due_date,submitted_at,approved_at,returned_at,file_name,brand_spec,notes,checklist';
const SLIDE_DESIGN_REVIEW_SELECT = 'id,slide_design_id,reviewer_profile_id,decision,comment,criteria,created_at';
const VOICE_OVER_SELECT = 'id,order_id,product_id,title,current_version,estimated_minutes,recorded_minutes,status,talent_profile_id,handoff_profile_id,due_date,submitted_at,completed_at,returned_at,file_name,voice_style,notes,checklist';
const VOICE_REVIEW_SELECT = 'id,voice_over_id,reviewer_profile_id,decision,comment,criteria,created_at';
const VIDEO_EDIT_SELECT = 'id,order_id,product_id,title,current_version,target_minutes,render_progress,status,editor_profile_id,qc_reviewer_profile_id,due_date,submitted_at,approved_at,returned_at,file_name,subtitle_file,render_preset,notes,checklist';
const VIDEO_REVIEW_SELECT = 'id,video_edit_id,reviewer_profile_id,decision,comment,criteria,created_at';
const QUESTION_LIBRARY_SELECT = 'id,module,prompt,difficulty,tags,correct_answer,distractors,active';
const SCORM_PACKAGE_SELECT = 'id,order_id,product_id,title,current_version,status,owner_profile_id,due_date,selected_question_ids,pass_score,randomize_questions,completion_rule,manifest_status,package_file_name,notes';
const SCORM_REVIEW_SELECT = 'id,scorm_package_id,reviewer_profile_id,decision,comment,criteria,created_at';
const ACTIVITY_LOG_SELECT = 'id,happened_at,actor_profile_id,action_type,object_type,object_id,summary,metadata';

type ListTasksOptions = {
  includeArchived?: boolean;
  stageIndices?: number[];
};

type ListInputItemsOptions = {
  module?: string;
  orderId?: string;
  productId?: string;
};

type ListWorkflowRecordsOptions = {
  kinds?: WorkflowRecordKind[];
  includeReviews?: boolean;
  includeQuestionLibrary?: boolean;
};

type WorkflowRecordsBundle = {
  storyboards: StoryboardRow[];
  storyboardReviews: StoryboardReviewRow[];
  slideDesigns: SlideDesignRow[];
  slideDesignReviews: SlideDesignReviewRow[];
  voiceOvers: VoiceOverRow[];
  voiceReviews: VoiceReviewRow[];
  videoEdits: VideoEditRow[];
  videoReviews: VideoReviewRow[];
  questionLibrary: QuestionLibraryRow[];
  scormPackages: ScormPackageRow[];
  scormReviews: ScormReviewRow[];
};

export async function listOrdersWithProducts() {
  const client = requireSupabase();
  const [ordersPrimary, productsPrimary] = await Promise.all([
    client.from('vcontent_orders').select(ORDER_SELECT).order('created_at', { ascending: false }),
    client.from('vcontent_products').select(PRODUCT_SELECT).order('created_at', { ascending: true }),
  ]);

  let orders: any[] = ordersPrimary.data || [];
  let products: any[] = productsPrimary.data || [];

  if (ordersPrimary.error) {
    if (!hasMissingColumnsError(ordersPrimary.error, ['project_code', 'priority', 'order_type'])) throw ordersPrimary.error;
    const ordersLegacy = await client.from('vcontent_orders').select(ORDER_SELECT_LEGACY).order('created_at', { ascending: false });
    if (ordersLegacy.error) throw ordersLegacy.error;
    orders = ordersLegacy.data || [];
  }

  if (productsPrimary.error) {
    if (!hasMissingColumnsError(productsPrimary.error, ['product_note'])) throw productsPrimary.error;
    const productsLegacy = await client.from('vcontent_products').select(PRODUCT_SELECT_LEGACY).order('created_at', { ascending: true });
    if (productsLegacy.error) throw productsLegacy.error;
    products = productsLegacy.data || [];
  }

  return {
    orders: normalizeOrderRows(orders),
    products: normalizeProductRows(products),
  };
}

export async function listTasks(options?: ListTasksOptions) {
  const client = requireSupabase();
  const buildQuery = (selectClause: string) => {
    let query = client
      .from('vcontent_tasks')
      .select(selectClause)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }

    if (options?.stageIndices?.length) {
      query = query.in('stage_index', options.stageIndices);
    }

    return query;
  };

  const primary = await buildQuery(TASK_SELECT);
  if (!primary.error) return normalizeTaskRows(primary.data || []);
  if (!isMissingTaskColumnError(primary.error)) throw primary.error;

  const legacy = await buildQuery(TASK_SELECT_LEGACY);
  if (legacy.error) throw legacy.error;
  return normalizeTaskRows(legacy.data || []);
}

export async function listDeliveries() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_deliveries')
    .select('*')
    .order('sent_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as any[]).map((item) => ({
    ...item,
    items: Array.isArray(item.items) ? item.items : [],
  })) as DeliveryRow[];
}

export async function listPaymentRequests() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_payment_requests')
    .select('*')
    .order('due_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PaymentRequestRow[];
}

export async function listPaymentReceipts() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_payment_receipts')
    .select('*')
    .order('paid_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PaymentReceiptRow[];
}

export async function listWorkflowRecords(options?: ListWorkflowRecordsOptions) {
  const client = requireSupabase();
  const kinds = options?.kinds?.length ? options.kinds : ['storyboard', 'slide_design', 'voice_over', 'video_edit', 'scorm_package'];
  const includeReviews = options?.includeReviews ?? true;
  const includeQuestionLibrary = options?.includeQuestionLibrary ?? true;

  const requests: Array<Promise<{ key: keyof WorkflowRecordsBundle; data: unknown[] }>> = [];

  if (kinds.includes('storyboard')) {
    requests.push(
      client
        .from('vcontent_storyboards')
        .select(STORYBOARD_SELECT)
        .order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'storyboards' as const, data: (data || []) as unknown[] };
        }),
    );
    if (includeReviews) {
      requests.push(
        client
          .from('vcontent_storyboard_reviews')
          .select(STORYBOARD_REVIEW_SELECT)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return { key: 'storyboardReviews' as const, data: (data || []) as unknown[] };
          }),
      );
    }
  }

  if (kinds.includes('slide_design')) {
    requests.push(
      client
        .from('vcontent_slide_designs')
        .select(SLIDE_DESIGN_SELECT)
        .order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'slideDesigns' as const, data: (data || []) as unknown[] };
        }),
    );
    if (includeReviews) {
      requests.push(
        client
          .from('vcontent_slide_design_reviews')
          .select(SLIDE_DESIGN_REVIEW_SELECT)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return { key: 'slideDesignReviews' as const, data: (data || []) as unknown[] };
          }),
      );
    }
  }

  if (kinds.includes('voice_over')) {
    requests.push(
      client
        .from('vcontent_voice_overs')
        .select(VOICE_OVER_SELECT)
        .order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'voiceOvers' as const, data: (data || []) as unknown[] };
        }),
    );
    if (includeReviews) {
      requests.push(
        client
          .from('vcontent_voice_reviews')
          .select(VOICE_REVIEW_SELECT)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return { key: 'voiceReviews' as const, data: (data || []) as unknown[] };
          }),
      );
    }
  }

  if (kinds.includes('video_edit')) {
    requests.push(
      client
        .from('vcontent_video_edits')
        .select(VIDEO_EDIT_SELECT)
        .order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'videoEdits' as const, data: (data || []) as unknown[] };
        }),
    );
    if (includeReviews) {
      requests.push(
        client
          .from('vcontent_video_reviews')
          .select(VIDEO_REVIEW_SELECT)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return { key: 'videoReviews' as const, data: (data || []) as unknown[] };
          }),
      );
    }
  }

  if (kinds.includes('scorm_package')) {
    requests.push(
      client
        .from('vcontent_scorm_packages')
        .select(SCORM_PACKAGE_SELECT)
        .order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'scormPackages' as const, data: (data || []) as unknown[] };
        }),
    );
    if (includeReviews) {
      requests.push(
        client
          .from('vcontent_scorm_reviews')
          .select(SCORM_REVIEW_SELECT)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return { key: 'scormReviews' as const, data: (data || []) as unknown[] };
          }),
      );
    }
  }

  if (includeQuestionLibrary) {
    requests.push(
      client
        .from('vcontent_question_library')
        .select(QUESTION_LIBRARY_SELECT)
        .order('id', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error;
          return { key: 'questionLibrary' as const, data: (data || []) as unknown[] };
        }),
    );
  }

  const resolved = await Promise.all(requests);

  const bundle: WorkflowRecordsBundle = {
    storyboards: [],
    storyboardReviews: [],
    slideDesigns: [],
    slideDesignReviews: [],
    voiceOvers: [],
    voiceReviews: [],
    videoEdits: [],
    videoReviews: [],
    questionLibrary: [],
    scormPackages: [],
    scormReviews: [],
  };

  for (const entry of resolved) {
    if (entry.key === 'storyboards') {
      bundle.storyboards = entry.data as StoryboardRow[];
      continue;
    }
    if (entry.key === 'storyboardReviews') {
      bundle.storyboardReviews = (entry.data as any[]).map((item) => ({
        ...item,
        criteria: item.criteria && typeof item.criteria === 'object' ? item.criteria : {},
      })) as StoryboardReviewRow[];
      continue;
    }
    if (entry.key === 'slideDesigns') {
      bundle.slideDesigns = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        checklist: item.checklist && typeof item.checklist === 'object' ? item.checklist : {},
      })) as SlideDesignRow[];
      continue;
    }
    if (entry.key === 'slideDesignReviews') {
      bundle.slideDesignReviews = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        criteria: item.criteria && typeof item.criteria === 'object' ? item.criteria : {},
      })) as SlideDesignReviewRow[];
      continue;
    }
    if (entry.key === 'voiceOvers') {
      bundle.voiceOvers = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        checklist: item.checklist && typeof item.checklist === 'object' ? item.checklist : {},
      })) as VoiceOverRow[];
      continue;
    }
    if (entry.key === 'voiceReviews') {
      bundle.voiceReviews = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        criteria: item.criteria && typeof item.criteria === 'object' ? item.criteria : {},
      })) as VoiceReviewRow[];
      continue;
    }
    if (entry.key === 'videoEdits') {
      bundle.videoEdits = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        checklist: item.checklist && typeof item.checklist === 'object' ? item.checklist : {},
      })) as VideoEditRow[];
      continue;
    }
    if (entry.key === 'videoReviews') {
      bundle.videoReviews = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        criteria: item.criteria && typeof item.criteria === 'object' ? item.criteria : {},
      })) as VideoReviewRow[];
      continue;
    }
    if (entry.key === 'questionLibrary') {
      bundle.questionLibrary = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : [],
        distractors: Array.isArray(item.distractors) ? item.distractors : [],
      })) as QuestionLibraryRow[];
      continue;
    }
    if (entry.key === 'scormPackages') {
      bundle.scormPackages = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        selected_question_ids: Array.isArray(item.selected_question_ids) ? item.selected_question_ids : [],
      })) as ScormPackageRow[];
      continue;
    }
    if (entry.key === 'scormReviews') {
      bundle.scormReviews = ((entry.data || []) as any[]).map((item) => ({
        ...item,
        criteria: item.criteria && typeof item.criteria === 'object' ? item.criteria : {},
      })) as ScormReviewRow[];
    }
  }

  return bundle;
}

export async function listInputItems(options?: ListInputItemsOptions) {
  const client = requireSupabase();
  let query = client
    .from('vcontent_input_items')
    .select(INPUT_ITEM_SELECT)
    .order('updated_at', { ascending: false });

  if (options?.module) {
    query = query.eq('module', options.module);
  }

  if (options?.orderId) {
    query = query.eq('order_id', options.orderId);
  }

  if (options?.productId) {
    query = query.eq('product_id', options.productId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as InputItemRow[];
}

export async function listNotifications() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function listActivityLogs(options?: { actionTypes?: string[]; limit?: number }) {
  const client = requireSupabase();
  let query = client
    .from('vcontent_activity_logs')
    .select(ACTIVITY_LOG_SELECT)
    .order('happened_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.actionTypes?.length) {
    query = query.in('action_type', options.actionTypes);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data || []) as any[]).map((item) => ({
    ...item,
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
  })) as ActivityLogRow[];
}

export async function listProfiles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_profiles')
    .select('id,email,full_name,role,company_id,organization_id,title,active,access_scope,auth_user_id')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listOrganizations() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_organizations')
    .select('id,name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listCompanies() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vcontent_companies')
    .select('id,name,organization_id')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createClientOrder(input: {
  title: string;
  deadline: string;
  client: string;
  companyId: string | null;
  createdByProfileId: string;
  bundleCounts: OrderBundleCounts;
  products?: ManualOrderProductInput[];
  intakeNote?: string;
  status?: string;
  orderCode?: string;
  projectCode?: string | null;
  priority?: string | null;
  orderType?: string | null;
}) {
  const client = requireSupabase();
  const normalizedOrderCode = normalizeIdentifier(input.orderCode);
  const orderId = normalizedOrderCode || (await getNextClientOrderId());
  if (normalizedOrderCode) {
    await ensureOrderIdAvailable(orderId);
  }
  const manualProducts = (input.products || [])
    .map((product) => ({
      module: product.module,
      name: String(product.name || '').trim(),
      code: normalizeIdentifier(product.code),
      note: String(product.note || '').trim(),
    }))
    .filter((product) => product.name);
  const bundleCounts = manualProducts.length
    ? manualProducts.reduce(
        (acc, product) => {
          if (product.module === 'VIDEO') acc.video += 1;
          else if (product.module === 'GAME') acc.game += 1;
          else acc.eln += 1;
          return acc;
        },
        { eln: 0, video: 0, game: 0 },
      )
    : {
        eln: clampBundleCount(input.bundleCounts.eln),
        video: clampBundleCount(input.bundleCounts.video),
        game: clampBundleCount(input.bundleCounts.game),
      };
  const totalProducts = bundleCounts.eln + bundleCounts.video + bundleCounts.game;
  if (totalProducts < 1) {
    throw new Error('Cần ít nhất 1 sản phẩm để tạo đơn.');
  }
  const submittedAt = input.status === 'submitted' ? new Date().toISOString() : null;
  const priority = normalizePriority(input.priority);
  const orderType = (String(input.orderType || '').trim().toUpperCase() || deriveLegacyOrderType(bundleCounts)) as string;

  const orderPayload = {
    id: orderId,
    client: input.client,
    company_id: input.companyId,
    title: input.title,
    module: getOrderModuleLabel(bundleCounts, orderType),
    project_code: String(input.projectCode || '').trim() || null,
    priority,
    order_type: orderType,
    deadline: input.deadline,
    status: input.status || 'draft',
    submitted_at: submittedAt,
    launched_at: null,
    assignees: {},
    created_by_profile_id: input.createdByProfileId,
    intake_note: input.intakeNote || '',
    rejection_reason: '',
    change_request_reason: '',
    stage_sla_overrides: {},
  };

  const productPayload = manualProducts.length
    ? buildManualProductPayload(orderId, input.title, manualProducts)
    : buildProductBundlePayload(orderId, input.title, bundleCounts);

  const orderPayloadLegacy = {
    id: orderPayload.id,
    client: orderPayload.client,
    company_id: orderPayload.company_id,
    title: orderPayload.title,
    module: orderPayload.module,
    deadline: orderPayload.deadline,
    status: orderPayload.status,
    submitted_at: orderPayload.submitted_at,
    launched_at: orderPayload.launched_at,
    assignees: orderPayload.assignees,
    created_by_profile_id: orderPayload.created_by_profile_id,
    intake_note: orderPayload.intake_note,
    rejection_reason: orderPayload.rejection_reason,
    change_request_reason: orderPayload.change_request_reason,
    stage_sla_overrides: orderPayload.stage_sla_overrides,
  };

  const { error: orderError } = await client.from('vcontent_orders').insert(orderPayload);
  if (orderError) {
    if (!hasMissingColumnsError(orderError, ['project_code', 'priority', 'order_type'])) throw orderError;
    const legacyInsert = await client.from('vcontent_orders').insert(orderPayloadLegacy);
    if (legacyInsert.error) throw legacyInsert.error;
  }

  const productPayloadLegacy = productPayload.map((item) => ({
    id: item.id,
    order_id: item.order_id,
    name: item.name,
    current_stage_index: item.current_stage_index,
    progress: item.progress,
    ready_for_delivery: item.ready_for_delivery,
    finished: item.finished,
    delivered_at: item.delivered_at,
  }));

  const { error: productError } = await client.from('vcontent_products').insert(productPayload);
  if (productError) {
    if (!hasMissingColumnsError(productError, ['product_note'])) throw productError;
    const legacyInsert = await client.from('vcontent_products').insert(productPayloadLegacy);
    if (legacyInsert.error) throw legacyInsert.error;
  }

  return {
    orderId,
    orderModule: orderPayload.module,
    productIds: productPayload.map((item) => item.id),
    bundleCounts,
  };
}

export async function createImportedOrders(input: { orders: ImportedOrderSeed[] }) {
  const client = requireSupabase();
  const orders = input.orders.filter((order) => order.products.length > 0);
  if (!orders.length) {
    throw new Error('Khong co order hop le de import.');
  }

  const { data: existingOrders, error: existingOrdersError } = await client
    .from('vcontent_orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(500);
  if (existingOrdersError) throw existingOrdersError;

  const numericIds = (existingOrders || [])
    .map((item: { id: string }) => /^ord-(\d{4})$/i.exec(String(item.id || '').trim()))
    .filter(Boolean)
    .map((match) => Number(match?.[1] || 0));

  let nextNumber = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
  const createdOrders: Array<{ orderId: string; productIds: string[]; title: string }> = [];

  for (const order of orders) {
    const orderId = `ord-${String(nextNumber).padStart(4, '0')}`;
    nextNumber += 1;

    const bundleCounts = order.products.reduce(
      (acc, product) => {
        if (product.module === 'ELN') acc.eln += 1;
        if (product.module === 'VIDEO') acc.video += 1;
        if (product.module === 'GAME') acc.game += 1;
        return acc;
      },
      { eln: 0, video: 0, game: 0 },
    );

    const orderPayload = {
      id: orderId,
      client: order.client,
      company_id: order.companyId,
      title: order.title,
      module: getOrderModuleLabel(bundleCounts, order.orderType),
      project_code: null,
      priority: normalizePriority(order.priority),
      order_type: order.orderType || deriveLegacyOrderType(bundleCounts),
      deadline: order.deadline,
      status: order.status || 'submitted',
      submitted_at: order.status === 'draft' ? null : new Date().toISOString(),
      launched_at: null,
      assignees: {},
      created_by_profile_id: order.createdByProfileId,
      intake_note: order.intakeNote || '',
      rejection_reason: '',
      change_request_reason: '',
      stage_sla_overrides: {},
    };

    const productPayload = buildImportedProductPayload(orderId, order.title, order.products);

    const orderPayloadLegacy = {
      id: orderPayload.id,
      client: orderPayload.client,
      company_id: orderPayload.company_id,
      title: orderPayload.title,
      module: orderPayload.module,
      deadline: orderPayload.deadline,
      status: orderPayload.status,
      submitted_at: orderPayload.submitted_at,
      launched_at: orderPayload.launched_at,
      assignees: orderPayload.assignees,
      created_by_profile_id: orderPayload.created_by_profile_id,
      intake_note: orderPayload.intake_note,
      rejection_reason: orderPayload.rejection_reason,
      change_request_reason: orderPayload.change_request_reason,
      stage_sla_overrides: orderPayload.stage_sla_overrides,
    };

    const { error: orderError } = await client.from('vcontent_orders').insert(orderPayload);
    if (orderError) {
      if (!hasMissingColumnsError(orderError, ['project_code', 'priority', 'order_type'])) throw orderError;
      const legacyInsert = await client.from('vcontent_orders').insert(orderPayloadLegacy);
      if (legacyInsert.error) throw legacyInsert.error;
    }

    const productPayloadLegacy = productPayload.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      name: item.name,
      current_stage_index: item.current_stage_index,
      progress: item.progress,
      ready_for_delivery: item.ready_for_delivery,
      finished: item.finished,
      delivered_at: item.delivered_at,
    }));

    const { error: productError } = await client.from('vcontent_products').insert(productPayload);
    if (productError) {
      if (!hasMissingColumnsError(productError, ['product_note'])) throw productError;
      const legacyInsert = await client.from('vcontent_products').insert(productPayloadLegacy);
      if (legacyInsert.error) throw legacyInsert.error;
    }

    createdOrders.push({
      orderId,
      title: order.title,
      productIds: productPayload.map((product) => product.id),
    });
  }

  return {
    orderCount: createdOrders.length,
    productCount: createdOrders.reduce((sum, order) => sum + order.productIds.length, 0),
    createdOrders,
  };
}

export async function createProfile(input: {
  fullName: string;
  email: string;
  role: string;
  organizationId: string | null;
  companyId: string | null;
  title: string | null;
  accessScope: string;
}) {
  const token = await getAccessToken();
  const response = await fetch('/api/admin-create-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const rawText = await response.text();
  let payload: any = {};
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { rawText };
  }

  if (!response.ok || payload?.ok === false) {
    const detail =
      payload?.error ||
      payload?.message ||
      payload?.rawText ||
      `HTTP ${response.status}`;
    throw new Error(`Khong tao duoc profile. ${detail}`);
  }
  return String(payload?.profile?.id || '');
}

export async function createTasksForLaunch(input: {
  orderId: string;
  products: ProductRow[];
  dueDate: string | null;
}) {
  const client = requireSupabase();
  const payload = input.products.map((product, index) => ({
    id: `TASK-${Date.now()}-${index + 1}`,
    order_id: input.orderId,
    product_id: product.id,
    stage_index: product.current_stage_index || 0,
    status: 'todo',
    progress: 0,
    due_date: input.dueDate,
    assignee: null,
    archived: false,
  }));

  if (!payload.length) return [];
  const { error } = await client.from('vcontent_tasks').insert(payload);
  if (error) throw error;
  return payload;
}

export async function createTask(input: {
  orderId: string;
  productId: string;
  stageIndex: number;
  dueDate?: string | null;
  assignee?: string | null;
  assigneeProfileId?: string | null;
  assigneeAccountId?: string | null;
  status?: string;
  progress?: number;
}) {
  const client = requireSupabase();
  const payload = {
    id: `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    order_id: input.orderId,
    product_id: input.productId,
    stage_index: input.stageIndex,
    status: input.status || 'todo',
    progress: input.progress ?? 0,
    due_date: input.dueDate || null,
    assignee: input.assignee || null,
    assignee_profile_id: input.assigneeProfileId || null,
    assignee_account_id: input.assigneeAccountId || null,
    archived: false,
  };
  const { error } = await client.from('vcontent_tasks').insert(payload);
  if (!error) return payload;
  if (!isMissingTaskColumnError(error)) throw error;

  const legacyPayload = {
    id: payload.id,
    order_id: payload.order_id,
    product_id: payload.product_id,
    stage_index: payload.stage_index,
    status: payload.status,
    progress: payload.progress,
    due_date: payload.due_date,
    assignee: payload.assignee,
    archived: payload.archived,
  };
  const legacyResult = await client.from('vcontent_tasks').insert(legacyPayload);
  if (legacyResult.error) throw legacyResult.error;
  return payload;
}

export async function ensureInputItemsForProduct(input: {
  orderId: string;
  productId: string;
  module: 'ELN' | 'VIDEO' | 'GAME';
  existingItems: InputItemRow[];
  ownerProfileId?: string | null;
}) {
  const client = requireSupabase();
  const template = getInputTemplate(input.module);
  const missingPayload = template
    .filter((templateItem) => !input.existingItems.some((item) => item.order_id === input.orderId && item.product_id === input.productId && item.item_code === templateItem.code))
    .map((templateItem) => ({
      id: `IN-${input.orderId}-${input.productId}-${templateItem.code}`,
      order_id: input.orderId,
      product_id: input.productId,
      module: input.module,
      item_code: templateItem.code,
      label: templateItem.label,
      item_type: templateItem.type,
      required: templateItem.required,
      status: 'changes_requested',
      file_name: null,
      file_url: null,
      notes: 'Đang chờ client/PM bổ sung.',
      owner_profile_id: input.ownerProfileId || null,
      due_date: null,
    }));

  if (!missingPayload.length) return [];
  const { error } = await client.from('vcontent_input_items').insert(missingPayload);
  if (error) throw error;
  return missingPayload as InputItemRow[];
}

export async function ensureGameBriefConfigItem(input: {
  orderId: string;
  productId: string;
  existingItems: InputItemRow[];
  ownerProfileId?: string | null;
}) {
  const existing = input.existingItems.find(
    (item) => item.order_id === input.orderId && item.product_id === input.productId && item.module === 'GAME' && item.item_code === 'game_brief_config',
  );
  if (existing) return existing;

  const client = requireSupabase();
  const payload = {
    id: `IN-${input.orderId}-${input.productId}-game_brief_config`,
    order_id: input.orderId,
    product_id: input.productId,
    module: 'GAME',
    item_code: 'game_brief_config',
    label: 'Game brief config',
    item_type: 'config',
    required: true,
    status: 'submitted',
    file_name: null,
    file_url: null,
    notes: JSON.stringify(DEFAULT_GAME_BRIEF_CONFIG),
    owner_profile_id: input.ownerProfileId || null,
    due_date: null,
  };

  const { data, error } = await client.from('vcontent_input_items').insert(payload).select('*').single();
  if (error) throw error;
  return data as InputItemRow;
}

export async function saveGameBriefConfig(itemId: string, config: Partial<GameBriefConfig>) {
  const nextConfig = sanitizeGameBriefConfig(config);
  await updateInputItem(itemId, {
    notes: JSON.stringify(nextConfig),
    status: isGameBriefReady(nextConfig) ? 'approved' : 'submitted',
  });
  return nextConfig;
}

export async function ensureWorkflowRecord(input: {
  kind: WorkflowRecordKind;
  orderId: string;
  productId: string;
  title: string;
  profileId?: string | null;
}) {
  const client = requireSupabase();
  const tableByKind: Record<WorkflowRecordKind, string> = {
    storyboard: 'vcontent_storyboards',
    slide_design: 'vcontent_slide_designs',
    voice_over: 'vcontent_voice_overs',
    video_edit: 'vcontent_video_edits',
    scorm_package: 'vcontent_scorm_packages',
  };

  const { data: existing, error: readError } = await client
    .from(tableByKind[input.kind])
    .select('*')
    .eq('order_id', input.orderId)
    .eq('product_id', input.productId)
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const baseId = `${input.orderId}::${input.productId}`;
  const common = {
    id: baseId,
    order_id: input.orderId,
    product_id: input.productId,
    title: input.title,
  };

  const payloadByKind: Record<WorkflowRecordKind, Record<string, unknown>> = {
    storyboard: {
      ...common,
      current_version: 1,
      total_scenes: 12,
      estimated_minutes: 24,
      status: 'todo',
      assignee_profile_id: input.profileId || null,
      reviewer_profile_id: null,
      due_date: null,
      submitted_at: null,
      approved_at: null,
      returned_at: null,
      file_name: null,
      notes: '',
    },
    slide_design: {
      ...common,
      current_version: 1,
      target_slides: 24,
      completed_slides: 0,
      status: 'todo',
      designer_profile_id: input.profileId || null,
      qc_reviewer_profile_id: null,
      due_date: null,
      submitted_at: null,
      approved_at: null,
      returned_at: null,
      file_name: null,
      brand_spec: '',
      notes: '',
      checklist: {},
    },
    voice_over: {
      ...common,
      current_version: 1,
      estimated_minutes: 18,
      recorded_minutes: 0,
      status: 'todo',
      talent_profile_id: input.profileId || null,
      handoff_profile_id: null,
      due_date: null,
      submitted_at: null,
      completed_at: null,
      returned_at: null,
      file_name: null,
      voice_style: '',
      notes: '',
      checklist: {},
    },
    video_edit: {
      ...common,
      current_version: 1,
      target_minutes: 18,
      render_progress: 0,
      status: 'todo',
      editor_profile_id: input.profileId || null,
      qc_reviewer_profile_id: null,
      due_date: null,
      submitted_at: null,
      approved_at: null,
      returned_at: null,
      file_name: null,
      subtitle_file: null,
      render_preset: '1080p',
      notes: '',
      checklist: {},
    },
    scorm_package: {
      ...common,
      current_version: 1,
      status: 'building_quiz',
      owner_profile_id: input.profileId || null,
      due_date: null,
      selected_question_ids: [],
      pass_score: 80,
      randomize_questions: true,
      completion_rule: 'watch_video_and_pass_quiz',
      manifest_status: 'draft',
      package_file_name: null,
      notes: '',
    },
  };

  const { data, error } = await client
    .from(tableByKind[input.kind])
    .insert(payloadByKind[input.kind])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function ensureTaskForStage(input: {
  orderId: string;
  productId: string;
  stageIndex: number;
  existingTasks: TaskRow[];
  dueDate?: string | null;
  assignee?: string | null;
  assigneeProfileId?: string | null;
  assigneeAccountId?: string | null;
}) {
  const existing = input.existingTasks.find(
    (task) => task.order_id === input.orderId && task.product_id === input.productId && task.stage_index === input.stageIndex && !task.archived,
  );
  if (existing) return existing;
  return createTask(input);
}

export async function createDelivery(input: {
  sentByProfileId: string;
  note: string;
  documentName?: string;
  items: Array<{ orderId: string; productId: string; productName?: string }>;
}) {
  const client = requireSupabase();
  const deliveryId = `DEL-${Date.now()}`;
  const payload = {
    id: deliveryId,
    sent_at: new Date().toISOString().slice(0, 10),
    status: 'sent',
    note: input.note,
    document_name: input.documentName || null,
    sent_by_profile_id: input.sentByProfileId,
    items: input.items,
  };
  const { error } = await client.from('vcontent_deliveries').insert(payload);
  if (error) throw error;
  return deliveryId;
}

export async function createPaymentRequest(input: {
  orderId: string;
  deliveryId?: string | null;
  title: string;
  amount: number;
  dueDate: string;
  createdByProfileId: string;
  note?: string;
}) {
  const client = requireSupabase();
  const requestId = `PAY-${Date.now()}`;
  const payload = {
    id: requestId,
    order_id: input.orderId,
    delivery_id: input.deliveryId || null,
    title: input.title,
    amount: input.amount,
    currency: 'VND',
    due_date: input.dueDate,
    status: 'sent',
    sent_at: new Date().toISOString().slice(0, 10),
    created_by_profile_id: input.createdByProfileId,
    client_confirmed_at: null,
    note: input.note || '',
    receipt_required: true,
  };
  const { error } = await client.from('vcontent_payment_requests').insert(payload);
  if (error) throw error;
  return requestId;
}

export async function createPaymentReceipt(input: {
  paymentRequestId: string;
  orderId: string;
  amount: number;
  paidAt: string;
  note?: string;
  confirmedByProfileId: string;
}) {
  const client = requireSupabase();
  const receiptId = `REC-${Date.now()}`;
  const payload = {
    id: receiptId,
    payment_request_id: input.paymentRequestId,
    order_id: input.orderId,
    amount: input.amount,
    paid_at: input.paidAt,
    method: 'bank_transfer',
    receipt_file_name: null,
    note: input.note || '',
    confirmed_by_profile_id: input.confirmedByProfileId,
    confirmed_at: new Date().toISOString(),
  };
  const { error } = await client.from('vcontent_payment_receipts').insert(payload);
  if (error) throw error;
  await updatePaymentRequest(input.paymentRequestId, {
    status: 'paid',
    client_confirmed_at: new Date().toISOString(),
  });
  return receiptId;
}

export async function updateProfile(profileId: string, patch: Partial<ProfileRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (error) throw error;
}

export async function updateProduct(productId: string, patch: Partial<ProductRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_products')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) throw error;
}

export async function updateInputItem(itemId: string, patch: Partial<InputItemRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_input_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  if (error) throw error;
}

export async function updateOrder(orderId: string, patch: Partial<OrderRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_orders')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;
}

export async function updateTask(taskId: string, patch: Partial<TaskRow>) {
  const client = requireSupabase();
  const primaryPatch = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await client
    .from('vcontent_tasks')
    .update(primaryPatch)
    .eq('id', taskId);
  if (!error) return;
  if (!isMissingTaskColumnError(error)) throw error;

  const legacyPatch = { ...primaryPatch } as Record<string, unknown>;
  delete legacyPatch.assignee_profile_id;
  delete legacyPatch.assignee_account_id;
  const legacyResult = await client
    .from('vcontent_tasks')
    .update(legacyPatch)
    .eq('id', taskId);
  if (legacyResult.error) throw legacyResult.error;
}

export async function updateDelivery(deliveryId: string, patch: Partial<DeliveryRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_deliveries')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', deliveryId);
  if (error) throw error;
}

export async function updatePaymentRequest(paymentRequestId: string, patch: Partial<PaymentRequestRow>) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_payment_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', paymentRequestId);
  if (error) throw error;
}

export async function updateWorkflowRecord(kind: WorkflowRecordKind, recordId: string, patch: Record<string, unknown>) {
  await measureTelemetry(
    'workflow.record.update',
    {
      kind,
      record_id: recordId,
      patch_keys: Object.keys(patch),
    },
    async () => {
      const client = requireSupabase();
      const tableByKind: Record<WorkflowRecordKind, string> = {
        storyboard: 'vcontent_storyboards',
        slide_design: 'vcontent_slide_designs',
        voice_over: 'vcontent_voice_overs',
        video_edit: 'vcontent_video_edits',
        scorm_package: 'vcontent_scorm_packages',
      };
      const { error } = await client
        .from(tableByKind[kind])
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', recordId);
      if (error) throw error;
    },
  );
}

export async function createStoryboardReview(input: {
  storyboardId: string;
  reviewerProfileId?: string | null;
  decision: string;
  comment?: string | null;
  criteria?: Record<string, boolean>;
}) {
  const client = requireSupabase();
  const payload = {
    id: `SR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    storyboard_id: input.storyboardId,
    reviewer_profile_id: input.reviewerProfileId || null,
    decision: input.decision,
    comment: input.comment || '',
    criteria: input.criteria || {},
  };
  const { data, error } = await client
    .from('vcontent_storyboard_reviews')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as StoryboardReviewRow;
}

export async function deleteStoryboardReview(reviewId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_storyboard_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

async function createWorkflowReviewRecord(table: string, idPrefix: string, idField: string, objectId: string, reviewerProfileId: string | null | undefined, decision: string, comment: string | null | undefined, criteria: Record<string, unknown> | undefined) {
  const client = requireSupabase();
  const payload = {
    id: `${idPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    [idField]: objectId,
    reviewer_profile_id: reviewerProfileId || null,
    decision,
    comment: comment || '',
    criteria: criteria || {},
  };
  const { data, error } = await client.from(table).insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function createSlideDesignReview(input: {
  slideDesignId: string;
  reviewerProfileId?: string | null;
  decision: string;
  comment?: string | null;
  criteria?: Record<string, unknown>;
}) {
  return await createWorkflowReviewRecord(
    'vcontent_slide_design_reviews',
    'SDR',
    'slide_design_id',
    input.slideDesignId,
    input.reviewerProfileId,
    input.decision,
    input.comment,
    input.criteria,
  ) as SlideDesignReviewRow;
}

export async function deleteSlideDesignReview(reviewId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_slide_design_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function createVoiceReview(input: {
  voiceOverId: string;
  reviewerProfileId?: string | null;
  decision: string;
  comment?: string | null;
  criteria?: Record<string, unknown>;
}) {
  return await createWorkflowReviewRecord(
    'vcontent_voice_reviews',
    'VR',
    'voice_over_id',
    input.voiceOverId,
    input.reviewerProfileId,
    input.decision,
    input.comment,
    input.criteria,
  ) as VoiceReviewRow;
}

export async function deleteVoiceReview(reviewId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_voice_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function createVideoReview(input: {
  videoEditId: string;
  reviewerProfileId?: string | null;
  decision: string;
  comment?: string | null;
  criteria?: Record<string, unknown>;
}) {
  return await createWorkflowReviewRecord(
    'vcontent_video_reviews',
    'VDR',
    'video_edit_id',
    input.videoEditId,
    input.reviewerProfileId,
    input.decision,
    input.comment,
    input.criteria,
  ) as VideoReviewRow;
}

export async function deleteVideoReview(reviewId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_video_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function createScormReview(input: {
  scormPackageId: string;
  reviewerProfileId?: string | null;
  decision: string;
  comment?: string | null;
  criteria?: Record<string, unknown>;
}) {
  return await createWorkflowReviewRecord(
    'vcontent_scorm_reviews',
    'SCR',
    'scorm_package_id',
    input.scormPackageId,
    input.reviewerProfileId,
    input.decision,
    input.comment,
    input.criteria,
  ) as ScormReviewRow;
}

export async function deleteScormReview(reviewId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_scorm_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function deleteWorkflowRecord(kind: WorkflowRecordKind, recordId: string) {
  const client = requireSupabase();
  const tableByKind: Record<WorkflowRecordKind, string> = {
    storyboard: 'vcontent_storyboards',
    slide_design: 'vcontent_slide_designs',
    voice_over: 'vcontent_voice_overs',
    video_edit: 'vcontent_video_edits',
    scorm_package: 'vcontent_scorm_packages',
  };
  const { error } = await client.from(tableByKind[kind]).delete().eq('id', recordId);
  if (error) throw error;
}

export async function archiveTasksForStage(orderId: string, productId: string, stageIndex: number) {
  const client = requireSupabase();
  const { error } = await client
    .from('vcontent_tasks')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .eq('stage_index', stageIndex);
  if (error) throw error;
}

export async function deleteOrder(orderId: string) {
  const client = requireSupabase();
  const { error } = await client.from('vcontent_orders').delete().eq('id', orderId);
  if (error) throw error;
}

export async function uploadIntakeAsset(input: {
  file: File;
  orderId: string;
  productId: string;
  itemCode: string;
  module: string;
  previousUrl?: string | null;
}) {
  try {
    return await uploadStorageFileDirect({
      bucket: INTAKE_STORAGE_BUCKET,
      file: input.file,
      previousUrl: input.previousUrl,
      segments: [
        slugifyStoragePath(input.module) || 'unknown-module',
        slugifyStoragePath(input.orderId) || 'unknown-order',
        slugifyStoragePath(input.productId) || 'unknown-product',
        slugifyStoragePath(input.itemCode) || 'unknown-item',
        `${Date.now()}-${slugifyStoragePath(input.file.name) || 'file'}`,
      ],
    });
  } catch {
    const base64 = await fileToBase64(input.file);
    const payload = await requestAppApi('/api/intake-upload', {
      method: 'POST',
      body: JSON.stringify({
        orderId: input.orderId,
        productId: input.productId,
        itemCode: input.itemCode,
        module: input.module,
        previousUrl: input.previousUrl || null,
        fileName: input.file.name,
        contentType: input.file.type || 'application/octet-stream',
        base64Data: base64,
      }),
    });

    return payload.file as IntakeUploadResult;
  }
}

export async function deleteIntakeAsset(input: { fileUrl: string }) {
  try {
    await deleteStorageFileDirect({ bucket: INTAKE_STORAGE_BUCKET, fileUrl: input.fileUrl });
  } catch {
    await requestAppApi('/api/intake-delete', {
      method: 'POST',
      body: JSON.stringify({
        fileUrl: input.fileUrl,
      }),
    });
  }
}

export async function uploadWorkflowAsset(input: {
  file: File;
  orderId: string;
  productId: string;
  module: string;
  stageCode: string;
  slot: string;
  previousUrl?: string | null;
}) {
  return measureTelemetry('workflow.asset.upload', {
    order_id: input.orderId,
    product_id: input.productId,
    module: input.module,
    stage_code: input.stageCode,
    slot: input.slot,
    file_name: input.file.name,
    file_size: input.file.size,
  }, async () => {
    try {
      return await uploadStorageFileDirect({
        bucket: WORKFLOW_STORAGE_BUCKET,
        file: input.file,
        previousUrl: input.previousUrl,
        segments: [
          'workflow',
          slugifyStoragePath(input.module) || 'unknown-module',
          slugifyStoragePath(input.stageCode) || 'unknown-stage',
          slugifyStoragePath(input.orderId) || 'unknown-order',
          slugifyStoragePath(input.productId) || 'unknown-product',
          slugifyStoragePath(input.slot) || 'unknown-slot',
          `${Date.now()}-${slugifyStoragePath(input.file.name) || 'file'}`,
        ],
      });
    } catch {
      const base64 = await fileToBase64(input.file);
      const payload = await requestAppApi('/api/workflow-upload', {
        method: 'POST',
        body: JSON.stringify({
          orderId: input.orderId,
          productId: input.productId,
          module: input.module,
          stageCode: input.stageCode,
          slot: input.slot,
          previousUrl: input.previousUrl || null,
          fileName: input.file.name,
          contentType: input.file.type || 'application/octet-stream',
          base64Data: base64,
        }),
      });

      return payload.file as WorkflowUploadResult;
    }
  });
}

export async function deleteWorkflowAsset(input: { fileUrl: string }) {
  await measureTelemetry('workflow.asset.delete', {
    file_url: input.fileUrl,
  }, async () => {
    try {
      await deleteStorageFileDirect({ bucket: WORKFLOW_STORAGE_BUCKET, fileUrl: input.fileUrl });
    } catch {
      await requestAppApi('/api/intake-delete', {
        method: 'POST',
        body: JSON.stringify({
          fileUrl: input.fileUrl,
        }),
      });
    }
  });
}

export async function createActivityLog(input: {
  actorProfileId?: string | null;
  actionType: string;
  objectType: string;
  objectId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const client = requireSupabase();
  const payload = {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    happened_at: new Date().toISOString(),
    actor_profile_id: input.actorProfileId || null,
    action_type: input.actionType,
    object_type: input.objectType,
    object_id: input.objectId,
    summary: input.summary,
    metadata: input.metadata || {},
  };
  const { data, error } = await client.from('vcontent_activity_logs').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function uploadProfileAvatar(input: {
  file: File;
  profileId: string;
  previousUrl?: string | null;
}) {
  try {
    return await uploadStorageFileDirect({
      bucket: AVATAR_STORAGE_BUCKET,
      file: input.file,
      previousUrl: input.previousUrl,
      segments: [
        'avatars',
        slugifyStoragePath(input.profileId) || 'unknown-profile',
        `${Date.now()}-${slugifyStoragePath(input.file.name) || 'avatar'}`,
      ],
    });
  } catch {
    const base64 = await fileToBase64(input.file);
    const payload = await requestAppApi('/api/profile-avatar-upload', {
      method: 'POST',
      body: JSON.stringify({
        profileId: input.profileId,
        previousUrl: input.previousUrl || null,
        fileName: input.file.name,
        contentType: input.file.type || 'application/octet-stream',
        base64Data: base64,
      }),
    });

    return payload.file as WorkflowUploadResult;
  }
}

export async function adminCreateAuthUser(input: {
  accessToken: string;
  email: string;
  password: string;
  fullName: string;
  profileId: string;
}) {
  const response = await fetch('/api/admin-create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Không tạo được Supabase Auth user.');
  }
  return payload.user;
}

export async function adminResetAuthPassword(input: {
  accessToken: string;
  userId: string;
  password: string;
}) {
  const response = await fetch('/api/admin-reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Không reset được mật khẩu.');
  }
  return payload.user;
}
