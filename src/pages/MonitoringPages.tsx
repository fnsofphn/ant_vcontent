import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Kpi, SectionHeader } from '@/components/ui/Primitives';
import { inferProductWorkflowModule, listOrdersWithProducts, listTasks } from '@/services/vcontent';

function toneForStatus(status: string): 'danger' | 'warning' | 'success' | 'neutral' | 'violet' {
  if (['overdue', 'qc_fail', 'fail', 'changes_requested', 'critical'].includes(status)) return 'danger';
  if (['submitted', 'review', 'in_review', 'ready_for_launch', 'packaging', 'warning'].includes(status)) return 'warning';
  if (['done', 'approved', 'ready_delivery', 'paid', 'success'].includes(status)) return 'success';
  if (['in_production', 'in_progress', 'recording', 'editing', 'info', 'todo'].includes(status)) return 'violet';
  return 'neutral';
}

function isLaunchedProduct(progress: number, tasks: Array<{ product_id: string; archived?: boolean }>, productId: string) {
  return progress > 0 || tasks.some((task) => task.product_id === productId && !task.archived);
}

function getWorkflowStageLabel(module: string, stageIndex: number, launched: boolean) {
  if (!launched) return 'Chưa launch';
  const prefix = module === 'VIDEO' ? 'VSMF' : module === 'GAME' ? 'GSMF' : 'SMF';
  const maxStage = module === 'VIDEO' ? 7 : module === 'GAME' ? 4 : 8;
  const normalized = Math.min(Math.max(stageIndex + 1, 1), maxStage);
  return `${prefix}-${String(normalized).padStart(2, '0')}`;
}

export function RealDashboardPage() {
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const orders = ordersQuery.data?.orders || [];
  const products = ordersQuery.data?.products || [];
  const tasks = tasksQuery.data || [];

  const productRows = useMemo(
    () =>
      products.map((product) => {
        const order = orders.find((entry) => entry.id === product.order_id) || null;
        const module = inferProductWorkflowModule(product.id, order?.module);
        const launched = isLaunchedProduct(product.progress, tasks, product.id);
        const taskCount = tasks.filter((task) => task.product_id === product.id && !task.archived).length;
        return {
          product,
          order,
          module,
          launched,
          taskCount,
          stageLabel: getWorkflowStageLabel(module, product.current_stage_index, launched),
        };
      }),
    [orders, products, tasks],
  );

  const overdueTasks = tasks.filter((task) => task.status === 'overdue').length;
  const activeProducts = productRows.filter((row) => row.launched && !row.product.finished).length;
  const readyProducts = productRows.filter((row) => row.product.ready_for_delivery || row.product.finished).length;
  const launchQueue = productRows.filter((row) => ['ready_for_launch', 'in_production'].includes(row.order?.status || '') && !row.launched).length;

  return (
    <>
      <SectionHeader eye="Tổng quan · F01" title="Tổng quan điều hành" subtitle="Toàn cảnh sản xuất theo product_id trong từng order." />
      <div className="kpi-row">
        <Kpi label="Task quá hạn" value={String(overdueTasks)} sub="Cần xử lý ngay" tone="danger" />
        <Kpi label="Sản phẩm đang SX" value={String(activeProducts)} sub="Theo dõi theo product" tone="violet" />
        <Kpi label="Ready delivery" value={String(readyProducts)} sub="Đã đủ điều kiện bàn giao" tone="success" />
        <Kpi label="Chờ launch" value={String(launchQueue)} sub="Product chờ mở sản xuất" tone="warning" />
      </div>
      <div className="content-grid dashboard-grid">
        <Card title="Heatmap theo product">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Đơn hàng</th>
                <th>Module</th>
                <th>Stage</th>
                <th>Progress</th>
                <th>Task</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row) => (
                <tr key={row.product.id}>
                  <td><div className="fw6">{row.product.id}</div><div className="muted-text">{row.product.name}</div></td>
                  <td>{row.order?.id || '-'}</td>
                  <td>{row.module}</td>
                  <td><Badge tone={row.launched ? 'violet' : 'warning'}>{row.stageLabel}</Badge></td>
                  <td>{row.product.progress}%</td>
                  <td>{row.taskCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Tiến độ theo module">
          <div className="metric-list">
            {[
              { key: 'ELN', name: 'E-learning', tone: 'violet' },
              { key: 'VIDEO', name: 'Video', tone: 'danger' },
              { key: 'GAME', name: 'Gamification', tone: 'warning' },
            ].map((item) => {
              const total = productRows.filter((row) => row.module === item.key).length;
              const done = productRows.filter((row) => row.module === item.key && (row.product.ready_for_delivery || row.product.finished)).length;
              const width = total ? `${Math.round((done / total) * 100)}%` : '0%';
              return (
                <div className="progress-row" key={item.name}>
                  <div className="progress-label">{item.name}</div>
                  <div className="progress-track">
                    <div className={`progress-fill tone-${item.tone}`} style={{ width }} />
                  </div>
                  <div className="progress-value">{`${done}/${total}`}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

export function RealTrackingPage() {
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const orders = ordersQuery.data?.orders || [];
  const products = ordersQuery.data?.products || [];
  const tasks = tasksQuery.data || [];

  const trackingRows = useMemo(
    () =>
      products.map((product) => {
        const order = orders.find((entry) => entry.id === product.order_id) || null;
        const module = inferProductWorkflowModule(product.id, order?.module);
        const launched = isLaunchedProduct(product.progress, tasks, product.id);
        const activeTasks = tasks.filter((task) => task.product_id === product.id && !task.archived);
        const owner = activeTasks[0]?.assignee || '-';
        const health = product.ready_for_delivery || product.finished ? 'ready_delivery' : launched ? order?.status || 'in_production' : 'ready_for_launch';
        return {
          product,
          order,
          module,
          owner,
          health,
          launched,
          stageLabel: getWorkflowStageLabel(module, product.current_stage_index, launched),
        };
      }),
    [orders, products, tasks],
  );

  return (
    <>
      <SectionHeader eye="Production Tracking" title="Theo dõi sản xuất" subtitle="Theo dõi theo product_id, không gộp chung theo order." />
      <Card title="Product tracking list">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
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
            {trackingRows.map((row) => (
              <tr key={row.product.id}>
                <td><div className="fw6">{row.product.id}</div><div className="muted-text">{row.product.name}</div></td>
                <td>{row.order?.id || '-'}</td>
                <td>{row.order?.client || '-'}</td>
                <td>{row.module}</td>
                <td>{row.stageLabel}</td>
                <td>{row.owner}</td>
                <td>
                  <div className="progress-inline">
                    <div className="progress-track">
                      <div className="progress-fill tone-violet" style={{ width: `${row.product.progress}%` }} />
                    </div>
                    <span>{row.product.progress}%</span>
                  </div>
                </td>
                <td><Badge tone={toneForStatus(row.health)}>{row.health}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
