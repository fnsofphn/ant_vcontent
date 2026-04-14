import React, { useState, useCallback, useEffect } from 'react';
import { getSurveyConfig, submitSurveyResponse } from '@/services/survey';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const B = "#003C8F", O = "#F7941D", LB = "#EBF0F7", LO = "#FFF8EE", DK = "#333", MG = "#777";

function Stars({ v = 0, set }: { v: number; set: (val: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => set(i)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 15, padding: 0, color: i <= v ? O : "#d0d0d0", transition: "transform .1s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.25)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {"★"}
        </button>
      ))}
      <span style={{ fontSize: 10, color: "#aaa", marginLeft: 3 }}>{v}/5</span>
    </span>
  );
}

function TA({ label, hint, value, onChange, rows = 3 }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, color: B, fontSize: 12.5, marginBottom: 2 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#999", marginBottom: 2, fontStyle: "italic" }}>{hint}</div>}
      <textarea
        rows={rows}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder="Nhập thông tin..."
        style={{
          width: "100%", border: "1px solid #cfd4da", borderRadius: 4, padding: "7px 10px",
          fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box"
        }}
      />
    </div>
  );
}

export function PublicStudentSurveyPage() {
  const { configCode } = useParams<{ configCode: string }>();
  const surveyCodeId = configCode || 'student_survey';

  const { data: config, isLoading } = useQuery({
    queryKey: ['surveyConfig', surveyCodeId],
    queryFn: () => getSurveyConfig(surveyCodeId),
  });

  const SK = `ks_${surveyCodeId}_data`;

  // Try to load from LocalStorage
  const ld = useCallback(() => {
    try {
      const r = localStorage.getItem(SK);
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  }, [SK]);

  const init = ld() || {};

  const [tab, setTab] = useState("intro");
  const [aj, setAj] = useState<string | null>(null);
  const [as2, setAs] = useState<string | null>(null);
  
  const [unit, setUnit] = useState<Record<string, any>>(init.unit || {});
  const [ts, setTs] = useState<Record<string, number>>(init.ts || {});
  const [iw, setIw] = useState<Record<string, number>>(init.iw || {});
  const [notes, setNotes] = useState<Record<string, string>>(init.notes || {});
  const [dr, setDr] = useState<Record<string, string[]>>(init.dr || { c1: [""] });
  const [ns, setNs] = useState<Record<string, number>>(init.ns || {});
  const [nn, setNn] = useState<Record<string, string>>(init.nn || {});
  const [snd, setSnd] = useState<Record<string, string>>(init.snd || {});
  const [ed, setEd] = useState<Record<string, string>>(init.ed || {});
  const [mf, setMf] = useState<Record<string, string>>(init.mf || {});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SK, JSON.stringify({ unit, ts, iw, notes, dr, ns, nn, snd, ed, mf }));
    } catch { }
  }, [SK, unit, ts, iw, notes, dr, ns, nn, snd, ed, mf]);

  useEffect(() => {
    if (config && config.journeys && config.journeys.length > 0 && !aj) {
      setAj(config.journeys[0].id);
    }
  }, [config, aj]);

  if (isLoading || !config) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Đang tải cấu hình khảo sát...</div>;
  }

  const JR = config.journeys || [];
  const ALL: any[] = [];
  (config.groups || []).forEach((g: any) => {
    if (g.items) ALL.push(...g.items);
  });

  const gs = (id: string) => ALL.find(s => s.id === id);

  const cj = JR.find((j: any) => j.id === aj) || JR[0];
  const rSegs = ALL.filter(x => cj && cj.s && cj.s.indexOf(x.id) >= 0);
  const cSeg = as2 ? gs(as2) : null;

  const addR = (k: string) => setDr(p => ({ ...p, [k]: [...(p[k] || [""]), ""] }));
  const updR = (k: string, i: number, v: string) => setDr(p => { const r = [...(p[k] || [])]; r[i] = v; return { ...p, [k]: r } });
  const delR = (k: string, i: number) => setDr(p => { const r = [...(p[k] || [])]; r.splice(i, 1); return { ...p, [k]: r } });

  const hasD = (jId: string, sId: string) => Object.keys(notes).some(k => k.startsWith(`${sId}_${jId}_`) && (notes[k] && notes[k].trim()));

  const fc = Object.values(notes).filter(v => v && v.trim()).length
    + Object.values(dr).reduce((s, a) => s + a.filter(v => v && v.trim()).length, 0)
    + Object.keys(ns).filter(k => ns[k] > 0).length
    + Object.values(snd).filter(v => v && v.trim()).length
    + Object.values(ed).filter(v => v && v.trim()).length
    + Object.values(mf).filter(v => v && v.trim()).length;

  const getPayload = () => ({ unit, ts, iw, notes, dr, ns, nn, snd, ed, mf, at: new Date().toISOString() });

  const exp = () => {
    const d = getPayload();
    const b = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${config.survey_code || surveyCodeId}_${unit.ten || "data"}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const saveToSystem = async () => {
    if (!unit.ten || !unit.nguoi) {
      alert("Vui lòng điền 'Tên đơn vị' và 'Người phụ trách' ở mục Thông tin chung trước khi nộp!");
      setTab('unit');
      return;
    }
    setSubmitting(true);
    try {
      await submitSurveyResponse(surveyCodeId, getPayload(), unit);
      alert("Đã ghi nhận dữ liệu lên hệ thống thành công. Cảm ơn bạn!");
    } catch(err) {
      alert("Lưu thất bại. Bạn có thể sử dụng nút Xuất JSON để tải file về thủ công và gửi quản trị viên.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    if (window.confirm("Xóa toàn bộ dữ liệu đã nhập trên thiết bị này?")) {
      localStorage.removeItem(SK);
      window.location.reload();
    }
  };

  const themeB = config.themeBaseColor || B;
  const themeO = config.themeAccentColor || O;

  return (
    <div style={{ fontFamily: "Arial,Helvetica,sans-serif", background: "#F5F7FA", minHeight: "100vh", color: DK }}>
      {/* HEADER */}
      <div style={{ background: themeB, color: "#fff", padding: "13px 20px" }}>
        <div style={{ fontSize: 9.5, opacity: .5, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
          {config.orgName || "Tổ chức"} — {config.orgSubTitle || ""}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{config.title || "Khảo sát"}</div>
      </div>
      
      {/* NAV */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", display: "flex", overflowX: "auto" }}>
        {[
          ["intro", "Giới thiệu"],
          ["unit", "Thông tin chung"],
          ["survey", "Khảo sát theo hành trình"],
          ["extra", "Nội dung bổ sung"]
        ].map(([id, lb]) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id === "survey") setAs(null); }}
            style={{
              padding: "9px 16px", border: "none", background: "none", fontFamily: "inherit", fontSize: 12.5,
              fontWeight: tab === id ? 700 : 500, color: tab === id ? themeB : MG, cursor: "pointer",
              borderBottom: tab === id ? `3px solid ${themeO}` : "3px solid transparent", whiteSpace: "nowrap"
            }}
          >
            {lb}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 12px" }}>
          <span style={{ background: themeO, color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 700 }}>
            {fc} mục
          </span>
          <button onClick={saveToSystem} disabled={submitting} style={{ background: "#10b981", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Đang gửi..." : "Gửi lên hệ thống"}
          </button>
          <button onClick={exp} style={{ background: themeB, color: "#fff", border: "none", padding: "5px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Xuất file backup (JSON)
          </button>
          <button onClick={reset} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "5px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Xóa
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 12px" }}>

        {/* INTRO */}
        {tab === "intro" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 6, padding: 20, marginBottom: 12, borderLeft: `4px solid ${themeB}` }}>
              <h2 style={{ color: themeB, fontSize: 16, marginTop: 0, marginBottom: 8 }}>Mục đích</h2>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: "#555", margin: 0 }}>
                {config.intro}
              </p>
            </div>
            {JR.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 6, padding: 20, marginBottom: 12 }}>
                <h3 style={{ color: themeB, fontSize: 14, marginTop: 0, marginBottom: 10 }}>{JR.length} hành trình khảo sát</h3>
                {JR.map((j: any, i: number) => (
                  <div key={j.id} style={{ padding: "5px 0", borderBottom: i < JR.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ fontWeight: 700, color: themeB, fontSize: 13 }}>{i + 1}. {j.l}</div>
                    <div style={{ fontSize: 12, color: MG }}>{j.d}</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>{j.s?.length || 0} nhóm đối tượng | {j.tp?.length || 0} điểm chạm</div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {(config.groups || []).map((grp: any, gIndex: number) => (
                <div key={grp.id} style={{ background: "#fff", borderRadius: 6, padding: 14, borderTop: `3px solid ${gIndex === 0 ? themeB : themeO}` }}>
                  <h4 style={{ color: gIndex === 0 ? themeB : themeO, fontSize: 13, marginTop: 0 }}>{grp.name}</h4>
                  {(grp.items || []).map((s: any, i: number) => (
                    <div key={s.id} style={{ fontSize: 12, padding: "2px 0", color: "#555" }}>{i + 1}. {s.v}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setTab("unit")}
                style={{ background: themeB, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Bắt đầu
              </button>
            </div>
          </div>
        )}

        {/* UNIT */}
        {tab === "unit" && (
          <div style={{ background: "#fff", borderRadius: 6, padding: 20 }}>
            <h2 style={{ color: themeB, fontSize: 16, marginTop: 0, marginBottom: 14 }}>Thông tin đơn vị / người cung cấp</h2>
            {[
              ["ten", "Tên đơn vị / Lớp học"],
              ["nguoi", "Người phụ trách / Tên người phản hồi"],
              ["cv", "Chức vụ / Chuyên môn"],
              ["email", "Email liên hệ"],
            ].map(([k, l]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontWeight: 600, color: themeB, fontSize: 12.5, marginBottom: 2 }}>{l}</label>
                <input
                  type="text"
                  value={unit[k] || ""}
                  onChange={e => setUnit({ ...unit, [k]: e.target.value })}
                  style={{ width: "100%", border: "1px solid #cfd4da", borderRadius: 4, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button
                onClick={() => setTab("survey")}
                style={{ background: themeB, color: "#fff", border: "none", padding: "8px 20px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* SURVEY OVERVIEW */}
        {tab === "survey" && !as2 && cj && (
          <div>
            <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", marginBottom: 14, overflowX: "auto" }}>
              {JR.map((j: any) => (
                <button
                  key={j.id}
                  onClick={() => { setAj(j.id); setAs(null); }}
                  style={{
                    padding: "7px 14px", border: "none", background: aj === j.id ? "#fff" : "transparent", fontFamily: "inherit",
                    fontSize: 12, fontWeight: aj === j.id ? 700 : 500, color: aj === j.id ? themeB : MG, cursor: "pointer",
                    borderBottom: aj === j.id ? `3px solid ${themeO}` : "3px solid transparent", whiteSpace: "nowrap"
                  }}
                >
                  {j.l}
                </button>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 18px", marginBottom: 14, borderLeft: `4px solid ${themeB}` }}>
              <h2 style={{ color: themeB, fontSize: 16, margin: 0 }}>{cj.l}</h2>
              <p style={{ color: MG, fontSize: 12, margin: "4px 0 0" }}>{cj.d}</p>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>{cj.tp?.length || 0} điểm chạm | {rSegs.length} nhóm đối tượng liên quan</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 18px", marginBottom: 14 }}>
              <h3 style={{ color: themeB, fontSize: 13, marginTop: 0, marginBottom: 4 }}>Lần lượt bấm chọn từng nhóm đối tượng để thực hiện khảo sát</h3>
              <p style={{ fontSize: 11, color: MG, fontStyle: "italic", margin: "0 0 12px" }}>Dấu (*) = đã có dữ liệu hoàn thành.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 8 }}>
                {rSegs.map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => setAs(seg.id)}
                    style={{
                      background: "#fafafa", border: "1.5px solid #e0e0e0", borderRadius: 4, padding: "10px 12px",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "border-color .15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = themeO}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e0e0"}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: themeB }}>{seg.v} {hasD(aj as string, seg.id) ? "(*)" : ""}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 6, padding: "14px 18px" }}>
              <h3 style={{ color: themeB, fontSize: 13, marginTop: 0, marginBottom: 8 }}>Các điểm chạm trong hành trình</h3>
              {(cj.tp || []).map((tp: any, i: number) => (
                <div key={tp.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", borderBottom: i < cj.tp.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <span style={{ background: themeB, color: "#fff", borderRadius: 3, width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: themeB, fontSize: 13 }}>{tp.n}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{(tp.is || []).length} vấn đề cần đánh giá</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SURVEY DETAIL */}
        {tab === "survey" && as2 && cSeg && cj && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 12 }}>
              <button onClick={() => setAs(null)} style={{ background: "none", border: "none", color: themeB, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", fontSize: 12, padding: 0, textDecoration: "underline" }}>{cj.l}</button>
              <span style={{ color: "#ccc" }}>/</span>
              <span style={{ color: themeB, fontWeight: 700 }}>{cSeg.v}</span>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: 12, overflowX: "auto" }}>
              {rSegs.map(s => (
                <button
                  key={s.id}
                  onClick={() => setAs(s.id)}
                  style={{
                    padding: "5px 10px", border: "none", background: "none", fontFamily: "inherit", fontSize: 11,
                    fontWeight: as2 === s.id ? 700 : 400, color: as2 === s.id ? themeB : MG, cursor: "pointer",
                    borderBottom: as2 === s.id ? `2px solid ${themeO}` : "2px solid transparent", whiteSpace: "nowrap"
                  }}
                >
                  {s.v.length > 28 ? s.v.slice(0, 28) + "..." : s.v}{hasD(aj as string, s.id) ? " (*)" : ""}
                </button>
              ))}
            </div>
            <div style={{ background: LO, borderLeft: `4px solid ${themeO}`, padding: "10px 14px", borderRadius: 4, marginBottom: 14, fontSize: 12, lineHeight: 1.6 }}>
              Đánh giá mức ảnh hưởng tại mỗi điểm chạm (1-5 sao): 1 sao = Rất thấp; 2 = Thấp; 3 = Trung bình; 4 = Cao, gây khó chịu đáng kể; 5 = Rất cao, cần ưu tiên xử lý ngay. Áp dụng cho nhóm: <b>{cSeg.v}</b>.
            </div>
            
            {(cj.tp || []).map((tp: any, tI: number) => {
              const tK = `${as2}_${aj}_${tp.id}`;
              const sc = (ts[tK] != null ? ts[tK] : 0);
              const bg2 = sc >= 4 ? "#fef2f2" : sc >= 3 ? "#fffbeb" : sc >= 1 ? "#f0fdf4" : "#fafafa";
              
              return (
                <div key={tp.id} style={{ border: "1px solid #e0e0e0", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ background: bg2, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: themeB, color: "#fff", borderRadius: 3, width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{tI + 1}</span>
                      <span style={{ fontWeight: 700, color: themeB, fontSize: 13 }}>{tp.n}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: MG }}>Mức độ chung của điểm chạm</div>
                      <Stars v={sc} set={v => setTs({ ...ts, [tK]: v })} />
                    </div>
                  </div>
                  <div style={{ padding: "10px 14px" }}>
                    {(tp.is || []).map((is2: string, iI: number) => {
                      const iK = `${tK}_i${iI}`;
                      return (
                        <div key={iI} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: iI < tp.is.length - 1 ? "1px solid #f5f5f5" : "none", gap: 10 }}>
                          <span style={{ fontSize: 12.5, color: "#555", flex: 1, lineHeight: 1.5 }}>{is2}</span>
                          <Stars v={(iw[iK] != null ? iw[iK] : 0)} set={v => setIw({ ...iw, [iK]: v })} />
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 8 }}>
                      <TA
                        label="Ghi chú thực tế (*bắt buộc với một số khảo sát):"
                        hint={`Đặc thù nhóm "${cSeg.v}" tại điểm chạm này`}
                        value={notes[`${tK}_note`] || ""}
                        onChange={v => setNotes({ ...notes, [`${tK}_note`]: v })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button onClick={() => setAs(null)} style={{ background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 4, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#666" }}>
                Quay lại danh sách
              </button>
              {(() => {
                const idx = rSegs.findIndex(s => s.id === as2);
                const miss = (cj.tp || []).filter((tp: any) => {
                  const k = `${as2}_${aj}_${tp.id}_note`;
                  return !notes[k] || !notes[k].trim();
                });
                const nx = rSegs[idx + 1];
                return nx ? (
                  <button
                    onClick={() => {
                      if (miss.length > 0 && !window.confirm(`Còn ${miss.length} điểm chạm chưa có ghi chú. Tiếp tục?`)) return;
                      setAs(nx.id);
                    }}
                    style={{ background: themeB, color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Nhóm tiếp theo: {nx.v}
                  </button>
                ) : (
                  <button
                    onClick={() => setAs(null)}
                    style={{ background: themeO, color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Hoàn thành hành trình này
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* EXTRA */}
        {tab === "extra" && config.extra && (
          <div>
            {config.extra.negativeBehaviors && (
              <div style={{ background: "#fff", borderRadius: 6, marginBottom: 14, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: themeB, color: "#fff", padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>Hành vi tiêu cực lặp lại / Các vấn đề nhức nhối</div>
                <div style={{ padding: "14px 16px" }}>
                  {config.extra.negativeBehaviors.map((t: string, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: 12.5, color: "#555", flex: 1 }}>{t}</span>
                      <Stars v={ns[`nb${i}`] || 0} set={v => setNs({ ...ns, [`nb${i}`]: v })} />
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <TA label="Hành vi tiêu cực/vấn đề khác (bổ sung):" value={nn.other || ""} onChange={v => setNn({ ...nn, other: v })} rows={2} />
                    <TA label="Ví dụ cụ thể (bối cảnh, phản ứng):" value={nn.ex || ""} onChange={v => setNn({ ...nn, ex: v })} rows={3} />
                  </div>
                </div>
              </div>
            )}

            {config.extra.specialNeeds && (
              <div style={{ background: "#fff", borderRadius: 6, marginBottom: 14, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: themeB, color: "#fff", padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>Nhu cầu hỗ trợ nhóm học viên yếu thế / Đặc biệt</div>
                <div style={{ padding: "14px 16px" }}>
                  {config.extra.specialNeeds.map((sn: any, si: number) => (
                    <div key={sn.id} style={{ border: "1px solid #e0e0e0", borderRadius: 4, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: themeB, fontSize: 12.5, marginBottom: 8 }}>{si + 1}. {sn.t}</div>
                      {(sn.f || []).map((f: string, fi: number) => {
                        const k = `${sn.id}_${fi}`;
                        return (
                          <div key={fi} style={{ marginBottom: 5 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#555", display: "block", marginBottom: 1 }}>{f}</label>
                            <input
                              type="text"
                              value={snd[k] || ""}
                              onChange={e => setSnd({ ...snd, [k]: e.target.value })}
                              placeholder="Nhập..."
                              style={{ width: "100%", border: "1px solid #cfd4da", borderRadius: 4, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {config.extra.metrics && (
              <div style={{ background: "#fff", borderRadius: 6, marginBottom: 14, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: themeB, color: "#fff", padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>Đo lường các chỉ số chung</div>
                <div style={{ padding: "14px 16px" }}>
                  {config.extra.metrics.map((f: any) => (
                    <TA key={f.k} label={f.l} value={mf[f.k] || ""} onChange={v => setMf({ ...mf, [f.k]: v })} rows={f.r || 2} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: LO, borderRadius: 6, padding: 18, textAlign: "center" }}>
              <p style={{ color: themeO, fontWeight: 600, fontSize: 13, margin: "0 0 10px" }}>Cảm ơn bạn đã hoàn tất điền thông tin khảo sát.</p>
              <button onClick={saveToSystem} disabled={submitting} style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Đang xử lý..." : "Nộp toàn bộ phiếu khảo sát"}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: "center", padding: 14, color: "#bbb", fontSize: 10, borderTop: "1px solid #eee", marginTop: 14 }}>
        Hệ thống Khảo sát Antigravity | VContent Ecosystem
      </div>
    </div>
  );
}
