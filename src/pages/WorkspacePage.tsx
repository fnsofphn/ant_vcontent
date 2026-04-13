import { Suspense, lazy, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ALERTS,
  AUDIT_LOGS,
  HEATMAP_ROWS,
  KPIS,
  NOTIFICATIONS,
  ORDERS,
  QC_CRITERIA,
  STAGE_PAGES,
  TASKS,
  USERS,
  GAME_STAGE_MAP,
  VIDEO_STAGE_MAP,
  isWorkflowStage,
  type PageKey,
} from '@/data/vcontent';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import { APP_PAGE_LABELS } from '@/lib/navigationConfig';
import {
  createClientOrder,
  deleteOrder,
  inferProductWorkflowModule,
  listNotifications,
  listOrdersWithProducts,
  listProfiles,
  listTasks,
  listWorkflowRecords,
} from '@/services/vcontent';

const ClientNewOrderPage = lazy(() => import('@/pages/ClientNewOrderPage').then((module) => ({ default: module.ClientNewOrderPage })));
const GameInputGatePage = lazy(() => import('@/pages/GameInputGatePage').then((module) => ({ default: module.GameInputGatePage })));
const GamePrototypePage = lazy(() => import('@/pages/GamePrototypePage').then((module) => ({ default: module.GamePrototypePage })));
const GameQcPage = lazy(() => import('@/pages/GameQcPage').then((module) => ({ default: module.GameQcPage })));
const GuidePage = lazy(() => import('@/pages/GuidePage').then((module) => ({ default: module.GuidePage })));
const InputGatePage = lazy(() => import('@/pages/InputGatePages').then((module) => ({ default: module.InputGatePage })));
const LecturerQuestionBankPage = lazy(() => import('@/pages/LecturerQuestionBankPage').then((module) => ({ default: module.LecturerQuestionBankPage })));
const RealDashboardPage = lazy(() => import('@/pages/MonitoringPages').then((module) => ({ default: module.RealDashboardPage })));
const RealTrackingPage = lazy(() => import('@/pages/MonitoringPages').then((module) => ({ default: module.RealTrackingPage })));
const DeliveryRealPage = lazy(() => import('@/pages/OperationsPages').then((module) => ({ default: module.DeliveryRealPage })));
const PaymentRealPage = lazy(() => import('@/pages/OperationsPages').then((module) => ({ default: module.PaymentRealPage })));
const ProducerInboxRealPage = lazy(() => import('@/pages/OperationsPages').then((module) => ({ default: module.ProducerInboxRealPage })));
const ProducerLaunchRealPage = lazy(() => import('@/pages/OperationsPages').then((module) => ({ default: module.ProducerLaunchRealPage })));
const TasksRealPage = lazy(() => import('@/pages/OperationsPages').then((module) => ({ default: module.TasksRealPage })));
const PlanningSetupPage = lazy(() => import('@/pages/PlanningPage').then((module) => ({ default: module.PlanningSetupPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const DomainStagePage = lazy(() => import('@/pages/ProductionStagePages').then((module) => ({ default: module.DomainStagePage })));
const QualityGatePage = lazy(() => import('@/pages/ProductionStagePages').then((module) => ({ default: module.QualityGatePage })));
const ScormStagePage = lazy(() => import('@/pages/ProductionStagePages').then((module) => ({ default: module.ScormStagePage })));
const StoryboardStagePage = lazy(() => import('@/pages/StoryboardStagePages').then((module) => ({ default: module.StoryboardStagePage })));
const UsersAdminPage = lazy(() => import('@/pages/UsersAdminPage').then((module) => ({ default: module.UsersAdminPage })));

function withPageLoader(node: ReactNode) {
  return <Suspense fallback={<div className="app-loading">Đang tải màn hình...</div>}>{node}</Suspense>;
}

type RealOrderView = {
  id: string;
  client: string;
  companyId: string | null;
  title: string;
  module: string;
  deadline: string;
  status: string;
  productCount: number;
};

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['overdue', 'qc_fail', 'fail', 'changes_requested', 'critical'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'pending_launch', 'packaging', 'warning'].includes(status)) return 'warning';
  if (['done', 'approved', 'ready_delivery', 'paid', 'success'].includes(status)) return 'success';
  if (['in_production', 'in_progress', 'recording', 'editing', 'info'].includes(status)) return 'violet';
  return 'neutral';
}

function getClientOrderStatusLabel(order: { status: string; change_request_reason?: string | null; rejection_reason?: string | null }) {
  if (['submitted', 'pm_review'].includes(order.status)) return 'da_xac_nhan';
  if (order.status === 'changes_requested') return order.change_request_reason?.trim() ? `thieu: ${order.change_request_reason}` : 'can_bo_sung';
  if (['ready_for_launch', 'in_production'].includes(order.status)) return 'dang_san_xuat';
  if (['qc_fail', 'fail'].includes(order.status)) return order.rejection_reason?.trim() ? `tra_ve_qc: ${order.rejection_reason}` : 'tra_ve_qc';
  if (order.status === 'pending_acceptance') return 'cho_xac_nhan_nghiem_thu';
  if (order.status === 'ready_delivery') return 'san_sang_ban_giao';
  if (order.status === 'paid') return 'da_thanh_toan';
  if (order.rejection_reason?.trim()) return `can_xu_ly: ${order.rejection_reason}`;
  return order.status;
}

function getWorkflowStageLabel(module: string, currentStageIndex: number) {
  const stageMap =
    module === 'VIDEO'
      ? ['VSMF-01', 'VSMF-02', 'VSMF-03', 'VSMF-04', 'VSMF-05', 'VSMF-06', 'VSMF-07', 'Ready delivery']
      : module === 'GAME'
        ? ['GSMF-01', 'GSMF-02', 'GSMF-03', 'GSMF-04', 'Ready delivery']
        : ['SMF-01', 'SMF-02', 'SMF-03', 'SMF-04', 'SMF-05', 'SMF-06', 'SMF-07', 'SMF-08', 'Ready delivery'];

  return stageMap[Math.max(0, Math.min(stageMap.length - 1, currentStageIndex))] || '-';
}

function scrollToClientSection(sectionId: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isLaunchedProductRealtime(product: { id: string; progress: number }, tasks: Array<{ product_id: string; archived?: boolean }>) {
  return product.progress > 0 || tasks.some((task) => task.product_id === product.id && !task.archived);
}

function getStageCodeForTask(task: { product_id: string; stage_index: number }, orderModule?: string | null) {
  const module = inferProductWorkflowModule(task.product_id, orderModule || null);
  const prefix = module === 'VIDEO' ? 'VSMF' : module === 'GAME' ? 'GSMF' : 'SMF';
  return `${prefix}-${String(task.stage_index + 1).padStart(2, '0')}`;
}

function summarizeWorkflowModules(entries: string[]) {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry) return acc;
    acc[entry] = (acc[entry] || 0) + 1;
    return acc;
  }, {});

  return ['ELN', 'VIDEO', 'GAME']
    .filter((key) => counts[key])
    .map((key) => `${counts[key]} ${key}`)
    .join(' · ') || 'Chua co';
}

function EmptyPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <SectionHeader eye="VContent 3.0" title={title} subtitle={subtitle} />
      <Card title="Roadmap">
        <div className="stack compact">
          <div className="bullet-item">Màn này sẽ được nối vào use-case và Supabase schema thật ở phase tiếp theo.</div>
          <div className="bullet-item">Hiện tại shell, route, IA và ngôn ngữ giao diện đã bám theo VContent cũ.</div>
        </div>
      </Card>
    </>
  );
}

function DashboardPage() {
  return (
    <>
      <SectionHeader
        eye="Tổng quan · F01"
        title="Tổng quan điều hành"
        subtitle="Toàn cảnh SX · Realtime · 10/4/2026"
        actions={
          <>
            <button className="btn btn-ghost">Xuất dữ liệu</button>
            <Link className="btn btn-danger" to="/client-new-order">+ Đơn hàng mới</Link>
          </>
        }
      />
      <div className="kpi-row">
        {KPIS.map((item) => (
          <Kpi key={item.label} {...item} />
        ))}
      </div>
      <div className="content-grid dashboard-grid">
        <Card title="Bản đồ nhiệt luồng công việc theo Đơn hàng × Bước">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Đơn hàng</th>
                {['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'].map((stage) => (
                  <th key={stage}>{stage}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_ROWS.map((row) => (
                <tr key={row.order}>
                  <td>{row.order}</td>
                  {row.stages.map((stage, index) => (
                    <td key={`${row.order}-${index}`}>
                      <span className={`stage-dot state-${stage}`}>
                        {stage === 'done' ? '✓' : stage === 'active' ? '▶' : stage === 'fail' ? '✗' : stage === 'locked' ? '🔒' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="stack">
          <Card title="Cần xử lý ngay" action={<Badge tone="danger">6 gấp</Badge>}>
            <div className="stack">
              {ALERTS.map((item) => (
                <div className={`alert-card tone-${item.level === 'critical' ? 'danger' : 'warning'}`} key={item.title}>
                  <div>
                    <div className="alert-title">{item.title}</div>
                    <div className="alert-detail">{item.detail}</div>
                  </div>
                  <Link className="btn btn-ghost btn-small" to={`/${item.action}`}>Xem</Link>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Tiến độ theo Module">
            <div className="metric-list">
              {[
                { name: 'E-learning', value: '12/20', width: '60%', tone: 'violet' },
                { name: 'Video', value: '6/8', width: '75%', tone: 'danger' },
                { name: 'Gamification', value: '2/5', width: '40%', tone: 'warning' },
              ].map((item) => (
                <div className="progress-row" key={item.name}>
                  <div className="progress-label">{item.name}</div>
                  <div className="progress-track">
                    <div className={`progress-fill tone-${item.tone}`} style={{ width: item.width }} />
                  </div>
                  <div className="progress-value">{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function OrdersTablePage(props: { eye: string; title: string; subtitle: string; actionLabel?: string }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: listOrdersWithProducts,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Missing current profile.');
      return createClientOrder({
        title: `Đơn mới ${new Date().toLocaleDateString('vi-VN')}`,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
        client: profile.fullName,
        companyId: profile.companyId,
        createdByProfileId: profile.id,
        bundleCounts: {
          eln: 1,
          video: 0,
          game: 0,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const realOrders: RealOrderView[] =
    ordersQuery.data?.orders.map((order) => ({
      id: order.id,
      client: order.client,
      companyId: order.company_id,
      title: order.title,
      module: order.module,
      deadline: order.deadline,
      status: order.status,
      productCount: ordersQuery.data?.products.filter((product) => product.order_id === order.id).length || 0,
    })) || [];

  const isClientRole = profile?.role === 'client' || profile?.role === 'client_director';
  const scopedOrders = isClientRole && profile?.companyId
    ? realOrders.filter((order) => order.companyId === profile.companyId)
    : realOrders;

  return (
    <>
      <SectionHeader
        eye={props.eye}
        title={props.title}
        subtitle={props.subtitle}
        actions={
          props.actionLabel ? (
            <Link className="btn btn-danger" to="/client-new-order">
              {createOrderMutation.isPending ? 'Đang tạo...' : props.actionLabel}
            </Link>
          ) : null
        }
      />
      <Card title="Danh sách đơn hàng">
        <table className="data-table">
          <thead>
            <tr>
              <th>Đơn hàng</th>
              <th>Module</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Sản phẩm</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(scopedOrders.length ? scopedOrders : ORDERS.map((order) => ({ ...order, productCount: order.products, companyId: null }))).map((order) => (
              <tr key={order.id}>
                <td><div className="fw6">{order.id}</div><div className="muted-text">{order.title}</div></td>
                <td>{order.module}</td>
                <td><Badge tone={toneForStatus(order.status)}>{profile?.role === 'client' || profile?.role === 'client_director' ? getClientOrderStatusLabel(order) : order.status}</Badge></td>
                <td>{order.deadline}</td>
                <td>{order.productCount}</td>
                <td>
                  <div className="action-row">
                    <Link className="btn btn-ghost btn-small" to={`/client-order-detail?orderId=${encodeURIComponent(order.id)}`}>Chi tiết</Link>
                    <Link className="btn btn-ghost btn-small" to={`/client-products?orderId=${encodeURIComponent(order.id)}`}>Input</Link>
                    {profile?.companyId && order.companyId === profile.companyId ? (
                      <button className="btn btn-ghost btn-small" onClick={() => deleteOrderMutation.mutate(order.id)}>
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ClientOrderDetailPage() {
  const { profile } = useAuth();
  const location = useLocation();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', 'client-detail'],
    queryFn: () => listWorkflowRecords({ kinds: ['storyboard', 'slide_design', 'voice_over', 'video_edit', 'scorm_package'], includeReviews: false, includeQuestionLibrary: false }),
  });

  const scopedOrders = useMemo(() => {
    const orders = ordersQuery.data?.orders || [];
    if (!profile?.companyId) return orders;
    return orders.filter((order) => order.company_id === profile.companyId);
  }, [ordersQuery.data, profile?.companyId]);

  const selectedOrderId = useMemo(() => new URLSearchParams(location.search).get('orderId') || scopedOrders[0]?.id || '', [location.search, scopedOrders]);
  const selectedOrder = scopedOrders.find((order) => order.id === selectedOrderId) || null;
  const orderProducts = (ordersQuery.data?.products || []).filter((product) => product.order_id === selectedOrder?.id);
  const orderTasks = (tasksQuery.data || []).filter((task) => task.order_id === selectedOrder?.id);

  const statusCards = selectedOrder
    ? [
        { id: 'client-order-products', label: 'Sản phẩm', value: String(orderProducts.length), sub: 'Danh sách sản phẩm', tone: 'neutral' as const },
        { id: 'client-order-progress', label: 'Đang SX', value: String(orderProducts.filter((product) => product.progress > 0 && !product.finished).length), sub: 'Sản phẩm đang chạy', tone: 'violet' as const },
        { id: 'client-order-delivery', label: 'Sẵn sàng BG', value: String(orderProducts.filter((product) => product.ready_for_delivery || product.finished).length), sub: 'Chờ nghiệm thu', tone: 'success' as const },
        { id: 'client-order-alerts', label: 'Trả về/lỗi', value: String(orderTasks.filter((task) => ['fail', 'qc_fail', 'changes_requested'].includes(task.status)).length), sub: 'Cần xử lý', tone: 'danger' as const },
      ]
    : [];

  return (
    <>
      <SectionHeader
        eye="Client Portal"
        title="Chi tiết đơn hàng"
        subtitle="Theo dõi xác nhận đơn, tiến độ sản xuất, các mốc bàn giao và các trạng thái bị trả về."
        actions={<Link className="btn btn-ghost" to="/client-orders">Quay lại danh sách</Link>}
      />

      <Card title="Chọn đơn">
        <div className="stack compact">
          {scopedOrders.map((order) => (
            <Link key={order.id} className={`list-item workflow-nav-card${order.id === selectedOrderId ? ' active' : ''}`} to={`/client-order-detail?orderId=${encodeURIComponent(order.id)}`}>
              <div className="workflow-nav-main">
                <div className="workflow-nav-code">{order.id}</div>
                <div className="workflow-nav-meta">{order.title}</div>
                <div className="workflow-nav-meta">{order.deadline} · {order.client}</div>
              </div>
              <Badge tone={toneForStatus(order.status)}>{getClientOrderStatusLabel(order)}</Badge>
            </Link>
          ))}
        </div>
      </Card>

      {selectedOrder ? (
        <>
          <div className="kpi-row small">
            {statusCards.map((item) => (
              <button key={item.id} className="kpi-button-reset" onClick={() => scrollToClientSection(item.id)}>
                <Kpi label={item.label} value={item.value} sub={item.sub} tone={item.tone} />
              </button>
            ))}
          </div>

          <div className="content-grid two-column">
            <Card title="Tổng quan đơn">
              <div className="stack compact">
                <div className="bullet-item">Đơn hàng: {selectedOrder.id}</div>
                <div className="bullet-item">Chương trình: {selectedOrder.title}</div>
                <div className="bullet-item">Deadline: {selectedOrder.deadline}</div>
                <div className="bullet-item">Trạng thái client: {getClientOrderStatusLabel(selectedOrder)}</div>
                <div className="bullet-item">Intake note: {selectedOrder.intake_note || 'Chưa có ghi chú.'}</div>
                {selectedOrder.change_request_reason ? <div className="bullet-item tone-danger">Thiếu / cần bổ sung: {selectedOrder.change_request_reason}</div> : null}
                {selectedOrder.rejection_reason ? <div className="bullet-item tone-danger">Lý do trả về: {selectedOrder.rejection_reason}</div> : null}
              </div>
            </Card>
            <Card title="Tiến độ từng sản phẩm">
              <table className="data-table" id="client-order-products">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Module</th>
                    <th>Bước hiện tại</th>
                    <th>Tiến độ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.map((product) => {
                    const module = inferProductWorkflowModule(product.id, selectedOrder.module);
                    const health = product.ready_for_delivery || product.finished ? 'ready_delivery' : selectedOrder.status;
                    return (
                      <tr key={product.id}>
                        <td><div className="fw6">{product.id}</div><div className="muted-text">{product.name}</div></td>
                        <td>{module}</td>
                        <td>{getWorkflowStageLabel(module, product.current_stage_index)}</td>
                        <td>{product.progress}%</td>
                        <td><Badge tone={toneForStatus(health)}>{health}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="content-grid two-column">
            <Card title="Task đang mở">
              <div id="client-order-progress" className="stack compact">
                {orderTasks.map((task) => (
                  <div className="list-item" key={task.id}>
                    <div>
                      <div className="list-title">{task.product_id}</div>
                      <div className="muted-text">Stage {task.stage_index + 1} · {task.due_date || '-'}</div>
                    </div>
                    <Badge tone={toneForStatus(task.status)}>{task.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Asset / bàn giao">
              <div id="client-order-delivery" className="stack compact">
                <div className="bullet-item">Storyboard: {(workflowQuery.data?.storyboards || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length}</div>
                <div className="bullet-item">Slide/voice/video: {(workflowQuery.data?.slideDesigns || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length + (workflowQuery.data?.voiceOvers || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length + (workflowQuery.data?.videoEdits || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length}</div>
                <div className="bullet-item">Package sẵn sàng: {(workflowQuery.data?.scormPackages || []).filter((item) => item.order_id === selectedOrder.id && item.package_file_name).length}</div>
                <div id="client-order-alerts" className="bullet-item">Task lỗi / trả về: {orderTasks.filter((task) => ['fail', 'qc_fail', 'changes_requested'].includes(task.status)).length}</div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card title="Chi tiết đơn hàng">
          <div className="muted-text">Chưa có đơn hàng nào trong phạm vi hiện tại.</div>
        </Card>
      )}
    </>
  );
}

function ClientProductsPage() {
  const { profile } = useAuth();
  const location = useLocation();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const workflowQuery = useQuery({
    queryKey: ['workflow-records', 'client-products'],
    queryFn: () => listWorkflowRecords({ kinds: ['storyboard', 'slide_design', 'voice_over', 'video_edit'], includeReviews: false, includeQuestionLibrary: false }),
  });

  const scopedOrders = useMemo(() => {
    const orders = ordersQuery.data?.orders || [];
    if (!profile?.companyId) return orders;
    return orders.filter((order) => order.company_id === profile.companyId);
  }, [ordersQuery.data, profile?.companyId]);

  const selectedOrderId = useMemo(() => new URLSearchParams(location.search).get('orderId') || scopedOrders[0]?.id || '', [location.search, scopedOrders]);
  const selectedOrder = scopedOrders.find((order) => order.id === selectedOrderId) || null;
  const orderProducts = (ordersQuery.data?.products || []).filter((product) => product.order_id === selectedOrder?.id);

  const statusCards = selectedOrder
    ? [
        { id: 'client-products-list', label: 'Danh sách SP', value: String(orderProducts.length), sub: 'Mở chi tiết phía dưới', tone: 'neutral' as const },
        { id: 'client-products-storyboard', label: 'Storyboard', value: String((workflowQuery.data?.storyboards || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length), sub: 'File đã hiển thị', tone: 'violet' as const },
        { id: 'client-products-video', label: 'Link video', value: String((workflowQuery.data?.videoEdits || []).filter((item) => item.order_id === selectedOrder.id && item.file_name).length), sub: 'Dán link thay vì upload', tone: 'warning' as const },
      ]
    : [];

  return (
    <>
      <SectionHeader
        eye="Client Portal"
        title="Nhập yêu cầu từng sản phẩm"
        subtitle="Theo dõi file storyboard, slide/script tham chiếu và link video từng sản phẩm trong đơn."
        actions={<Link className="btn btn-ghost" to="/client-orders">Quay lại danh sách</Link>}
      />

      <Card title="Chọn đơn">
        <div className="stack compact">
          {scopedOrders.map((order) => (
            <Link key={order.id} className={`list-item workflow-nav-card${order.id === selectedOrderId ? ' active' : ''}`} to={`/client-products?orderId=${encodeURIComponent(order.id)}`}>
              <div className="workflow-nav-main">
                <div className="workflow-nav-code">{order.id}</div>
                <div className="workflow-nav-meta">{order.title}</div>
                <div className="workflow-nav-meta">{order.deadline} · {order.client}</div>
              </div>
              <Badge tone={toneForStatus(order.status)}>{getClientOrderStatusLabel(order)}</Badge>
            </Link>
          ))}
        </div>
      </Card>

      {selectedOrder ? (
        <>
          <div className="kpi-row small">
            {statusCards.map((item) => (
              <button key={item.id} className="kpi-button-reset" onClick={() => scrollToClientSection(item.id)}>
                <Kpi label={item.label} value={item.value} sub={item.sub} tone={item.tone} />
              </button>
            ))}
          </div>
          <Card title="Danh sách từng sản phẩm">
            <div id="client-products-list" className="stack">
              {orderProducts.map((product) => {
                const storyboard = (workflowQuery.data?.storyboards || []).find((entry) => entry.product_id === product.id);
                const video = (workflowQuery.data?.videoEdits || []).find((entry) => entry.product_id === product.id);
                return (
                  <div className="list-item" key={product.id}>
                    <div>
                      <div className="list-title">{product.id} · {product.name}</div>
                      <div className="muted-text">{inferProductWorkflowModule(product.id, selectedOrder.module)} · {product.progress}%</div>
                    </div>
                    <div className="action-row">
                      {storyboard?.file_name ? <a id="client-products-storyboard" className="btn btn-ghost btn-small" href={storyboard.file_name} target="_blank" rel="noreferrer">Xem storyboard</a> : null}
                      {video?.file_name ? <a id="client-products-video" className="btn btn-ghost btn-small" href={video.file_name} target="_blank" rel="noreferrer">Mở link video</a> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <Card title="Nhập yêu cầu từng sản phẩm">
          <div className="muted-text">Chưa có đơn hàng nào trong phạm vi hiện tại.</div>
        </Card>
      )}
    </>
  );
}

function ProducerInboxPage() {
  return (
    <>
      <SectionHeader eye="PM Inbox" title="Hộp thư đơn hàng" subtitle="Nơi PM nhận đơn, xem hồ sơ intake và quyết định launch hoặc yêu cầu bổ sung." actions={<Link className="btn btn-danger" to="/producer-launch">Mở Launch</Link>} />
      <div className="content-grid two-column">
        <Card title="Đơn đang chờ PM nhận">
          <div className="stack">
            {ORDERS.filter((item) => item.status === 'pending_launch' || item.status === 'in_production').map((order) => (
              <div className="list-item" key={order.id}>
                <div>
                  <div className="list-title">{order.id} · {order.title}</div>
                  <div className="muted-text">{order.client} · {order.module} · deadline {order.deadline}</div>
                </div>
                <div className="action-row">
                  <button className="btn btn-ghost btn-small">Yêu cầu bổ sung</button>
                  <button className="btn btn-danger btn-small">Nhận đơn</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Checklist intake đang nóng">
          <div className="stack compact">
            {['Brand guideline bản cuối chưa upload', 'Client director note chưa phản hồi', 'SLA B5 cần override do volume voice tăng'].map((item) => (
              <div className="bullet-item" key={item}>{item}</div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function TrackingPage() {
  return (
    <>
      <SectionHeader eye="Production Tracking" title="Theo dõi sản xuất" subtitle="Theo dõi list, progress, bottleneck và trạng thái cross-module theo từng đơn." />
      <Card title="Danh sách theo dõi đơn hàng">
        <table className="data-table">
          <thead>
            <tr>
              <th>Đơn hàng</th>
              <th>Client</th>
              <th>Module</th>
              <th>Current stage</th>
              <th>Owner</th>
              <th>Progress</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.client}</td>
                <td>{order.module}</td>
                <td>{order.stage}</td>
                <td>{order.owner}</td>
                <td>
                  <div className="progress-inline">
                    <div className="progress-track">
                      <div className="progress-fill tone-violet" style={{ width: `${order.progress}%` }} />
                    </div>
                    <span>{order.progress}%</span>
                  </div>
                </td>
                <td><Badge tone={toneForStatus(order.status)}>{order.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function WorkflowOverviewPage() {
  return (
    <>
      <SectionHeader
        eye="Use Case ưu tiên · PM / Production"
        title="Luồng sản xuất"
        subtitle="Điều phối sản xuất từ nhận đơn đến bàn giao, tập trung vào theo dõi điểm nghẽn và hành động trong ngày."
        actions={
          <>
            <Link className="btn btn-ghost" to="/tracking">Theo dõi sản xuất</Link>
            <Link className="btn btn-primary" to="/order-pm-dashboard">Dashboard PM</Link>
          </>
        }
      />
      <div className="kpi-row">
        <Kpi label="Cần xử lý ngay" value="4" sub="2 overdue · 1 QC fail · 1 đơn chờ launch" tone="danger" />
        <Kpi label="Đơn đang SX" value="3" sub="1 ELN · 1 Video · 1 Game" tone="violet" />
        <Kpi label="SP sẵn sàng bàn giao" value="3" sub="Có thể gom gói bàn giao" tone="success" />
        <Kpi label="Điểm nghẽn chính" value="B5" sub="Voice overdue kéo chậm critical path" tone="warning" />
      </div>
      <Card title="Luồng vận hành ưu tiên">
        <div className="workflow-grid">
          {[
            { label: '1. Nhận đơn', page: 'producer-inbox', desc: 'Check intake, owner, SLA.' },
            { label: '2. Launch', page: 'producer-launch', desc: 'Khóa assignment và mở task.' },
            { label: '3. Theo dõi task', page: 'my-tasks', desc: 'Bám overdue và QC fail.' },
            { label: '4. Bàn giao', page: 'producer-deliver', desc: 'Gom sản phẩm ready delivery.' },
          ].map((step) => (
            <Link className="workflow-step" key={step.label} to={`/${step.page}`}>
              <div className="workflow-step-label">{step.label}</div>
              <div className="muted-text">{step.desc}</div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function WorkflowOverviewRealPage() {
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const orders = ordersQuery.data?.orders || [];
  const products = ordersQuery.data?.products || [];
  const tasks = tasksQuery.data || [];

  const orderMap = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);
  const waitingInboxOrders = useMemo(() => orders.filter((order) => ['submitted', 'pm_review', 'changes_requested'].includes(order.status)), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => ['ready_for_launch', 'in_production'].includes(order.status)), [orders]);
  const readyProducts = useMemo(() => products.filter((product) => product.ready_for_delivery || product.finished), [products]);
  const launchQueueProducts = useMemo(
    () =>
      products.filter((product) => {
        const order = orderMap.get(product.order_id);
        return ['ready_for_launch', 'in_production'].includes(order?.status || '') && !isLaunchedProductRealtime(product, tasks);
      }),
    [orderMap, products, tasks],
  );
  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((task) => !task.archived && task.due_date && task.due_date < today && !['done', 'approved'].includes(task.status));
  }, [tasks]);
  const qcFailTasks = useMemo(() => tasks.filter((task) => !task.archived && ['qc_fail', 'fail', 'changes_requested'].includes(task.status)), [tasks]);
  const urgentCount = overdueTasks.length + qcFailTasks.length + waitingInboxOrders.length;
  const activeOrderModuleSummary = summarizeWorkflowModules(activeOrders.map((order) => String(order.module || '')));
  const readyProductModuleSummary = summarizeWorkflowModules(
    readyProducts.map((product) => {
      const order = orderMap.get(product.order_id);
      return inferProductWorkflowModule(product.id, order?.module);
    }),
  );
  const bottleneckTask = useMemo(() => {
    const ranked = [...qcFailTasks, ...overdueTasks];
    return ranked.sort((a, b) => String(a.due_date || '9999-12-31').localeCompare(String(b.due_date || '9999-12-31')))[0] || null;
  }, [overdueTasks, qcFailTasks]);
  const bottleneckValue = bottleneckTask ? getStageCodeForTask(bottleneckTask, orderMap.get(bottleneckTask.order_id)?.module) : '-';
  const bottleneckSub = bottleneckTask ? `${bottleneckTask.product_id} · ${bottleneckTask.status}` : 'Chưa có điểm nghẽn cần xử lý';
  const workflowSteps = [
    { label: '1. Nhận đơn', page: 'producer-inbox', desc: `${waitingInboxOrders.length} đơn chờ PM nhận`, accent: 'danger' },
    { label: '2. Launch', page: 'producer-launch', desc: `${launchQueueProducts.length} product chờ launch`, accent: 'violet' },
    { label: '3. Theo dõi task', page: 'my-tasks', desc: `${overdueTasks.length} quá hạn · ${qcFailTasks.length} QC fail`, accent: 'warning' },
    { label: '4. Bàn giao', page: 'producer-deliver', desc: `${readyProducts.length} product sẵn sàng bàn giao`, accent: 'success' },
  ] as const;
  const managementHighlights = [
    {
      title: 'Việc cần chốt ngay',
      metric: `${urgentCount}`,
      detail: `${waitingInboxOrders.length} đơn chưa nhận, ${overdueTasks.length} task quá hạn, ${qcFailTasks.length} task QC fail`,
      page: '/my-tasks',
      accent: 'danger',
    },
    {
      title: 'Áp lực launch',
      metric: `${launchQueueProducts.length}`,
      detail: launchQueueProducts.length
        ? 'Khóa assignment, SLA và mở sản xuất cho nhóm product đang chờ đầu vào.'
        : 'Queue launch đang thoáng, có thể dồn lực sang xử lý các công đoạn chậm.',
      page: '/producer-launch',
      accent: 'warning',
    },
    {
      title: 'Năng lực bàn giao',
      metric: `${readyProducts.length}`,
      detail: readyProducts.length
        ? `${readyProductModuleSummary}. Có thể chốt lịch giao và nghiệm thu với khách hàng.`
        : 'Chưa có product sẵn sàng bàn giao, cần bảo vệ tiến độ ở các stage cuối.',
      page: '/producer-deliver',
      accent: 'success',
    },
  ] as const;

  return (
    <>
      <div className="action-row top-gap-12">
        <Link className="btn btn-ghost" to="/tracking">Theo dõi sản xuất</Link>
        <Link className="btn btn-primary" to="/order-pm-dashboard">Dashboard PM</Link>
      </div>
      <div className="kpi-row">
        <Link className="kpi-button-reset" to="/my-tasks">
          <Kpi label="Cần xử lý ngay" value={String(urgentCount)} sub={`${overdueTasks.length} quá hạn · ${qcFailTasks.length} QC fail · ${waitingInboxOrders.length} đơn chờ nhận`} tone="danger" />
        </Link>
        <Link className="kpi-button-reset" to="/tracking">
          <Kpi label="Đơn đang sản xuất" value={String(activeOrders.length)} sub={activeOrderModuleSummary} tone="violet" />
        </Link>
        <Link className="kpi-button-reset" to="/producer-deliver">
          <Kpi label="SP sẵn sàng bàn giao" value={String(readyProducts.length)} sub={readyProductModuleSummary} tone="success" />
        </Link>
        <Link className="kpi-button-reset" to="/my-tasks">
          <Kpi label="Điểm nghẽn chính" value={bottleneckValue} sub={bottleneckSub} tone="warning" />
        </Link>
      </div>
      <Card title="Luồng vận hành ưu tiên">
        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <Link className={`workflow-step tone-${step.accent}`} key={step.label} to={`/${step.page}`}>
              <div className="workflow-step-label">{step.label}</div>
              <div className="muted-text">{step.desc}</div>
            </Link>
          ))}
        </div>
        <div className="workflow-orbit-matrix">
          {managementHighlights.map((item) => (
            <Link className={`workflow-orbit-card tone-${item.accent}`} key={item.title} to={item.page}>
              <span className="workflow-orbit-glow" aria-hidden="true" />
              <span className="workflow-orbit-ring" aria-hidden="true" />
              <span className="workflow-orbit-core">
                <span className="workflow-orbit-metric">{item.metric}</span>
                <span className="workflow-orbit-title">{item.title}</span>
                <span className="workflow-orbit-detail">{item.detail}</span>
                <span className="workflow-orbit-cta">Mở chi tiết</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
function PmDashboardPage() {
  const order = ORDERS[0];
  return (
    <>
      <SectionHeader eye="PM Dashboard" title={`${order.id} - ${order.title}`} subtitle="CRUD team assignment, deadline, SLA và intake note trước khi launch." actions={<Link className="btn btn-ghost" to="/producer-inbox">← Inbox</Link>} />
      <div className="content-grid two-column">
        <Card title="Thiết lập đơn hàng">
          <div className="form-grid">
            <label><span>Tiêu đề</span><input defaultValue={order.title} /></label>
            <label><span>Deadline</span><input defaultValue={order.deadline} /></label>
            <label className="full"><span>Intake note</span><textarea defaultValue="Khóa scope học phần 3 trước 12/4. Client yêu cầu giọng nam miền Bắc." /></label>
            <label className="full"><span>Request change reason</span><textarea defaultValue="Typography và glossary cần xác nhận lại." /></label>
          </div>
        </Card>
        <Card title="Team assignment">
          <div className="form-grid">
            {['PM', 'Specialist', 'QC', 'Client', 'Client Director'].map((field) => (
              <label key={field}>
                <span>{field}</span>
                <select defaultValue={field === 'PM' ? 'Văn Đức' : ''}>
                  <option value="">-- Chọn --</option>
                  <option>Văn Đức</option>
                  <option>Phương Anh</option>
                  <option>Minh Tú</option>
                  <option>Hà Nhi</option>
                  <option>Nguyễn Lan</option>
                </select>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function NotificationsPage() {
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  const items = notificationsQuery.data?.length
    ? notificationsQuery.data.map((item: any) => ({
        level: item.level || 'info',
        title: item.title,
        body: item.body,
        when: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '-',
        page: (item.link_page || 'notifications') as PageKey,
      }))
    : NOTIFICATIONS;

  return (
    <>
      <SectionHeader eye="Thông báo" title="Thông báo hệ thống" subtitle="Cảnh báo trong ứng dụng theo vai trò hiện tại." actions={<button className="btn btn-ghost">Đánh dấu tất cả đã đọc</button>} />
      <div className="kpi-row small">
        <Kpi label="Tổng thông báo" value="12" sub="3 critical · 4 warning" tone="violet" />
        <Kpi label="Chưa đọc" value="4" sub="Cần phản hồi trong ngày" tone="danger" />
      </div>
      <Card title="Feed cảnh báo vận hành">
        <div className="stack">
          {items.map((item) => (
            <div className="notification-row" key={item.title}>
              <div>
                <div className="action-row">
                  <Badge tone={toneForStatus(item.level)}>{item.level}</Badge>
                  <strong>{item.title}</strong>
                </div>
                <div className="muted-text">{item.body}</div>
              </div>
              <div className="stack compact right">
                <span className="muted-text">{item.when}</span>
                <Link className="btn btn-ghost btn-small" to={`/${item.page}`}>Mở màn liên quan</Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function MyTasksPage() {
  return (
    <>
      <SectionHeader eye="Workspace cá nhân" title="Công việc của tôi" subtitle="Danh sách task ưu tiên theo deadline, QC fail và queue hiện tại." />
      <Card title="Task queue">
        <div className="stack">
          {TASKS.map((task) => (
            <div className="task-row" key={task.id}>
              <div className="task-row-content">
                <div className="list-title">{task.title}</div>
                <div className="muted-text">{task.id} · {task.stage} · owner {task.owner}</div>
                <div className="muted-text">{task.due}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function StagePage({ pageId }: { pageId: PageKey }) {
  const stageKey = pageId.startsWith('vsmf')
    ? VIDEO_STAGE_MAP[pageId]
    : pageId.startsWith('gsmf')
      ? GAME_STAGE_MAP[pageId]
      : pageId;
  const stage = STAGE_PAGES[stageKey];

  if (!stage) {
    return <EmptyPage title={APP_PAGE_LABELS[pageId]} subtitle="Màn này đang được tách lại theo workflow contract mới." />;
  }

  return (
    <>
      <SectionHeader eye={stage.eye} title={stage.title} subtitle={stage.subtitle} />
      <div className="kpi-row small">
        {stage.columns.map((column) => (
          <Kpi key={column.title} label={column.title} value={String(column.count)} sub="Queue theo stage" tone={column.tone} />
        ))}
      </div>
      <Card title="Workspace stage">
        <div className="stack">
          {stage.queue.map((item) => (
            <div className="list-item" key={item.product}>
              <div>
                <div className="list-title">{item.product}</div>
                <div className="muted-text">{item.note}</div>
              </div>
              <div className="stack compact right">
                <span className="muted-text">{item.owner}</span>
                <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function SimpleTablePage({
  eye,
  title,
  subtitle,
  headers,
  rows,
}: {
  eye: string;
  title: string;
  subtitle: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <>
      <SectionHeader eye={eye} title={title} subtitle={subtitle} />
      <Card title={title}>
        <table className="data-table">
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function UsersPage() {
  const usersQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  });

  const rows = usersQuery.data?.length
    ? usersQuery.data.map((item: any) => [
        item.full_name,
        item.email,
        item.role,
        item.company_id || item.organization_id || '-',
        item.active ? <Badge tone="success">✅</Badge> : <Badge tone="danger">❌</Badge>,
      ])
    : USERS.map((item) => [
        item.name,
        item.email,
        item.role,
        item.org,
        item.active ? <Badge tone="success">✅</Badge> : <Badge tone="danger">❌</Badge>,
      ]);

  return (
    <SimpleTablePage
      eye="Hệ thống"
      title="Người dùng & Phân quyền"
      subtitle="CRUD organization, company, user, role, active status và access scope."
      headers={['Tên', 'Email', 'Role', 'Đơn vị', 'Active']}
      rows={rows}
    />
  );
}

export function WorkspacePage() {
  const params = useParams();
  const pageId = (params.pageId || 'dashboard') as PageKey;

  if (pageId === 'profile') return withPageLoader(<ProfilePage />);
  if (pageId === 'guide') return withPageLoader(<GuidePage />);
  if (pageId === 'dashboard') return withPageLoader(<RealDashboardPage />);
  if (pageId === 'tracking') return withPageLoader(<RealTrackingPage />);
  if (pageId === 'producer-inbox') return withPageLoader(<ProducerInboxRealPage />);
  if (pageId === 'order-pm-dashboard') return <PmDashboardPage />;
  if (pageId === 'production-workflow') return <WorkflowOverviewRealPage />;
  if (pageId === 'notifications') return <NotificationsPage />;
  if (pageId === 'my-tasks') return withPageLoader(<TasksRealPage />);
  if (pageId === 'smf01' || pageId === 'vsmf01') return withPageLoader(<InputGatePage pageId={pageId} />);
  if (pageId === 'gsmf01') return withPageLoader(<GameInputGatePage />);
  if (pageId === 'gsmf02') return withPageLoader(<GamePrototypePage />);
  if (pageId === 'gsmf03') return withPageLoader(<GameQcPage />);
  if (pageId === 'smf02' || pageId === 'vsmf02') return withPageLoader(<StoryboardStagePage pageId={pageId} />);
  if (/^(smf03|vsmf03|smf05|vsmf05|smf06|vsmf06)$/.test(pageId)) return withPageLoader(<DomainStagePage pageId={pageId} />);
  if (/^(smf04|vsmf04|smf07|vsmf07)$/.test(pageId)) return withPageLoader(<QualityGatePage pageId={pageId} />);
  if (pageId === 'smf08') return withPageLoader(<ScormStagePage />);
  if (pageId === 'client-new-order') return withPageLoader(<ClientNewOrderPage />);
  if (pageId === 'producer-launch') return withPageLoader(<ProducerLaunchRealPage />);
  if (pageId === 'producer-deliver') return withPageLoader(<DeliveryRealPage />);
  if (pageId === 'client-delivery') return withPageLoader(<DeliveryRealPage />);
  if (pageId === 'producer-invoice') return withPageLoader(<PaymentRealPage />);
  if (pageId === 'client-payment') return withPageLoader(<PaymentRealPage clientMode />);
  if (false) {
    return (
      <OrdersTablePage
        eye="Quản lý đơn hàng"
        title="Danh sách đơn hàng"
        subtitle="Theo dõi toàn bộ đơn hàng, xem chi tiết từng đơn và chuyển sang màn khởi tạo đơn hàng nội bộ."
        actionLabel="+ Khởi tạo đơn"
      />
    );
  }
  if (pageId === 'client-orders') {
    return <OrdersTablePage eye="Client Portal" title="Đơn hàng của tôi" subtitle="Theo dõi order, tạo đơn mới và quay lại cập nhật khi PM yêu cầu bổ sung." actionLabel="+ Đơn mới" />;
  }
  if (pageId === 'client-order-detail') {
    return <ClientOrderDetailPage />;
  }
  if (pageId === 'client-products') {
    return <ClientProductsPage />;
  }
  if (false) {
    return <OrdersTablePage eye="Producer Launch" title="Chuyển vào sản xuất" subtitle="Khóa assignment, SLA và tạo task đầu tiên theo stage plan." actionLabel="Launch selected" />;
  }
  if (false) {
    return <OrdersTablePage eye="Delivery" title="Bàn giao sản phẩm" subtitle="Gom sản phẩm ready delivery, tạo batch và gửi client nghiệm thu." actionLabel="Tạo batch bàn giao" />;
  }
  if (false) {
    return <OrdersTablePage eye="Client Delivery" title="Nghiệm thu sản phẩm" subtitle="Client xem package, chấp nhận hoặc yêu cầu chỉnh sửa." />;
  }
  if (false) {
    return (
      <SimpleTablePage
        eye="Payment"
        title={APP_PAGE_LABELS[pageId]}
        subtitle="Quản lý đề nghị thanh toán, receipt và xác nhận đối soát theo từng đợt."
        headers={['Đợt', 'Order', 'Giá trị', 'Trạng thái', 'Ngày', 'Action']}
        rows={[
          ['PR-001', 'ORD-2606', '120.000.000đ', <Badge tone="warning">sent</Badge>, '12/4/2026', <button className="btn btn-ghost btn-small">Mở</button>],
          ['PR-002', 'ORD-2609', '48.000.000đ', <Badge tone="success">paid</Badge>, '10/4/2026', <button className="btn btn-ghost btn-small">Receipt</button>],
        ]}
      />
    );
  }
  if (false) {
    return (
      <>
        <SectionHeader eye="Client Portal" title="Tạo Đơn hàng mới" subtitle="Flow 3 bước: thông tin đơn hàng, yêu cầu kỹ thuật, xem lại và gửi duyệt." actions={<button className="btn btn-danger">Gửi duyệt</button>} />
        <div className="content-grid two-column">
          <Card title="Thông tin đơn hàng">
            <div className="form-grid">
              <label><span>Tên chương trình</span><input defaultValue="Chương trình đào tạo nội bộ quý 2" /></label>
              <label><span>Module</span><select defaultValue="ELN"><option>ELN</option><option>VIDEO</option></select></label>
              <label><span>Deadline</span><input defaultValue="2026-04-30" /></label>
              <label><span>Số sản phẩm</span><input defaultValue="3" /></label>
              <label className="full"><span>Mô tả mục tiêu</span><textarea defaultValue="Chuẩn hóa đào tạo sales onboarding và kỹ năng chăm sóc khách hàng." /></label>
            </div>
          </Card>
          <Card title="Yêu cầu kỹ thuật">
            <div className="stack compact">
              {['Brand guidelines', 'Logo files', 'Colour palette', 'Lesson script', 'Learning objectives', 'SCORM spec'].map((item) => (
                <div className="bullet-item" key={item}>{item}</div>
              ))}
            </div>
          </Card>
        </div>
      </>
    );
  }
  if (pageId === 'client-approvals') {
    return <OrdersTablePage eye="Client Director" title="Duyệt đơn khách hàng" subtitle="Kiểm tra đơn nội bộ phía khách hàng trước khi chuyển cho PM intake." />;
  }
  if (pageId === 'schedule-setup') {
    return <PlanningSetupPage />;
  }
  if (pageId === 'qc-criteria') {
    return (
      <SimpleTablePage
        eye="Hệ thống"
        title="Tiêu chí QC — Quản lý"
        subtitle="Quản lý rule cho B4 slides và B7 video."
        headers={['Nhóm', 'Tiêu chí', 'Mức độ', 'Bước áp dụng']}
        rows={QC_CRITERIA.map((item) => [item.group, item.name, <Badge tone={item.severity === 'Critical' ? 'danger' : 'warning'}>{item.severity}</Badge>, item.stage])}
      />
    );
  }
  if (pageId === 'lecturer-question-bank') {
    return withPageLoader(<LecturerQuestionBankPage />);
  }
  if (pageId === 'users') {
    return withPageLoader(<UsersAdminPage />);
  }
  if (false) {
    return <UsersPage />;
  }
  if (pageId === 'audit') {
    return (
      <SimpleTablePage
        eye="Hệ thống"
        title="Nhật ký kiểm tra"
        subtitle="Timeline hành động phát sinh từ workflow production."
        headers={['Thời gian', 'User', 'Hành động', 'Object', 'Chi tiết']}
        rows={AUDIT_LOGS.map((item) => [item.time, item.actor, <Badge tone={toneForStatus(item.action.toLowerCase())}>{item.action}</Badge>, item.object, item.detail])}
      />
    );
  }
  if (pageId === 'archived-products') {
    return <OrdersTablePage eye="Archive" title="Sản phẩm lưu trữ" subtitle="Danh sách sản phẩm đã archive sau khi hoàn tất bàn giao và khóa workflow." />;
  }
  if (false) return null;
  if (isWorkflowStage(pageId)) return <StagePage pageId={pageId} />;

    return <EmptyPage title={APP_PAGE_LABELS[pageId]} subtitle="Màn này sẽ được dựng tiếp theo capability backlog." />;
}
