import { type ChangeEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, SectionHeader } from '@/components/ui/Primitives';
import { useAuth } from '@/contexts/AuthContext';
import {
  downloadOrderImportTemplate,
  parseWorkbookToOrderPreview,
  type ImportedWorkbookPreview,
} from '@/lib/orderImport';
import {
  createClientOrder,
  createImportedOrders,
  listCompanies,
  type ManualOrderProductInput,
} from '@/services/vcontent';

type OrderType = 'E' | 'H' | 'G' | 'M';
type PriorityLevel = 'high' | 'medium' | 'low';

type ManualProductDraft = {
  id: string;
  name: string;
  note: string;
};

const ORDER_TYPE_OPTIONS: Array<{
  value: OrderType;
  label: string;
  description: string;
  module: ManualOrderProductInput['module'];
}> = [
  { value: 'E', label: 'E · E-learning', description: 'Map workflow nội bộ sang ELN.', module: 'ELN' },
  { value: 'H', label: 'H · Video học liệu', description: 'Map workflow nội bộ sang VIDEO.', module: 'VIDEO' },
  { value: 'G', label: 'G · Gamification', description: 'Map workflow nội bộ sang GAME.', module: 'GAME' },
  { value: 'M', label: 'M · Video truyền thông', description: 'Tạm thời map workflow nội bộ sang VIDEO.', module: 'VIDEO' },
];

const PRIORITY_OPTIONS: Array<{ value: PriorityLevel; label: string }> = [
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' },
];

function createManualProductDraft(): ManualProductDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    note: '',
  };
}

function normalizeIdentifier(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function abbreviateTokens(value: string, fallback: string) {
  const tokens = value
    .split(/[^A-Za-z0-9À-ỹ]+/u)
    .map((item) => normalizeIdentifier(item))
    .filter(Boolean);
  if (!tokens.length) return fallback;
  return tokens
    .slice(0, 4)
    .map((item) => item.slice(0, 4))
    .join('_');
}

function suggestOrderCode(clientName: string, title: string, orderType: OrderType) {
  const clientToken = abbreviateTokens(clientName, 'CLIENT');
  const titleToken = abbreviateTokens(title, 'DU_AN');
  return normalizeIdentifier(`${clientToken}_${titleToken}_${orderType}`);
}

function getModuleForOrderType(orderType: OrderType): ManualOrderProductInput['module'] {
  return ORDER_TYPE_OPTIONS.find((item) => item.value === orderType)?.module || 'ELN';
}

function buildProductCode(orderCode: string, index: number) {
  const normalizedOrderCode = normalizeIdentifier(orderCode) || 'ORDER';
  return `${normalizedOrderCode}${String(index + 1).padStart(2, '0')}`;
}

async function requireActiveProfile(
  profile: ReturnType<typeof useAuth>['profile'],
  refreshProfile: ReturnType<typeof useAuth>['refreshProfile'],
) {
  let activeProfile = profile;
  if (!activeProfile) {
    activeProfile = await refreshProfile().catch(() => null);
  }

  if (!activeProfile) {
    throw new Error('Thiếu profile hiện tại. Hãy kiểm tra email, active profile và auth_user_id.');
  }

  return activeProfile;
}

export function ClientNewOrderPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  });

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('H');
  const [orderCode, setOrderCode] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10));
  const [manualProducts, setManualProducts] = useState<ManualProductDraft[]>([createManualProductDraft()]);
  const [intakeNote, setIntakeNote] = useState('');

  const [importDeadline, setImportDeadline] = useState(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10));
  const [importPreview, setImportPreview] = useState<ImportedWorkbookPreview | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [parseError, setParseError] = useState('');

  const normalizedOrderCode = normalizeIdentifier(orderCode);
  const effectiveOrderCode = normalizedOrderCode || suggestOrderCode(clientName, title, orderType);
  const moduleForOrder = getModuleForOrderType(orderType);
  const totalProducts = manualProducts.filter((product) => product.name.trim()).length;
  const selectedCompany = (companiesQuery.data || []).find((item) => item.id === companyId) || null;

  const previewProducts = useMemo(
    () =>
      manualProducts.map((product, index) => ({
        key: product.id,
        code: buildProductCode(effectiveOrderCode, index),
        name: product.name.trim(),
        note: product.note.trim(),
      })),
    [effectiveOrderCode, manualProducts],
  );

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const activeProfile = await requireActiveProfile(profile, refreshProfile);
      const validProducts = previewProducts.filter((product) => product.name);
      if (!title.trim()) throw new Error('Cần nhập tên đơn hàng.');
      if (!clientName.trim()) throw new Error('Cần nhập khách hàng.');
      if (!effectiveOrderCode) throw new Error('Không tạo được mã đơn hàng.');
      if (!validProducts.length) throw new Error('Cần ít nhất 1 sản phẩm hợp lệ.');

      return createClientOrder({
        title: title.trim(),
        deadline,
        client: clientName.trim(),
        companyId: companyId || null,
        createdByProfileId: activeProfile.id,
        bundleCounts: {
          eln: moduleForOrder === 'ELN' ? validProducts.length : 0,
          video: moduleForOrder === 'VIDEO' ? validProducts.length : 0,
          game: moduleForOrder === 'GAME' ? validProducts.length : 0,
        },
        products: validProducts.map((product) => ({
          module: moduleForOrder,
          code: product.code,
          name: product.name,
          note: product.note,
        })),
        intakeNote: intakeNote.trim(),
        status: 'ready_for_launch',
        orderCode: effectiveOrderCode,
        projectCode: normalizeIdentifier(projectCode),
        priority,
        orderType,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setTitle('');
      setClientName('');
      setCompanyId('');
      setOrderType('H');
      setOrderCode('');
      setProjectCode('');
      setPriority('medium');
      setDeadline(new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10));
      setManualProducts([createManualProductDraft()]);
      setIntakeNote('');
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importPreview) {
        throw new Error('Chưa có preview import.');
      }

      const activeProfile = await requireActiveProfile(profile, refreshProfile);
      return createImportedOrders({
        orders: importPreview.orders.map((order) => ({
          title: order.title,
          client: order.client,
          deadline: importDeadline,
          companyId: activeProfile.companyId,
          createdByProfileId: activeProfile.id,
          intakeNote: order.intakeNote,
          status: 'ready_for_launch',
          priority: 'medium',
          orderType:
            order.bundleCounts.game > 0 && order.bundleCounts.eln === 0 && order.bundleCounts.video === 0
              ? 'G'
              : order.bundleCounts.video > 0 && order.bundleCounts.eln === 0 && order.bundleCounts.game === 0
                ? 'H'
                : 'E',
          products: order.products.map((product) => ({
            module: product.module,
            sourceCode: product.sourceCode,
            detail: product.detail,
            productType: product.productType,
          })),
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setParseError('');
    setImportPreview(null);
    setImportFileName(file?.name || '');

    if (!file) return;

    try {
      const preview = await parseWorkbookToOrderPreview(file);
      setImportPreview(preview);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : String(error));
    }
  }

  function updateManualProduct(id: string, patch: Partial<ManualProductDraft>) {
    setManualProducts((current) => current.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  }

  function addManualProduct() {
    setManualProducts((current) => [...current, createManualProductDraft()]);
  }

  function removeManualProduct(id: string) {
    setManualProducts((current) =>
      current.length > 1
        ? current.filter((product) => product.id !== id)
        : current.map((product) => (product.id === id ? { ...product, name: '', note: '' } : product)),
    );
  }

  return (
    <>
      <SectionHeader
        eye="Quản lý đơn hàng"
        title="Khởi tạo đơn hàng"
        subtitle="PM hoặc Admin nội dung khởi tạo đơn hàng nội bộ, chuẩn hóa mã đơn và sinh mã sản phẩm ngay từ đầu."
        actions={
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setOrderCode(suggestOrderCode(clientName, title, orderType))}
          >
            Gợi ý mã đơn
          </button>
        }
      />

      <div className="content-grid two-column">
        <Card title="Thông tin đơn hàng">
          <div className="form-grid">
            <label className="full">
              <span>Tên đơn hàng</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Sản xuất video học liệu đào tạo CMHV HCMC"
              />
            </label>
            <label>
              <span>Mã đơn hàng</span>
              <input
                value={orderCode}
                onChange={(event) => setOrderCode(event.target.value)}
                placeholder={suggestOrderCode(clientName, title, orderType)}
              />
            </label>
            <label>
              <span>Mã dự án</span>
              <input
                value={projectCode}
                onChange={(event) => setProjectCode(event.target.value)}
                placeholder="Ví dụ: CMHV_2026"
              />
            </label>
            <label>
              <span>Loại đơn</span>
              <select value={orderType} onChange={(event) => setOrderType(event.target.value as OrderType)}>
                {ORDER_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mức độ ưu tiên</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel)}>
                {PRIORITY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Thời hạn hoàn thành</span>
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </label>
            <label>
              <span>Khách hàng</span>
              <input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Ví dụ: HCMC"
              />
            </label>
            <label>
              <span>Công ty khách hàng</span>
              <select
                value={companyId}
                onChange={(event) => {
                  const nextCompanyId = event.target.value;
                  setCompanyId(nextCompanyId);
                  const nextCompany = (companiesQuery.data || []).find((item) => item.id === nextCompanyId);
                  if (nextCompany && !clientName.trim()) {
                    setClientName(nextCompany.name);
                  }
                }}
              >
                <option value="">Chọn công ty</option>
                {(companiesQuery.data || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tổng sản phẩm</span>
              <input value={String(totalProducts)} readOnly />
            </label>
            <label className="full">
              <span>Ghi chú / yêu cầu đầu vào</span>
              <textarea
                value={intakeNote}
                onChange={(event) => setIntakeNote(event.target.value)}
                placeholder="Mô tả scope, yêu cầu đầu vào, lưu ý về brand, voice, QC hoặc tài liệu liên quan."
              />
            </label>
          </div>

          <div className="toolbar">
            <button
              className="btn btn-danger"
              onClick={() => createOrderMutation.mutate()}
              disabled={!title.trim() || !clientName.trim() || totalProducts < 1 || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Đang khởi tạo...' : 'Khởi tạo đơn hàng'}
            </button>
          </div>
        </Card>

        <Card title="Tóm tắt khởi tạo">
          <div className="stack compact">
            <div className="bullet-item">Mã đơn hàng: {effectiveOrderCode || '-'}</div>
            <div className="bullet-item">Khách hàng: {clientName.trim() || selectedCompany?.name || '-'}</div>
            <div className="bullet-item">Mã dự án: {normalizeIdentifier(projectCode) || '-'}</div>
            <div className="bullet-item">
              Loại đơn: {ORDER_TYPE_OPTIONS.find((item) => item.value === orderType)?.label}
            </div>
            <div className="bullet-item">
              Mapping workflow tạm thời: {moduleForOrder}
              {orderType === 'M' ? ' (module M hiện đang dùng workflow VIDEO).' : ''}
            </div>
            <div className="bullet-item">
              Mức độ ưu tiên: {PRIORITY_OPTIONS.find((item) => item.value === priority)?.label}
            </div>
            {previewProducts.map((product) => (
              <div className="bullet-item" key={product.key}>
                {product.code}: {product.name || 'Chưa nhập tên sản phẩm'}
                {product.note ? ` · Note: ${product.note}` : ''}
              </div>
            ))}
            {createOrderMutation.data ? (
              <div className="bullet-item tone-success">
                Đã tạo đơn {createOrderMutation.data.orderId} với {createOrderMutation.data.productIds.length} sản phẩm.
              </div>
            ) : null}
            {createOrderMutation.error ? (
              <div className="bullet-item tone-danger">{String(createOrderMutation.error)}</div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card title="Danh sách sản phẩm">
        <div className="stack compact">
          {manualProducts.map((product, index) => (
            <div key={product.id} className="form-grid product-draft-grid">
              <label>
                <span>Mã sản phẩm</span>
                <input value={buildProductCode(effectiveOrderCode, index)} readOnly />
              </label>
              <label className="full">
                <span>Tên sản phẩm</span>
                <input
                  value={product.name}
                  onChange={(event) => updateManualProduct(product.id, { name: event.target.value })}
                  placeholder={`Ví dụ: Học liệu ${String(index + 1).padStart(2, '0')}`}
                />
              </label>
              <label className="full">
                <span>Ghi chú sản phẩm</span>
                <textarea
                  value={product.note}
                  onChange={(event) => updateManualProduct(product.id, { note: event.target.value })}
                  placeholder="Ví dụ: Video 01 dùng voice thật, không dùng outro VNB."
                />
              </label>
              <div className="action-row">
                <button type="button" className="btn btn-ghost btn-small" onClick={addManualProduct}>
                  Thêm dòng
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => removeManualProduct(product.id)}
                  disabled={manualProducts.length === 1}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Nhập nhanh từ Excel">
        <div className="toolbar">
          <button type="button" className="btn btn-ghost" onClick={downloadOrderImportTemplate}>
            Tải mẫu Excel
          </button>
        </div>

        <div className="form-grid">
          <label className="full">
            <span>File import Excel</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} />
          </label>
          <label>
            <span>Deadline cho lô import</span>
            <input type="date" value={importDeadline} onChange={(event) => setImportDeadline(event.target.value)} />
          </label>
          <label>
            <span>File đang chọn</span>
            <input value={importFileName || '-'} readOnly />
          </label>
        </div>

        <div className="stack compact">
          {importPreview ? (
            <>
              <div className="bullet-item">Sheet: {importPreview.sheetName}</div>
              <div className="bullet-item">Tổng dòng dữ liệu: {importPreview.totalRows}</div>
              <div className="bullet-item">Dòng hợp lệ: {importPreview.validRows}</div>
              <div className="bullet-item">Dòng bỏ qua: {importPreview.ignoredRows}</div>
              <div className="bullet-item">
                Preview: {importPreview.orders.length} đơn hàng / {importPreview.validRows} sản phẩm
              </div>
              <div className="bullet-item">
                Breakdown: ELN {importPreview.counts.eln} / VIDEO {importPreview.counts.video} / GAME {importPreview.counts.game}
              </div>
            </>
          ) : null}
          {parseError ? <div className="bullet-item tone-danger">{parseError}</div> : null}
          {importMutation.data ? (
            <div className="bullet-item tone-success">
              Đã import {importMutation.data.orderCount} đơn hàng / {importMutation.data.productCount} sản phẩm.
            </div>
          ) : null}
          {importMutation.error ? <div className="bullet-item tone-danger">{String(importMutation.error)}</div> : null}
        </div>

        <div className="toolbar">
          <button
            className="btn btn-primary"
            onClick={() => importMutation.mutate()}
            disabled={!importPreview || importPreview.validRows < 1 || importMutation.isPending}
          >
            {importMutation.isPending ? 'Đang import...' : 'Import thành đơn hàng'}
          </button>
        </div>
      </Card>
    </>
  );
}
