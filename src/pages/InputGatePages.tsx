import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import { useToast } from '@/components/system/ToastProvider';
import {
  archiveTasksForStage,
  deleteIntakeAsset,
  ensureInputItemsForProduct,
  ensureTaskForStage,
  getInputTemplate,
  inferProductWorkflowModule,
  listInputItems,
  listOrdersWithProducts,
  listTasks,
  updateInputItem,
  updateProduct,
  uploadIntakeAsset,
  type InputItemRow,
  type OrderRow,
} from '@/services/vcontent';
import type { PageKey } from '@/data/vcontent';

type InputGateConfig = {
  pageId: 'smf01' | 'vsmf01';
  module: 'ELN' | 'VIDEO';
  eye: string;
  title: string;
  subtitle: string;
  nextStagePage: string;
  nextStageRoute: PageKey;
};

type ItemOperationState = {
  action: 'upload' | 'delete' | 'request' | 'approve' | 'save';
  label: string;
  progress: number;
  tone: 'warning' | 'danger' | 'success' | 'violet' | 'neutral';
};

const INTAKE_MAX_UPLOAD_MB = 200;
const INTAKE_MAX_UPLOAD_BYTES = INTAKE_MAX_UPLOAD_MB * 1024 * 1024;

const CONFIGS: Record<'smf01' | 'vsmf01', InputGateConfig> = {
  smf01: {
    pageId: 'smf01',
    module: 'ELN',
    eye: 'Module 2 · SMF-01',
    title: 'Quản lý đầu vào',
    subtitle: '9 intake riêng cho E-learning. Chỉ nhận product đã được launch vào sản xuất.',
    nextStagePage: 'SMF-02',
    nextStageRoute: 'smf02',
  },
  vsmf01: {
    pageId: 'vsmf01',
    module: 'VIDEO',
    eye: 'Module 3 · VSMF-01',
    title: 'Quản lý đầu vào Video',
    subtitle: '9 intake riêng cho Video. Chỉ nhận product đã launch vào luồng VSMF.',
    nextStagePage: 'VSMF-02',
    nextStageRoute: 'vsmf02',
  },
};

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['missing', 'changes_requested', 'blocked', 'fail'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'todo'].includes(status)) return 'warning';
  if (['approved', 'done', 'ready', 'ready_launch'].includes(status)) return 'success';
  if (['in_progress'].includes(status)) return 'violet';
  return 'neutral';
}

function validateIntakeFile(file: File) {
  if (file.size > INTAKE_MAX_UPLOAD_BYTES) {
    throw new Error(`File vượt quá ${INTAKE_MAX_UPLOAD_MB}MB.`);
  }
}

function isModuleMatch(productId: string, order: OrderRow, module: 'ELN' | 'VIDEO') {
  return inferProductWorkflowModule(productId, order.module) === module;
}

function isLaunchedProduct(productId: string, progress: number, tasks: Array<{ product_id: string; stage_index: number; archived: boolean }>) {
  return progress > 0 || tasks.some((task) => task.product_id === productId && task.stage_index === 0 && !task.archived);
}

function getSummary(items: InputItemRow[]) {
  const total = items.length;
  const required = items.filter((item) => item.required);
  const checkedTotal = items.filter((item) => item.status !== 'missing').length;
  const approvedRequired = required.filter((item) => item.status === 'approved').length;
  const ready = required.length > 0 && approvedRequired === required.length;
  const blocked = required.filter((item) => item.status === 'missing' || item.status === 'changes_requested').length;
  const review = required.filter((item) => item.status === 'submitted').length;

  return {
    total,
    required: required.length,
    checkedTotal,
    approvedRequired,
    ready,
    blocked,
    review,
  };
}

function makeInitialDrafts(items: InputItemRow[]) {
  return {
    links: Object.fromEntries(items.map((item) => [item.id, item.file_url || ''])) as Record<string, string>,
    notes: Object.fromEntries(items.map((item) => [item.id, item.notes || ''])) as Record<string, string>,
  };
}

function splitProductDisplayId(productId: string, orderId: string) {
  if (productId.startsWith(`${orderId}-`)) {
    return {
      primary: orderId,
      secondary: productId.slice(orderId.length + 1),
    };
  }

  const parts = productId.split('-');
  if (parts.length <= 2) {
    return {
      primary: productId,
      secondary: '',
    };
  }

  return {
    primary: parts.slice(0, 2).join('-'),
    secondary: parts.slice(2).join('-'),
  };
}

export function InputGatePage({ pageId }: { pageId: PageKey }) {
  const config = CONFIGS[pageId as 'smf01' | 'vsmf01'];
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const shouldAutoNavigate = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const inputItemsQuery = useQuery({ queryKey: ['input-items', config.module], queryFn: () => listInputItems({ module: config.module }) });
  const tasksQuery = useQuery({ queryKey: ['tasks', 'stage-0'], queryFn: () => listTasks({ stageIndices: [0] }) });

  const scopedProducts = useMemo(() => {
    const orders = ordersQuery.data?.orders || [];
    const products = ordersQuery.data?.products || [];
    const tasks = tasksQuery.data || [];
    return orders.flatMap((order) =>
      products
        .filter((product) => product.order_id === order.id)
        .filter((product) => isModuleMatch(product.id, order, config.module))
        .filter((product) => isLaunchedProduct(product.id, product.progress, tasks))
        .map((product) => ({ order, product })),
    );
  }, [ordersQuery.data, tasksQuery.data, config.module]);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, { order: OrderRow; products: Array<(typeof scopedProducts)[number]> }>();
    for (const entry of scopedProducts) {
      const current = groups.get(entry.order.id);
      if (current) {
        current.products.push(entry);
        continue;
      }
      groups.set(entry.order.id, { order: entry.order, products: [entry] });
    }
    return Array.from(groups.values());
  }, [scopedProducts]);

  const [selectedKey, setSelectedKey] = useState('');
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [confirmNotice, setConfirmNotice] = useState<string | null>(null);
  const [itemOperations, setItemOperations] = useState<Record<string, ItemOperationState>>({});

  useEffect(() => {
    if (!selectedKey && scopedProducts[0]) {
      setSelectedKey(`${scopedProducts[0].order.id}::${scopedProducts[0].product.id}`);
    }
  }, [scopedProducts, selectedKey]);

  const selected = useMemo(
    () => scopedProducts.find((item) => `${item.order.id}::${item.product.id}` === selectedKey) || null,
    [scopedProducts, selectedKey],
  );

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      return ensureInputItemsForProduct({
        orderId: selected.order.id,
        productId: selected.product.id,
        module: config.module,
        existingItems: inputItemsQuery.data || [],
        ownerProfileId: profile?.id || null,
      });
    },
    onSuccess: async (_, input) => {
      await queryClient.invalidateQueries({ queryKey: ['input-items'] });
      const actionLabel =
        input.action === 'upload' ? 'Đã tải file lên' :
        input.action === 'delete' ? 'Đã xóa file/link' :
        input.action === 'request' ? 'Đã gửi yêu cầu bổ sung' :
        input.action === 'approve' ? 'Đã xác nhận mục intake' :
        'Đã lưu intake';
      pushToast({ title: actionLabel, message: input.item.label || input.item.item_code, tone: 'success' });
    },
    onError: (error) => {
      pushToast({ title: 'Thao tác intake thất bại', message: error instanceof Error ? error.message : String(error), tone: 'danger', durationMs: 4200 });
    },
  });

  useEffect(() => {
    if (!selected || !inputItemsQuery.data) return;
    const existing = inputItemsQuery.data.filter(
      (item) => item.order_id === selected.order.id && item.product_id === selected.product.id && item.module === config.module,
    );
    if (!existing.length) {
      void seedMutation.mutateAsync();
    }
  }, [selected, inputItemsQuery.data, config.module, seedMutation]);

  const items = useMemo(() => {
    if (!selected) return [];
    const raw = (inputItemsQuery.data || []).filter(
      (item) => item.order_id === selected.order.id && item.product_id === selected.product.id && item.module === config.module,
    );
    return getInputTemplate(config.module)
      .map((template) => raw.find((item) => item.item_code === template.code))
      .filter(Boolean) as InputItemRow[];
  }, [selected, inputItemsQuery.data, config.module]);

  useEffect(() => {
    const drafts = makeInitialDrafts(items);
    setLinkDrafts(drafts.links);
    setNoteDrafts(drafts.notes);
  }, [selectedKey, items]);

  useEffect(() => {
    setConfirmNotice(null);
  }, [selectedKey]);

  useEffect(() => {
    const activeIds = Object.keys(itemOperations);
    if (!activeIds.length) return;

    const timer = window.setInterval(() => {
      setItemOperations((current) =>
        Object.fromEntries(
          Object.entries(current).map(([itemId, operation]) => [
            itemId,
            {
              ...operation,
              progress: operation.progress >= 92 ? operation.progress : Math.min(92, operation.progress + (operation.progress < 40 ? 18 : operation.progress < 72 ? 10 : 4)),
            },
          ]),
        ) as Record<string, ItemOperationState>,
      );
    }, 260);

    return () => window.clearInterval(timer);
  }, [itemOperations]);

  const summary = getSummary(items);

  function startItemOperation(itemId: string, action: ItemOperationState['action']) {
    const metaByAction: Record<ItemOperationState['action'], Omit<ItemOperationState, 'progress'>> = {
      upload: { action: 'upload', label: 'Đang tải file lên server', tone: 'violet' },
      delete: { action: 'delete', label: 'Đang xóa tệp hoặc link', tone: 'danger' },
      request: { action: 'request', label: 'Đang cập nhật yêu cầu cung cấp', tone: 'warning' },
      approve: { action: 'approve', label: 'Đang xác nhận hoàn thành', tone: 'success' },
      save: { action: 'save', label: 'Đang lưu intake', tone: 'warning' },
    };

    setItemOperations((current) => ({
      ...current,
      [itemId]: {
        ...metaByAction[action],
        progress: 8,
      },
    }));
  }

  function finishItemOperation(itemId: string) {
    setItemOperations((current) => ({
      ...current,
      [itemId]: current[itemId]
        ? {
            ...current[itemId],
            progress: 100,
            tone: 'success',
            label: 'Đã cập nhật xong',
          }
        : current[itemId],
    }));

    window.setTimeout(() => {
      setItemOperations((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
    }, 700);
  }

  function failItemOperation(itemId: string) {
    setItemOperations((current) => ({
      ...current,
      [itemId]: current[itemId]
        ? {
            ...current[itemId],
            progress: 100,
            tone: 'danger',
            label: 'Có lỗi, vui lòng thử lại',
          }
        : current[itemId],
    }));
  }

  const itemMutation = useMutation({
    mutationFn: async (input: { item: InputItemRow; action: 'upload' | 'delete' | 'request' | 'approve' | 'save'; file?: File; fileUrl?: string; notes?: string }) => {
      if (input.action === 'upload') {
        if (!selected || !input.file) throw new Error('Chưa có file để upload.');
        validateIntakeFile(input.file);
        const uploaded = await uploadIntakeAsset({
          file: input.file,
          orderId: selected.order.id,
          productId: selected.product.id,
          itemCode: input.item.item_code,
          module: config.module,
          previousUrl: input.item.file_url,
        });
        await updateInputItem(input.item.id, {
          file_name: uploaded.fileName,
          file_url: uploaded.fileUrl,
          status: 'submitted',
        });
        return;
      }

      if (input.action === 'delete') {
        if (input.item.file_url?.includes('/storage/v1/object/')) {
          await deleteIntakeAsset({ fileUrl: input.item.file_url });
        }
        await updateInputItem(input.item.id, {
          file_name: null,
          file_url: null,
          status: input.item.required ? 'changes_requested' : 'missing',
        });
        return;
      }

      if (input.action === 'request') {
        await updateInputItem(input.item.id, {
          status: 'changes_requested',
          notes: input.notes ?? input.item.notes ?? 'Đang chờ client/PM bổ sung.',
        });
        return;
      }

      if (input.action === 'approve') {
        await updateInputItem(input.item.id, {
          status: 'approved',
          notes: input.notes ?? input.item.notes,
        });
        return;
      }

      const nextFileUrl = (input.fileUrl ?? input.item.file_url ?? '').trim() || null;
      await updateInputItem(input.item.id, {
        file_url: nextFileUrl,
        notes: input.notes ?? input.item.notes,
        status:
          ['missing', 'changes_requested'].includes(input.item.status) && (nextFileUrl || input.item.file_name)
            ? 'submitted'
            : input.item.status,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['input-items'] });
      pushToast({ title: 'Đã duyệt checklist bắt buộc', message: 'Các mục intake đã được xác nhận.', tone: 'success' });
    },
    onError: (error) => {
      pushToast({ title: 'Không duyệt được checklist', message: error instanceof Error ? error.message : String(error), tone: 'danger', durationMs: 4200 });
    },
  });

  async function runItemAction(input: { item: InputItemRow; action: 'upload' | 'delete' | 'request' | 'approve' | 'save'; file?: File; fileUrl?: string; notes?: string }) {
    startItemOperation(input.item.id, input.action);
    try {
      await itemMutation.mutateAsync(input);
      finishItemOperation(input.item.id);
    } catch (error) {
      failItemOperation(input.item.id);
      throw error;
    }
  }

  const approveRequiredMutation = useMutation({
    mutationFn: async () => {
      for (const item of items.filter((entry) => entry.required)) {
        await updateInputItem(item.id, {
          status: 'approved',
          notes: noteDrafts[item.id] || item.notes || 'Input đã được approve.',
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['input-items'] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Chưa chọn product.');
      if (!summary.ready) throw new Error('Chưa đủ mục bắt buộc được xác nhận.');
      await archiveTasksForStage(selected.order.id, selected.product.id, 0).catch(() => null);
      await updateProduct(selected.product.id, {
        current_stage_index: 1,
        progress: 13,
      });
      await ensureTaskForStage({
        orderId: selected.order.id,
        productId: selected.product.id,
        stageIndex: 1,
        existingTasks: tasksQuery.data || [],
        assignee: null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      pushToast({ title: 'Đã xác nhận để đi tiếp', message: `${config.pageId.toUpperCase()} đã hoàn tất intake.`, tone: 'success' });
      if (shouldAutoNavigate) {
        setConfirmNotice(`Đã xác nhận intake. Đang chuyển sang ${config.nextStagePage}.`);
        navigate(`/${config.nextStageRoute}`);
        return;
      }
      setConfirmNotice(`Đã xác nhận intake. Hãy mở ${config.nextStagePage} từ menu bên trái để tiếp tục.`);
    },
  });

  return (
    <>
      <SectionHeader eye={config.eye} title={config.title} subtitle={config.subtitle} />

      <div className="kpi-row small">
        <Kpi label="Tổng sản phẩm" value={String(scopedProducts.length)} sub={`${config.module} workspace`} tone="neutral" />
        <Kpi label="Đang bị chặn" value={String(summary.blocked)} sub="Thiếu đầu vào bắt buộc" tone="danger" />
        <Kpi label="Đang review" value={String(summary.review)} sub="Cần PM hoặc client chốt" tone="warning" />
        <Kpi label="Sẵn sàng triển khai" value={summary.ready ? '1' : '0'} sub={`Đủ điều kiện mở ${config.nextStagePage}`} tone="success" />
      </div>

      <div className="intake-layout">
        <Card title="Sản phẩm">
          <div className="intake-product-list">
            {groupedProducts.map((group) => (
              <section className="intake-order-group" key={group.order.id}>
                <div className="intake-order-head">
                  <div className="intake-order-id">{group.order.id}</div>
                  <div className="intake-order-meta">{group.order.title} · {group.products.length} intake đang chảy ra</div>
                </div>
                <div className="intake-order-flow">
                  {group.products.map((item) => {
                    const productItems = (inputItemsQuery.data || []).filter(
                      (entry) => entry.order_id === item.order.id && entry.product_id === item.product.id && entry.module === config.module,
                    );
                    const productSummary = getSummary(productItems);
                    const active = `${item.order.id}::${item.product.id}` === selectedKey;
                    const productDisplay = splitProductDisplayId(item.product.id, item.order.id);
                    return (
                      <button
                        key={`${item.order.id}-${item.product.id}`}
                        className={`list-item intake-product-item workflow-nav-card${active ? ' active' : ''}`}
                        onClick={() => setSelectedKey(`${item.order.id}::${item.product.id}`)}
                      >
                        {active ? <div className="intake-product-bridge" aria-hidden="true" /> : null}
                        <div className="intake-product-flow-dot" />
                        <div className="workflow-nav-main">
                          <div className="intake-product-row">
                            <div className="workflow-nav-code intake-product-code">
                              <span>{productDisplay.primary}</span>
                              {productDisplay.secondary ? <span>{productDisplay.secondary}</span> : null}
                            </div>
                          </div>
                          <div className="workflow-nav-meta">{item.order.client}</div>
                          <div className="workflow-nav-meta">
                            {productSummary.checkedTotal}/{Math.max(productSummary.total, 9)} checklist · {productSummary.approvedRequired}/{productSummary.required} mục bắt buộc
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </Card>

        <Card
          title={selected ? `${selected.order.title} / ${selected.product.name} · 9 intake` : 'Checklist đầu vào'}
          action={selected ? <Badge tone={summary.ready ? 'success' : summary.review ? 'warning' : 'danger'}>{summary.ready ? 'ĐẠT' : 'CHẶN'}</Badge> : undefined}
        >
          {selected ? (
            <div className="intake-fan-stage" key={selectedKey}>
              <div className="intake-linked-header">
                <span className="intake-linked-pill">{selected.product.id}</span>
                <span className="muted-text">9 intake hiện tại thuộc product này</span>
              </div>

              <div className="intake-checklist intake-checklist-reveal intake-checklist-linked">
                {items.map((item, index) => {
                  const noteValue = noteDrafts[item.id] ?? item.notes ?? '';
                  const linkValue = linkDrafts[item.id] ?? item.file_url ?? '';
                  const hasAsset = Boolean(item.file_name || item.file_url);
                  const operation = itemOperations[item.id];

                  return (
                    <article
                      className="intake-item-card intake-item-card-reveal intake-item-card-linked"
                      key={item.id}
                      style={
                        {
                          '--reveal-index': index,
                        } as CSSProperties
                      }
                    >
                      <div className="intake-item-top">
                        <div className="intake-item-title-group">
                          <div className="intake-item-index">{String(index + 1).padStart(2, '0')}</div>
                          <div className="intake-item-header-block">
                            <div className="intake-item-heading-row">
                              <div className="fw6">{item.label}</div>
                              <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                            </div>
                            <div className="intake-meta-row">
                              <span className="muted-text">{item.item_code}</span>
                              <Badge tone="neutral">{item.item_type}</Badge>
                              <Badge tone={item.required ? 'danger' : 'neutral'}>{item.required ? 'Bắt buộc' : 'Tùy chọn'}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="intake-controls-grid">
                        <label className="intake-upload-box">
                          <span className="muted-text">Tải file lên server</span>
                          <input
                            type="file"
                            disabled={itemMutation.isPending}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              void runItemAction({ item, action: 'upload', file });
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>

                        <div className="stack compact">
                          <label className="stack compact">
                            <span className="muted-text">Hoặc dán link ngoài</span>
                            <input
                              className="fi"
                              value={linkValue}
                              placeholder="Dán link tệp tại đây"
                              onChange={(event) => setLinkDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                              onBlur={(event) => {
                                void runItemAction({
                                  item,
                                  action: 'save',
                                  fileUrl: event.target.value.trim(),
                                  notes: noteValue,
                                });
                              }}
                            />
                          </label>
                          {(item.file_name || item.file_url) ? (
                            <div className="intake-file-row">
                              <div className="muted-text intake-file-name">{item.file_name || item.file_url}</div>
                              <div className="intake-inline-actions">
                                {item.file_url ? (
                                  <a className="btn btn-ghost btn-small" href={item.file_url} target="_blank" rel="noreferrer">
                                    Mở file
                                  </a>
                                ) : null}
                                <button
                                  className="btn btn-ghost btn-small"
                                  disabled={!hasAsset || itemMutation.isPending}
                                  onClick={() => void runItemAction({ item, action: 'delete' })}
                                >
                                  Xóa tệp/link
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="muted-text">Chưa có file hoặc link.</div>
                          )}
                        </div>
                      </div>

                      {operation ? (
                        <div className="intake-progress-panel">
                          <div className="intake-progress-head">
                            <span>{operation.label}</span>
                            <span>{operation.progress}%</span>
                          </div>
                          <div className="progress-track intake-progress-track">
                            <div className={`progress-fill tone-${operation.tone}`} style={{ width: `${operation.progress}%` }} />
                          </div>
                        </div>
                      ) : null}

                      <label className="stack compact">
                        <span className="muted-text">Ghi chú intake</span>
                        <textarea
                          className="fta"
                          rows={2}
                          value={noteValue}
                          onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                          onBlur={(event) => {
                            void runItemAction({
                              item,
                              action: 'save',
                              fileUrl: linkValue.trim(),
                              notes: event.target.value,
                            });
                          }}
                        />
                      </label>

                      <div className="intake-action-pack intake-action-row-bottom">
                        <button
                          className="btn btn-ghost btn-small"
                          disabled={itemMutation.isPending}
                          onClick={() =>
                            void runItemAction({
                              item,
                              action: 'save',
                              fileUrl: linkValue.trim(),
                              notes: noteValue,
                            })
                          }
                        >
                          Lưu
                        </button>
                        <button className="btn btn-ghost btn-small" disabled={itemMutation.isPending} onClick={() => void runItemAction({ item, action: 'approve', notes: noteValue })}>
                          Hoàn thành
                        </button>
                        <button className="btn btn-ghost btn-small" disabled={itemMutation.isPending} onClick={() => void runItemAction({ item, action: 'request', notes: noteValue || 'Đang chờ client/PM bổ sung.' })}>
                          Yêu cầu cung cấp
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="muted-text">Chọn product để thao tác intake.</div>
          )}
        </Card>

        <div className="stack intake-sidebar">
          <Card title="Tổng hợp điều kiện">
            <div className="stack compact">
              <div className="bullet-item">Trạng thái đơn hàng: {selected?.order.status || '-'}</div>
              <div className="bullet-item">Module: {config.module}</div>
              <div className="bullet-item">Checklist đã kiểm: {summary.checkedTotal}/{summary.total}</div>
              <div className="bullet-item">Mục bắt buộc đã duyệt: {summary.approvedRequired}/{summary.required}</div>
              <div className="bullet-item">Điều kiện triển khai: {summary.ready ? 'ĐẠT' : 'CHẶN'}</div>
              <div className={`bullet-item${summary.ready ? '' : ' tone-danger'}`}>
                {summary.ready ? `Tất cả đầu vào bắt buộc đã được duyệt. Có thể đi tiếp ${config.nextStagePage}.` : 'Đơn hàng chưa thể triển khai vì còn đầu vào bắt buộc chưa được xác nhận.'}
              </div>
            </div>
          </Card>

          <Card title="Thao tác nhanh">
            <div className="stack compact">
              <button className="btn btn-ghost" onClick={() => approveRequiredMutation.mutate()} disabled={!selected || approveRequiredMutation.isPending}>
                Xác nhận đủ đầu vào sản xuất
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setConfirmNotice(null);
                  confirmMutation.mutate();
                }}
                disabled={!selected || !summary.ready || confirmMutation.isPending}
              >
                Xác nhận để đi tiếp
              </button>
              {confirmNotice ? <div className="muted-text">{confirmNotice}</div> : null}
              {itemMutation.error ? <div className="muted-text">{String(itemMutation.error)}</div> : null}
              {confirmMutation.error ? <div className="muted-text">{String(confirmMutation.error)}</div> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
