import { useState, useEffect, useCallback } from "react";

// ── 預設任務設定 ──────────────────────────────────────────
const DEFAULT_DAILY_TASKS = [
  { id: "d1", label: "閱讀 20 分鐘 📚" },
  { id: "d2", label: "整理房間 🧹" },
  { id: "d3", label: "練習才藝 🎹" },
];

const DEFAULT_WEEKLY_TASKS = [
  { id: "w1",  label: "幫忙洗碗 🍽️" },
  { id: "w2",  label: "澆花 🌱" },
  { id: "w3",  label: "幫忙曬衣服 👕" },
  { id: "w4",  label: "倒垃圾 🗑️" },
  { id: "w5",  label: "整理書包 🎒" },
  { id: "w6",  label: "幫忙擦桌子 🧽" },
  { id: "w7",  label: "自己洗澡不催促 🛁" },
  { id: "w8",  label: "提早完成作業 ✏️" },
  { id: "w9",  label: "主動學英文 🔤" },
  { id: "w10", label: "幫助家人 ❤️" },
];

const DAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const STAMP_THRESHOLD = 5;

// ── 工具函式 ──────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};

const loadStorage = async () => {
  try {
    const r = await window.storage.get("kids_tracker_v2");
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
};

const saveStorage = async (data) => {
  try {
    await window.storage.set("kids_tracker_v2", JSON.stringify(data));
  } catch (e) { console.error(e); }
};

const initData = () => ({
  stamps: {},        // { "YYYY-MM-DD": true }
  weeklyScores: {},  // { "weekStart": { taskId: true, ... } }
  totalScore: 0,
  redeemed: 0,       // 已兌換次數
  dailyProgress: {}, // { "YYYY-MM-DD": { d1: true, ... } }
  dailyTasks: DEFAULT_DAILY_TASKS,
  weeklyTasks: DEFAULT_WEEKLY_TASKS,
});

// ── 元件 ─────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("daily"); // daily | weekly | history
  const [showRedeem, setShowRedeem] = useState(false);
  const [justStamped, setJustStamped] = useState(false);
  const [gdExporting, setGdExporting] = useState(false);

  // 載入資料
  useEffect(() => {
    loadStorage().then(d => {
      setData(d || initData());
      setLoaded(true);
    });
  }, []);

  // 儲存資料
  useEffect(() => {
    if (loaded && data) saveStorage(data);
  }, [data, loaded]);

  const today = todayKey();
  const ws = weekStart();

  const dailyProgress = data?.dailyProgress?.[today] || {};
  const allDailyDone = data
    ? data.dailyTasks.every(t => dailyProgress[t.id])
    : false;
  const hasStampToday = data?.stamps?.[today] || false;

  // 今週累積戳章數
  const stampCount = data
    ? Object.keys(data.stamps || {}).filter(k => {
        const d = new Date(k);
        const ws2 = new Date(ws);
        const we = new Date(ws2); we.setDate(we.getDate() + 6);
        return d >= ws2 && d <= we;
      }).length
    : 0;

  // 可兌換次數
  const totalStamps = data ? Object.keys(data.stamps || {}).length : 0;
  const redeemable = Math.floor(totalStamps / STAMP_THRESHOLD) - (data?.redeemed || 0);

  // 本週獎勵分數
  const weeklyDone = data?.weeklyScores?.[ws] || {};
  const weeklyCount = Object.values(weeklyDone).filter(Boolean).length;

  const update = (fn) => setData(prev => {
    const next = fn(JSON.parse(JSON.stringify(prev)));
    return next;
  });

  const toggleDaily = (taskId) => {
    update(d => {
      if (!d.dailyProgress[today]) d.dailyProgress[today] = {};
      d.dailyProgress[today][taskId] = !d.dailyProgress[today][taskId];
      // 若全完成且今天還沒蓋章
      const allDone = d.dailyTasks.every(t => d.dailyProgress[today][t.id]);
      if (allDone && !d.stamps[today]) {
        d.stamps[today] = true;
        setJustStamped(true);
        setTimeout(() => setJustStamped(false), 2000);
      }
      return d;
    });
  };

  const toggleWeekly = (taskId) => {
    update(d => {
      if (!d.weeklyScores[ws]) d.weeklyScores[ws] = {};
      const prev = d.weeklyScores[ws][taskId];
      d.weeklyScores[ws][taskId] = !prev;
      d.totalScore += prev ? -1 : 1;
      if (d.totalScore < 0) d.totalScore = 0;
      return d;
    });
  };

  const doRedeem = () => {
    update(d => { d.redeemed += 1; return d; });
    setShowRedeem(false);
  };

  // Google Drive 匯出（純文字 JSON 下載，需用戶手動存入 Drive）
  const exportToGoogleDrive = useCallback(async () => {
    setGdExporting(true);
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kids_tracker_${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGdExporting(false);
    }
  }, [data, today]);

  // 匯入
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData({ ...initData(), ...parsed });
      } catch { alert("檔案格式錯誤！"); }
    };
    reader.readAsText(file);
  };

  if (!loaded) return (
    <div style={S.loading}>
      <div style={S.loadingDot}>⭐</div>
      <p style={{ color: "#f59e0b", fontFamily: "sans-serif" }}>載入中…</p>
    </div>
  );

  // 建立本週7天格
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, day: DAYS_ZH[i], isToday: key === today, hasStamp: data.stamps[key] };
  });

  return (
    <div style={S.wrap}>
      {/* 彩虹背景裝飾 */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      {/* Header */}
      <div style={S.header}>
        <div style={S.star}>🌟</div>
        <h1 style={S.title}>我的任務星球</h1>
        <div style={S.scoreBox}>
          <span style={S.scoreLabel}>本週獎勵分</span>
          <span style={S.scoreNum}>{data.totalScore}</span>
        </div>
      </div>

      {/* 本週戳章欄 */}
      <div style={S.stampRow}>
        {weekDays.map(({ key, day, isToday, hasStamp }) => (
          <div key={key} style={{ ...S.stampCell, ...(isToday ? S.stampCellToday : {}) }}>
            <div style={S.stampDay}>週{day}</div>
            <div style={{
              ...S.stampCircle,
              ...(hasStamp ? S.stampFilled : {}),
              ...(isToday && !hasStamp ? S.stampTodayEmpty : {}),
            }}>
              {hasStamp ? "⭐" : isToday ? "◉" : "○"}
            </div>
          </div>
        ))}
      </div>

      {/* 累積資訊 */}
      <div style={S.infoRow}>
        <div style={S.infoCard}>
          <div style={S.infoIcon}>🏅</div>
          <div>
            <div style={S.infoVal}>{totalStamps}</div>
            <div style={S.infoLbl}>總戳章</div>
          </div>
        </div>
        <div style={S.infoCard}>
          <div style={S.infoIcon}>🎁</div>
          <div>
            <div style={S.infoVal}>{redeemable}</div>
            <div style={S.infoLbl}>可兌換</div>
          </div>
        </div>
        <div style={S.infoCard}>
          <div style={S.infoIcon}>✨</div>
          <div>
            <div style={S.infoVal}>{weeklyCount}</div>
            <div style={S.infoLbl}>本週獎勵任務</div>
          </div>
        </div>
      </div>

      {/* 兌換進度條 */}
      <div style={S.progressWrap}>
        <div style={S.progressLabel}>
          <span>集章進度</span>
          <span>{totalStamps % STAMP_THRESHOLD} / {STAMP_THRESHOLD} 枚</span>
        </div>
        <div style={S.progressBar}>
          <div style={{
            ...S.progressFill,
            width: `${((totalStamps % STAMP_THRESHOLD) / STAMP_THRESHOLD) * 100}%`
          }} />
          {Array.from({ length: STAMP_THRESHOLD }).map((_, i) => (
            <div key={i} style={{ ...S.progressDot, left: `${(i / STAMP_THRESHOLD) * 100}%` }} />
          ))}
        </div>
        {redeemable > 0 && (
          <button style={S.redeemBtn} onClick={() => setShowRedeem(true)}>
            🎁 兌換獎勵 ×{redeemable}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[["daily","📋 每日任務"],["weekly","⭐ 獎勵任務"],["sync","☁️ 同步"]].map(([k,l]) => (
          <button key={k} style={{ ...S.tab, ...(tab === k ? S.tabActive : {}) }}
            onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* 每日任務 */}
      {tab === "daily" && (
        <div style={S.taskList}>
          <div style={S.taskHeader}>
            今天的任務
            {hasStampToday && <span style={S.stampedBadge}>⭐ 已獲戳章！</span>}
          </div>
          {data.dailyTasks.map(t => {
            const done = dailyProgress[t.id];
            return (
              <div key={t.id} style={{ ...S.taskItem, ...(done ? S.taskDone : {}) }}
                onClick={() => toggleDaily(t.id)}>
                <div style={{ ...S.checkbox, ...(done ? S.checkboxDone : {}) }}>
                  {done ? "✓" : ""}
                </div>
                <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>
                  {t.label}
                </span>
              </div>
            );
          })}
          {allDailyDone && !hasStampToday && (
            <div style={S.allDoneMsg}>🎉 全部完成！戳章已自動蓋上！</div>
          )}
          {justStamped && (
            <div style={S.stampPopup}>⭐ 獲得今日戳章！</div>
          )}
        </div>
      )}

      {/* 獎勵任務 */}
      {tab === "weekly" && (
        <div style={S.taskList}>
          <div style={S.taskHeader}>
            本週獎勵任務
            <span style={S.weekScore}>+{weeklyCount} 分</span>
          </div>
          {data.weeklyTasks.map(t => {
            const done = weeklyDone[t.id];
            return (
              <div key={t.id} style={{ ...S.taskItem, ...(done ? S.taskDoneBonus : {}) }}
                onClick={() => toggleWeekly(t.id)}>
                <div style={{ ...S.checkbox, ...(done ? S.checkboxBonus : {}) }}>
                  {done ? "✓" : ""}
                </div>
                <span style={{ flex: 1, textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>
                  {t.label}
                </span>
                <span style={S.bonusBadge}>+1</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 同步 */}
      {tab === "sync" && (
        <div style={S.syncPanel}>
          <div style={S.syncTitle}>☁️ Google Drive 同步</div>
          <p style={S.syncDesc}>
            點下方按鈕將資料匯出為 JSON 檔，手動存入 Google Drive；
            需要還原時再匯入即可。
          </p>
          <button style={S.syncBtn} onClick={exportToGoogleDrive} disabled={gdExporting}>
            {gdExporting ? "匯出中…" : "📥 匯出資料到 Google Drive"}
          </button>
          <div style={S.syncDivider}>── 或 ──</div>
          <label style={S.syncBtn}>
            📤 從檔案匯入資料
            <input type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
          </label>
          <div style={S.syncNote}>
            <b>資料說明：</b><br />
            總戳章：{totalStamps} 枚　|　總獎勵分：{data.totalScore} 分　|　已兌換：{data.redeemed} 次
          </div>
        </div>
      )}

      {/* 兌換確認 Modal */}
      {showRedeem && (
        <div style={S.modalBg} onClick={() => setShowRedeem(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>🎁 兌換獎勵</div>
            <p style={S.modalDesc}>你已集滿 {STAMP_THRESHOLD} 枚戳章，可以兌換一個獎勵！</p>
            <p style={S.modalDesc}>目前可兌換：<b>{redeemable} 次</b></p>
            <div style={S.modalBtns}>
              <button style={S.modalCancel} onClick={() => setShowRedeem(false)}>取消</button>
              <button style={S.modalConfirm} onClick={doRedeem}>✅ 確認兌換</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 樣式 ─────────────────────────────────────────────────
const S = {
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fef9c3 0%, #fce7f3 50%, #dbeafe 100%)",
    fontFamily: "'Segoe UI', 'PingFang TC', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "0 0 40px",
  },
  bgCircle1: {
    position: "fixed", top: -80, right: -80,
    width: 260, height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle, #fde68a55, #fb7185aa)",
    zIndex: 0,
  },
  bgCircle2: {
    position: "fixed", bottom: -60, left: -60,
    width: 220, height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle, #a5f3fc55, #818cf8aa)",
    zIndex: 0,
  },
  loading: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "100vh", gap: 12,
    background: "#fef9c3",
  },
  loadingDot: { fontSize: 48, animation: "spin 1s linear infinite" },
  header: {
    position: "relative", zIndex: 1,
    background: "linear-gradient(135deg, #f97316, #ec4899)",
    padding: "24px 20px 20px",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 4px 20px #f9731644",
  },
  star: { fontSize: 36 },
  title: {
    flex: 1, margin: 0,
    color: "#fff",
    fontSize: 24, fontWeight: 900,
    letterSpacing: 2,
    textShadow: "0 2px 8px #00000033",
  },
  scoreBox: {
    background: "#fff3",
    borderRadius: 16,
    padding: "8px 16px",
    textAlign: "center",
  },
  scoreLabel: { display: "block", color: "#fef3c7", fontSize: 11 },
  scoreNum: { display: "block", color: "#fff", fontSize: 28, fontWeight: 900 },

  stampRow: {
    position: "relative", zIndex: 1,
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "16px 12px 8px",
    background: "#fff8",
    backdropFilter: "blur(8px)",
  },
  stampCell: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "6px 8px",
    borderRadius: 12,
    minWidth: 40,
  },
  stampCellToday: {
    background: "#fde68a",
    boxShadow: "0 2px 8px #f59e0b55",
  },
  stampDay: { fontSize: 11, color: "#6b7280", fontWeight: 700 },
  stampCircle: {
    width: 34, height: 34,
    borderRadius: "50%",
    border: "2.5px dashed #d1d5db",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, color: "#d1d5db",
    transition: "all .3s",
  },
  stampFilled: {
    border: "2.5px solid #f59e0b",
    background: "linear-gradient(135deg, #fde68a, #fbbf24)",
    boxShadow: "0 2px 8px #f59e0b66",
    color: "initial",
  },
  stampTodayEmpty: { border: "2.5px solid #f97316", color: "#f97316" },

  infoRow: {
    position: "relative", zIndex: 1,
    display: "flex", gap: 10, padding: "12px 16px",
  },
  infoCard: {
    flex: 1,
    background: "#ffffffcc",
    borderRadius: 16,
    padding: "12px 8px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 2px 12px #00000011",
  },
  infoIcon: { fontSize: 24 },
  infoVal: { fontSize: 22, fontWeight: 900, color: "#1e293b", lineHeight: 1 },
  infoLbl: { fontSize: 11, color: "#94a3b8" },

  progressWrap: {
    position: "relative", zIndex: 1,
    margin: "0 16px 12px",
    background: "#ffffffcc",
    borderRadius: 20,
    padding: "14px 16px",
    boxShadow: "0 2px 12px #00000011",
  },
  progressLabel: {
    display: "flex", justifyContent: "space-between",
    fontSize: 12, color: "#6b7280", marginBottom: 8,
  },
  progressBar: {
    height: 16, background: "#f1f5f9",
    borderRadius: 99, position: "relative", overflow: "visible",
  },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg, #f97316, #ec4899)",
    borderRadius: 99, transition: "width .5s ease",
    minWidth: 0,
  },
  progressDot: {
    position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#cbd5e1",
    zIndex: 2,
  },
  redeemBtn: {
    marginTop: 10,
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #f59e0b, #f97316)",
    border: "none", borderRadius: 12,
    color: "#fff", fontWeight: 800, fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 4px 12px #f59e0b44",
  },

  tabs: {
    position: "relative", zIndex: 1,
    display: "flex", gap: 0,
    margin: "0 16px 12px",
    background: "#e2e8f0",
    borderRadius: 16, padding: 4,
  },
  tab: {
    flex: 1, padding: "8px 0",
    background: "none", border: "none",
    borderRadius: 12, fontSize: 13, fontWeight: 700,
    color: "#64748b", cursor: "pointer",
    transition: "all .2s",
  },
  tabActive: {
    background: "#fff",
    color: "#f97316",
    boxShadow: "0 2px 8px #00000015",
  },

  taskList: {
    position: "relative", zIndex: 1,
    margin: "0 16px",
    background: "#ffffffcc",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 2px 16px #00000011",
  },
  taskHeader: {
    fontSize: 15, fontWeight: 800, color: "#1e293b",
    marginBottom: 12,
    display: "flex", alignItems: "center", gap: 8,
  },
  stampedBadge: {
    background: "#fde68a", color: "#92400e",
    fontSize: 12, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
  },
  weekScore: {
    background: "#dcfce7", color: "#15803d",
    fontSize: 13, padding: "2px 10px", borderRadius: 99, fontWeight: 800,
  },
  taskItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 14px", marginBottom: 8,
    background: "#f8fafc", borderRadius: 14,
    cursor: "pointer", transition: "all .2s",
    border: "2px solid transparent",
    userSelect: "none",
  },
  taskDone: { background: "#f0fdf4", border: "2px solid #86efac" },
  taskDoneBonus: { background: "#fef9c3", border: "2px solid #fde68a" },
  checkbox: {
    width: 28, height: 28, borderRadius: "50%",
    border: "2.5px solid #cbd5e1",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 900, color: "#fff",
    flexShrink: 0, transition: "all .2s",
  },
  checkboxDone: { background: "#22c55e", border: "2.5px solid #22c55e" },
  checkboxBonus: { background: "#f59e0b", border: "2.5px solid #f59e0b" },
  bonusBadge: {
    background: "#fde68a", color: "#92400e",
    fontSize: 12, fontWeight: 800,
    padding: "2px 8px", borderRadius: 99, flexShrink: 0,
  },
  allDoneMsg: {
    marginTop: 12, padding: 12,
    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
    borderRadius: 12, textAlign: "center",
    color: "#15803d", fontWeight: 800,
  },
  stampPopup: {
    position: "fixed", top: "40%", left: "50%",
    transform: "translate(-50%,-50%)",
    background: "linear-gradient(135deg, #fde68a, #f59e0b)",
    color: "#fff", fontWeight: 900, fontSize: 28,
    padding: "20px 40px", borderRadius: 24,
    boxShadow: "0 8px 32px #f59e0b66",
    zIndex: 999,
    animation: "fadeInOut 2s forwards",
    pointerEvents: "none",
  },

  syncPanel: {
    position: "relative", zIndex: 1,
    margin: "0 16px",
    background: "#ffffffcc",
    borderRadius: 20, padding: 20,
    boxShadow: "0 2px 16px #00000011",
  },
  syncTitle: { fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 },
  syncDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 },
  syncBtn: {
    display: "block", width: "100%",
    padding: "13px", marginBottom: 8,
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none", borderRadius: 14,
    color: "#fff", fontWeight: 800, fontSize: 15,
    cursor: "pointer", textAlign: "center",
    boxShadow: "0 4px 12px #3b82f644",
    textDecoration: "none",
  },
  syncDivider: { textAlign: "center", color: "#94a3b8", margin: "8px 0", fontSize: 13 },
  syncNote: {
    marginTop: 16, padding: 12,
    background: "#f8fafc", borderRadius: 12,
    fontSize: 13, color: "#475569", lineHeight: 1.8,
  },

  modalBg: {
    position: "fixed", inset: 0,
    background: "#00000055",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 200, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#fff",
    borderRadius: 24, padding: "28px 24px",
    maxWidth: 320, width: "90%",
    boxShadow: "0 12px 40px #00000033",
    textAlign: "center",
  },
  modalTitle: { fontSize: 24, fontWeight: 900, marginBottom: 12 },
  modalDesc: { fontSize: 14, color: "#475569", marginBottom: 8, lineHeight: 1.6 },
  modalBtns: { display: "flex", gap: 10, marginTop: 20 },
  modalCancel: {
    flex: 1, padding: 12, borderRadius: 12,
    border: "2px solid #e2e8f0", background: "#fff",
    fontWeight: 700, cursor: "pointer", fontSize: 14,
  },
  modalConfirm: {
    flex: 1, padding: 12, borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #f97316)",
    color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14,
  },
};
