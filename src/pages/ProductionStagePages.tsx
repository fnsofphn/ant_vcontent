import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import { useToast } from '@/components/system/ToastProvider';
import { buildTaskAssigneePatch, findAssignableProfile, toAssignableProfiles } from '@/lib/taskAssignee';
import {
  archiveTasksForStage,
  createActivityLog,
  createScormReview,
  createSlideDesignReview,
  createVideoReview,
  createVoiceReview,
  deleteScormReview,
  deleteSlideDesignReview,
  deleteVideoReview,
  deleteWorkflowAsset,
  ensureTaskForStage,
  ensureWorkflowRecord,
  inferProductWorkflowModule,
  listActivityLogs,
  listOrdersWithProducts,
  listProfiles,
  listTasks,
  listWorkflowRecords,
  updateOrder,
  updateProduct,
  updateTask,
  updateWorkflowRecord,
  uploadWorkflowAsset,
  type OrderRow,
  type ProductRow,
  type QuestionLibraryRow,
  type ScormReviewRow,
  type SlideDesignReviewRow,
  type TaskRow,
  type VideoReviewRow,
} from '@/services/vcontent';
import type { PageKey } from '@/data/vcontent';

const WORKFLOW_MAX_UPLOAD_MB = 200;
const WORKFLOW_MAX_UPLOAD_BYTES = WORKFLOW_MAX_UPLOAD_MB * 1024 * 1024;

type DomainConfig = {
  pageId: 'smf03' | 'vsmf03' | 'smf05' | 'vsmf05' | 'smf06' | 'vsmf06';
  module: 'ELN' | 'VIDEO';
  stageIndex: number;
  recordKind: 'slide_design' | 'voice_over' | 'video_edit';
  eye: string;
  title: string;
  subtitle: string;
  nextStagePage: string;
  nextStageRoute: PageKey;
  startLabel: string;
  submitLabel: string;
  stageCode: string;
};

type QcConfig = {
  pageId: 'smf04' | 'vsmf04' | 'smf07' | 'vsmf07';
  module: 'ELN' | 'VIDEO';
  stageIndex: number;
  recordKind: 'slide_design' | 'video_edit';
  eye: string;
  title: string;
  subtitle: string;
  previousStageIndex: number;
  nextStageIndex: number;
  nextStagePage: string;
  nextStageRoute: PageKey | null;
  previousStagePage: string;
  previousStageRoute: PageKey;
  stageCode: string;
};

type NoticeState = {
  tone: 'success' | 'danger';
  message: string;
} | null;

type UploadOperationState = {
  label: string;
  progress: number;
  tone: 'warning' | 'danger' | 'success' | 'violet' | 'neutral';
};

type WorkflowAssetItem = {
  url: string;
  label: string;
};

const DOMAIN_CONFIGS: Record<DomainConfig['pageId'], DomainConfig> = {
  smf03: { pageId: 'smf03', module: 'ELN', stageIndex: 2, recordKind: 'slide_design', eye: 'Module 2 \u00b7 SMF-03', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd \u0054\u0068\u0069\u1ebf\u0074 \u006b\u1ebf Slides', subtitle: 'Workspace B3: thi\u1ebft k\u1ebf slides, l\u01b0u h\u1ed3 s\u01a1 v\u00e0 submit sang c\u1ed5ng QC B4.', nextStagePage: 'SMF-04', nextStageRoute: 'smf04', startLabel: 'B\u1eaft \u0111\u1ea7u B3', submitLabel: 'Submit -> B4', stageCode: 'SMF-03' },
  vsmf03: { pageId: 'vsmf03', module: 'VIDEO', stageIndex: 2, recordKind: 'slide_design', eye: 'Module 3 \u00b7 VSMF-03', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd \u0054\u0068\u0069\u1ebf\u0074 \u006b\u1ebf Slides', subtitle: 'Workspace VSMF-03: thi\u1ebft k\u1ebf khung h\u00ecnh, l\u01b0u h\u1ed3 s\u01a1 v\u00e0 submit sang QC.', nextStagePage: 'VSMF-04', nextStageRoute: 'vsmf04', startLabel: 'B\u1eaft \u0111\u1ea7u VSMF-03', submitLabel: 'Submit -> VSMF-04', stageCode: 'VSMF-03' },
  smf05: { pageId: 'smf05', module: 'ELN', stageIndex: 4, recordKind: 'voice_over', eye: 'Module 2 \u00b7 SMF-05', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd Thu Voice', subtitle: 'Workspace B5: thu voice, ch\u1ed1t handoff package v\u00e0 m\u1edf B6 Video.', nextStagePage: 'SMF-06', nextStageRoute: 'smf06', startLabel: 'B\u1eaft \u0111\u1ea7u B5', submitLabel: 'Submit -> B6', stageCode: 'SMF-05' },
  vsmf05: { pageId: 'vsmf05', module: 'VIDEO', stageIndex: 4, recordKind: 'voice_over', eye: 'Module 3 \u00b7 VSMF-05', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd Thu Voice', subtitle: 'Workspace VSMF-05: thu voice video v\u00e0 chuy\u1ec3n sang VSMF-06.', nextStagePage: 'VSMF-06', nextStageRoute: 'vsmf06', startLabel: 'B\u1eaft \u0111\u1ea7u VSMF-05', submitLabel: 'Submit -> VSMF-06', stageCode: 'VSMF-05' },
  smf06: { pageId: 'smf06', module: 'ELN', stageIndex: 5, recordKind: 'video_edit', eye: 'Module 2 \u00b7 SMF-06', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd Bi\u00ean t\u1eadp Video', subtitle: 'Workspace B6: d\u1ef1ng video, render, subtitle v\u00e0 submit sang B7 QC Video.', nextStagePage: 'SMF-07', nextStageRoute: 'smf07', startLabel: 'B\u1eaft \u0111\u1ea7u B6', submitLabel: 'Submit -> B7', stageCode: 'SMF-06' },
  vsmf06: { pageId: 'vsmf06', module: 'VIDEO', stageIndex: 5, recordKind: 'video_edit', eye: 'Module 3 \u00b7 VSMF-06', title: '\u0051\u0075\u1ea3\u006e \u006c\u00fd Bi\u00ean t\u1eadp Video', subtitle: 'Workspace VSMF-06: d\u1ef1ng video, render v\u00e0 submit sang QC Video.', nextStagePage: 'VSMF-07', nextStageRoute: 'vsmf07', startLabel: 'B\u1eaft \u0111\u1ea7u VSMF-06', submitLabel: 'Submit -> VSMF-07', stageCode: 'VSMF-06' },
};

const QC_CONFIGS: Record<QcConfig['pageId'], QcConfig> = {
  smf04: { pageId: 'smf04', module: 'ELN', stageIndex: 3, recordKind: 'slide_design', eye: 'Module 2 \u00b7 SMF-04', title: 'QC Slides', subtitle: 'Gate B4: claim review, pass/fail v\u00e0 tr\u1ea3 v\u1ec1 B3 khi c\u1ea7n.', previousStageIndex: 2, nextStageIndex: 4, nextStagePage: 'SMF-05', nextStageRoute: 'smf05', previousStagePage: 'SMF-03', previousStageRoute: 'smf03', stageCode: 'SMF-04' },
  vsmf04: { pageId: 'vsmf04', module: 'VIDEO', stageIndex: 3, recordKind: 'slide_design', eye: 'Module 3 \u00b7 VSMF-04', title: 'QC Slides', subtitle: 'Gate VSMF-04: review khung h\u00ecnh, pass/fail v\u00e0 tr\u1ea3 v\u1ec1 VSMF-03.', previousStageIndex: 2, nextStageIndex: 4, nextStagePage: 'VSMF-05', nextStageRoute: 'vsmf05', previousStagePage: 'VSMF-03', previousStageRoute: 'vsmf03', stageCode: 'VSMF-04' },
  smf07: { pageId: 'smf07', module: 'ELN', stageIndex: 6, recordKind: 'video_edit', eye: 'Module 2 \u00b7 SMF-07', title: 'QC Video', subtitle: 'Gate B7: review video cu\u1ed1i, pass/fail v\u00e0 m\u1edf SMF-08.', previousStageIndex: 5, nextStageIndex: 7, nextStagePage: 'SMF-08', nextStageRoute: 'smf08', previousStagePage: 'SMF-06', previousStageRoute: 'smf06', stageCode: 'SMF-07' },
  vsmf07: { pageId: 'vsmf07', module: 'VIDEO', stageIndex: 6, recordKind: 'video_edit', eye: 'Module 3 \u00b7 VSMF-07', title: 'QC Video', subtitle: 'Gate VSMF-07: review video cu\u1ed1i, pass/fail v\u00e0 m\u1edf b\u00e0n giao.', previousStageIndex: 5, nextStageIndex: 7, nextStagePage: 'Ready delivery', nextStageRoute: null, previousStagePage: 'VSMF-06', previousStageRoute: 'vsmf06', stageCode: 'VSMF-07' },
};

const SLIDE_CHECKLIST = [
  { key: 'brand_font', label: 'Brand font \u0111\u00fang guideline' },
  { key: 'color_palette', label: 'Color palette \u0111\u00fang brand' },
  { key: 'storyboard_alignment', label: 'B\u00e1m storyboard \u0111\u00e3 duy\u1ec7t' },
] as const;

const VOICE_CHECKLIST = [
  { key: 'script_locked', label: 'Script \u0111\u00e3 kh\u00f3a' },
  { key: 'pronunciation_checked', label: 'Ph\u00e1t \u00e2m \u0111\u00e3 ki\u1ec3m tra' },
  { key: 'pacing_aligned', label: 'Nh\u1ecbp \u0111\u1ecdc ph\u00f9 h\u1ee3p' },
  { key: 'noise_cleaned', label: '\u0110\u00e3 x\u1eed l\u00fd noise' },
] as const;

const VIDEO_CHECKLIST = [
  { key: 'voice_synced', label: 'Voice sync \u0111\u00fang timeline' },
  { key: 'transitions_checked', label: 'Transition \u1ed5n \u0111\u1ecbnh' },
  { key: 'subtitle_embedded', label: 'Subtitle \u0111\u00e3 g\u1eafn' },
  { key: 'branding_applied', label: 'Branding \u0111\u00e3 \u00e1p d\u1ee5ng' },
] as const;

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['changes_requested', 'qc_fail', 'fail', 'rejected'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'submitted_qc', 'submitted_video', 'todo', 'packaging', 'building_quiz', 'claimed'].includes(status)) return 'warning';
  if (['approved', 'qc_passed', 'completed', 'ready_delivery', 'done'].includes(status)) return 'success';
  if (['in_progress', 'recording', 'editing', 'started'].includes(status)) return 'violet';
  return 'neutral';
}

function getWorkflowStatusLabel(status: string | null | undefined) {
  switch (String(status || '')) {
    case 'todo':
      return 'Chưa bắt đầu';
    case 'draft':
      return 'Bản nháp';
    case 'in_progress':
    case 'started':
      return 'Đang làm';
    case 'recording':
      return 'Đang thu';
    case 'editing':
      return 'Đang biên tập';
    case 'review':
    case 'in_review':
    case 'claimed':
      return 'Đang duyệt';
    case 'submitted':
      return 'Đã gửi';
    case 'submitted_qc':
      return 'Đã gửi QC';
    case 'submitted_video':
      return 'Đã chuyển video';
    case 'changes_requested':
    case 'qc_fail':
    case 'fail':
    case 'rejected':
      return 'Bị trả lại';
    case 'approved':
      return 'Đã duyệt';
    case 'qc_passed':
      return 'QC đạt';
    case 'completed':
    case 'done':
      return 'Hoàn thành';
    case 'ready_delivery':
      return 'Sẵn sàng bàn giao';
    default:
      return String(status || 'Chưa bắt đầu');
  }
}

function getReviewDecisionLabel(decision: string | null | undefined) {
  switch (String(decision || '')) {
    case 'submitted':
      return 'Đã gửi duyệt';
    case 'changes_requested':
      return 'Bị trả lại';
    case 'approved':
      return 'Đã duyệt';
    default:
      return String(decision || '-');
  }
}

function localizeWorkflowText(text: string | null | undefined) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value
    .replace(/submitted to QC video\./gi, 'đã gửi sang QC video.')
    .replace(/submitted to QC gate\./gi, 'đã gửi sang cổng QC.')
    .replace(/submitted to video\./gi, 'đã chuyển sang bước video.')
    .replace(/QC passed\./gi, 'QC đã duyệt.')
    .replace(/QC failed\. Return to previous step\./gi, 'QC chưa đạt, trả về bước trước.')
    .replace(/approved at/gi, 'được duyệt tại')
    .replace(/returned to/gi, 'bị trả về')
    .replace(/started/gi, 'bắt đầu')
    .replace(/submitted/gi, 'đã gửi')
    .replace(/claimed/gi, 'đã nhận review');
}

function getWorkflowStatusFrameClass(status: string) {
  if (['in_progress', 'recording', 'editing', 'started'].includes(status)) return 'status-working';
  if (['submitted', 'review', 'in_review', 'submitted_qc', 'submitted_video', 'claimed'].includes(status)) return 'status-submitted';
  if (['changes_requested', 'qc_fail', 'fail', 'rejected'].includes(status)) return 'status-returned';
  if (['approved', 'qc_passed', 'completed', 'ready_delivery', 'done'].includes(status)) return 'status-approved';
  return 'status-neutral';
}

function getWorkflowEventTone(actionType: string) {
  if (actionType === 'workflow_step_started') return 'status-working';
  if (actionType === 'workflow_step_submitted') return 'status-submitted';
  if (actionType === 'workflow_step_returned') return 'status-returned';
  if (actionType === 'workflow_step_approved') return 'status-approved';
  return 'status-neutral';
}

function getWorkflowEventLabel(actionType: string) {
  if (actionType === 'workflow_step_started') return 'Bắt đầu';
  if (actionType === 'workflow_step_submitted') return 'Gửi QC';
  if (actionType === 'workflow_step_returned') return 'Bị trả lại';
  if (actionType === 'workflow_step_approved') return 'Được duyệt';
  if (actionType === 'workflow_review_claimed') return 'QC nhận review';
  return actionType;
}

function getStatusFromStageEvent(actionType: string, fallbackStatus: string) {
  if (actionType === 'workflow_step_returned') return 'changes_requested';
  if (actionType === 'workflow_step_approved') return 'qc_passed';
  if (actionType === 'workflow_step_submitted') {
    return fallbackStatus === 'submitted_video' ? 'submitted_video' : 'submitted_qc';
  }
  if (actionType === 'workflow_review_claimed') return 'claimed';
  if (actionType === 'workflow_step_started') return 'in_progress';
  return fallbackStatus;
}

function isOpenWorkflowStatus(status: string | null | undefined) {
  return ['todo', 'draft', 'in_progress', 'recording', 'editing', 'started', 'submitted', 'review', 'in_review', 'submitted_qc', 'submitted_video', 'claimed', 'changes_requested', 'qc_fail', 'fail', 'rejected'].includes(String(status || ''));
}

function getRowsForStage(orders: OrderRow[], products: ProductRow[], tasks: TaskRow[], records: Array<any>, module: 'ELN' | 'VIDEO', stageIndices: number[]) {
  return orders
    .flatMap((order) =>
      products
        .filter((product) => product.order_id === order.id && inferProductWorkflowModule(product.id, order.module) === module)
        .map((product) => {
          const activeTask = tasks.find((task) => task.order_id === order.id && task.product_id === product.id && stageIndices.includes(task.stage_index) && !task.archived) || null;
          const record = records.find((entry) => entry.order_id === order.id && entry.product_id === product.id) || null;
          const isAtCurrentStage = stageIndices.includes(product.current_stage_index);
          const hasOpenRecord = Boolean(record && isOpenWorkflowStatus(record.status));
          const isRelevant = Boolean(activeTask || isAtCurrentStage || hasOpenRecord);
          if (!isRelevant) return null;
          return { order, product, task: activeTask, record };
        }),
    )
    .filter(Boolean) as Array<{ order: OrderRow; product: ProductRow; task: TaskRow | null; record: any | null }>;
}

function findWorkflowRecordByProduct(entries: Array<any> | undefined, orderId: string, productId: string) {
  return (entries || []).find((entry) => entry.order_id === orderId && entry.product_id === productId) || null;
}

function getAssetLabel(value: string | null | undefined) {
  if (!value) return 'Ch\u01b0a c\u00f3 file';
  if (/^https?:\/\//i.test(value)) {
    const clean = value.split('?')[0];
    return decodeURIComponent(clean.slice(clean.lastIndexOf('/') + 1));
  }
  return value;
}

function parseAssetItems(value: string | null | undefined): WorkflowAssetItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === 'string') {
            return { url: item, label: getAssetLabel(item) };
          }
          if (item && typeof item === 'object' && typeof item.url === 'string') {
            return { url: item.url, label: typeof item.label === 'string' && item.label ? item.label : getAssetLabel(item.url) };
          }
          return null;
        })
        .filter(Boolean) as WorkflowAssetItem[];
    }
  } catch {
    // Keep backward compatibility for single-file values.
  }
  return [{ url: value, label: getAssetLabel(value) }];
}

function serializeAssetItems(items: WorkflowAssetItem[]) {
  if (!items.length) return null;
  if (items.length === 1) return items[0].url;
  return JSON.stringify(items);
}

function getAssetSummary(value: string | null | undefined) {
  const items = parseAssetItems(value);
  if (!items.length) return 'Ch\u01b0a c\u00f3 file';
  if (items.length === 1) return items[0].label;
  return `${items.length} file da upload`;
}

function isAssetUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function renderNotice(notice: NoticeState) {
  return notice ? <div className={`bullet-item ${notice.tone === 'danger' ? 'tone-danger' : 'tone-success'}`}>{notice.message}</div> : null;
}

function formatErrorMessage(error: unknown) {
  if (!error) return '\u0110\u00e3 x\u1ea3y ra l\u1ed7i.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const maybe = error as { message?: string; details?: string; hint?: string; code?: string };
    return maybe.message || maybe.details || maybe.hint || maybe.code || JSON.stringify(error);
  }
  return String(error);
}

function getDomainRecordAssigneeProfileId(recordKind: DomainConfig['recordKind'], record: any) {
  if (!record) return '';
  if (recordKind === 'slide_design') return String(record.designer_profile_id || '');
  if (recordKind === 'voice_over') return String(record.talent_profile_id || '');
  return String(record.editor_profile_id || '');
}

function getDomainRecordAssigneePatch(recordKind: DomainConfig['recordKind'], profileId: string) {
  if (recordKind === 'slide_design') return { designer_profile_id: profileId || null };
  if (recordKind === 'voice_over') return { talent_profile_id: profileId || null };
  return { editor_profile_id: profileId || null };
}

function getQcReviewerProfileId(record: any) {
  return String(record?.qc_reviewer_profile_id || '');
}

function usesVideoLinkOnly(pageId: PageKey) {
  return pageId === 'smf06' || pageId === 'vsmf06' || pageId === 'smf07' || pageId === 'vsmf07';
}

function validateWorkflowFile(file: File) {
  if (file.size > WORKFLOW_MAX_UPLOAD_BYTES) {
    throw new Error(`File vượt quá ${WORKFLOW_MAX_UPLOAD_MB}MB.`);
  }
}

function UploadProgressPanel({ operation }: { operation: UploadOperationState | null | undefined }) {
  if (!operation) return null;
  return (
    <div className="intake-progress-panel">
      <div className="intake-progress-head">
        <span>{operation.label}</span>
        <span>{operation.progress}%</span>
      </div>
      <div className="progress-track intake-progress-track">
        <div className={`progress-fill tone-${operation.tone}`} style={{ width: `${operation.progress}%` }} />
      </div>
    </div>
  );
}

function FileActions({
  label,
  assetValue,
  onUpload,
  onDelete,
  operation,
}: {
  label: string;
  assetValue: string | null | undefined;
  onUpload: (file: File) => void;
  onDelete: () => void;
  operation?: UploadOperationState | null;
}) {
  return (
    <div className="asset-toolbar">
      <label className="btn btn-ghost">
        {label}
        <input
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onUpload(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {assetValue ? (
        <>
          {isAssetUrl(assetValue) ? (
            <a className="btn btn-ghost" href={assetValue} target="_blank" rel="noreferrer">
              {'T\u1ea3i/xem file'}
            </a>
          ) : null}
          <button className="btn btn-ghost" onClick={onDelete}>
            {'X\u00f3a file'}
          </button>
          <div className="muted-text">{getAssetLabel(assetValue)}</div>
        </>
      ) : (
        <div className="muted-text">{'Ch\u01b0a c\u00f3 file \u0111\u00e3 upload.'}</div>
      )}
      <UploadProgressPanel operation={operation} />
    </div>
  );
}

function MultiFileActions({
  label,
  assetValue,
  onUpload,
  onDeleteItem,
  operation,
}: {
  label: string;
  assetValue: string | null | undefined;
  onUpload: (files: File[]) => void;
  onDeleteItem: (fileUrl: string) => void;
  operation?: UploadOperationState | null;
}) {
  const items = parseAssetItems(assetValue);
  return (
    <div className="asset-toolbar">
      <label className="btn btn-ghost">
        {label}
        <input
          type="file"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (!files.length) return;
            onUpload(files);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {items.length ? (
        <div className="stack compact full">
          {items.map((item) => (
            <div className="intake-file-row" key={item.url}>
              <div className="muted-text intake-file-name">{item.label}</div>
              <div className="intake-inline-actions">
                {isAssetUrl(item.url) ? (
                  <a className="btn btn-ghost btn-small" href={item.url} target="_blank" rel="noreferrer">
                    {'T\u1ea3i/xem file'}
                  </a>
                ) : null}
                <button className="btn btn-ghost btn-small" onClick={() => onDeleteItem(item.url)}>
                  {'X\u00f3a file'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="muted-text">{'Ch\u01b0a c\u00f3 file \u0111\u00e3 upload.'}</div>
      )}
      <UploadProgressPanel operation={operation} />
    </div>
  );
}

function ReferenceAsset({ label, assetValue, emptyLabel }: { label: string; assetValue: string | null | undefined; emptyLabel: string }) {
  return (
    <div className="asset-toolbar">
      <div className="bullet-item">{label}</div>
      {assetValue ? (
        <>
          {isAssetUrl(assetValue) ? (
            <a className="btn btn-ghost" href={assetValue} target="_blank" rel="noreferrer">
              {'Mo/tai file'}
            </a>
          ) : null}
          <div className="muted-text">{getAssetLabel(assetValue)}</div>
        </>
      ) : (
        <div className="muted-text">{emptyLabel}</div>
      )}
    </div>
  );
}

function StageQueue({ rows, selectedKey, setSelectedKey, getMeta, colorizeFrame = false }: { rows: Array<{ order: OrderRow; product: ProductRow; task: TaskRow | null; record: any | null }>; selectedKey: string; setSelectedKey: (value: string) => void; getMeta: (row: { order: OrderRow; product: ProductRow; task: TaskRow | null; record: any | null }) => string; colorizeFrame?: boolean }) {
  return (
    <div className="stack">
      {rows.map((row) => {
        const active = `${row.order.id}::${row.product.id}` === selectedKey;
        const status = row.record?.status || row.task?.status || 'todo';
        const statusFrameClass = colorizeFrame ? ` ${getWorkflowStatusFrameClass(status)}` : '';
        return (
          <button key={`${row.order.id}-${row.product.id}`} className={`list-item storyboard-queue-item workflow-nav-card${statusFrameClass}${active ? ' active' : ''}`} onClick={() => setSelectedKey(`${row.order.id}::${row.product.id}`)}>
            <div className="workflow-nav-main">
              <div className="workflow-nav-code">{row.product.id}</div>
              <div className="workflow-nav-meta">{row.order.id}</div>
              <div className="workflow-nav-meta">{row.product.name}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function DomainStagePage({ pageId }: { pageId: PageKey }) {
  const config = DOMAIN_CONFIGS[pageId as DomainConfig['pageId']];
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const shouldAutoNavigate = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const workflowKinds = config.recordKind === 'slide_design'
    ? ['slide_design', 'storyboard']
    : config.recordKind === 'voice_over'
      ? ['voice_over', 'storyboard', 'slide_design']
      : ['video_edit', 'storyboard', 'slide_design'];
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'stage', config.stageIndex], queryFn: () => listTasks({ stageIndices: [config.stageIndex] }) });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', ...workflowKinds, 'lite'],
    queryFn: () => listWorkflowRecords({ kinds: workflowKinds as any, includeReviews: false, includeQuestionLibrary: false }),
  });
  const profilesQuery = useQuery({ queryKey: ['profiles', 'domain-stage-assignees'], queryFn: listProfiles });
  const activityLogsQuery = useQuery({
    queryKey: ['activity-logs', 'task-starts'],
    queryFn: () =>
      listActivityLogs({
        actionTypes: ['task_started', 'workflow_step_started', 'workflow_review_claimed', 'workflow_step_submitted', 'workflow_step_returned', 'workflow_step_approved'],
        limit: 1000,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const records = useMemo(() => {
    if (config.recordKind === 'slide_design') return workflowQuery.data?.slideDesigns || [];
    if (config.recordKind === 'voice_over') return workflowQuery.data?.voiceOvers || [];
    return workflowQuery.data?.videoEdits || [];
  }, [config.recordKind, workflowQuery.data]);

  const rows = useMemo(
    () => getRowsForStage(ordersQuery.data?.orders || [], ordersQuery.data?.products || [], tasksQuery.data || [], records, config.module, [config.stageIndex]),
    [config.module, config.stageIndex, ordersQuery.data, records, tasksQuery.data],
  );
  const rowsWithDisplayStatus = useMemo(() => {
    const latestStageEventByProduct = new Map<string, { actionType: string; happenedAt: number }>();
    for (const log of activityLogsQuery.data || []) {
      if (log.metadata?.stage_code !== config.stageCode) continue;
      const productId = typeof log.metadata?.product_id === 'string' ? log.metadata.product_id : null;
      if (!productId) continue;
      const happenedAt = new Date(log.happened_at).getTime();
      const current = latestStageEventByProduct.get(productId);
      if (!current || happenedAt >= current.happenedAt) {
        latestStageEventByProduct.set(productId, { actionType: log.action_type, happenedAt });
      }
    }

    return rows.map((row) => {
      const fallbackStatus = String(row.record?.status || row.task?.status || 'todo');
      const latestEvent = latestStageEventByProduct.get(row.product.id);
      const displayStatus = latestEvent ? getStatusFromStageEvent(latestEvent.actionType, fallbackStatus) : fallbackStatus;
      return {
        ...row,
        displayStatus,
        record: row.record ? { ...row.record, status: displayStatus } : row.record,
      };
    });
  }, [activityLogsQuery.data, config.stageCode, rows]);

  const [selectedKey, setSelectedKey] = useState('');
  const [notice, setNotice] = useState<NoticeState>(null);
  const [startedAtOverrides, setStartedAtOverrides] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [selectedAssigneeProfileId, setSelectedAssigneeProfileId] = useState('');
  const [mainAssetLink, setMainAssetLink] = useState('');
  const [assetOperations, setAssetOperations] = useState<Record<string, UploadOperationState>>({});

  useEffect(() => {
    if (!selectedKey && rowsWithDisplayStatus[0]) setSelectedKey(`${rowsWithDisplayStatus[0].order.id}::${rowsWithDisplayStatus[0].product.id}`);
  }, [rowsWithDisplayStatus, selectedKey]);

  const selected = useMemo(() => rowsWithDisplayStatus.find((row) => `${row.order.id}::${row.product.id}` === selectedKey) || null, [rowsWithDisplayStatus, selectedKey]);
  const selectedStoryboardRecord = useMemo(
    () => (selected ? findWorkflowRecordByProduct(workflowQuery.data?.storyboards, selected.order.id, selected.product.id) : null),
    [selected, workflowQuery.data?.storyboards],
  );
  const selectedSlideRecord = useMemo(
    () => (selected ? findWorkflowRecordByProduct(workflowQuery.data?.slideDesigns, selected.order.id, selected.product.id) : null),
    [selected, workflowQuery.data?.slideDesigns],
  );
  const assigneeProfiles = useMemo(
    () => toAssignableProfiles(profilesQuery.data || [], ['admin', 'pm', 'specialist', 'designer', 'vc', 'qc']),
    [profilesQuery.data],
  );
  const selectedAssignee = findAssignableProfile(assigneeProfiles, selectedAssigneeProfileId);
  const startedAtByTask = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of activityLogsQuery.data || []) {
      const taskId = typeof log.metadata?.task_id === 'string' ? log.metadata.task_id : null;
      if (!taskId) continue;
      const current = map.get(taskId);
      if (!current || new Date(log.happened_at).getTime() < new Date(current).getTime()) {
        map.set(taskId, log.happened_at);
      }
    }
    return map;
  }, [activityLogsQuery.data]);
  const selectedStageLogs = useMemo(
    () =>
      (activityLogsQuery.data || []).filter(
        (log) =>
          log.metadata?.order_id === selected?.order.id &&
          log.metadata?.product_id === selected?.product.id &&
          log.metadata?.stage_code === config.stageCode,
      ),
    [activityLogsQuery.data, config.stageCode, selected?.order.id, selected?.product.id],
  );

  useEffect(() => {
    const record = selected?.record;
    if (!record) {
      setDraft({});
      return;
    }
    if (config.recordKind === 'slide_design') {
      setDraft({
        target_slides: record.target_slides || 24,
        completed_slides: record.completed_slides || 0,
        file_name: isAssetUrl(record.file_name) ? '' : record.file_name || '',
        brand_spec: record.brand_spec || '',
        notes: record.notes || '',
        checklist: record.checklist || {},
      });
      return;
    }
    if (config.recordKind === 'voice_over') {
      setDraft({
        estimated_minutes: record.estimated_minutes || 18,
        recorded_minutes: record.recorded_minutes || 0,
        file_name: isAssetUrl(record.file_name) ? '' : record.file_name || '',
        voice_style: record.voice_style || '',
        notes: record.notes || '',
        checklist: record.checklist || {},
      });
      return;
    }
    setDraft({
      target_minutes: record.target_minutes || 18,
      render_progress: record.render_progress || 0,
      file_name: isAssetUrl(record.file_name) ? '' : record.file_name || '',
      subtitle_file: isAssetUrl(record.subtitle_file) ? '' : record.subtitle_file || '',
      render_preset: record.render_preset || '1080p',
      notes: record.notes || '',
      checklist: record.checklist || {},
    });
  }, [config.recordKind, selected?.record]);

  useEffect(() => {
    if (!selected) {
      setSelectedAssigneeProfileId('');
      return;
    }
    setSelectedAssigneeProfileId(
      selected.task?.assignee_profile_id ||
      getDomainRecordAssigneeProfileId(config.recordKind, selected.record) ||
      profile?.id ||
      '',
    );
  }, [config.recordKind, profile?.id, selected]);

  useEffect(() => {
    setMainAssetLink(String(selected?.record?.file_name || ''));
  }, [selected?.record?.file_name]);

  useEffect(() => {
    const operationKeys = Object.keys(assetOperations);
    if (!operationKeys.length) return;
    const timer = window.setInterval(() => {
      setAssetOperations((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, operation]) => [
            key,
            {
              ...operation,
              progress: operation.progress >= 92 ? operation.progress : Math.min(92, operation.progress + (operation.progress < 40 ? 18 : operation.progress < 72 ? 10 : 4)),
            },
          ]),
        ) as Record<string, UploadOperationState>,
      );
    }, 260);
    return () => window.clearInterval(timer);
  }, [assetOperations]);

  function startAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 8,
        tone: 'violet',
      },
    }));
  }

  function finishAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 100,
        tone: 'success',
      },
    }));
    window.setTimeout(() => {
      setAssetOperations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, 700);
  }

  function failAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 100,
        tone: 'danger',
      },
    }));
    window.setTimeout(() => {
      setAssetOperations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, 1200);
  }

  async function runAssetUpload(key: string, label: string, action: { action: 'upload_main' | 'upload_subtitle'; file: File }) {
    startAssetOperation(key, label);
    try {
      await mutation.mutateAsync(action);
      finishAssetOperation(key, 'Da tai len xong');
    } catch (error) {
      failAssetOperation(key, 'Upload that bai, vui long thu lai');
      throw error;
    }
  }

  async function runBatchAssetUpload(key: string, label: string, files: File[]) {
    startAssetOperation(key, label);
    try {
      await mutation.mutateAsync({ action: 'upload_main_batch', files });
      finishAssetOperation(key, 'Da tai len xong');
    } catch (error) {
      failAssetOperation(key, 'Upload that bai, vui long thu lai');
      throw error;
    }
  }

  const counts = useMemo(
    () => ({
      total: rowsWithDisplayStatus.length,
      active: rowsWithDisplayStatus.filter((row) => ['in_progress', 'recording', 'editing', 'started'].includes(row.displayStatus || '')).length,
      review: rowsWithDisplayStatus.filter((row) => ['submitted_qc', 'submitted_video', 'review', 'claimed'].includes(row.displayStatus || '')).length,
      done: rowsWithDisplayStatus.filter((row) => ['qc_passed', 'completed'].includes(row.displayStatus || '')).length,
    }),
    [rowsWithDisplayStatus],
  );

  const checklistConfig = config.recordKind === 'slide_design' ? SLIDE_CHECKLIST : config.recordKind === 'voice_over' ? VOICE_CHECKLIST : VIDEO_CHECKLIST;
  const shouldColorTaskLinked = ['smf03', 'vsmf03', 'smf06', 'vsmf06'].includes(config.pageId);
  const linkedTaskStatus = selected?.displayStatus || selected?.record?.status || selected?.task?.status || 'todo';
  const linkedTaskStatusClass = shouldColorTaskLinked ? getWorkflowStatusFrameClass(linkedTaskStatus) : 'status-neutral';

  const mutation = useMutation({
    mutationFn: async (input: {
      action: 'create' | 'save' | 'start' | 'submit' | 'upload_main' | 'upload_main_batch' | 'delete_main' | 'delete_main_item' | 'upload_subtitle' | 'delete_subtitle' | 'save_main_link';
      file?: File;
      files?: File[];
      fileUrl?: string;
      link?: string;
    }) => {
      if (!selected) throw new Error('Ch\u01b0a ch\u1ecdn item.');
      const existingTasks = tasksQuery.data || [];
      const ensuredTask =
        selected.task ||
        (await ensureTaskForStage({
          orderId: selected.order.id,
          productId: selected.product.id,
          stageIndex: config.stageIndex,
          existingTasks,
          assignee: selectedAssignee?.fullName || profile?.fullName || null,
          assigneeProfileId: selectedAssignee?.profileId || profile?.id || null,
          assigneeAccountId: selectedAssignee?.accountId || profile?.authUserId || null,
        }));
      const record = await ensureWorkflowRecord({
        kind: config.recordKind,
        orderId: selected.order.id,
        productId: selected.product.id,
        title: `${selected.product.id}: ${selected.product.name}`,
        profileId: profile?.id || null,
      });
      const storyboardRecord = findWorkflowRecordByProduct(workflowQuery.data?.storyboards, selected.order.id, selected.product.id);
      const slideRecord = findWorkflowRecordByProduct(workflowQuery.data?.slideDesigns, selected.order.id, selected.product.id);

      if (input.action === 'create') {
        return { notice: '\u0110\u00e3 t\u1ea1o h\u1ed3 s\u01a1 t\u00e1c nghi\u1ec7p.' };
      }

      if (input.action === 'upload_main') {
        if (!input.file) throw new Error('Ch\u01b0a c\u00f3 file de upload.');
        validateWorkflowFile(input.file);
        const uploaded = await uploadWorkflowAsset({
          file: input.file,
          orderId: selected.order.id,
          productId: selected.product.id,
          module: config.module,
          stageCode: config.stageCode,
          slot: config.recordKind,
          previousUrl: record.file_name,
        });
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: uploaded.fileUrl,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 t\u1ea3i file l\u00ean server.' };
      }

      if (input.action === 'upload_main_batch') {
        if (config.recordKind !== 'voice_over') throw new Error('Ch\u1ee9c nang nay chi ap dung cho thu voice.');
        const files = input.files || [];
        if (!files.length) throw new Error('Chua co file de upload.');
        const currentItems = parseAssetItems(record.file_name);
        const nextItems = [...currentItems];
        for (const file of files) {
          validateWorkflowFile(file);
          const uploaded = await uploadWorkflowAsset({
            file,
            orderId: selected.order.id,
            productId: selected.product.id,
            module: config.module,
            stageCode: config.stageCode,
            slot: config.recordKind,
          });
          nextItems.push({ url: uploaded.fileUrl, label: uploaded.fileName || getAssetLabel(uploaded.fileUrl) });
        }
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: serializeAssetItems(nextItems),
          updated_at: new Date().toISOString(),
        });
        return { notice: `\u0110\u00e3 t\u1ea3i ${files.length} file voice l\u00ean server.` };
      }

      if (input.action === 'delete_main') {
        const items = parseAssetItems(record.file_name);
        if (items.length === 1 && isAssetUrl(items[0]?.url)) {
          await deleteWorkflowAsset({ fileUrl: String(items[0].url) });
        }
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: null,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 x\u00f3a file ch\u00ednh.' };
      }

      if (input.action === 'delete_main_item') {
        if (config.recordKind !== 'voice_over') throw new Error('Ch\u1ee9c nang nay chi ap dung cho thu voice.');
        const currentItems = parseAssetItems(record.file_name);
        const targetUrl = String(input.fileUrl || '');
        if (!targetUrl) throw new Error('Chua xac dinh file can xoa.');
        if (isAssetUrl(targetUrl)) {
          await deleteWorkflowAsset({ fileUrl: targetUrl });
        }
        const nextItems = currentItems.filter((item) => item.url !== targetUrl);
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: serializeAssetItems(nextItems),
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 x\u00f3a file voice.' };
      }

      if (input.action === 'save_main_link') {
        const nextLink = String(input.link ?? mainAssetLink).trim();
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: nextLink || null,
          ...getDomainRecordAssigneePatch(config.recordKind, selectedAssigneeProfileId),
          updated_at: new Date().toISOString(),
        });
        return { notice: nextLink ? 'Đã lưu link video.' : 'Đã xóa link video.' };
      }

      if (input.action === 'upload_subtitle') {
        if (config.recordKind !== 'video_edit') throw new Error('B\u01b0\u1edbc n\u00e0y kh\u00f4ng c\u00f3 subtitle.');
        if (!input.file) throw new Error('Ch\u01b0a c\u00f3 file subtitle de upload.');
        validateWorkflowFile(input.file);
        const uploaded = await uploadWorkflowAsset({
          file: input.file,
          orderId: selected.order.id,
          productId: selected.product.id,
          module: config.module,
          stageCode: config.stageCode,
          slot: 'subtitle',
          previousUrl: record.subtitle_file,
        });
        await updateWorkflowRecord('video_edit', record.id, {
          subtitle_file: uploaded.fileUrl,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 t\u1ea3i file subtitle l\u00ean server.' };
      }

      if (input.action === 'delete_subtitle') {
        if (config.recordKind !== 'video_edit') throw new Error('B\u01b0\u1edbc n\u00e0y kh\u00f4ng c\u00f3 subtitle.');
        if (isAssetUrl(record.subtitle_file)) {
          await deleteWorkflowAsset({ fileUrl: String(record.subtitle_file) });
        }
        await updateWorkflowRecord('video_edit', record.id, {
          subtitle_file: null,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 x\u00f3a file subtitle.' };
      }

      if (input.action === 'save') {
        const normalizedTargetSlides = config.recordKind === 'slide_design' ? Math.max(1, Number(draft.target_slides) || 1) : draft.target_slides;
        await updateWorkflowRecord(config.recordKind, record.id, {
          ...draft,
          ...(config.recordKind === 'slide_design' ? { target_slides: normalizedTargetSlides } : {}),
          file_name: String(draft.file_name || '').trim() || record.file_name || null,
          ...(config.recordKind === 'video_edit'
            ? { subtitle_file: String(draft.subtitle_file || '').trim() || record.subtitle_file || null }
            : {}),
          ...getDomainRecordAssigneePatch(config.recordKind, selectedAssigneeProfileId),
          updated_at: new Date().toISOString(),
        });
        await updateTask(ensuredTask.id, buildTaskAssigneePatch(selectedAssignee));
        return { notice: '\u0110\u00e3 l\u01b0u c\u1eadp nh\u1eadt.' };
      }

      if (input.action === 'start') {
        const shouldLogStart = ensuredTask.status !== 'in_progress';
        const startedAt = new Date().toISOString();
        const status = config.recordKind === 'slide_design' ? 'in_progress' : config.recordKind === 'voice_over' ? 'recording' : 'editing';
        await updateWorkflowRecord(config.recordKind, record.id, {
          status,
          ...draft,
          ...getDomainRecordAssigneePatch(config.recordKind, selectedAssigneeProfileId),
          updated_at: new Date().toISOString(),
        });
        await updateTask(ensuredTask.id, {
          status: 'in_progress',
          progress: Math.max(ensuredTask.progress, 25),
          ...buildTaskAssigneePatch(selectedAssignee),
        });
        await updateProduct(selected.product.id, {
          current_stage_index: config.stageIndex,
          progress: Math.max(selected.product.progress, 25),
        });
        if (shouldLogStart) {
          await createActivityLog({
            actorProfileId: profile?.id || null,
            actionType: 'workflow_step_started',
            objectType: 'task',
            objectId: ensuredTask.id,
            summary: `${selected.product.id} started ${config.stageCode}`,
            metadata: {
              task_id: ensuredTask.id,
              order_id: selected.order.id,
              product_id: selected.product.id,
              stage_code: config.stageCode,
              stage_index: config.stageIndex,
              module: config.module,
            },
          });
        }
        return { notice: '\u0110\u00e3 ghi nh\u1eadn b\u1eaft \u0111\u1ea7u b\u01b0\u1edbc.', taskId: ensuredTask.id, startedAt };
      }

      if (config.recordKind === 'slide_design') {
        const normalizedTargetSlides = Math.max(1, Number(draft.target_slides) || 1);
        await updateWorkflowRecord('slide_design', record.id, {
          ...draft,
          ...getDomainRecordAssigneePatch('slide_design', selectedAssigneeProfileId),
          status: 'submitted_qc',
          target_slides: normalizedTargetSlides,
          completed_slides: Math.max(Number(draft.completed_slides) || 0, normalizedTargetSlides),
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
        await ensureTaskForStage({
          orderId: selected.order.id,
          productId: selected.product.id,
          stageIndex: 3,
          existingTasks,
          assignee: null,
        });
        await updateProduct(selected.product.id, { current_stage_index: 3, progress: 50 });
        await createActivityLog({
          actorProfileId: profile?.id || null,
          actionType: 'workflow_step_submitted',
          objectType: 'workflow',
          objectId: record.id,
          summary: `${selected.product.id} submitted ${config.stageCode} to QC`,
          metadata: {
            order_id: selected.order.id,
            product_id: selected.product.id,
            stage_code: config.stageCode,
            stage_index: config.stageIndex,
            module: config.module,
          },
        });
        await createSlideDesignReview({
          slideDesignId: record.id,
          reviewerProfileId: profile?.id || null,
          decision: 'submitted',
          comment: 'Bộ slides đã được gửi sang cổng QC.',
          criteria: {
            slide_count: true,
            brand_font: Boolean(draft.checklist?.brand_font),
            color_palette: Boolean(draft.checklist?.color_palette),
            storyboard_alignment: Boolean(draft.checklist?.storyboard_alignment),
          },
        });
        return { notice: '\u0110\u00e3 submit sang c\u1ed5ng QC.', nextRoute: config.nextStageRoute };
      }

      if (config.recordKind === 'voice_over') {
        await updateWorkflowRecord('voice_over', record.id, {
          ...draft,
          ...getDomainRecordAssigneePatch('voice_over', selectedAssigneeProfileId),
          status: 'submitted_video',
          recorded_minutes: Math.max(Number(draft.recorded_minutes) || 0, Number(draft.estimated_minutes) || 0),
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
        await ensureTaskForStage({
          orderId: selected.order.id,
          productId: selected.product.id,
          stageIndex: 5,
          existingTasks,
          assignee: null,
        });
        await updateProduct(selected.product.id, { current_stage_index: 5, progress: 55 });
        await createActivityLog({
          actorProfileId: profile?.id || null,
          actionType: 'workflow_step_submitted',
          objectType: 'workflow',
          objectId: record.id,
          summary: `${selected.product.id} submitted ${config.stageCode} to ${config.nextStagePage}`,
          metadata: {
            order_id: selected.order.id,
            product_id: selected.product.id,
            stage_code: config.stageCode,
            stage_index: config.stageIndex,
            module: config.module,
          },
        });
        await createVoiceReview({
          voiceOverId: record.id,
          reviewerProfileId: profile?.id || null,
          decision: 'submitted',
          comment: 'Gói thu voice đã được chuyển sang bước biên tập video.',
          criteria: {
            script_locked: Boolean(draft.checklist?.script_locked),
            pronunciation_checked: Boolean(draft.checklist?.pronunciation_checked),
            pacing_aligned: Boolean(draft.checklist?.pacing_aligned),
            noise_cleaned: Boolean(draft.checklist?.noise_cleaned),
          },
        });
        return { notice: '\u0110\u00e3 submit sang b\u01b0\u1edbc video.', nextRoute: config.nextStageRoute };
      }

      await updateWorkflowRecord('video_edit', record.id, {
        ...draft,
        ...getDomainRecordAssigneePatch('video_edit', selectedAssigneeProfileId),
        status: 'submitted_qc',
        render_progress: 100,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
      await ensureTaskForStage({
        orderId: selected.order.id,
        productId: selected.product.id,
        stageIndex: 6,
        existingTasks,
        assignee: null,
      });
      await updateProduct(selected.product.id, { current_stage_index: 6, progress: 75 });
      await createActivityLog({
        actorProfileId: profile?.id || null,
        actionType: 'workflow_step_submitted',
        objectType: 'workflow',
        objectId: record.id,
        summary: `${selected.product.id} submitted ${config.stageCode} to ${config.nextStagePage}`,
        metadata: {
          order_id: selected.order.id,
          product_id: selected.product.id,
          stage_code: config.stageCode,
          stage_index: config.stageIndex,
          module: config.module,
        },
      });
      await createVideoReview({
        videoEditId: record.id,
        reviewerProfileId: profile?.id || null,
        decision: 'submitted',
          comment: 'Gói video đã được gửi sang QC video.',
        criteria: {
          voice_synced: Boolean(draft.checklist?.voice_synced),
          transitions_checked: Boolean(draft.checklist?.transitions_checked),
          subtitle_embedded: Boolean(draft.checklist?.subtitle_embedded),
          branding_applied: Boolean(draft.checklist?.branding_applied),
        },
      });
      return { notice: '\u0110\u00e3 submit video sang c\u1ed5ng QC.', nextRoute: config.nextStageRoute };
    },
    onSuccess: async (result) => {
      setNotice(result?.notice ? { tone: 'success', message: result.notice } : null);
      pushToast({ title: `${config.stageCode} cập nhật thành công`, message: result?.notice || 'Đã ghi nhận thao tác.', tone: 'success' });
      if (result?.taskId && result?.startedAt) {
        setStartedAtOverrides((current) => ({ ...current, [result.taskId]: result.startedAt }));
      }
      await queryClient.invalidateQueries({ queryKey: ['workflow-records'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['activity-logs', 'task-starts'] });
      if (shouldAutoNavigate && result?.nextRoute) {
        navigate(`/${result.nextRoute}`);
      }
    },
    onError: (error) => {
      setNotice({ tone: 'danger', message: formatErrorMessage(error) });
      pushToast({ title: `${config.stageCode} thất bại`, message: formatErrorMessage(error), tone: 'danger', durationMs: 4200 });
    },
  });

  return (
    <>
      <SectionHeader eye={config.eye} title={config.title} subtitle={config.subtitle} />
      <div className="kpi-row small">
        <Kpi label={'T\u1ed5ng queue'} value={String(counts.total)} sub={'Theo stage hi\u1ec7n t\u1ea1i'} tone="neutral" />
        <Kpi label={'\u0110ang l\u00e0m'} value={String(counts.active)} sub="Đang xử lý trong bước" tone="violet" />
        <Kpi label={'Ch\u1edd handoff'} value={String(counts.review)} sub={config.nextStagePage} tone="warning" />
        <Kpi label={'\u0110\u00e3 ch\u1ed1t'} value={String(counts.done)} sub={'\u0110\u00e3 qua b\u01b0\u1edbc'} tone="success" />
      </div>
      <div className="storyboard-layout">
        <Card title={'Queue thao t\u00e1c'}>
          <StageQueue
            rows={rowsWithDisplayStatus}
            selectedKey={selectedKey}
            setSelectedKey={setSelectedKey}
            getMeta={(row) => getAssetSummary(row.record?.file_name) || row.record?.title || 'Ch\u01b0a c\u00f3 h\u1ed3 s\u01a1 t\u00e1c nghi\u1ec7p'}
            colorizeFrame={shouldColorTaskLinked}
          />
        </Card>
        <Card title={selected ? `${selected.product.id}: ${selected.product.name}` : 'Workspace'}>
          {selected ? (
            <div className="storyboard-workspace">
              {renderNotice(notice)}
              <div className="form-grid storyboard-form-grid">
                {config.recordKind === 'slide_design' ? (
                  <>
                    <label><span>Số lượng slides</span><input className="fi" type="number" min="1" value={draft.target_slides || 1} onChange={(e) => setDraft((c) => ({ ...c, target_slides: Math.max(1, Number(e.target.value) || 1) }))} /></label>
                    <label><span>{'\u0110\u00e3 xong'}</span><input className="fi" type="number" value={draft.completed_slides || 0} onChange={(e) => setDraft((c) => ({ ...c, completed_slides: Number(e.target.value) || 0 }))} /></label>
                    <label><span>Người phụ trách</span><select className="fi" value={selectedAssigneeProfileId} onChange={(e) => setSelectedAssigneeProfileId(e.target.value)}><option value="">-- Chọn --</option>{assigneeProfiles.map((option) => <option key={option.profileId} value={option.profileId}>{option.fullName}</option>)}</select></label>
                    <label className="full"><span>File slides / URL</span><input className="fi" value={draft.file_name || ''} onChange={(e) => setDraft((c) => ({ ...c, file_name: e.target.value }))} /></label>
                    <label className="full"><span>Yêu cầu thương hiệu</span><input className="fi" value={draft.brand_spec || ''} onChange={(e) => setDraft((c) => ({ ...c, brand_spec: e.target.value }))} /></label>
                  </>
                ) : null}
                {config.recordKind === 'voice_over' ? (
                  <>
                    <label><span>{'Th\u1eddi l\u01b0\u1ee3ng d\u1ef1 ki\u1ebfn'}</span><input className="fi" type="number" value={draft.estimated_minutes || 0} onChange={(e) => setDraft((c) => ({ ...c, estimated_minutes: Number(e.target.value) || 0 }))} /></label>
                    <label><span>{'\u0110\u00e3 thu'}</span><input className="fi" type="number" value={draft.recorded_minutes || 0} onChange={(e) => setDraft((c) => ({ ...c, recorded_minutes: Number(e.target.value) || 0 }))} /></label>
                    <label><span>Voice talent</span><select className="fi" value={selectedAssigneeProfileId} onChange={(e) => setSelectedAssigneeProfileId(e.target.value)}><option value="">-- Chọn --</option>{assigneeProfiles.map((option) => <option key={option.profileId} value={option.profileId}>{option.fullName}</option>)}</select></label>
                    <label className="full"><span>File voice / URL</span><input className="fi" value={draft.file_name || ''} onChange={(e) => setDraft((c) => ({ ...c, file_name: e.target.value }))} /></label>
                    <label className="full"><span>Phong cách giọng đọc</span><input className="fi" value={draft.voice_style || ''} onChange={(e) => setDraft((c) => ({ ...c, voice_style: e.target.value }))} /></label>
                  </>
                ) : null}
                {config.recordKind === 'video_edit' ? (
                  <>
                    <label><span>{'Target ph\u00fat'}</span><input className="fi" type="number" value={draft.target_minutes || 0} onChange={(e) => setDraft((c) => ({ ...c, target_minutes: Number(e.target.value) || 0 }))} /></label>
                    <label><span>Tiến độ render</span><input className="fi" type="number" value={draft.render_progress || 0} onChange={(e) => setDraft((c) => ({ ...c, render_progress: Math.min(100, Number(e.target.value) || 0) }))} /></label>
                    <label><span>Người biên tập</span><select className="fi" value={selectedAssigneeProfileId} onChange={(e) => setSelectedAssigneeProfileId(e.target.value)}><option value="">-- Chọn --</option>{assigneeProfiles.map((option) => <option key={option.profileId} value={option.profileId}>{option.fullName}</option>)}</select></label>
                    <label className="full"><span>File video / URL</span><input className="fi" value={draft.file_name || ''} onChange={(e) => setDraft((c) => ({ ...c, file_name: e.target.value }))} /></label>
                    <label><span>File subtitle / URL</span><input className="fi" value={draft.subtitle_file || ''} onChange={(e) => setDraft((c) => ({ ...c, subtitle_file: e.target.value }))} /></label>
                    <label><span>Cấu hình render</span><input className="fi" value={draft.render_preset || ''} onChange={(e) => setDraft((c) => ({ ...c, render_preset: e.target.value }))} /></label>
                  </>
                ) : null}
                <label className="full"><span>Note / handoff</span><textarea className="fta" rows={4} value={draft.notes || ''} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} /></label>
              </div>
              <div className="stack compact">
                {config.recordKind === 'slide_design' ? (
                  <ReferenceAsset
                    label={'Storyboard dau vao'}
                    assetValue={selectedStoryboardRecord?.file_name}
                    emptyLabel={'Chua co storyboard de tai tai buoc nay.'}
                  />
                ) : null}
                {config.recordKind === 'voice_over' ? (
                  <>
                    <ReferenceAsset
                      label={'Storyboard tham chieu'}
                      assetValue={selectedStoryboardRecord?.file_name}
                      emptyLabel={'Chua co storyboard de tai tai buoc nay.'}
                    />
                    <ReferenceAsset
                      label={'Kich ban / slides tham chieu'}
                      assetValue={selectedSlideRecord?.file_name}
                      emptyLabel={'Chua co file kich ban/slides de tai tai buoc nay.'}
                    />
                  </>
                ) : null}
                <div className="bullet-item">Upload limit: {WORKFLOW_MAX_UPLOAD_MB}MB per file</div>
                {usesVideoLinkOnly(config.pageId) ? (
                  <>
                    <label className="full">
                      <span>Link video</span>
                      <input className="fi" value={mainAssetLink} onChange={(e) => setMainAssetLink(e.target.value)} placeholder="https://..." />
                    </label>
                    <div className="action-row">
                      <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'save_main_link', link: mainAssetLink })}>Lưu link</button>
                      <button className="btn btn-ghost" onClick={() => { setMainAssetLink(''); mutation.mutate({ action: 'save_main_link', link: '' }); }}>Xóa link</button>
                    </div>
                  </>
                ) : config.recordKind === 'voice_over' ? (
                  <MultiFileActions
                    label={'T\u1ea3i file voice'}
                    assetValue={selected.record?.file_name}
                    onUpload={(files) => void runBatchAssetUpload('domain-main', 'Dang tai cac file voice len server', files)}
                    onDeleteItem={(fileUrl) => mutation.mutate({ action: 'delete_main_item', fileUrl })}
                    operation={assetOperations['domain-main']}
                  />
                ) : (
                  <FileActions
                    label={'T\u1ea3i file ch\u00ednh'}
                    assetValue={draft.file_name || selected.record?.file_name}
                    onUpload={(file) => void runAssetUpload('domain-main', 'Dang tai file chinh len server', { action: 'upload_main', file })}
                    onDelete={() => mutation.mutate({ action: 'delete_main' })}
                    operation={assetOperations['domain-main']}
                  />
                )}
                {config.recordKind === 'video_edit' ? (
                  <FileActions
                    label={'T\u1ea3i file'}
                    assetValue={draft.subtitle_file || selected.record?.subtitle_file}
                    onUpload={(file) => void runAssetUpload('domain-subtitle', 'Dang tai subtitle len server', { action: 'upload_subtitle', file })}
                    onDelete={() => mutation.mutate({ action: 'delete_subtitle' })}
                    operation={assetOperations['domain-subtitle']}
                  />
                ) : null}
              </div>
              <div className="stack compact">
                {checklistConfig.map((item) => (
                  <label className={`review-criterion ${draft.checklist?.[item.key] ? 'pass' : ''}`} key={item.key}>
                    <input type="checkbox" checked={Boolean(draft.checklist?.[item.key])} onChange={(e) => setDraft((c) => ({ ...c, checklist: { ...(c.checklist || {}), [item.key]: e.target.checked } }))} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="action-row">
                <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'create' })}>{'T\u1ea1o h\u1ed3 s\u01a1'}</button>
                <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'save' })}>{'L\u01b0u c\u1eadp nh\u1eadt'}</button>
                <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'start' })}>{config.startLabel}</button>
                <button className="btn btn-danger" onClick={() => mutation.mutate({ action: 'submit' })}>{config.submitLabel}</button>
              </div>
            </div>
          ) : <div className="muted-text">{'Ch\u1ecdn item \u0111\u1ec3 thao t\u00e1c.'}</div>}
        </Card>
        <div className="stack storyboard-sidebar">
        <Card title={'Task li\u00ean k\u1ebft'}>
          {selected ? (
            <div className="stack compact">
              {notice ? <div className="bullet-item">{notice.message}</div> : null}
              <div className="bullet-item">Task: {selected.task?.id || 'Ch\u01b0a t\u1ea1o'}</div>
               <div className="bullet-item">Trạng thái task: <Badge tone={toneForStatus(linkedTaskStatus)}>{getWorkflowStatusLabel(linkedTaskStatus)}</Badge></div>
              <div className="bullet-item">Bắt đầu lúc: {selected.task?.id && (startedAtOverrides[selected.task.id] || startedAtByTask.get(selected.task.id)) ? new Date(String(startedAtOverrides[selected.task.id] || startedAtByTask.get(selected.task.id))).toLocaleString('vi-VN') : 'Chưa ghi nhận'}</div>
               <div className="bullet-item">Bước tiếp theo: {config.nextStagePage}</div>
            </div>
          ) : <div className="muted-text">{'Ch\u1ecdn item \u0111\u1ec3 xem task.'}</div>}
        </Card>
        {shouldColorTaskLinked ? (
          <Card title="Lịch sử bước">
            <div className="stack compact">
              {selectedStageLogs.map((log) => (
                <div className={`bullet-item workflow-status-tile ${getWorkflowEventTone(log.action_type)}`} key={log.id}>
                  <div className="fw6">{getWorkflowEventLabel(log.action_type)}</div>
                  <div>{localizeWorkflowText(log.summary)}</div>
                  <div className="muted-text">{new Date(log.happened_at).toLocaleString('vi-VN')}</div>
                </div>
              ))}
              {!selectedStageLogs.length ? <div className="muted-text">Chưa có log cho bước này.</div> : null}
            </div>
          </Card>
        ) : null}
        </div>
      </div>
    </>
  );
}

export function QualityGatePage({ pageId }: { pageId: PageKey }) {
  const config = QC_CONFIGS[pageId as QcConfig['pageId']];
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const shouldAutoNavigate = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'stage', config.stageIndex], queryFn: () => listTasks({ stageIndices: [config.stageIndex] }) });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', config.recordKind, 'with-reviews'],
    queryFn: () => listWorkflowRecords({ kinds: [config.recordKind], includeReviews: true, includeQuestionLibrary: false }),
  });
  const profilesQuery = useQuery({ queryKey: ['profiles', 'qc-stage-assignees'], queryFn: listProfiles });

  const records = config.recordKind === 'slide_design' ? workflowQuery.data?.slideDesigns || [] : workflowQuery.data?.videoEdits || [];
  const reviews = config.recordKind === 'slide_design' ? workflowQuery.data?.slideDesignReviews || [] : workflowQuery.data?.videoReviews || [];
  const rows = useMemo(
    () => getRowsForStage(ordersQuery.data?.orders || [], ordersQuery.data?.products || [], tasksQuery.data || [], records, config.module, [config.stageIndex]),
    [config.module, config.stageIndex, ordersQuery.data, records, tasksQuery.data],
  );

  const [selectedKey, setSelectedKey] = useState('');
  const [notice, setNotice] = useState<NoticeState>(null);
  const [comment, setComment] = useState('');
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [selectedReviewerProfileId, setSelectedReviewerProfileId] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [assetOperations, setAssetOperations] = useState<Record<string, UploadOperationState>>({});

  useEffect(() => {
    if (!selectedKey && rows[0]) setSelectedKey(`${rows[0].order.id}::${rows[0].product.id}`);
  }, [rows, selectedKey]);

  const selected = useMemo(() => rows.find((row) => `${row.order.id}::${row.product.id}` === selectedKey) || null, [rows, selectedKey]);
  const selectedReviews = useMemo(
    () => reviews.filter((item: any) => item[config.recordKind === 'slide_design' ? 'slide_design_id' : 'video_edit_id'] === selected?.record?.id),
    [config.recordKind, reviews, selected?.record?.id],
  );
  const assigneeProfiles = useMemo(
    () => toAssignableProfiles(profilesQuery.data || [], ['admin', 'pm', 'qc']),
    [profilesQuery.data],
  );
  const selectedReviewer = findAssignableProfile(assigneeProfiles, selectedReviewerProfileId);
  const criteriaConfig = config.recordKind === 'slide_design' ? SLIDE_CHECKLIST : VIDEO_CHECKLIST;

  useEffect(() => {
    setComment(selectedReviews[0]?.comment || '');
    const nextCriteria: Record<string, boolean> = {};
    for (const item of criteriaConfig) nextCriteria[item.key] = Boolean(selectedReviews[0]?.criteria?.[item.key] ?? true);
    setCriteria(nextCriteria);
  }, [criteriaConfig, selectedReviews]);

  useEffect(() => {
    if (!selected) {
      setSelectedReviewerProfileId('');
      return;
    }
    setSelectedReviewerProfileId(selected.task?.assignee_profile_id || getQcReviewerProfileId(selected.record) || profile?.id || '');
  }, [profile?.id, selected]);

  useEffect(() => {
    setReviewLink(String(selected?.record?.file_name || ''));
  }, [selected?.record?.file_name]);

  useEffect(() => {
    const operationKeys = Object.keys(assetOperations);
    if (!operationKeys.length) return;
    const timer = window.setInterval(() => {
      setAssetOperations((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, operation]) => [
            key,
            {
              ...operation,
              progress: operation.progress >= 92 ? operation.progress : Math.min(92, operation.progress + (operation.progress < 40 ? 18 : operation.progress < 72 ? 10 : 4)),
            },
          ]),
        ) as Record<string, UploadOperationState>,
      );
    }, 260);
    return () => window.clearInterval(timer);
  }, [assetOperations]);

  function startAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 8,
        tone: 'violet',
      },
    }));
  }

  function finishAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 100,
        tone: 'success',
      },
    }));
    window.setTimeout(() => {
      setAssetOperations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, 700);
  }

  function failAssetOperation(key: string, label: string) {
    setAssetOperations((current) => ({
      ...current,
      [key]: {
        label,
        progress: 100,
        tone: 'danger',
      },
    }));
    window.setTimeout(() => {
      setAssetOperations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, 1200);
  }

  async function runAssetUpload(key: string, label: string, action: { action: 'upload_main' | 'upload_subtitle'; file: File }) {
    startAssetOperation(key, label);
    try {
      await mutation.mutateAsync(action);
      finishAssetOperation(key, 'Da tai len xong');
    } catch (error) {
      failAssetOperation(key, 'Upload that bai, vui long thu lai');
      throw error;
    }
  }

  const mutation = useMutation({
    mutationFn: async (input: {
      action: 'claim' | 'fail' | 'pass' | 'delete_review' | 'upload_main' | 'delete_main' | 'upload_subtitle' | 'delete_subtitle' | 'save_link';
      reviewId?: string;
      file?: File;
      link?: string;
    }) => {
      if (!selected) throw new Error('Ch\u01b0a ch\u1ecdn item QC.');
      const existingTasks = tasksQuery.data || [];
      const task =
        selected.task ||
        (await ensureTaskForStage({
          orderId: selected.order.id,
          productId: selected.product.id,
          stageIndex: config.stageIndex,
          existingTasks,
          assignee: selectedReviewer?.fullName || profile?.fullName || null,
          assigneeProfileId: selectedReviewer?.profileId || profile?.id || null,
          assigneeAccountId: selectedReviewer?.accountId || profile?.authUserId || null,
        }));
      const record =
        selected.record ||
        (await ensureWorkflowRecord({
          kind: config.recordKind,
          orderId: selected.order.id,
          productId: selected.product.id,
          title: `${selected.product.id}: ${selected.product.name}`,
          profileId: profile?.id || null,
        }));

      if (input.action === 'delete_review' && input.reviewId) {
        if (config.recordKind === 'slide_design') await deleteSlideDesignReview(input.reviewId);
        else await deleteVideoReview(input.reviewId);
        return { notice: '\u0110\u00e3 x\u00f3a review log.' };
      }

      if (input.action === 'save_link') {
        const nextLink = String(input.link ?? reviewLink).trim();
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: nextLink || null,
          updated_at: new Date().toISOString(),
        });
        return { notice: nextLink ? 'Đã lưu link video review.' : 'Đã xóa link video review.' };
      }

      if (input.action === 'upload_main') {
        if (!input.file) throw new Error('Ch\u01b0a c\u00f3 file \u0111\u1ec3 upload.');
        validateWorkflowFile(input.file);
        const uploaded = await uploadWorkflowAsset({
          file: input.file,
          orderId: selected.order.id,
          productId: selected.product.id,
          module: config.module,
          stageCode: config.stageCode,
          slot: config.recordKind === 'slide_design' ? 'qc-slide' : 'qc-video',
          previousUrl: record.file_name,
        });
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: uploaded.fileUrl,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 t\u1ea3i file review l\u00ean server.' };
      }

      if (input.action === 'delete_main') {
        if (isAssetUrl(record.file_name)) {
          await deleteWorkflowAsset({ fileUrl: String(record.file_name) });
        }
        await updateWorkflowRecord(config.recordKind, record.id, {
          file_name: null,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 x\u00f3a file \u0111ang review.' };
      }

      if (input.action === 'upload_subtitle') {
        if (config.recordKind !== 'video_edit') throw new Error('B\u01b0\u1edbc n\u00e0y kh\u00f4ng c\u00f3 subtitle.');
        if (!input.file) throw new Error('Ch\u01b0a c\u00f3 subtitle \u0111\u1ec3 upload.');
        validateWorkflowFile(input.file);
        const uploaded = await uploadWorkflowAsset({
          file: input.file,
          orderId: selected.order.id,
          productId: selected.product.id,
          module: config.module,
          stageCode: config.stageCode,
          slot: 'qc-subtitle',
          previousUrl: record.subtitle_file,
        });
        await updateWorkflowRecord('video_edit', record.id, {
          subtitle_file: uploaded.fileUrl,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 t\u1ea3i subtitle review l\u00ean server.' };
      }

      if (input.action === 'delete_subtitle') {
        if (config.recordKind !== 'video_edit') throw new Error('B\u01b0\u1edbc n\u00e0y kh\u00f4ng c\u00f3 subtitle.');
        if (isAssetUrl(record.subtitle_file)) {
          await deleteWorkflowAsset({ fileUrl: String(record.subtitle_file) });
        }
        await updateWorkflowRecord('video_edit', record.id, {
          subtitle_file: null,
          updated_at: new Date().toISOString(),
        });
        return { notice: '\u0110\u00e3 x\u00f3a subtitle \u0111ang review.' };
      }

      if (input.action === 'claim') {
        await updateTask(task.id, { status: 'in_progress', ...buildTaskAssigneePatch(selectedReviewer) });
        await updateWorkflowRecord(config.recordKind, record.id, {
          qc_reviewer_profile_id: selectedReviewerProfileId || null,
          updated_at: new Date().toISOString(),
        });
        if (task.status !== 'in_progress') {
          await createActivityLog({
            actorProfileId: profile?.id || null,
            actionType: 'workflow_review_claimed',
            objectType: 'task',
            objectId: task.id,
            summary: `${selected.product.id} claimed ${config.stageCode}`,
            metadata: {
              task_id: task.id,
              order_id: selected.order.id,
              product_id: selected.product.id,
              stage_code: config.stageCode,
              stage_index: config.stageIndex,
              module: config.module,
            },
          });
        }
        return { notice: '\u0110\u00e3 ghi nh\u1eadn b\u1eaft \u0111\u1ea7u review.' };
      }

      if (config.recordKind === 'slide_design') {
        if (input.action === 'fail') {
          await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
          await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: config.previousStageIndex, existingTasks, assignee: null });
          await updateProduct(selected.product.id, { current_stage_index: config.previousStageIndex, progress: 55 });
          await updateWorkflowRecord('slide_design', record.id, {
            status: 'changes_requested',
            qc_reviewer_profile_id: selectedReviewerProfileId || null,
            returned_at: new Date().toISOString(),
            approved_at: null,
            updated_at: new Date().toISOString(),
          });
          await createActivityLog({
            actorProfileId: profile?.id || null,
            actionType: 'workflow_step_returned',
            objectType: 'workflow',
            objectId: record.id,
            summary: `${selected.product.id} returned to ${config.previousStagePage}`,
            metadata: {
              order_id: selected.order.id,
              product_id: selected.product.id,
              stage_code: config.previousStagePage,
              stage_index: config.previousStageIndex,
              module: config.module,
            },
          });
          await createSlideDesignReview({ slideDesignId: record.id, reviewerProfileId: profile?.id || null, decision: 'changes_requested', comment: comment || 'QC chưa đạt, trả về bước trước.', criteria });
          return { notice: `\u0110\u00e3 tr\u1ea3 v\u1ec1 ${config.previousStagePage}.` };
        }
        await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
        await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: config.nextStageIndex, existingTasks, assignee: null });
        await updateProduct(selected.product.id, { current_stage_index: config.nextStageIndex, progress: 63 });
        await updateWorkflowRecord('slide_design', record.id, {
          status: 'qc_passed',
          qc_reviewer_profile_id: selectedReviewerProfileId || null,
          approved_at: new Date().toISOString(),
          returned_at: null,
          updated_at: new Date().toISOString(),
        });
        await createActivityLog({
          actorProfileId: profile?.id || null,
          actionType: 'workflow_step_approved',
          objectType: 'workflow',
          objectId: record.id,
          summary: `${selected.product.id} approved at ${config.previousStagePage}`,
          metadata: {
            order_id: selected.order.id,
            product_id: selected.product.id,
            stage_code: config.previousStagePage,
            stage_index: config.previousStageIndex,
            module: config.module,
          },
        });
        await createSlideDesignReview({ slideDesignId: record.id, reviewerProfileId: profile?.id || null, decision: 'approved', comment: comment || 'QC đã duyệt.', criteria });
        return { notice: `\u0110\u00e3 pass sang ${config.nextStagePage}.` };
      }

      if (input.action === 'fail') {
        const nextVersion = Math.max(1, (record.current_version || 1) + 1);
        await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
        await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: config.previousStageIndex, existingTasks, assignee: null });
        await updateProduct(selected.product.id, { current_stage_index: config.previousStageIndex, progress: 75 });
        await updateWorkflowRecord('video_edit', record.id, {
          status: 'changes_requested',
          qc_reviewer_profile_id: selectedReviewerProfileId || null,
          returned_at: new Date().toISOString(),
          current_version: nextVersion,
          render_progress: 75,
          approved_at: null,
          updated_at: new Date().toISOString(),
        });
        await createActivityLog({
          actorProfileId: profile?.id || null,
          actionType: 'workflow_step_returned',
          objectType: 'workflow',
          objectId: record.id,
          summary: `${selected.product.id} returned to ${config.previousStagePage}`,
          metadata: {
            order_id: selected.order.id,
            product_id: selected.product.id,
            stage_code: config.previousStagePage,
            stage_index: config.previousStageIndex,
            module: config.module,
          },
        });
        await createVideoReview({ videoEditId: record.id, reviewerProfileId: profile?.id || null, decision: 'changes_requested', comment: comment || 'QC chưa đạt, trả về bước trước.', criteria });
        return { notice: `\u0110\u00e3 tr\u1ea3 v\u1ec1 ${config.previousStagePage}.` };
      }

      await archiveTasksForStage(selected.order.id, selected.product.id, config.stageIndex);
      await updateWorkflowRecord('video_edit', record.id, {
        status: 'qc_passed',
        qc_reviewer_profile_id: selectedReviewerProfileId || null,
        approved_at: new Date().toISOString(),
        returned_at: null,
        updated_at: new Date().toISOString(),
      });
      await createActivityLog({
        actorProfileId: profile?.id || null,
        actionType: 'workflow_step_approved',
        objectType: 'workflow',
        objectId: record.id,
        summary: `${selected.product.id} approved at ${config.previousStagePage}`,
        metadata: {
          order_id: selected.order.id,
          product_id: selected.product.id,
          stage_code: config.previousStagePage,
          stage_index: config.previousStageIndex,
          module: config.module,
        },
      });
      await createVideoReview({ videoEditId: record.id, reviewerProfileId: profile?.id || null, decision: 'approved', comment: comment || 'QC đã duyệt.', criteria });
      if (config.pageId === 'vsmf07') {
        await updateProduct(selected.product.id, { current_stage_index: 7, progress: 100, ready_for_delivery: true, finished: true });
        await updateOrder(selected.order.id, { status: 'ready_delivery' });
        return { notice: '\u0110\u00e3 pass v\u00e0 s\u1eb5n s\u00e0ng b\u00e0n giao.' };
      }
      await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: config.nextStageIndex, existingTasks, assignee: null });
      await updateProduct(selected.product.id, { current_stage_index: config.nextStageIndex, progress: 88 });
      return { notice: `\u0110\u00e3 pass sang ${config.nextStagePage}.` };
    },
    onSuccess: async (result) => {
      setNotice(result?.notice ? { tone: 'success', message: result.notice } : null);
      pushToast({ title: `${config.stageCode} đã cập nhật`, message: result?.notice || 'Đã ghi nhận review.', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['workflow-records'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['activity-logs', 'task-starts'] });
      if (!shouldAutoNavigate) return;
      if (result?.notice?.includes(config.previousStagePage)) {
        navigate(`/${config.previousStageRoute}`);
        return;
      }
      if (config.nextStageRoute && result?.notice?.includes(config.nextStagePage)) {
        navigate(`/${config.nextStageRoute}`);
      }
    },
    onError: (error) => {
      setNotice({ tone: 'danger', message: formatErrorMessage(error) });
      pushToast({ title: `${config.stageCode} thất bại`, message: formatErrorMessage(error), tone: 'danger', durationMs: 4200 });
    },
  });

  return (
    <>
      <SectionHeader eye={config.eye} title={config.title} subtitle={config.subtitle} />
      <div className="storyboard-layout">
        <Card title="Queue QC">
          <StageQueue rows={rows} selectedKey={selectedKey} setSelectedKey={setSelectedKey} getMeta={(row) => row.record?.file_name || row.record?.title || 'Ch\u01b0a c\u00f3 file review'} colorizeFrame={config.pageId === 'smf03' || config.pageId === 'vsmf03'} />
        </Card>
        <Card title={'B\u1ea3ng review'}>
          {selected ? (
            <div className="storyboard-workspace">
              {renderNotice(notice)}
              <div className="stack compact">
                {config.pageId === 'smf04' || config.pageId === 'vsmf04' ? (
                  <ReferenceAsset
                    label={config.pageId === 'smf04' ? 'Slides tham chieu tu SMF-03' : 'Slides tham chieu tu VSMF-03'}
                    assetValue={selected.record?.file_name}
                    emptyLabel={'Chua co file slides tu buoc 3.'}
                  />
                ) : null}
                {config.recordKind === 'video_edit' ? (
                  <ReferenceAsset
                    label={config.pageId === 'smf07' ? 'Video tham chieu tu SMF-06' : 'Video tham chieu tu VSMF-06'}
                    assetValue={selected.record?.file_name}
                    emptyLabel={'Chua co link hoac file video tu buoc bien tap.'}
                  />
                ) : config.pageId === 'vsmf07' ? (
                  <>
                    <label className="full">
                      <span>Link video review</span>
                      <input className="fi" value={reviewLink} onChange={(e) => setReviewLink(e.target.value)} placeholder="https://..." />
                    </label>
                    <div className="action-row">
                      <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'save_link', link: reviewLink })}>Lưu link</button>
                      <button className="btn btn-ghost" onClick={() => { setReviewLink(''); mutation.mutate({ action: 'save_link', link: '' }); }}>Xóa link</button>
                    </div>
                  </>
                ) : (
                  <FileActions
                    label={config.pageId === 'smf04' || config.pageId === 'vsmf04' ? 'Tai file review rieng' : 'T\u1ea3i file review'}
                    assetValue={selected.record?.file_name}
                    onUpload={(file) => void runAssetUpload('qc-main', 'Dang tai file review len server', { action: 'upload_main', file })}
                    onDelete={() => mutation.mutate({ action: 'delete_main' })}
                    operation={assetOperations['qc-main']}
                  />
                )}
                {config.recordKind === 'video_edit' ? (
                  <FileActions
                    label={'T\u1ea3i file l\u00ean'}
                    assetValue={selected.record?.subtitle_file}
                    onUpload={(file) => void runAssetUpload('qc-subtitle', 'Dang tai file review len server', { action: 'upload_subtitle', file })}
                    onDelete={() => mutation.mutate({ action: 'delete_subtitle' })}
                    operation={assetOperations['qc-subtitle']}
                  />
                ) : null}
              </div>
              <label>
                <span>Người review</span>
                <select className="fi" value={selectedReviewerProfileId} onChange={(e) => setSelectedReviewerProfileId(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {assigneeProfiles.map((option) => <option key={option.profileId} value={option.profileId}>{option.fullName}</option>)}
                </select>
              </label>
              <div className="stack compact">
                {criteriaConfig.map((item) => (
                  <label className={`review-criterion ${criteria[item.key] ? 'pass' : ''}`} key={item.key}>
                    <input type="checkbox" checked={Boolean(criteria[item.key])} onChange={(e) => setCriteria((c) => ({ ...c, [item.key]: e.target.checked }))} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              <textarea className="fta" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={'Nh\u1eadn x\u00e9t QC / PM review'} />
              <div className="action-row">
                <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'claim' })}>Nhận review</button>
                <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'fail' })}>{`Trả lại -> ${config.previousStagePage}`}</button>
                <button className="btn btn-danger" onClick={() => mutation.mutate({ action: 'pass' })}>{config.pageId === 'vsmf07' ? 'Duyệt -> Sẵn sàng bàn giao' : `Duyệt -> ${config.nextStagePage}`}</button>
              </div>
            </div>
          ) : <div className="muted-text">{'Ch\u1ecdn item \u0111\u1ec3 review.'}</div>}
        </Card>
        <Card title="Lịch sử review">
          <div className="stack compact">
            {renderNotice(notice)}
            {selectedReviews.map((review: SlideDesignReviewRow | VideoReviewRow) => (
              <div className="storyboard-review-item" key={review.id}>
                <div className="action-row">
                  <Badge tone={review.decision === 'approved' ? 'success' : review.decision === 'changes_requested' ? 'danger' : 'warning'}>{getReviewDecisionLabel(review.decision)}</Badge>
                  <button className="btn btn-ghost btn-small" onClick={() => mutation.mutate({ action: 'delete_review', reviewId: review.id })}>{'X\u00f3a'}</button>
                </div>
                <div className="muted-text">{new Date(review.created_at).toLocaleString('vi-VN')}</div>
                <div>{localizeWorkflowText(review.comment || 'Kh\u00f4ng c\u00f3 ghi ch\u00fa.')}</div>
              </div>
            ))}
            {!selectedReviews.length ? <div className="muted-text">{'Ch\u01b0a c\u00f3 lịch sử review.'}</div> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

export function ScormStagePage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'stage', 'scorm'], queryFn: () => listTasks({ stageIndices: [7, 8] }) });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', 'scorm_package', 'with-reviews', 'questions'],
    queryFn: () => listWorkflowRecords({ kinds: ['scorm_package'], includeReviews: true, includeQuestionLibrary: true }),
  });

  const scormRows = useMemo(
    () => getRowsForStage(ordersQuery.data?.orders || [], ordersQuery.data?.products || [], tasksQuery.data || [], workflowQuery.data?.scormPackages || [], 'ELN', [7, 8]),
    [ordersQuery.data, tasksQuery.data, workflowQuery.data],
  );
  const questions = useMemo(
    () => ((workflowQuery.data?.questionLibrary || []) as QuestionLibraryRow[]).filter((item) => item.active && item.module === 'ELN'),
    [workflowQuery.data],
  );

  const [selectedKey, setSelectedKey] = useState('');
  const [draft, setDraft] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!selectedKey && scormRows[0]) setSelectedKey(`${scormRows[0].order.id}::${scormRows[0].product.id}`);
  }, [scormRows, selectedKey]);

  const selected = useMemo(() => scormRows.find((row) => `${row.order.id}::${row.product.id}` === selectedKey) || null, [scormRows, selectedKey]);
  const selectedReviews = useMemo(
    () => ((workflowQuery.data?.scormReviews || []) as ScormReviewRow[]).filter((item) => item.scorm_package_id === selected?.record?.id),
    [workflowQuery.data, selected?.record?.id],
  );

  useEffect(() => {
    if (!selected?.record) {
      setDraft({});
      return;
    }
    setDraft({
      pass_score: selected.record.pass_score || 80,
      completion_rule: selected.record.completion_rule || 'watch_video_and_pass_quiz',
      randomize_questions: Boolean(selected.record.randomize_questions),
      package_file_name: selected.record.package_file_name || '',
      notes: selected.record.notes || '',
      selected_question_ids: selected.record.selected_question_ids || [],
    });
  }, [selected?.record]);

  const mutation = useMutation({
    mutationFn: async (input: { action: 'create' | 'save' | 'start' | 'promote' | 'finalize' | 'delete_review'; reviewId?: string }) => {
      if (!selected) throw new Error('Ch\u01b0a ch\u1ecdn package.');
      const existingTasks = tasksQuery.data || [];
      const task =
        selected.task ||
        (await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: 7, existingTasks, assignee: profile?.fullName || null }));
      const scorm = await ensureWorkflowRecord({ kind: 'scorm_package', orderId: selected.order.id, productId: selected.product.id, title: `${selected.product.id}: ${selected.product.name}`, profileId: profile?.id || null });
      if (input.action === 'create') return;
      if (input.action === 'delete_review' && input.reviewId) {
        await deleteScormReview(input.reviewId);
        return;
      }
      if (input.action === 'save') {
        await updateWorkflowRecord('scorm_package', scorm.id, { ...draft, updated_at: new Date().toISOString() });
        return;
      }
      if (input.action === 'start') {
        await updateWorkflowRecord('scorm_package', scorm.id, { status: task.stage_index === 7 ? 'building_quiz' : 'packaging', updated_at: new Date().toISOString() });
        await updateTask(task.id, { status: 'in_progress', progress: Math.max(task.progress, 25), assignee: profile?.fullName || task.assignee });
        return;
      }
      if (input.action === 'promote') {
        if ((draft.selected_question_ids || []).length < 3) throw new Error('C\u1ea7n ch\u1ecdn \u00edt nh\u1ea5t 3 c\u00e2u h\u1ecfi tr\u01b0\u1edbc khi ch\u1ed1t quiz.');
        await archiveTasksForStage(selected.order.id, selected.product.id, 7);
        await ensureTaskForStage({ orderId: selected.order.id, productId: selected.product.id, stageIndex: 8, existingTasks, assignee: null });
        await updateProduct(selected.product.id, { current_stage_index: 8, progress: 30 });
        await updateWorkflowRecord('scorm_package', scorm.id, { ...draft, status: 'packaging', manifest_status: 'building', updated_at: new Date().toISOString() });
        await createScormReview({ scormPackageId: scorm.id, reviewerProfileId: profile?.id || null, decision: 'submitted', comment: 'Đã chốt bộ câu hỏi và chuyển sang bước đóng gói.', criteria: { selected_questions: (draft.selected_question_ids || []).length, pass_score: draft.pass_score } });
        return;
      }
      await archiveTasksForStage(selected.order.id, selected.product.id, 8);
      await updateWorkflowRecord('scorm_package', scorm.id, { ...draft, status: 'ready_delivery', manifest_status: 'validated', updated_at: new Date().toISOString() });
      await createScormReview({ scormPackageId: scorm.id, reviewerProfileId: profile?.id || null, decision: 'approved', comment: 'Gói SCORM đã được kiểm tra và sẵn sàng bàn giao.', criteria: { manifest: true, selected_questions: (draft.selected_question_ids || []).length, completion_rule: draft.completion_rule } });
      await updateProduct(selected.product.id, { current_stage_index: 9, progress: 100, ready_for_delivery: true, finished: true });
      await updateOrder(selected.order.id, { status: 'ready_delivery' });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workflow-records'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return (
    <>
      <SectionHeader eye={'Module 2 \u00b7 SMF-08'} title="SCORM + Quiz" subtitle={'Ch\u1ecdn c\u00e2u h\u1ecfi, ch\u1ed1t quiz, \u0111\u00f3ng g\u00f3i SCORM v\u00e0 s\u1eb5n s\u00e0ng b\u00e0n giao.'} />
      <div className="storyboard-layout">
        <Card title="Queue package">
          <StageQueue
            rows={scormRows}
            selectedKey={selectedKey}
            setSelectedKey={setSelectedKey}
            getMeta={(row) => `${(row.record?.selected_question_ids || []).length} c\u00e2u h\u1ecfi - ${row.record?.package_file_name || 'Ch\u01b0a c\u00f3 package file'}`}
          />
        </Card>
        <div className="stack">
          <Card title="Question library">
            <div className="stack compact">
              {questions.map((question) => {
                const checked = (draft.selected_question_ids || []).includes(question.id);
                return (
                  <label className={`review-criterion ${checked ? 'pass' : ''}`} key={question.id}>
                    <input type="checkbox" checked={checked} onChange={(e) => setDraft((current) => ({ ...current, selected_question_ids: e.target.checked ? [...(current.selected_question_ids || []), question.id] : (current.selected_question_ids || []).filter((id: string) => id !== question.id) }))} />
                    <span>{question.id} - {question.prompt}</span>
                  </label>
                );
              })}
            </div>
          </Card>
          <Card title={selected ? `${selected.product.id}: ${selected.product.name}` : 'SCORM config'}>
            {selected ? (
              <div className="storyboard-workspace">
                <div className="form-grid storyboard-form-grid">
                  <label><span>Pass score (%)</span><input className="fi" type="number" value={draft.pass_score || 80} onChange={(e) => setDraft((c) => ({ ...c, pass_score: Number(e.target.value) || 80 }))} /></label>
                  <label><span>Completion rule</span><select className="fi" value={draft.completion_rule || 'watch_video_and_pass_quiz'} onChange={(e) => setDraft((c) => ({ ...c, completion_rule: e.target.value }))}><option value="watch_video_and_pass_quiz">Watch video + pass quiz</option><option value="pass_quiz_only">Pass quiz only</option><option value="watch_video_only">Watch video only</option></select></label>
                  <label><span>Randomize</span><select className="fi" value={draft.randomize_questions ? 'yes' : 'no'} onChange={(e) => setDraft((c) => ({ ...c, randomize_questions: e.target.value === 'yes' }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                  <label className="full"><span>Package file</span><input className="fi" value={draft.package_file_name || ''} onChange={(e) => setDraft((c) => ({ ...c, package_file_name: e.target.value }))} /></label>
                  <label className="full"><span>Note / handoff</span><textarea className="fta" rows={4} value={draft.notes || ''} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} /></label>
                </div>
                <div className="action-row">
                  <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'create' })}>{'T\u1ea1o h\u1ed3 s\u01a1'}</button>
                  <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'save' })}>{'L\u01b0u c\u1eadp nh\u1eadt'}</button>
                  <button className="btn btn-ghost" onClick={() => mutation.mutate({ action: 'start' })}>{'B\u1eaft \u0111\u1ea7u'}</button>
                  {selected.task?.stage_index === 7 ? <button className="btn btn-danger" onClick={() => mutation.mutate({ action: 'promote' })}>{'Ch\u1ed1t quiz -> B9'}</button> : null}
                  {selected.task?.stage_index === 8 ? <button className="btn btn-danger" onClick={() => mutation.mutate({ action: 'finalize' })}>{'Xu\u1ea5t package -> S\u1eb5n s\u00e0ng b\u00e0n giao'}</button> : null}
                </div>
              </div>
            ) : <div className="muted-text">{'Ch\u1ecdn package \u0111\u1ec3 thao t\u00e1c.'}</div>}
          </Card>
        </div>
        <Card title="L\u1ecbch s\u1eed review SCORM">
          <div className="stack compact">
            {selectedReviews.map((review) => (
              <div className="storyboard-review-item" key={review.id}>
                <div className="action-row">
                  <Badge tone={review.decision === 'approved' ? 'success' : 'warning'}>{getReviewDecisionLabel(review.decision)}</Badge>
                  <button className="btn btn-ghost btn-small" onClick={() => mutation.mutate({ action: 'delete_review', reviewId: review.id })}>{'X\u00f3a'}</button>
                </div>
                <div className="muted-text">{new Date(review.created_at).toLocaleString('vi-VN')}</div>
                <div>{localizeWorkflowText(review.comment || 'Kh\u00f4ng c\u00f3 ghi ch\u00fa.')}</div>
              </div>
            ))}
            {!selectedReviews.length ? <div className="muted-text">{'Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed review.'}</div> : null}
            {mutation.error ? <div className="bullet-item tone-danger">{formatErrorMessage(mutation.error)}</div> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

