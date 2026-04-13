import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, SectionHeader, Badge } from '@/components/ui/Primitives';
import { listOrdersWithProducts, listTasks } from '@/services/vcontent';
import { Link } from 'react-router-dom';

const WORKFLOW_BY_MODULE: Record<string, { code: string; label: string }[]> = {
  ELN: [
    { code: 'SMF-01', label: 'Yêu cầu đầu vào' },
    { code: 'SMF-02', label: 'Storyboard' },
    { code: 'SMF-03', label: 'Thiết kế Slide' },
    { code: 'SMF-04', label: 'QC Slide' },
    { code: 'SMF-05', label: 'Thu Voice' },
    { code: 'SMF-06', label: 'Biên tập Video' },
    { code: 'SMF-07', label: 'QC Video' },
    { code: 'SMF-08', label: 'SCORM + Quiz' },
  ],
  VIDEO: [
    { code: 'VSMF-01', label: 'Yêu cầu đầu vào' },
    { code: 'VSMF-02', label: 'Storyboard' },
    { code: 'VSMF-03', label: 'Thiết kế Slide' },
    { code: 'VSMF-04', label: 'QC Slide' },
    { code: 'VSMF-05', label: 'Thu Voice' },
    { code: 'VSMF-06', label: 'Biên tập Video' },
    { code: 'VSMF-07', label: 'QC Video' },
  ],
  GAME: [
    { code: 'GSMF-01', label: 'Khởi tạo Game' },
    { code: 'GSMF-02', label: 'Prototype' },
    { code: 'GSMF-03', label: 'QC Game' },
    { code: 'GSMF-04', label: 'Bản hoàn chỉnh' },
  ],
};

function toneForStatus(status: string): 'default' | 'success' | 'warning' | 'danger' | 'violet' {
  if (status === 'Hoàn thành') return 'success';
  if (status === 'Đang thực hiện') return 'violet';
  if (status === 'Chưa bắt đầu') return 'default';
  if (status === 'Quá hạn') return 'danger';
  if (status === 'Pending') return 'warning';
  return 'default';
}

function mapProductDetailStatus(product: any, tasks: any[]): string {
  if (product.finished || product.ready_for_delivery) return 'Hoàn thành';
  if (product.progress >= 100) return 'Hoàn thành';
  if (product.progress === 0) return 'Chưa bắt đầu';
  
  const activeTask = tasks.find(t => t.progress < 100 && t.status !== 'done');
  if (activeTask && activeTask.due_date && new Date(activeTask.due_date).getTime() < Date.now()) {
      return 'Quá hạn';
  }
  
  if (product.progress > 0) return 'Đang thực hiện';
  return 'Pending';
}

function mapTaskStatus(task: any): string {
  const s = task.status;
  if (['done', 'approved', 'success'].includes(s) || task.progress >= 100) return 'Hoàn thành';
  if (['todo', 'assigned'].includes(s) || task.progress === 0) return 'Chưa bắt đầu';
  if (['overdue', 'fail', 'qc_fail', 'changes_requested'].includes(s) || (task.due_date && new Date(task.due_date).getTime() < Date.now())) return 'Quá hạn';
  if (['review', 'submitted'].includes(s)) return 'Pending';
  return 'Đang thực hiện';
}

function formatDateToDDMMYY(dateString?: string | null) {
  if (!dateString) return '-';
  const parts = String(dateString).split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    const timeIndex = dd.indexOf('T');
    const cleanDd = timeIndex > -1 ? dd.slice(0, timeIndex) : dd;
    return `${cleanDd}/${mm}/${yyyy.slice(-2)}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function PlanningSetupPage() {
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: listOrdersWithProducts });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => listTasks() });

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const realProducts = useMemo(() => {
    if (!ordersQuery.data || !tasksQuery.data) return [];
    const ordersMap = new Map();
    ordersQuery.data.orders.forEach(o => ordersMap.set(o.id, o));

    return ordersQuery.data.products.map(product => {
      const order = ordersMap.get(product.order_id);
      const productTasks = tasksQuery.data.filter(t => t.product_id === product.id);
      
      const moduleKey = order?.module || 'ELN';
      let typeCode = moduleKey.charAt(0);
      const parts = String(product.order_id || '').split('_');
      if (parts.length >= 3) {
         typeCode = parts[parts.length - 1];
      }

      const sortedTasks = [...productTasks].sort((a,b) => a.stage_index - b.stage_index);
      const firstTask = sortedTasks.find(t => t.due_date) || sortedTasks[0];
      const activeTask = sortedTasks.find(t => t.progress < 100 && t.status !== 'done');
      const lastTask = [...sortedTasks].reverse().find(t => t.due_date);

      const startDate = firstTask?.due_date || order?.launched_at || order?.submitted_at;
      const deadline = lastTask?.due_date || order?.deadline;

      const assignee = activeTask?.assignee || order?.client || 'Nam';

      const status = mapProductDetailStatus(product, sortedTasks);

      return {
        ...product,
        orderCode: product.order_id,
        orderTitle: order?.title || '',
        typeCode,
        startDate,
        deadline,
        assignee,
        status,
        tasks: sortedTasks,
        moduleKey,
      };
    });
  }, [ordersQuery.data, tasksQuery.data]);

  const totalProds = realProducts.length;
  const countInProgress = realProducts.filter(p => p.status === 'Đang thực hiện').length;
  const countCompleted = realProducts.filter(p => p.status === 'Hoàn thành').length;
  const countOverdue = realProducts.filter(p => p.status === 'Quá hạn').length;
  const countPending = realProducts.filter(p => p.status === 'Pending').length;
  const countNotStarted = realProducts.filter(p => p.status === 'Chưa bắt đầu').length;

  const pct = (val: number) => totalProds > 0 ? Math.round((val / totalProds) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedProductId(prev => prev === id ? null : id);
  };

  return (
    <>
      <SectionHeader
        eye="Kế hoạch sản xuất"
        title="KẾ HOẠCH SẢN XUẤT"
        subtitle="Theo dõi và sắp xếp ưu tiên sản xuất sản phẩm theo tuần/tháng"
        actions={
          <div className="action-row compact wrap">
             <button className="btn btn-primary btn-small">Theo tuần</button>
             <button className="btn btn-ghost btn-small">Theo tháng</button>
             <button className="btn btn-ghost btn-small">Lọc</button>
             <button className="btn btn-ghost btn-small">Xuất file</button>
          </div>
        }
      />

      <div style={{ padding: '0 0 24px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
         <button className="btn btn-ghost btn-small" style={{background: 'var(--brand-violet-bg)', color: 'var(--brand-violet)', border: '1px solid var(--brand-violet)'}}>Thời gian hoàn thành</button>
         <button className="btn btn-ghost btn-small">Loại sản phẩm</button>
         <button className="btn btn-ghost btn-small">Trạng thái</button>
         <button className="btn btn-ghost btn-small">Phụ trách</button>
         <button className="btn btn-ghost btn-small">Mã đơn hàng</button>
         <button className="btn btn-ghost btn-small">Mã sản phẩm</button>
      </div>

      <div className="kpi-row" style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--brand-violet)' }}>
           <div className="muted-text fw6" style={{ textTransform: 'uppercase', fontSize: 12 }}>ĐANG SẢN XUẤT</div>
           <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-violet)' }}>{countInProgress}</div>
           <div className="muted-text" style={{ fontSize: 14 }}>{pct(countInProgress)}% trên tổng SP</div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--brand-success)' }}>
           <div className="muted-text fw6" style={{ textTransform: 'uppercase', fontSize: 12 }}>HOÀN THÀNH</div>
           <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-success)' }}>{countCompleted}</div>
           <div className="muted-text" style={{ fontSize: 14 }}>{pct(countCompleted)}% trên tổng SP</div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--brand-danger)' }}>
           <div className="muted-text fw6" style={{ textTransform: 'uppercase', fontSize: 12 }}>QUÁ HẠN</div>
           <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-danger)' }}>{countOverdue}</div>
           <div className="muted-text" style={{ fontSize: 14 }}>{pct(countOverdue)}% trên tổng SP</div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--brand-warning)' }}>
           <div className="muted-text fw6" style={{ textTransform: 'uppercase', fontSize: 12 }}>PENDING</div>
           <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-warning)' }}>{countPending}</div>
           <div className="muted-text" style={{ fontSize: 14 }}>{pct(countPending)}% trên tổng SP</div>
        </div>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '4px solid var(--text-muted)' }}>
           <div className="muted-text fw6" style={{ textTransform: 'uppercase', fontSize: 12 }}>CHƯA SẢN XUẤT</div>
           <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-color)' }}>{countNotStarted}</div>
           <div className="muted-text" style={{ fontSize: 14 }}>{pct(countNotStarted)}% trên tổng SP</div>
        </div>
      </div>

      <Card title="DÒNG 4 - DANH SÁCH SẢN PHẨM">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table tree-table">
            <thead>
              <tr>
                <th>Mã sản phẩm</th>
                <th>Mã đơn hàng</th>
                <th>Tên sản phẩm</th>
                <th>Loại sản phẩm</th>
                <th>Ngày bắt đầu</th>
                <th>Deadline</th>
                <th>Phụ trách</th>
                <th>Trạng thái</th>
                <th>Checking point</th>
              </tr>
            </thead>
            <tbody>
              {realProducts.map((p) => {
                const isExpanded = expandedProductId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr className={isExpanded ? 'row-expanded row-parent' : ''} style={{ background: isExpanded ? 'var(--app-bg)' : '' }}>
                      <td><div className="fw6">{p.id}</div></td>
                      <td>{p.orderCode}</td>
                      <td>{p.name}</td>
                      <td>{p.typeCode}</td>
                      <td>{formatDateToDDMMYY(p.startDate)}</td>
                      <td>{formatDateToDDMMYY(p.deadline)}</td>
                      <td><span className="muted-text">@</span>{p.assignee}</td>
                      <td><Badge tone={toneForStatus(p.status)}>{p.status}</Badge></td>
                      <td>
                        <button className="btn btn-ghost btn-small" onClick={() => toggleExpand(p.id)} style={{ color: 'var(--brand-violet)', fontWeight: 600 }}>
                           <span style={{ marginRight: 6 }}>👁</span>View chi tiết
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="row-child-container" style={{ background: 'var(--surface-color)' }}>
                        <td colSpan={9} style={{ padding: '16px 24px 24px 24px' }}>
                          <div className="muted-text" style={{ fontSize: '0.875rem', marginBottom: 12, fontStyle: 'italic' }}>
                              Khi click vào "View chi tiết", hệ thống mở bảng checking point bên dưới
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase' }}>
                             DÒNG 5 - CHECKING POINT HIỂN THỊ SAU KHI CLICK "VIEW CHI TIẾT"
                          </div>
                          <table className="data-table" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
                            <thead>
                              <tr>
                                <th>Checking point</th>
                                <th>Phụ trách</th>
                                <th>Trạng thái</th>
                                <th>Deadline</th>
                                <th>Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.tasks.map((task) => {
                                const workflowStages = WORKFLOW_BY_MODULE[p.moduleKey] || WORKFLOW_BY_MODULE.ELN;
                                const stageInfo = workflowStages[task.stage_index] || { label: `Bước ${task.stage_index + 1}` };
                                const taskState = mapTaskStatus(task);

                                return (
                                  <tr key={task.id}>
                                    <td><div className="fw6">{stageInfo.label}</div></td>
                                    <td><span className="muted-text">@</span>{task.assignee || p.assignee}</td>
                                    <td>
                                       <Badge tone={toneForStatus(taskState)}>{taskState}</Badge>
                                    </td>
                                    <td>{formatDateToDDMMYY(task.due_date)}</td>
                                    <td>{task.status !== 'todo' ? (task.status === 'done' ? 'Đã duyệt' : 'Đang xử lý') : ''}</td>
                                  </tr>
                                );
                              })}
                              {p.tasks.length === 0 && (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }} className="muted-text">Chưa có dữ liệu task nào cho sản phẩm này.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {realProducts.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32 }} className="muted-text">Không có sản phẩm nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
