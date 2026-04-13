import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, SectionHeader } from '@/components/ui/Primitives';
import { getStatusDisplayLabel } from '@/lib/statusLabels';
import { isTaskAssignedToCurrentProfile } from '@/lib/taskAssignee';
import { getStageCode, getStagePageKey, getTaskStartActionType } from '@/lib/workflowTasks';
import {
  createActivityLog,
  createDelivery,
  createPaymentReceipt,
  createPaymentRequest,
  createTask,
  inferProductWorkflowModule,
  listActivityLogs,
  listDeliveries,
  listOrdersWithProducts,
  listPaymentReceipts,
  listPaymentRequests,
  listTasks,
  updateOrder,
  updateProduct,
  updateTask,
} from '@/services/vcontent';

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['overdue', 'qc_fail', 'fail', 'changes_requested', 'critical', 'rejected'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'ready_for_launch', 'packaging', 'warning', 'sent'].includes(status)) return 'warning';
  if (['done', 'approved', 'ready_delivery', 'paid', 'success', 'accepted', 'confirmed'].includes(status)) return 'success';
  if (['in_production', 'in_progress', 'recording', 'editing', 'info', 'todo'].includes(status)) return 'violet';
  return 'neutral';
}

function isProductLaunched(product: { id: string; progress: number }, tasks: Array<{ product_id: string; archived?: boolean }>) {
  return product.progress > 0 || tasks.some((task) => task.product_id === product.id && !task.archived);
}

function getStageEntryLabel(module: string) {
  if (module === 'VIDEO') return 'VSMF-01';
  if (module === 'GAME') return 'GSMF-01';
  return 'SMF-01';
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

function getClientFacingOrderStatus(order: { status: string; change_request_reason?: string | null; rejection_reason?: string | null }) {
  if (['submitted', 'pm_review'].includes(order.status)) return 'Đã gửi xác nhận';
  if (['changes_requested'].includes(order.status)) return order.change_request_reason?.trim() ? `Cần bổ sung: ${order.change_request_reason}` : 'Cần bổ sung thông tin';
  if (['ready_for_launch', 'in_production'].includes(order.status)) return 'Đang sản xuất';
  if (['pending_acceptance'].includes(order.status)) return 'Đã bàn giao, chờ xác nhận';
  if (['ready_delivery'].includes(order.status)) return 'Sẵn sàng bàn giao';
  if (['paid'].includes(order.status)) return 'Đã thanh toán';
  if (order.rejection_reason?.trim()) return `Cần xử lý: ${order.rejection_reason}`;
  return 'Đang xử lý';
}

export function ProducerInboxRealPage() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const intakeOrders = (ordersQuery.data?.orders || []).filter((item) => ['submitted', 'pm_review', 'changes_requested'].includes(item.status));
  const productCountByOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of ordersQuery.data?.products || []) {
      map.set(product.order_id, (map.get(product.order_id) || 0) + 1);
    }
    return map;
  }, [ordersQuery.data]);

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, patch }: { orderId: string; patch: any }) => updateOrder(orderId, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return (
    <>
      <SectionHeader
        eye="PM Inbox"
        title="Hộp thư đơn hàng"
        subtitle="PM xử lý đơn ở mức order. Sau khi nhận đơn, từng product sẽ vào queue Launch để mở sản xuất độc lập."
      />
      <Card title="Đơn chờ PM xử lý">
        <div className="stack">
          {intakeOrders.map((order) => (
            <div className="list-item" key={order.id}>
              <div>
                <div className="list-title">{order.id} · {order.title}</div>
                <div className="muted-text">{order.client} · {order.module} · deadline {order.deadline}</div>
                <div className="muted-text">{productCountByOrder.get(order.id) || 0} product trong order</div>
                <div className="muted-text">{order.intake_note || 'Chưa có intake note.'}</div>
              </div>
              <div className="action-row">
                <Badge tone={toneForStatus(order.status)}>{getStatusDisplayLabel(order.status)}</Badge>
                <button className="btn btn-ghost btn-small" onClick={() => updateOrderMutation.mutate({ orderId: order.id, patch: { status: 'changes_requested' } })}>
                  Yêu cầu bổ sung
                </button>
                <button className="btn btn-danger btn-small" onClick={() => updateOrderMutation.mutate({ orderId: order.id, patch: { status: 'ready_for_launch' } })}>
                  Nhận đơn
                </button>
              </div>
            </div>
          ))}
          {!intakeOrders.length ? <div className="muted-text">Không còn đơn mới trong inbox.</div> : null}
          {updateOrderMutation.error ? <div className="bullet-item tone-danger">{String(updateOrderMutation.error)}</div> : null}
        </div>
      </Card>
    </>
  );
}

export function ProducerLaunchRealPage() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });

  const launchQueue = useMemo(() => {
    const orders = ordersQuery.data?.orders || [];
    const products = ordersQuery.data?.products || [];
    const tasks = tasksQuery.data || [];

    return orders
      .filter((order) => ['ready_for_launch', 'in_production'].includes(order.status))
      .flatMap((order) =>
        products
          .filter((product) => product.order_id === order.id)
          .filter((product) => !isProductLaunched(product, tasks))
          .map((product) => ({
            order,
            product,
            module: inferProductWorkflowModule(product.id, order.module),
          })),
      );
  }, [ordersQuery.data, tasksQuery.data]);

  const launchMutation = useMutation({
    mutationFn: async ({ orderId, productId }: { orderId: string; productId: string }) => {
      const product = (ordersQuery.data?.products || []).find((item) => item.id === productId);
      if (!product) throw new Error('Không tìm thấy product để launch.');

      await updateOrder(orderId, {
        status: 'in_production',
        launched_at: new Date().toISOString().slice(0, 10),
      });

      await createTask({
        orderId,
        productId,
        stageIndex: 0,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
        assignee: null,
        assigneeProfileId: null,
        assigneeAccountId: null,
        status: 'todo',
        progress: 0,
      });

      await updateProduct(product.id, {
        current_stage_index: 0,
        progress: 5,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <>
      <SectionHeader
        eye="Producer Launch"
        title="Chuyển vào sản xuất"
        subtitle="Launch theo product-level. Mỗi product được đưa vào stage đầu tiên theo module của chính nó."
      />
      <Card title="Queue product chờ launch">
        <div className="stack">
          {launchQueue.map(({ order, product, module }) => (
            <div className="list-item" key={product.id}>
              <div>
                <div className="list-title">{product.id} · {product.name}</div>
                <div className="muted-text">{order.id} · {order.client} · {module}</div>
                <div className="muted-text">Launch sẽ mở {getStageEntryLabel(module)}</div>
              </div>
              <div className="action-row">
                <Badge tone="warning">{getStatusDisplayLabel(order.status)}</Badge>
                <button className="btn btn-danger btn-small" onClick={() => launchMutation.mutate({ orderId: order.id, productId: product.id })} disabled={launchMutation.isPending}>
                  Chuyển vào sản xuất
                </button>
              </div>
            </div>
          ))}
          {!launchQueue.length ? <div className="muted-text">Không có product nào đang chờ launch.</div> : null}
          {launchMutation.error ? <div className="muted-text">{String(launchMutation.error)}</div> : null}
        </div>
      </Card>
    </>
  );
}

export function TasksRealPage() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const activityLogsQuery = useQuery({
    queryKey: ['activity-logs', 'task-details'],
    queryFn: () =>
      listActivityLogs({
        actionTypes: ['task_started', 'workflow_step_started', 'workflow_review_claimed', 'workflow_step_submitted', 'workflow_step_returned', 'workflow_step_approved'],
        limit: 1000,
      }),
  });
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const { profile } = useAuth();
  const navigate = useNavigate();

  const orderMap = useMemo(() => new Map((ordersQuery.data?.orders || []).map((order) => [order.id, order])), [ordersQuery.data]);
  const productMap = useMemo(() => new Map((ordersQuery.data?.products || []).map((product) => [product.id, product])), [ordersQuery.data]);
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

  const scopedTasks = (tasksQuery.data || []).filter((task) => isTaskAssignedToCurrentProfile(task, profile));
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const selectedTask = scopedTasks.find((task) => task.id === selectedTaskId) || scopedTasks[0] || null;
  const selectedTaskLatestLog = useMemo(() => {
    if (!selectedTask) return null;
    return (
      (activityLogsQuery.data || []).find((log) => {
        const metadataTaskId = typeof log.metadata?.task_id === 'string' ? log.metadata.task_id : null;
        if (metadataTaskId === selectedTask.id) return true;
        const metadataProductId = typeof log.metadata?.product_id === 'string' ? log.metadata.product_id : null;
        const metadataStageIndex = Number(log.metadata?.stage_index);
        return metadataProductId === selectedTask.product_id && Number.isFinite(metadataStageIndex) && metadataStageIndex === selectedTask.stage_index;
      }) || null
    );
  }, [activityLogsQuery.data, selectedTask]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, patch }: { taskId: string; patch: any }) => {
      const task = (tasksQuery.data || []).find((entry) => entry.id === taskId);
      if (!task) throw new Error('Không tìm thấy task.');
      const order = orderMap.get(task.order_id);
      const module = inferProductWorkflowModule(task.product_id, order?.module);
      const stageCode = getStageCode(module, task.stage_index);
      await updateTask(taskId, patch);

      const nextProgress = Number(patch.progress ?? task.progress ?? 0);
      const currentProduct = productMap.get(task.product_id);
      if (currentProduct) {
        await updateProduct(task.product_id, {
          current_stage_index: Math.max(currentProduct.current_stage_index || 0, task.stage_index),
          progress: Math.max(currentProduct.progress || 0, nextProgress),
        });
      }

      if (patch.status === 'in_progress') {
        await updateOrder(task.order_id, { status: 'in_production' });
        if (task.status !== 'in_progress') {
          await createActivityLog({
            actorProfileId: profile?.id || null,
            actionType: getTaskStartActionType(module, task.stage_index),
            objectType: 'task',
            objectId: task.id,
            summary: stageCode ? `${task.product_id} started ${stageCode}` : `${task.product_id} started task B${task.stage_index + 1}`,
            metadata: {
              task_id: task.id,
              order_id: task.order_id,
              product_id: task.product_id,
              stage_index: task.stage_index,
              stage_code: stageCode,
              module,
              source: 'my_tasks',
            },
          });
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['activity-logs', 'task-details'] });
    },
  });

  return (
    <>
      <SectionHeader
        eye="Workspace cá nhân"
        title="Công việc của tôi"
        subtitle="Danh sách task thật từ Supabase. Bấm vào từng việc để xem chi tiết và mở đúng màn stage."
      />
      <div className="content-grid two-column">
        <Card title="Danh sách task">
          <div className="stack">
            {scopedTasks.map((task) => {
              const order = orderMap.get(task.order_id);
              const product = productMap.get(task.product_id);
              const active = selectedTask?.id === task.id;
              return (
                <button key={task.id} className={`list-item workflow-nav-card task-list-card${active ? ' active' : ''}`} onClick={() => setSelectedTaskId(task.id)}>
                  <div className="workflow-nav-main">
                    <div className="workflow-nav-code">{product?.id || task.product_id}</div>
                    <div className="workflow-nav-meta">{product?.name || task.product_id}</div>
                    <div className="workflow-nav-meta">{order?.id || task.order_id} · bước {task.stage_index + 1} · hạn {task.due_date || '-'}</div>
                    <div className="workflow-nav-meta">Bắt đầu: {startedAtByTask.get(task.id) ? new Date(String(startedAtByTask.get(task.id))).toLocaleString('vi-VN') : '-'}</div>
                  </div>
                </button>
              );
            })}
            {!scopedTasks.length ? <div className="muted-text">Chưa có task nào trong queue.</div> : null}
          </div>
        </Card>
        <Card title="Chi tiết task">
          {selectedTask ? (
            <div className="stack compact task-detail-summary">
              <div className="bullet-item">Trạng thái: {selectedTask.status}</div>
              <div className="bullet-item">Tiến độ: {selectedTask.progress}%</div>
              <div className="bullet-item">Deadline: {selectedTask.due_date || '-'}</div>
              <div className="bullet-item">
                Ghi log:
                {' '}
                {selectedTaskLatestLog ? `${localizeWorkflowText(selectedTaskLatestLog.summary)} (${new Date(selectedTaskLatestLog.happened_at).toLocaleString('vi-VN')})` : 'Chua co log cho task nay'}
              </div>
              <div className="bullet-item">Người thực hiện: {selectedTask.assignee || 'Chưa gán'}</div>
              <div className="bullet-item">Bắt đầu lúc: {startedAtByTask.get(selectedTask.id) ? new Date(String(startedAtByTask.get(selectedTask.id))).toLocaleString('vi-VN') : 'Chưa ghi nhận'}</div>
              <div className="action-row">
                <button className="btn btn-ghost btn-small" onClick={() => updateTaskMutation.mutate({ taskId: selectedTask.id, patch: { status: 'in_progress', progress: Math.max(selectedTask.progress, 25) } })}>
                  Start
                </button>
                <button className="btn btn-ghost btn-small" onClick={() => updateTaskMutation.mutate({ taskId: selectedTask.id, patch: { status: 'done', progress: 100 } })}>
                  Done
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => {
                    const order = orderMap.get(selectedTask.order_id);
                    const module = inferProductWorkflowModule(selectedTask.product_id, order?.module);
                    const pageKey = getStagePageKey(module, selectedTask.stage_index);
                    if (pageKey) navigate(`/${pageKey}`);
                  }}
                >
                  Mở màn
                </button>
              </div>
            </div>
          ) : (
            <div className="muted-text">Chọn một task để xem chi tiết.</div>
          )}
          {updateTaskMutation.error ? <div className="muted-text tone-danger">{String(updateTaskMutation.error)}</div> : null}
        </Card>
      </div>
    </>
  );
}

export function DeliveryRealPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const deliveriesQuery = useQuery({ queryKey: ['deliveries'], queryFn: listDeliveries });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const deliverableProducts = (ordersQuery.data?.products || []).filter((product) => product.ready_for_delivery || product.finished || product.progress >= 100);

  const createDeliveryMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !selectedProductId) throw new Error('Thiếu profile hoặc product được chọn.');
      const product = (ordersQuery.data?.products || []).find((item) => item.id === selectedProductId);
      if (!product) throw new Error('Không tìm thấy product.');
      await updateProduct(product.id, {
        ready_for_delivery: true,
        finished: true,
        delivered_at: new Date().toISOString().slice(0, 10),
      });
      const deliveryId = await createDelivery({
        sentByProfileId: profile.id,
        note: deliveryNote,
        items: [
          {
            orderId: product.order_id,
            productId: product.id,
            productName: product.name,
          },
        ],
      });
      await updateOrder(product.order_id, { status: 'pending_acceptance' });
      return deliveryId;
    },
    onSuccess: async () => {
      setSelectedProductId('');
      setDeliveryNote('');
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });

  return (
    <>
      <SectionHeader eye="Delivery" title="Bàn giao sản phẩm" subtitle="PM tạo batch bàn giao thật. Sau khi gửi, order chuyển sang pending_acceptance." />
      <div className="content-grid two-column">
        <Card title="Tạo batch bàn giao">
          <div className="form-grid">
            <label>
              <span>Sản phẩm sẵn sàng</span>
              <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                <option value="">-- Chọn product --</option>
                {deliverableProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label className="full">
              <span>Ghi chú bàn giao</span>
              <textarea value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} placeholder="Nội dung bàn giao, link package, ghi chú nghiệm thu..." />
            </label>
            <div className="action-row">
              <button className="btn btn-danger" onClick={() => createDeliveryMutation.mutate()} disabled={!selectedProductId || createDeliveryMutation.isPending}>
                {createDeliveryMutation.isPending ? 'Đang tạo...' : 'Tạo batch bàn giao'}
              </button>
            </div>
            {createDeliveryMutation.error ? <div className="muted-text">{String(createDeliveryMutation.error)}</div> : null}
          </div>
        </Card>
        <Card title="Batch gần nhất">
          <div className="stack compact">
            {(deliveriesQuery.data || []).slice(0, 6).map((item) => (
              <div className="bullet-item" key={item.id}>{item.id} · {item.status} · {item.sent_at}</div>
            ))}
            {!deliveriesQuery.data?.length ? <div className="muted-text">Chưa có batch delivery nào.</div> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

export function PaymentRealPage({ clientMode = false }: { clientMode?: boolean }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const paymentRequestsQuery = useQuery({ queryKey: ['payment-requests'], queryFn: listPaymentRequests });
  const paymentReceiptsQuery = useQuery({ queryKey: ['payment-receipts'], queryFn: listPaymentReceipts });
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !selectedOrderId) throw new Error('Thiếu order hoặc profile hiện tại.');
      return createPaymentRequest({
        orderId: selectedOrderId,
        title: `Thanh toán ${selectedOrderId}`,
        amount: Number(amount),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
        createdByProfileId: profile.id,
        note,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      setSelectedOrderId('');
      setAmount('0');
      setNote('');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ paymentRequestId, orderId, payAmount }: { paymentRequestId: string; orderId: string; payAmount: number }) => {
      if (!profile) throw new Error('Thiếu profile hiện tại.');
      return createPaymentReceipt({
        paymentRequestId,
        orderId,
        amount: payAmount,
        paidAt: new Date().toISOString().slice(0, 10),
        note: 'Client confirmed payment on portal.',
        confirmedByProfileId: profile.id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
    },
  });

  const visibleOrders = (ordersQuery.data?.orders || []).filter((order) => {
    if (profile?.companyId && order.company_id !== profile.companyId) return false;
    return clientMode ? true : ['pending_acceptance', 'ready_delivery', 'paid', 'in_production'].includes(order.status);
  });
  const visiblePaymentRequests = (paymentRequestsQuery.data || []).filter((item) => {
    const order = (ordersQuery.data?.orders || []).find((entry) => entry.id === item.order_id);
    if (!order) return !clientMode;
    if (profile?.companyId && order.company_id !== profile.companyId) return false;
    return true;
  });

  return (
    <>
      <SectionHeader
        eye="Payment"
        title={clientMode ? 'Thanh toán' : 'Đề nghị thanh toán'}
        subtitle={clientMode ? 'Client xác nhận đã thanh toán và sinh receipt thật.' : 'PM tạo payment request thật trên Supabase.'}
      />
      <div className="content-grid two-column">
        {!clientMode ? (
          <Card title="Tạo đề nghị thanh toán">
            <div className="form-grid">
              <label>
                <span>Order</span>
                <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
                  <option value="">-- Chọn order --</option>
                  {visibleOrders.map((order) => (
                    <option key={order.id} value={order.id}>{order.id} · {order.title}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Số tiền</span>
                <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </label>
              <label className="full">
                <span>Ghi chú</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nội dung thanh toán, đợt, điều kiện..." />
              </label>
              <div className="action-row">
                <button className="btn btn-danger" onClick={() => requestMutation.mutate()} disabled={!selectedOrderId || Number(amount) <= 0 || requestMutation.isPending}>
                  {requestMutation.isPending ? 'Đang tạo...' : 'Tạo đề nghị'}
                </button>
              </div>
              {requestMutation.error ? <div className="muted-text">{String(requestMutation.error)}</div> : null}
            </div>
          </Card>
        ) : null}
        <Card title={clientMode ? 'Yêu cầu thanh toán của tôi' : 'Danh sách payment request'}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Order</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Hạn</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visiblePaymentRequests.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.order_id}</td>
                  <td>{Number(item.amount).toLocaleString('vi-VN')} {item.currency}</td>
                  <td><Badge tone={toneForStatus(item.status)}>{clientMode ? getClientFacingOrderStatus({ status: item.status }) : item.status}</Badge></td>
                  <td>{item.due_date}</td>
                  <td>
                    {clientMode && item.status !== 'paid' ? (
                      <button className="btn btn-ghost btn-small" onClick={() => confirmPaymentMutation.mutate({ paymentRequestId: item.id, orderId: item.order_id, payAmount: Number(item.amount) })}>
                        Xác nhận đã thanh toán
                      </button>
                    ) : (
                      <span className="muted-text">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {confirmPaymentMutation.error ? <div className="muted-text">{String(confirmPaymentMutation.error)}</div> : null}
          <div className="stack compact">
            {(paymentReceiptsQuery.data || []).slice(0, 4).map((receipt) => (
              <div className="bullet-item" key={receipt.id}>{receipt.id} · {receipt.order_id} · {receipt.paid_at}</div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
