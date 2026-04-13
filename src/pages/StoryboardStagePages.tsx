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
  createStoryboardReview,
  deleteStoryboardReview,
  deleteWorkflowAsset,
  ensureTaskForStage,
  ensureWorkflowRecord,
  inferProductWorkflowModule,
  listActivityLogs,
  listOrdersWithProducts,
  listProfiles,
  listTasks,
  listWorkflowRecords,
  updateProduct,
  updateTask,
  updateWorkflowRecord,
  uploadWorkflowAsset,
  type OrderRow,
  type ProductRow,
  type StoryboardReviewRow,
  type StoryboardRow,
  type TaskRow,
} from '@/services/vcontent';
import type { PageKey } from '@/data/vcontent';

const STORYBOARD_MAX_UPLOAD_MB = 200;
const STORYBOARD_MAX_UPLOAD_BYTES = STORYBOARD_MAX_UPLOAD_MB * 1024 * 1024;

type StoryboardPageConfig = {
  pageId: 'smf02' | 'vsmf02';
  module: 'ELN' | 'VIDEO';
  eye: string;
  title: string;
  subtitle: string;
  nextStagePage: string;
  nextStageRoute: PageKey;
  stageCode: 'SMF-02' | 'VSMF-02';
};

type NoticeState = {
  tone: 'success' | 'danger' | 'warning';
  message: string;
} | null;

type UploadOperationState = {
  label: string;
  progress: number;
  tone: 'warning' | 'danger' | 'success' | 'violet' | 'neutral';
};

type StoryboardAction = 'create' | 'save' | 'start' | 'submit' | 'request_changes' | 'approve' | 'delete_review' | 'upload_file' | 'delete_file';

function getPendingNotice(action: StoryboardAction, payload?: any) {
  if (action === 'start') return 'Đang ghi nhận thao tác bắt đầu công việc...';
  if (action === 'submit') return 'Đang ghi nhận thao tác submit storyboard sang PM review...';
  if (action === 'upload_file') return `Đang upload file${payload?.file?.name ? ` ${payload.file.name}` : ''}...`;
  if (action === 'delete_file') return 'Đang xóa file storyboard...';
  if (action === 'save') return 'Đang lưu cập nhật storyboard...';
  if (action === 'create') return 'Đang tạo hồ sơ storyboard...';
  if (action === 'request_changes') return 'Đang ghi nhận phản hồi trả sửa...';
  if (action === 'approve') return 'Đang ghi nhận duyệt storyboard và mở bước tiếp theo...';
  if (action === 'delete_review') return 'Đang xóa lịch sử review...';
  return 'Đang xử lý thao tác...';
}

function formatErrorMessage(error: unknown) {
  if (!error) return 'Đã xảy ra lỗi.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const maybe = error as { message?: string; details?: string; hint?: string; code?: string };
    return maybe.message || maybe.details || maybe.hint || maybe.code || JSON.stringify(error);
  }
  return String(error);
}

const CONFIGS: Record<'smf02' | 'vsmf02', StoryboardPageConfig> = {
  smf02: {
    pageId: 'smf02',
    module: 'ELN',
    eye: 'Module 2 · SMF-02',
    title: 'Quản lý storyboard',
    subtitle: 'Tác nghiệp B2: soạn draft, upload file, submit, PM review và mở B3.',
    nextStagePage: 'SMF-03',
    nextStageRoute: 'smf03',
    stageCode: 'SMF-02',
  },
  vsmf02: {
    pageId: 'vsmf02',
    module: 'VIDEO',
    eye: 'Module 3 · VSMF-02',
    title: 'Quản lý storyboard',
    subtitle: 'Tác nghiệp storyboard video: soạn draft, upload file, submit, PM review và mở bước tiếp theo.',
    nextStagePage: 'VSMF-03',
    nextStageRoute: 'vsmf03',
    stageCode: 'VSMF-02',
  },
};

const REVIEW_CRITERIA = [
  { key: 'lo_alignment', label: 'Mục tiêu bám đúng brief' },
  { key: 'structure', label: 'Bố cục nội dung rõ ràng' },
  { key: 'duration_control', label: 'Nhịp cảnh hợp lý' },
  { key: 'dialogue_clarity', label: 'Lời thoại dễ triển khai' },
] as const;

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['changes_requested', 'fail', 'rejected'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'todo'].includes(status)) return 'warning';
  if (['approved', 'done'].includes(status)) return 'success';
  if (['draft', 'in_progress'].includes(status)) return 'violet';
  return 'neutral';
}

function getStoryboardStatusLabel(status: string | null | undefined) {
  switch (String(status || '')) {
    case 'todo':
      return 'Chưa bắt đầu';
    case 'draft':
      return 'Bản nháp';
    case 'in_progress':
      return 'Đang làm';
    case 'review':
    case 'in_review':
    case 'submitted':
      return 'Đang duyệt';
    case 'changes_requested':
    case 'fail':
    case 'rejected':
      return 'Bị trả lại';
    case 'approved':
    case 'done':
      return 'Đã duyệt';
    default:
      return String(status || 'Chưa bắt đầu');
  }
}

function getStoryboardDecisionLabel(decision: string | null | undefined) {
  switch (String(decision || '')) {
    case 'submitted':
      return 'Đã gửi duyệt';
    case 'changes_requested':
      return 'Trả sửa';
    case 'approved':
      return 'Đã duyệt';
    default:
      return String(decision || '-');
  }
}

function localizeStoryboardText(text: string | null | undefined) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value
    .replace(/Storyboard submitted to PM for review\./gi, 'Storyboard đã được gửi PM duyệt.')
    .replace(/Need tighter scene timing and simpler dialogue\./gi, 'Cần siết nhịp cảnh và đơn giản hóa lời thoại.')
    .replace(/Storyboard approved and can move to next stage\./gi, 'Storyboard đã được duyệt và có thể sang bước tiếp theo.');
}

function moduleMatches(productId: string, order: OrderRow, module: 'ELN' | 'VIDEO') {
  return inferProductWorkflowModule(productId, order.module) === module;
}

function getStoryboardStatus(task: TaskRow | null, product: ProductRow, storyboard: StoryboardRow | null) {
  if (storyboard?.status) return storyboard.status;
  if (product.current_stage_index > 1) return 'approved';
  if (!task) return 'todo';
  if (task.status === 'review') return 'in_review';
  if (task.status === 'fail' || task.status === 'qc_fail') return 'changes_requested';
  if (task.status === 'in_progress') return 'draft';
  return task.status || 'todo';
}

function getQueueStats(rows: Array<{ storyboard: StoryboardRow | null }>) {
  return {
    active: rows.filter((row) => row.storyboard?.status === 'draft').length,
    review: rows.filter((row) => row.storyboard?.status === 'in_review').length,
    changes: rows.filter((row) => row.storyboard?.status === 'changes_requested').length,
    approved: rows.filter((row) => row.storyboard?.status === 'approved').length,
  };
}

function getAssetLabel(value: string | null | undefined) {
  if (!value) return 'Chưa có file';
  if (/^https?:\/\//i.test(value)) {
    const clean = value.split('?')[0];
    return decodeURIComponent(clean.slice(clean.lastIndexOf('/') + 1));
  }
  return value;
}

function isAssetUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function validateStoryboardFile(file: File) {
  if (file.size > STORYBOARD_MAX_UPLOAD_BYTES) {
    throw new Error(`File storyboard vượt quá ${STORYBOARD_MAX_UPLOAD_MB}MB.`);
  }
}

export function StoryboardStagePage({ pageId }: { pageId: PageKey }) {
  const config = CONFIGS[pageId as 'smf02' | 'vsmf02'];
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const shouldAutoNavigate = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'stage', 1], queryFn: () => listTasks({ stageIndices: [1] }) });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', 'storyboard', 'with-reviews'],
    queryFn: () => listWorkflowRecords({ kinds: ['storyboard'], includeReviews: true, includeQuestionLibrary: false }),
  });
  const activityLogsQuery = useQuery({
    queryKey: ['activity-logs', 'task-starts'],
    queryFn: () => listActivityLogs({ actionTypes: ['task_started', 'workflow_step_started', 'workflow_review_claimed'], limit: 500 }),
    staleTime: 1000 * 60 * 2,
  });
  const profilesQuery = useQuery({ queryKey: ['profiles', 'storyboard-assignees'], queryFn: listProfiles });

  const rows = useMemo(() => {
    const orders = ordersQuery.data?.orders || [];
    const products = ordersQuery.data?.products || [];
    const tasks = tasksQuery.data || [];
    const storyboards = workflowQuery.data?.storyboards || [];

    return orders
      .flatMap((order) =>
        products
          .filter((product) => product.order_id === order.id && moduleMatches(product.id, order, config.module))
          .map((product) => {
            const task = tasks.find((entry) => entry.order_id === order.id && entry.product_id === product.id && entry.stage_index === 1 && !entry.archived) || null;
            const storyboard = storyboards.find((entry) => entry.order_id === order.id && entry.product_id === product.id) || null;
            const isRelevant = product.current_stage_index >= 1 || task || storyboard;
            if (!isRelevant) return null;
            return {
              order,
              product,
              task,
              storyboard: storyboard
                ? {
                    ...storyboard,
                    status: getStoryboardStatus(task, product, storyboard),
                  }
                : null,
            };
          }),
      )
      .filter(Boolean) as Array<{ order: OrderRow; product: ProductRow; task: TaskRow | null; storyboard: StoryboardRow | null }>;
  }, [ordersQuery.data, tasksQuery.data, workflowQuery.data, config.module]);

  const [selectedKey, setSelectedKey] = useState('');
  const [notice, setNotice] = useState<NoticeState>(null);
  const [startedAtOverrides, setStartedAtOverrides] = useState<Record<string, string>>({});
  const [storyboardDraft, setStoryboardDraft] = useState({
    totalScenes: 0,
    estimatedMinutes: 0,
    assigneeProfileId: '',
    fileName: '',
    notes: '',
  });
  const [reviewDraft, setReviewDraft] = useState<Record<string, boolean>>({
    lo_alignment: true,
    structure: true,
    duration_control: true,
    dialogue_clarity: true,
  });
  const [reviewComment, setReviewComment] = useState('');
  const [uploadOperation, setUploadOperation] = useState<UploadOperationState | null>(null);

  useEffect(() => {
    if (!selectedKey && rows[0]) setSelectedKey(`${rows[0].order.id}::${rows[0].product.id}`);
  }, [rows, selectedKey]);

  const selected = useMemo(() => rows.find((entry) => `${entry.order.id}::${entry.product.id}` === selectedKey) || null, [rows, selectedKey]);
  const selectedStoryboard = selected?.storyboard || null;
  const assigneeProfiles = useMemo(
    () => toAssignableProfiles(profilesQuery.data || [], ['admin', 'pm', 'specialist', 'designer', 'vc']),
    [profilesQuery.data],
  );
  const selectedAssignee = findAssignableProfile(assigneeProfiles, storyboardDraft.assigneeProfileId);
  const assigneeOptions = useMemo(
    () =>
      (profilesQuery.data || [])
        .filter((entry) => entry.active && ['admin', 'pm', 'specialist', 'designer', 'vc'].includes(String(entry.role || '')))
        .map((entry) => ({
          id: entry.id,
          label: entry.full_name,
        })),
    [profilesQuery.data],
  );
  const selectedAssigneeLabel = selectedAssignee?.fullName || selectedStoryboard?.assignee_profile_id || 'Chưa gán';
  const selectedReviews = useMemo(
    () => (workflowQuery.data?.storyboardReviews || []).filter((entry) => entry.storyboard_id === selectedStoryboard?.id),
    [workflowQuery.data, selectedStoryboard?.id],
  );
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

  useEffect(() => {
    setStoryboardDraft({
      totalScenes: selectedStoryboard?.total_scenes || 0,
      estimatedMinutes: selectedStoryboard?.estimated_minutes || 0,
      assigneeProfileId: selectedStoryboard?.assignee_profile_id || profile?.id || '',
      fileName: isAssetUrl(selectedStoryboard?.file_name) ? '' : selectedStoryboard?.file_name || '',
      notes: selectedStoryboard?.notes || '',
    });
  }, [selectedStoryboard?.id, selectedStoryboard?.total_scenes, selectedStoryboard?.estimated_minutes, selectedStoryboard?.assignee_profile_id, selectedStoryboard?.file_name, selectedStoryboard?.notes, profile?.id]);

  useEffect(() => {
    const lastReview = selectedReviews[0];
    setReviewDraft({
      lo_alignment: Boolean(lastReview?.criteria?.lo_alignment ?? true),
      structure: Boolean(lastReview?.criteria?.structure ?? true),
      duration_control: Boolean(lastReview?.criteria?.duration_control ?? true),
      dialogue_clarity: Boolean(lastReview?.criteria?.dialogue_clarity ?? true),
    });
    setReviewComment(lastReview?.comment || '');
  }, [selectedStoryboard?.id, selectedReviews]);

  useEffect(() => {
    if (!uploadOperation) return;
    const timer = window.setInterval(() => {
      setUploadOperation((current) => {
        if (!current) return current;
        return {
          ...current,
          progress: current.progress >= 92 ? current.progress : Math.min(92, current.progress + (current.progress < 40 ? 18 : current.progress < 72 ? 10 : 4)),
        };
      });
    }, 260);
    return () => window.clearInterval(timer);
  }, [uploadOperation]);

  const queueStats = getQueueStats(rows);

  async function runStoryboardUpload(file: File) {
    setUploadOperation({
      label: 'Dang tai file storyboard len server',
      progress: 8,
      tone: 'violet',
    });
    try {
      await storyboardMutation.mutateAsync({ action: 'upload_file', payload: { file } });
      setUploadOperation({
        label: 'Da tai len xong',
        progress: 100,
        tone: 'success',
      });
      window.setTimeout(() => setUploadOperation(null), 700);
    } catch (error) {
      setUploadOperation({
        label: 'Upload that bai, vui long thu lai',
        progress: 100,
        tone: 'danger',
      });
      window.setTimeout(() => setUploadOperation(null), 1200);
      throw error;
    }
  }

  const storyboardMutation = useMutation({
    mutationFn: async (input: { action: StoryboardAction; payload?: any }) => {
      if (!selected) throw new Error('Chưa chọn storyboard.');
      const { order, product, task } = selected;
      const existingTasks = tasksQuery.data || [];
      const ensuredTask =
        task ||
        (await ensureTaskForStage({
          orderId: order.id,
          productId: product.id,
          stageIndex: 1,
          existingTasks,
          assignee: selectedAssignee?.fullName || profile?.fullName || null,
          assigneeProfileId: selectedAssignee?.profileId || profile?.id || null,
          assigneeAccountId: selectedAssignee?.accountId || profile?.authUserId || null,
        }));

      const storyboard = await ensureWorkflowRecord({
        kind: 'storyboard',
        orderId: order.id,
        productId: product.id,
        title: `${product.id}: ${product.name}`,
        profileId: profile?.id || null,
      });

      if (input.action === 'create') {
        return { notice: 'Đã tạo hồ sơ storyboard.' };
      }

      if (input.action === 'upload_file') {
        if (!input.payload?.file) throw new Error('Chưa có file để upload.');
        validateStoryboardFile(input.payload.file as File);
        const uploaded = await uploadWorkflowAsset({
          file: input.payload.file as File,
          orderId: order.id,
          productId: product.id,
          module: config.module,
          stageCode: config.stageCode,
          slot: 'storyboard',
          previousUrl: storyboard.file_name,
        });
        await updateWorkflowRecord('storyboard', storyboard.id, {
          file_name: uploaded.fileUrl,
          updated_at: new Date().toISOString(),
        });
        return { notice: 'Đã tải file storyboard lên server.' };
      }

      if (input.action === 'delete_file') {
        if (isAssetUrl(storyboard.file_name)) {
          await deleteWorkflowAsset({ fileUrl: String(storyboard.file_name) });
        }
        await updateWorkflowRecord('storyboard', storyboard.id, {
          file_name: null,
          updated_at: new Date().toISOString(),
        });
        return { notice: 'Đã xóa file storyboard.' };
      }

      if (input.action === 'save') {
        await updateWorkflowRecord('storyboard', storyboard.id, {
          total_scenes: Math.max(1, Number(input.payload.totalScenes) || storyboard.total_scenes || 1),
          estimated_minutes: Math.max(1, Number(input.payload.estimatedMinutes) || storyboard.estimated_minutes || 1),
          file_name: String(input.payload.fileName || '').trim() || storyboard.file_name,
          notes: input.payload.notes || '',
          assignee_profile_id: input.payload.assigneeProfileId || storyboard.assignee_profile_id,
          updated_at: new Date().toISOString(),
        });
        return { notice: 'Đã lưu cập nhật storyboard.' };
      }

      if (input.action === 'start') {
        const shouldLogStart = ensuredTask.status === 'todo';
        const startedAt = new Date().toISOString();
        await updateWorkflowRecord('storyboard', storyboard.id, {
          status: 'draft',
          updated_at: new Date().toISOString(),
        });
        await updateTask(ensuredTask.id, {
          status: ensuredTask.status === 'todo' ? 'in_progress' : ensuredTask.status,
          progress: Math.max(ensuredTask.progress, 30),
          ...buildTaskAssigneePatch(selectedAssignee),
        });
        await updateProduct(product.id, {
          current_stage_index: 1,
          progress: Math.max(product.progress, 25),
        });
        if (shouldLogStart) {
          await createActivityLog({
            actorProfileId: profile?.id || null,
            actionType: 'workflow_step_started',
            objectType: 'task',
            objectId: ensuredTask.id,
            summary: `${product.id} started ${config.stageCode}`,
            metadata: {
              task_id: ensuredTask.id,
              order_id: order.id,
              product_id: product.id,
              stage_code: config.stageCode,
              stage_index: 1,
              module: config.module,
            },
          });
        }
        return { notice: 'Đã bắt đầu bước storyboard.', taskId: ensuredTask.id, startedAt };
      }

      if (input.action === 'submit') {
        await updateWorkflowRecord('storyboard', storyboard.id, {
          status: 'in_review',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await updateTask(ensuredTask.id, {
          status: 'review',
          progress: 100,
        });
        await createStoryboardReview({
          storyboardId: storyboard.id,
          reviewerProfileId: profile?.id || null,
          decision: 'submitted',
          comment: 'Storyboard đã được gửi PM duyệt.',
          criteria: {
            lo_alignment: true,
            structure: true,
            duration_control: true,
            dialogue_clarity: true,
          },
        });
        return { notice: 'Đã submit storyboard sang PM review.' };
      }

      if (input.action === 'request_changes') {
        const nextVersion = Math.max(1, (storyboard.current_version || 1) + 1);
        await updateWorkflowRecord('storyboard', storyboard.id, {
          status: 'changes_requested',
          returned_at: new Date().toISOString(),
          current_version: nextVersion,
          notes: input.payload.comment || storyboard.notes,
          updated_at: new Date().toISOString(),
        });
        await updateTask(ensuredTask.id, {
          status: 'in_progress',
          progress: 65,
        });
        await createStoryboardReview({
          storyboardId: storyboard.id,
          reviewerProfileId: profile?.id || null,
          decision: 'changes_requested',
          comment: input.payload.comment || 'Cần siết nhịp cảnh và đơn giản hóa lời thoại.',
          criteria: input.payload.criteria || reviewDraft,
        });
        return { notice: 'Đã trả sửa storyboard.' };
      }

      if (input.action === 'approve') {
        await updateWorkflowRecord('storyboard', storyboard.id, {
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await createStoryboardReview({
          storyboardId: storyboard.id,
          reviewerProfileId: profile?.id || null,
          decision: 'approved',
          comment: input.payload.comment || 'Storyboard đã được duyệt và có thể sang bước tiếp theo.',
          criteria: input.payload.criteria || reviewDraft,
        });
        await updateTask(ensuredTask.id, {
          status: 'done',
          progress: 100,
        });
        await archiveTasksForStage(order.id, product.id, 1);
        await updateProduct(product.id, {
          current_stage_index: 2,
          progress: 38,
        });
        await ensureTaskForStage({
          orderId: order.id,
          productId: product.id,
          stageIndex: 2,
          existingTasks,
          assignee: null,
        });
        return { notice: `Đã duyệt storyboard và mở ${config.nextStagePage}.` };
      }

      if (input.action === 'delete_review') {
        await deleteStoryboardReview(String(input.payload.reviewId));
        return { notice: 'Đã xóa review log.' };
      }

      return { notice: 'Đã xử lý thao tác.' };
    },
    onMutate: (input) => {
      setNotice({ tone: 'warning', message: getPendingNotice(input.action, input.payload) });
      pushToast({ title: 'Đang xử lý storyboard', message: getPendingNotice(input.action, input.payload), tone: 'info', durationMs: 1800 });
    },
    onSuccess: async (result) => {
      setNotice({ tone: 'success', message: result?.notice || 'Đã ghi nhận thao tác.' });
      if (result?.taskId && result?.startedAt) {
        setStartedAtOverrides((current) => ({ ...current, [result.taskId]: result.startedAt }));
      }
      await queryClient.invalidateQueries({ queryKey: ['workflow-records'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['activity-logs', 'task-starts'] });
      if (shouldAutoNavigate && result?.notice?.includes(config.nextStagePage)) {
        navigate(`/${config.nextStageRoute}`);
      }
    },
    onError: (error) => {
      setNotice({ tone: 'danger', message: formatErrorMessage(error) });
    },
  });

  return (
    <>
      <SectionHeader
        eye={config.eye}
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => storyboardMutation.mutate({ action: 'save', payload: storyboardDraft })}
              disabled={!selected}
            >
              Lưu toàn bộ
            </button>
          </>
        }
      />

      <div className="kpi-row small">
        <Kpi label="Đang ở B2" value={String(queueStats.active)} sub="Bản storyboard đang làm" tone="violet" />
        <Kpi label="Chờ PM duyệt" value={String(queueStats.review)} sub="Đã submit review" tone="warning" />
        <Kpi label="Cần sửa" value={String(queueStats.changes)} sub="PM đã trả feedback" tone="danger" />
        <Kpi label="Đã duyệt" value={String(queueStats.approved)} sub={`Đã mở ${config.nextStagePage}`} tone="success" />
      </div>

      <div className="storyboard-layout">
        <Card title="Hàng đợi storyboard">
          <div className="stack">
            {rows.map((row) => {
              const active = `${row.order.id}::${row.product.id}` === selectedKey;
              return (
                <button key={`${row.order.id}-${row.product.id}`} className={`list-item storyboard-queue-item workflow-nav-card${active ? ' active' : ''}`} onClick={() => setSelectedKey(`${row.order.id}::${row.product.id}`)}>
                  <div className="workflow-nav-main">
                    <div className="workflow-nav-code">{row.product.id}</div>
                    <div className="workflow-nav-meta">
                      {row.order.id} · {row.order.title}
                    </div>
                    <div className="workflow-nav-meta">
                      v{row.storyboard?.current_version || 1} · {row.storyboard?.estimated_minutes || 0} phút · Due {row.storyboard?.due_date || '—'}
                    </div>
                  </div>
                </button>
              );
            })}
            {!rows.length ? <div className="muted-text">Chưa có storyboard nào ở bước B2.</div> : null}
          </div>
        </Card>

        <div className="stack">
          <Card title={selected ? `${selected.product.id}: ${selected.product.name}` : 'Không gian storyboard'}>
            {selected ? (
              <div className="storyboard-workspace">
                <div className="storyboard-header-row">
                  <div className="muted-text">
                    {selected.order.id} · {selected.order.client}
                  </div>
                  <div className="intake-inline-actions">
                    <Badge tone={toneForStatus(selectedStoryboard?.status || selected.task?.status || 'todo')}>{getStoryboardStatusLabel(selectedStoryboard?.status || selected.task?.status || 'todo')}</Badge>
                    <Badge tone="neutral">v{selectedStoryboard?.current_version || 1}</Badge>
                  </div>
                </div>

                {notice ? <div className={`bullet-item ${notice.tone === 'danger' ? 'tone-danger' : notice.tone === 'warning' ? 'tone-warning' : 'tone-success'}`}>{notice.message}</div> : null}

                <div className="form-grid storyboard-form-grid">
                  <label>
                    <span>Tổng cảnh</span>
                    <input className="fi" type="number" min="1" value={storyboardDraft.totalScenes} onChange={(event) => setStoryboardDraft((current) => ({ ...current, totalScenes: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    <span>Thoi luong du kien (phút)</span>
                    <input className="fi" type="number" min="1" value={storyboardDraft.estimatedMinutes} onChange={(event) => setStoryboardDraft((current) => ({ ...current, estimatedMinutes: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    <span>Người phụ trách</span>
                    <select className="fi" value={storyboardDraft.assigneeProfileId} onChange={(event) => setStoryboardDraft((current) => ({ ...current, assigneeProfileId: event.target.value }))}>
                      <option value="">-- Chọn người phụ trách --</option>
                      {assigneeProfiles.map((option) => (
                        <option key={option.profileId} value={option.profileId}>
                          {option.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="full">
                    <span>File storyboard / URL</span>
                    <input className="fi" value={storyboardDraft.fileName} onChange={(event) => setStoryboardDraft((current) => ({ ...current, fileName: event.target.value }))} />
                  </label>
                  <label className="full">
                    <span>Note / handoff</span>
                    <textarea className="fta" rows={4} value={storyboardDraft.notes} onChange={(event) => setStoryboardDraft((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>

                <div className="asset-toolbar">
                  <div className="bullet-item">Upload limit: {STORYBOARD_MAX_UPLOAD_MB}MB per file</div>
                  <label className="btn btn-ghost">
                    Tải file
                    <input
                      type="file"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void runStoryboardUpload(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {uploadOperation ? (
                    <div className="intake-progress-panel">
                      <div className="intake-progress-head">
                        <span>{uploadOperation.label}</span>
                        <span>{uploadOperation.progress}%</span>
                      </div>
                      <div className="progress-track intake-progress-track">
                        <div className={`progress-fill tone-${uploadOperation.tone}`} style={{ width: `${uploadOperation.progress}%` }} />
                      </div>
                    </div>
                  ) : null}
                  {selectedStoryboard?.file_name ? (
                    <>
                      <a className="btn btn-ghost" href={selectedStoryboard.file_name} target="_blank" rel="noreferrer">
                        Tải/xem file
                      </a>
                      <button
                        className="btn btn-ghost"
                        onClick={() => storyboardMutation.mutate({ action: 'delete_file' })}
                      >
                        Xóa file
                      </button>
                      <div className="muted-text">{getAssetLabel(selectedStoryboard.file_name)}</div>
                    </>
                  ) : (
                    <div className="muted-text">Chưa có file storyboard đã upload.</div>
                  )}
                </div>

                <div className="action-row">
                  <button className="btn btn-ghost" onClick={() => storyboardMutation.mutate({ action: 'create' })}>
                    Tạo hồ sơ
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => storyboardMutation.mutate({ action: 'save', payload: storyboardDraft })}
                  >
                    Lưu cập nhật
                  </button>
                  <button className="btn btn-ghost" onClick={() => storyboardMutation.mutate({ action: 'start' })}>
                    Bắt đầu soạn
                  </button>
                  <button className="btn btn-danger" onClick={() => storyboardMutation.mutate({ action: 'submit' })}>
                    Gửi PM duyệt
                  </button>
                </div>
                <div className="stack compact">
                  <div className="bullet-item">Người phụ trách: {selectedAssigneeLabel}</div>
                  {selectedStoryboard?.file_name ? <div className="bullet-item">File đính kèm: {getAssetLabel(selectedStoryboard.file_name)}</div> : null}
                </div>
              </div>
            ) : (
              <div className="muted-text">Chọn item để thao tác storyboard.</div>
            )}
          </Card>

          <Card title="Workflow liên kết task B2">
            {selected ? (
              <div className="stack compact">
                <div className="bullet-item">Task ID: {selected.task?.id || 'Chưa tạo'}</div>
                <div className="bullet-item">Trạng thái task: {getStoryboardStatusLabel(selected.task?.status || 'todo')}</div>
                <div className="bullet-item">Bắt đầu lúc: {selected.task?.id && (startedAtOverrides[selected.task.id] || startedAtByTask.get(selected.task.id)) ? new Date(String(startedAtOverrides[selected.task.id] || startedAtByTask.get(selected.task.id))).toLocaleString('vi-VN') : 'Chưa ghi nhận'}</div>
                <div className="bullet-item">Progress: {selected.task?.progress || 0}%</div>
                <div className="bullet-item">Cổng tiếp theo: {config.nextStagePage}</div>
              </div>
            ) : (
              <div className="muted-text">Chọn item để xem task.</div>
            )}
          </Card>
        </div>

        <div className="stack storyboard-sidebar">
          <Card title="Checklist PM duyệt" action={<Badge tone="warning">PM</Badge>}>
            {selected ? (
              <div className="stack compact">
                {REVIEW_CRITERIA.map((criterion) => (
                  <label className={`review-criterion ${reviewDraft[criterion.key] ? 'pass' : ''}`} key={criterion.key}>
                    <input type="checkbox" checked={Boolean(reviewDraft[criterion.key])} onChange={(event) => setReviewDraft((current) => ({ ...current, [criterion.key]: event.target.checked }))} />
                    <span>{criterion.label}</span>
                  </label>
                ))}
                <textarea className="fta" rows={4} placeholder="Nhận xét PM review" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
                <div className="action-row">
                  <button
                    className="btn btn-ghost btn-small"
                    onClick={() => storyboardMutation.mutate({ action: 'request_changes', payload: { comment: reviewComment, criteria: reviewDraft } })}
                  >
                    Trả sửa
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => storyboardMutation.mutate({ action: 'approve', payload: { comment: reviewComment, criteria: reviewDraft } })}
                  >
                    Duyệt và mở {config.nextStagePage}
                  </button>
                </div>
              </div>
            ) : (
              <div className="muted-text">Chọn storyboard để PM review.</div>
            )}
          </Card>

          <Card title="Lịch sử review">
            <div className="stack compact">
              {selectedStoryboard?.file_name ? (
                <div className="storyboard-review-item">
                  <div className="action-row">
                    <Badge tone="violet">Xem trước</Badge>
                    <a className="btn btn-ghost btn-small" href={selectedStoryboard.file_name} target="_blank" rel="noreferrer">
                      Mở storyboard
                    </a>
                  </div>
                  <div className="muted-text">{getAssetLabel(selectedStoryboard.file_name)}</div>
                </div>
              ) : null}
              {selectedReviews.map((review: StoryboardReviewRow) => (
                <div className="storyboard-review-item" key={review.id}>
                  <div className="action-row">
                    <Badge tone={review.decision === 'approved' ? 'success' : review.decision === 'changes_requested' ? 'danger' : 'warning'}>{getStoryboardDecisionLabel(review.decision)}</Badge>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => storyboardMutation.mutate({ action: 'delete_review', payload: { reviewId: review.id } })}
                    >
                      Xoa
                    </button>
                  </div>
                  <div className="muted-text">{new Date(review.created_at).toLocaleString('vi-VN')}</div>
                  <div>{localizeStoryboardText(review.comment || 'Không có ghi chú.')}</div>
                </div>
              ))}
              {!selectedReviews.length ? <div className="muted-text">Chưa có lịch sử review cho storyboard này.</div> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
