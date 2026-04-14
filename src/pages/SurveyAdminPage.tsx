import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSurveyConfig, saveSurveyConfig, listSurveyResponses } from '@/services/survey';
import { Card, SectionHeader, Badge } from '@/components/ui/Primitives';
import * as XLSX from 'xlsx';

export function SurveyAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics' | 'config'>('responses');
  const surveyCode = 'student_survey';

  const configQuery = useQuery({
    queryKey: ['survey-admin-config', surveyCode],
    queryFn: () => getSurveyConfig(surveyCode),
  });

  const responsesQuery = useQuery({
    queryKey: ['survey-admin-responses', surveyCode],
    queryFn: () => listSurveyResponses(surveyCode),
  });

  const configData = configQuery.data;
  const responsesData = responsesQuery.data || [];

  const [rawConfig, setRawConfig] = useState<string>('');

  // Handle configuration update
  const saveConfigMutation = useMutation({
    mutationFn: (newConfig: any) => saveSurveyConfig(surveyCode, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-admin-config', surveyCode] });
      alert('Cập nhật cấu hình thành công!');
    },
    onError: (e) => {
      alert(`Lỗi khi lưu cấu hình: ${e.message}`);
    }
  });

  // Populate raw config into editor once loaded
  React.useEffect(() => {
    if (configData && !rawConfig) {
      setRawConfig(JSON.stringify(configData, null, 2));
    }
  }, [configData]);

  const handleSaveConfig = () => {
    try {
      const parsed = JSON.parse(rawConfig);
      saveConfigMutation.mutate(parsed);
    } catch (e) {
      alert('Lỗi định dạng JSON, vui lòng kiểm tra lại!');
    }
  };

  const exportToExcel = () => {
    if (!configData || responsesData.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    const { groups = [], journeys = [] } = configData;

    // Helper map
    const segmentsMap = new Map();
    groups.forEach((g: any) => {
      (g.items || []).forEach((s: any) => {
        segmentsMap.set(s.id, s.v);
      });
    });

    const rows: any[] = [];

    responsesData.forEach(resp => {
      const payload = resp.payload || {};
      const { unit = {}, ts = {}, notes = {} } = payload;
      const unitTen = unit.ten || resp.submitter_info?.ten || 'Không xác định';
      const unitNguoi = unit.nguoi || resp.submitter_info?.nguoi || 'Không xác định';

      journeys.forEach((j: any) => {
        const jId = j.id;
        const jName = j.l;

        (j.tp || []).forEach((tp: any) => {
          const tpId = tp.id;
          const tpName = tp.n;

          (j.s || []).forEach((sId: string) => {
            const tk = `${sId}_${jId}_${tpId}`;
            const sName = segmentsMap.get(sId) || sId;
            
            const starVal = ts[tk];
            const noteVal = notes[`${tk}_note`];

            if (starVal != null || noteVal) {
              rows.push({
                "Tên Lớp / Đơn vị": unitTen,
                "Người phụ trách / Nộp": unitNguoi,
                "Thời gian gửi": new Date(resp.created_at).toLocaleString('vi-VN'),
                "Hành trình": jName,
                "Nhóm đối tượng": sName,
                "Điểm chạm (Vấn đề)": tpName,
                "Mức độ ảnh hưởng (1-5 Sao)": starVal ?? '',
                "Ghi chú chi tiết": noteVal || ''
              });
            }
          });
        });
      });
    });

    if (rows.length === 0) {
      alert("Chưa có bất kỳ đánh giá điểm chạm nào trong các phiếu được ghi nhận.");
      return;
    }

    // Export using XLSX
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Khảo Sát");
    XLSX.writeFile(wb, `KetQua_KhaoSat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getAnalytics = () => {
    let totalDocs = responsesData.length;
    let totalVotes = 0;
    let maxStarVal = 0;
    
    responsesData.forEach(r => {
      const p = r.payload;
      if (p && p.ts) {
        totalVotes += Object.keys(p.ts).length;
      }
    });

    return { totalDocs, totalVotes };
  };

  const analytics = useMemo(() => getAnalytics(), [responsesData]);

  if (configQuery.isLoading || responsesQuery.isLoading) {
    return <div style={{ padding: 40 }}>Đang tải dữ liệu...</div>;
  }

  return (
    <>
      <SectionHeader 
        eye="Quản trị" 
        title="Quản lý Khảo sát" 
        subtitle="Theo dõi kết quả gửi về, tải báo cáo xuất Excel hoặc điều chỉnh câu hỏi/nhóm đối tượng."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/survey`);
              alert('Đã copy link form public vào khay nhớ tạm!');
            }}>
              Copy Link Public
            </button>
            <a href="/survey" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Mở link khảo sát ↗
            </a>
            <button className="btn btn-primary" onClick={exportToExcel}>
              Xuất kết quả (Excel)
            </button>
          </div>
        }
      />
      
      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <button className={`btn ${activeTab === 'responses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('responses')}>
          Danh sách gửi ({responsesData.length})
        </button>
        <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('analytics')}>
          Tổng hợp kết quả
        </button>
        <button className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('config')}>
          Cấu hình động (JSON)
        </button>
      </div>

      {activeTab === 'responses' && (
        <Card title="Danh sách các bản ghi điểm danh / khảo sát">
           <table className="data-table">
            <thead>
              <tr>
                <th>Lớp / Đơn vị</th>
                <th>Người gửi</th>
                <th>Chức vụ / Email</th>
                <th>Thời gian gửi</th>
                <th>Cỡ dữ liệu payload</th>
              </tr>
            </thead>
            <tbody>
              {responsesData.map((res: any) => (
                <tr key={res.id}>
                  <td>
                    <div className="fw6">{res.submitter_info?.ten || '-'}</div>
                  </td>
                  <td>{res.submitter_info?.nguoi || '-'}</td>
                  <td>
                    {(res.submitter_info?.cv) ? res.submitter_info.cv + ' / ' : ''}
                    {res.submitter_info?.email || '-'}
                  </td>
                  <td>{new Date(res.created_at).toLocaleString('vi-VN')}</td>
                  <td>{JSON.stringify(res.payload || {}).length} bytes</td>
                </tr>
              ))}
              {responsesData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Chưa có phản hồi nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card title="Phân tích tổng hợp">
          <div className="kpi-row">
            <div className="kpi-card tone-success">
              <div className="kpi-label">Tổng số phiếu</div>
              <div className="kpi-value">{analytics.totalDocs}</div>
            </div>
            <div className="kpi-card tone-violet">
              <div className="kpi-label">Tổng số thao tác đánh giá (*)</div>
              <div className="kpi-value">{analytics.totalVotes}</div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <p className="muted-text">Lưu ý: Để phân tích cụ thể tần suất các nhóm gặp vấn đề ở từng điểm chạm, vui lòng bấm nút "Xuất kết quả (Excel)" và tiến hành Pivot Table theo Hành trình/Điểm chạm.</p>
          </div>
        </Card>
      )}

      {activeTab === 'config' && (
        <Card title="Chỉnh sửa cấu hình hiển thị / câu hỏi">
          <p className="muted-text" style={{ marginBottom: 16 }}>
            Bạn có thể chỉnh sửa mảng JSON này để thay đổi text, thêm bớt đối tượng học viên hoặc chỉnh sửa điểm chạm hành trình. 
            Thay đổi sẽ ảnh hưởng đến trang khảo sát Public ngay sau khi lưu.
          </p>
          <textarea 
            value={rawConfig} 
            onChange={e => setRawConfig(e.target.value)} 
            rows={20} 
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, padding: 12, borderRadius: 4, border: '1px solid #ccc', marginBottom: 16 }}
          />
          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
              {saveConfigMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </Card>
      )}
    </>
  );
}
