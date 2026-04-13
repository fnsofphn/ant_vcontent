import React, { useState } from 'react';
import { Card, SectionHeader, Badge } from '@/components/ui/Primitives';

const MOCK_LIBRARY = [
  { id: 'LIB-001', name: 'VNPT Onboarding Package', module: 'ELN', status: 'active', client: 'VNPT Corp', tags: ['Onboarding', 'Scorm 1.2'], lastUpdated: '2026-04-10' },
  { id: 'LIB-002', name: 'Safety First (Animation)', module: 'VIDEO', status: 'active', client: 'EVN', tags: ['2D Animation', 'HSE'], lastUpdated: '2026-04-05' },
  { id: 'LIB-003', name: 'Sales Pipeline Ninja', module: 'GAME', status: 'archived', client: 'Internal', tags: ['Quiz', 'Sales'], lastUpdated: '2026-03-20' },
  { id: 'LIB-004', name: 'KYC Standard Training', module: 'ELN', status: 'active', client: 'BIDV', tags: ['Compliance', 'Scorm 2004'], lastUpdated: '2026-04-12' },
  { id: 'LIB-005', name: 'Service Culture Basics', module: 'ELN', status: 'active', client: 'SaigonTourist', tags: ['Soft Skills', 'Interactive'], lastUpdated: '2026-04-01' },
];

export function ProductLibraryPage() {
  const [filterModule, setFilterModule] = useState('ALL');
  
  const filteredProducts = MOCK_LIBRARY.filter(p => filterModule === 'ALL' || p.module === filterModule);

  return (
    <>
      <SectionHeader 
        eye="Hệ thống nội bộ" 
        title="Thư viện sản phẩm" 
        subtitle="Quản lý tập trung các sản phẩm đã và đang thực hiện. Dành cho Admin và Nội bộ tải file, tái sử dụng tài nguyên."
        actions={<button className="btn btn-primary">Tải lên tài nguyên mới</button>}
      />
      
      <div className="kpi-row small" style={{ marginBottom: 24 }}>
        <div className="kpi-card" onClick={() => setFilterModule('ALL')} style={{ cursor: 'pointer', border: filterModule === 'ALL' ? '1px solid var(--violet-9)' : '' }}>
          <div className="kpi-label">Tổng sản phẩm</div>
          <div className="kpi-value">{MOCK_LIBRARY.length}</div>
        </div>
        <div className="kpi-card tone-violet" onClick={() => setFilterModule('ELN')} style={{ cursor: 'pointer', border: filterModule === 'ELN' ? '1px solid var(--violet-9)' : '' }}>
          <div className="kpi-label">E-learning</div>
          <div className="kpi-value">{MOCK_LIBRARY.filter(p => p.module === 'ELN').length}</div>
        </div>
        <div className="kpi-card tone-red" onClick={() => setFilterModule('VIDEO')} style={{ cursor: 'pointer', border: filterModule === 'VIDEO' ? '1px solid var(--red-9)' : '' }}>
          <div className="kpi-label">Video</div>
          <div className="kpi-value">{MOCK_LIBRARY.filter(p => p.module === 'VIDEO').length}</div>
        </div>
        <div className="kpi-card tone-cyan" onClick={() => setFilterModule('GAME')} style={{ cursor: 'pointer', border: filterModule === 'GAME' ? '1px solid var(--cyan-9)' : '' }}>
          <div className="kpi-label">Gamification</div>
          <div className="kpi-value">{MOCK_LIBRARY.filter(p => p.module === 'GAME').length}</div>
        </div>
      </div>

      <Card title={`Danh sách tài nguyên ${filterModule !== 'ALL' ? `- ${filterModule}` : ''}`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Thư viện</th>
                <th>Tên sản phẩm</th>
                <th>Module</th>
                <th>Khách hàng</th>
                <th>Tags</th>
                <th>Cập nhật lần cuối</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td><div className="fw6">{product.id}</div></td>
                  <td>{product.name}</td>
                  <td><Badge tone={product.module === 'ELN' ? 'violet' : product.module === 'VIDEO' ? 'danger' : 'success'}>{product.module}</Badge></td>
                  <td>{product.client}</td>
                  <td>
                    <div className="stack compact horizontal">
                      {product.tags.map(tag => <span key={tag} className="badge tone-neutral" style={{ fontSize: '0.7em' }}>{tag}</span>)}
                    </div>
                  </td>
                  <td>{product.lastUpdated}</td>
                  <td>{product.status === 'active' ? <Badge tone="success">Đang dùng</Badge> : <Badge tone="neutral">Lưu trữ</Badge>}</td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-ghost btn-small">Mở</button>
                      <button className="btn btn-ghost btn-small">Tải source</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }} className="muted-text">
                    Không có sản phẩm nào phù hợp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
