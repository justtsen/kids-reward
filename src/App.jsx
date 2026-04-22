import { useState, useEffect, useCallback } from "react";

// ── 預設資料 ──────────────────────────────────────────────
const DEFAULT_DAILY_TASKS = [
  { id: "d1", label: "閱讀 20 分鐘 📚" },
  { id: "d2", label: "整理房間 🧹" },
  { id: "d3", label: "練習才藝 🎹" },
];

const DEFAULT_WEEKLY_TASKS = [
  { id: "w1",  label: "幫忙洗碗 🍽️",       score: 1 },
  { id: "w2",  label: "澆花 🌱",            score: 1 },
  { id: "w3",  label: "幫忙曬衣服 👕",      score: 2 },
  { id: "w4",  label: "倒垃圾 🗑️",         score: 1 },
  { id: "w5",  label: "整理書包 🎒",        score: 1 },
  { id: "w6",  label: "幫忙擦桌子 🧽",      score: 1 },
  { id: "w7",  label: "自己洗澡不催促 🛁",  score: 2 },
  { id: "w8",  label: "提早完成作業 ✏️",    score: 3 },
  { id: "w9",  label: "主動學英文 🔤",      score: 3 },
  { id: "w10", label: "幫助家人 ❤️",        score: 2 },
];

const DEFAULT_REWARDS = [
  { id: "r1", label: "遊戲 1 分鐘 🎮",  cost: 1    },
  { id: "r2", label: "遊戲 5 分鐘 🎮",  cost: 5    },
  { id: "r3", label: "文具 ✏️",          cost: 100  },
  { id: "r4", label: "書 📖",            cost: 200  },
  { id: "r5", label: "小玩具 🧸",        cost: 500  },
  { id: "r6", label: "大玩具 🎁",        cost: 1000 },
  { id: "r7", label: "狗狗一隻 🐕",      cost: 10000},
];

const DAYS_ZH = ["日","一","二","三","四","五","六"];
const STAMP_THRESHOLD = 5;
const ADMIN_PASSWORD = "parent123";

const todayKey = () => new Date().toISOString().slice(0, 10);
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};
const uid = () => Math.random().toString(36).slice(2, 8);

const loadStorage = async () => {
  try { const r = localStorage.getItem("kids_tracker_v3"); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const saveStorage = async (data) => {
  try { localStorage.setItem("kids_tracker_v3", JSON.stringify(data)); } catch (e) { console.error(e); }
};

const initData = () => ({
  stamps: {},
  weeklyScores: {},
  totalScore: 0,
  redeemHistory: [],
  stampRedeemed: 0,
  dailyProgress: {},
  dailyTasks: DEFAULT_DAILY_TASKS,
  weeklyTasks: DEFAULT_WEEKLY_TASKS,
  rewards: DEFAULT_REWARDS,
});

export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("daily");
  const [justStamped, setJustStamped] = useState(false);
  const [gdExporting, setGdExporting] = useState(false);

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");
  const [adminErr, setAdminErr] = useState(false);
  const [adminTab, setAdminTab] = useState("weekly");

  const [redeemTarget, setRedeemTarget] = useState(null);
  const [showStampRedeem, setShowStampRedeem] = useState(false);

  const [editingWeekly, setEditingWeekly] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [newWeekly, setNewWeekly] = useState({ label: "", score: 1 });
  const [newReward, setNewReward] = useState({ label: "", cost: 10 });

  useEffect(() => {
    loadStorage().then(d => { setData(d || initData()); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (loaded && data) saveStorage(data);
  }, [data, loaded]);

  const today = todayKey();
  const ws = weekStart();

  const dailyProgress = data?.dailyProgress?.[today] || {};
  const allDailyDone = data ? data.dailyTasks.every(t => dailyProgress[t.id]) : false;
  const hasStampToday = data?.stamps?.[today] || false;
  const totalStamps = data ? Object.keys(data.stamps || {}).length : 0;
  const redeemable = Math.floor(totalStamps / STAMP_THRESHOLD) - (data?.stampRedeemed || 0);
  const weeklyDone = data?.weeklyScores?.[ws] || {};
  const weeklyEarned = data
    ? data.weeklyTasks.reduce((s, t) => s + (weeklyDone[t.id] ? t.score : 0), 0)
    : 0;

  const update = (fn) => setData(prev => fn(JSON.parse(JSON.stringify(prev))));

  const toggleDaily = (taskId) => {
    update(d => {
      if (!d.dailyProgress[today]) d.dailyProgress[today] = {};
      d.dailyProgress[today][taskId] = !d.dailyProgress[today][taskId];
      const allDone = d.dailyTasks.every(t => d.dailyProgress[today][t.id]);
      if (allDone && !d.stamps[today]) {
        d.stamps[today] = true;
        setJustStamped(true);
        setTimeout(() => setJustStamped(false), 2500);
      }
      return d;
    });
  };

  const toggleWeekly = (task) => {
    update(d => {
      if (!d.weeklyScores[ws]) d.weeklyScores[ws] = {};
      const prev = d.weeklyScores[ws][task.id];
      d.weeklyScores[ws][task.id] = !prev;
      d.totalScore += prev ? -task.score : task.score;
      if (d.totalScore < 0) d.totalScore = 0;
      return d;
    });
  };

  const doRedeemReward = (reward) => {
    update(d => {
      if (d.totalScore < reward.cost) return d;
      d.totalScore -= reward.cost;
      d.redeemHistory.unshift({ id: uid(), rewardLabel: reward.label, cost: reward.cost, date: today });
      return d;
    });
    setRedeemTarget(null);
  };

  const doRedeemStamp = () => {
    update(d => { d.stampRedeemed += 1; return d; });
    setShowStampRedeem(false);
  };

  const tryAdminLogin = () => {
    if (adminPwd === ADMIN_PASSWORD) {
      setAdminMode(true); setShowAdminLogin(false); setAdminPwd(""); setAdminErr(false);
    } else { setAdminErr(true); }
  };

  const saveWeeklyEdit = () => {
    if (!editingWeekly?.label.trim()) return;
    update(d => {
      const idx = d.weeklyTasks.findIndex(t => t.id === editingWeekly.id);
      if (idx >= 0) d.weeklyTasks[idx] = { ...editingWeekly, score: Number(editingWeekly.score) || 1 };
      return d;
    });
    setEditingWeekly(null);
  };
  const deleteWeekly = (id) => update(d => { d.weeklyTasks = d.weeklyTasks.filter(t => t.id !== id); return d; });
  const addWeekly = () => {
    if (!newWeekly.label.trim()) return;
    update(d => { d.weeklyTasks.push({ id: "w" + uid(), label: newWeekly.label.trim(), score: Number(newWeekly.score) || 1 }); return d; });
    setNewWeekly({ label: "", score: 1 });
  };

  const saveRewardEdit = () => {
    if (!editingReward?.label.trim()) return;
    update(d => {
      const idx = d.rewards.findIndex(r => r.id === editingReward.id);
      if (idx >= 0) d.rewards[idx] = { ...editingReward, cost: Number(editingReward.cost) || 1 };
      return d;
    });
    setEditingReward(null);
  };
  const deleteReward = (id) => update(d => { d.rewards = d.rewards.filter(r => r.id !== id); return d; });
  const addReward = () => {
    if (!newReward.label.trim()) return;
    update(d => { d.rewards.push({ id: "r" + uid(), label: newReward.label.trim(), cost: Number(newReward.cost) || 1 }); return d; });
    setNewReward({ label: "", cost: 10 });
  };

  const exportData = useCallback(() => {
    setGdExporting(true);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `kids_tracker_${today}.json`; a.click();
    URL.revokeObjectURL(url); setGdExporting(false);
  }, [data, today]);

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { setData({ ...initData(), ...JSON.parse(ev.target.result) }); }
      catch { alert("檔案格式錯誤！"); }
    };
    reader.readAsText(file);
  };

  if (!loaded) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:12,background:"#fef9c3",fontFamily:"sans-serif" }}>
      <div style={{ fontSize: 48 }}>⭐</div>
      <p style={{ color: "#f59e0b" }}>載入中…</p>
    </div>
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, day: DAYS_ZH[i], isToday: key === today, hasStamp: data.stamps[key] };
  });

  const badge = (bg, color) => ({
    background: bg, color, fontSize: 12, padding: "2px 8px",
    borderRadius: 99, fontWeight: 700, whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#fef9c3 0%,#fce7f3 50%,#dbeafe 100%)", fontFamily:"'Segoe UI','PingFang TC',sans-serif", position:"relative", overflow:"hidden", paddingBottom:40 }}>
      {/* bg deco */}
      <div style={{ position:"fixed",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,#fde68a55,#fb7185aa)",zIndex:0 }} />
      <div style={{ position:"fixed",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,#a5f3fc55,#818cf8aa)",zIndex:0 }} />

      {/* Header */}
      <div style={{ position:"relative",zIndex:1,background:"linear-gradient(135deg,#f97316,#ec4899)",padding:"20px 16px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px #f9731644" }}>
        <div style={{ fontSize:32 }}>🌟</div>
        <h1 style={{ flex:1,margin:0,color:"#fff",fontSize:22,fontWeight:900,letterSpacing:2,textShadow:"0 2px 8px #00000033" }}>我的任務星球</h1>
        <div style={{ background:"#fff3",borderRadius:14,padding:"6px 14px",textAlign:"center" }}>
          <span style={{ display:"block",color:"#fef3c7",fontSize:10 }}>積分</span>
          <span style={{ display:"block",color:"#fff",fontSize:26,fontWeight:900 }}>{data.totalScore}</span>
        </div>
        <button style={{ background:"#fff3",border:"none",borderRadius:10,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18 }}
          onClick={() => adminMode ? setAdminMode(false) : setShowAdminLogin(true)}>
          {adminMode ? "🔓" : "🔒"}
        </button>
      </div>

      {/* 戳章欄 */}
      <div style={{ position:"relative",zIndex:1,display:"flex",justifyContent:"center",gap:4,padding:"14px 8px 8px",background:"#fff8",backdropFilter:"blur(8px)" }}>
        {weekDays.map(({ key, day, isToday, hasStamp }) => (
          <div key={key} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"6px",borderRadius:12,minWidth:38, ...(isToday ? { background:"#fde68a",boxShadow:"0 2px 8px #f59e0b55" } : {}) }}>
            <div style={{ fontSize:10,color:"#6b7280",fontWeight:700 }}>週{day}</div>
            <div style={{ width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,transition:"all .3s",
              ...(hasStamp ? { border:"2px solid #f59e0b",background:"linear-gradient(135deg,#fde68a,#fbbf24)",boxShadow:"0 2px 8px #f59e0b66" }
              : isToday ? { border:"2px solid #f97316",color:"#f97316" }
              : { border:"2px dashed #d1d5db",color:"#d1d5db" })
            }}>
              {hasStamp ? "⭐" : isToday ? "◉" : "○"}
            </div>
          </div>
        ))}
      </div>

      {/* 資訊卡 */}
      <div style={{ position:"relative",zIndex:1,display:"flex",gap:8,padding:"10px 12px" }}>
        {[
          { icon:"🏅", val:totalStamps,  lbl:"總戳章" },
          { icon:"🎁", val:redeemable,   lbl:"可兌換戳章" },
          { icon:"✨", val:weeklyEarned, lbl:"本週獎勵分" },
        ].map(({ icon, val, lbl }) => (
          <div key={lbl} style={{ flex:1,background:"#ffffffcc",borderRadius:14,padding:"10px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 10px #00000011" }}>
            <div style={{ fontSize:22 }}>{icon}</div>
            <div>
              <div style={{ fontSize:20,fontWeight:900,color:"#1e293b",lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:10,color:"#94a3b8" }}>{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 進度條 */}
      <div style={{ position:"relative",zIndex:1,margin:"0 12px 10px",background:"#ffffffcc",borderRadius:18,padding:"12px 14px",boxShadow:"0 2px 12px #00000011" }}>
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginBottom:7 }}>
          <span>集章進度（每{STAMP_THRESHOLD}枚可兌換）</span>
          <span>{totalStamps % STAMP_THRESHOLD} / {STAMP_THRESHOLD}</span>
        </div>
        <div style={{ height:14,background:"#f1f5f9",borderRadius:99,overflow:"hidden" }}>
          <div style={{ height:"100%",background:"linear-gradient(90deg,#f97316,#ec4899)",borderRadius:99,transition:"width .5s ease",width:`${((totalStamps % STAMP_THRESHOLD) / STAMP_THRESHOLD) * 100}%` }} />
        </div>
        {redeemable > 0 && (
          <button style={{ marginTop:10,width:"100%",padding:"10px",background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer" }}
            onClick={() => setShowStampRedeem(true)}>
            🎁 兌換戳章獎勵 ×{redeemable}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ position:"relative",zIndex:1,display:"flex",margin:"0 12px 10px",background:"#e2e8f0",borderRadius:14,padding:3 }}>
        {[["daily","📋 每日"],["weekly","⭐ 獎勵"],["shop","🏪 商店"],["sync","☁️ 同步"]].map(([k,l]) => (
          <button key={k} style={{ flex:1,padding:"7px 0",background: tab===k ? "#fff" : "none",border:"none",borderRadius:11,fontSize:12,fontWeight:700,color: tab===k ? "#f97316" : "#64748b",cursor:"pointer",transition:"all .2s",boxShadow: tab===k ? "0 2px 8px #00000015" : "none" }}
            onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── 每日任務 ── */}
      {tab === "daily" && (
        <div style={{ position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011" }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            今天的任務
            {hasStampToday && <span style={badge("#fde68a","#92400e")}>⭐ 已獲戳章</span>}
          </div>
          {data.dailyTasks.map(t => {
            const done = dailyProgress[t.id];
            return (
              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 12px",marginBottom:7,background: done ? "#f0fdf4" : "#f8fafc",borderRadius:12,cursor:"pointer",border: done ? "2px solid #86efac" : "2px solid transparent",userSelect:"none" }}
                onClick={() => toggleDaily(t.id)}>
                <div style={{ width:26,height:26,borderRadius:"50%",border: done ? "none" : "2px solid #cbd5e1",background: done ? "#22c55e" : "transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0 }}>{done ? "✓" : ""}</div>
                <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1, flex:1 }}>{t.label}</span>
              </div>
            );
          })}
          {allDailyDone && <div style={{ marginTop:10,padding:10,background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",borderRadius:10,textAlign:"center",color:"#15803d",fontWeight:800,fontSize:14 }}>🎉 全部完成！戳章已蓋上！</div>}
        </div>
      )}

      {/* ── 獎勵任務 ── */}
      {tab === "weekly" && (
        <div style={{ position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011" }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            本週獎勵任務
            <span style={badge("#dcfce7","#15803d")}>已得 {weeklyEarned} 分</span>
          </div>
          {data.weeklyTasks.map(t => {
            const done = weeklyDone[t.id];
            return (
              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 12px",marginBottom:7,background: done ? "#fef9c3" : "#f8fafc",borderRadius:12,cursor:"pointer",border: done ? "2px solid #fde68a" : "2px solid transparent",userSelect:"none" }}
                onClick={() => toggleWeekly(t)}>
                <div style={{ width:26,height:26,borderRadius:"50%",border: done ? "none" : "2px solid #cbd5e1",background: done ? "#f59e0b" : "transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0 }}>{done ? "✓" : ""}</div>
                <span style={{ flex:1,textDecoration: done ? "line-through" : "none",opacity: done ? 0.5 : 1 }}>{t.label}</span>
                <span style={badge("#fde68a","#92400e")}>+{t.score}分</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 獎品商店 ── */}
      {tab === "shop" && (
        <div style={{ position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011" }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            🏪 獎品商店
            <span style={badge("#dbeafe","#1e40af")}>餘額 {data.totalScore} 分</span>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {data.rewards.map(r => {
              const canAfford = data.totalScore >= r.cost;
              return (
                <div key={r.id} style={{ background:"#f8fafc",borderRadius:16,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 2px 10px #00000010",opacity: canAfford ? 1 : 0.5 }}>
                  <div style={{ fontSize:14,fontWeight:700,textAlign:"center",color:"#1e293b" }}>{r.label}</div>
                  <div style={{ fontSize:20,fontWeight:900,color:"#f97316" }}>{r.cost} 分</div>
                  <button
                    style={{ width:"100%",padding:"8px",background: canAfford ? "linear-gradient(135deg,#f97316,#ec4899)" : "#e2e8f0",border:"none",borderRadius:10,color: canAfford ? "#fff" : "#94a3b8",fontWeight:800,fontSize:13,cursor: canAfford ? "pointer" : "not-allowed" }}
                    disabled={!canAfford}
                    onClick={() => setRedeemTarget(r)}>
                    {canAfford ? "兌換 🎉" : "積分不足"}
                  </button>
                </div>
              );
            })}
          </div>
          {data.redeemHistory.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13,fontWeight:800,color:"#64748b",marginBottom:8 }}>兌換紀錄</div>
              {data.redeemHistory.slice(0,10).map(h => (
                <div key={h.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8fafc",borderRadius:10,marginBottom:5,fontSize:13 }}>
                  <span style={{ flex:1 }}>{h.rewardLabel}</span>
                  <span style={{ color:"#ef4444",fontWeight:700 }}>-{h.cost}分</span>
                  <span style={{ color:"#94a3b8",fontSize:11 }}>{h.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 同步 ── */}
      {tab === "sync" && (
        <div style={{ position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011" }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12 }}>☁️ Google Drive 同步</div>
          <p style={{ fontSize:13,color:"#64748b",lineHeight:1.7,marginBottom:16 }}>匯出 JSON 檔後手動存入 Google Drive；需要還原時再匯入。</p>
          <button style={{ display:"block",width:"100%",padding:"12px",marginBottom:8,background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer" }}
            onClick={exportData} disabled={gdExporting}>
            {gdExporting ? "匯出中…" : "📥 匯出資料"}
          </button>
          <div style={{ textAlign:"center",color:"#94a3b8",margin:"8px 0",fontSize:13 }}>── 或 ──</div>
          <label style={{ display:"block",width:"100%",padding:"12px",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center",boxSizing:"border-box" }}>
            📤 從檔案匯入
            <input type="file" accept=".json" style={{ display:"none" }} onChange={importData} />
          </label>
          <div style={{ marginTop:16,padding:12,background:"#f8fafc",borderRadius:12,fontSize:13,color:"#475569",lineHeight:1.8 }}>
            <b>目前資料：</b><br />總戳章：{totalStamps} 枚　|　總積分：{data.totalScore}　|　兌換紀錄：{data.redeemHistory.length} 筆
          </div>
        </div>
      )}

      {/* ── 家長管理面板 ── */}
      {adminMode && (
        <div style={{ position:"relative",zIndex:1,margin:"10px 12px 0",background:"#fffbeb",borderRadius:18,padding:14,border:"2px solid #f97316",boxShadow:"0 4px 20px #f9731622" }}>
          <div style={{ fontSize:15,fontWeight:800,color:"#f97316",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            🔓 家長管理模式
            <div style={{ display:"inline-flex",background:"#f1f5f9",borderRadius:10,padding:2,gap:2 }}>
              {[["weekly","週任務"],["rewards","獎品"]].map(([k,l]) => (
                <button key={k} style={{ padding:"4px 12px",background: adminTab===k ? "#fff" : "none",border:"none",borderRadius:8,fontSize:12,fontWeight:700,color: adminTab===k ? "#f97316" : "#64748b",cursor:"pointer" }}
                  onClick={() => setAdminTab(k)}>{l}</button>
              ))}
            </div>
          </div>

          {adminTab === "weekly" && (
            <div>
              {data.weeklyTasks.map(t => (
                <div key={t.id} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                  {editingWeekly?.id === t.id ? (
                    <>
                      <input style={{ flex:1,minWidth:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13 }} value={editingWeekly.label} onChange={e => setEditingWeekly(p => ({ ...p,label:e.target.value }))} placeholder="任務名稱" />
                      <input style={{ width:60,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:13 }} type="number" value={editingWeekly.score} onChange={e => setEditingWeekly(p => ({ ...p,score:e.target.value }))} />
                      <span style={{ fontSize:11,color:"#94a3b8" }}>分</span>
                      <button style={{ padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer" }} onClick={saveWeeklyEdit}>✓</button>
                      <button style={{ padding:"5px 10px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer" }} onClick={() => setEditingWeekly(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex:1,fontSize:13 }}>{t.label}</span>
                      <span style={badge("#fde68a","#92400e")}>{t.score}分</span>
                      <button style={{ padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14 }} onClick={() => setEditingWeekly({ ...t })}>✏️</button>
                      <button style={{ padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14 }} onClick={() => deleteWeekly(t.id)}>🗑</button>
                    </>
                  )}
                </div>
              ))}
              <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap" }}>
                <input style={{ flex:1,minWidth:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13 }} value={newWeekly.label} onChange={e => setNewWeekly(p => ({ ...p,label:e.target.value }))} placeholder="新增任務名稱" />
                <input style={{ width:60,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:13 }} type="number" value={newWeekly.score} onChange={e => setNewWeekly(p => ({ ...p,score:e.target.value }))} />
                <span style={{ fontSize:11,color:"#94a3b8" }}>分</span>
                <button style={{ padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer" }} onClick={addWeekly}>＋ 新增</button>
              </div>
            </div>
          )}

          {adminTab === "rewards" && (
            <div>
              {data.rewards.map(r => (
                <div key={r.id} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                  {editingReward?.id === r.id ? (
                    <>
                      <input style={{ flex:1,minWidth:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13 }} value={editingReward.label} onChange={e => setEditingReward(p => ({ ...p,label:e.target.value }))} placeholder="獎品名稱" />
                      <input style={{ width:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:13 }} type="number" value={editingReward.cost} onChange={e => setEditingReward(p => ({ ...p,cost:e.target.value }))} />
                      <span style={{ fontSize:11,color:"#94a3b8" }}>分</span>
                      <button style={{ padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer" }} onClick={saveRewardEdit}>✓</button>
                      <button style={{ padding:"5px 10px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer" }} onClick={() => setEditingReward(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex:1,fontSize:13 }}>{r.label}</span>
                      <span style={badge("#dbeafe","#1e40af")}>{r.cost}分</span>
                      <button style={{ padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14 }} onClick={() => setEditingReward({ ...r })}>✏️</button>
                      <button style={{ padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14 }} onClick={() => deleteReward(r.id)}>🗑</button>
                    </>
                  )}
                </div>
              ))}
              <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap" }}>
                <input style={{ flex:1,minWidth:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13 }} value={newReward.label} onChange={e => setNewReward(p => ({ ...p,label:e.target.value }))} placeholder="新增獎品名稱" />
                <input style={{ width:80,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:13 }} type="number" value={newReward.cost} onChange={e => setNewReward(p => ({ ...p,cost:e.target.value }))} />
                <span style={{ fontSize:11,color:"#94a3b8" }}>分</span>
                <button style={{ padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer" }} onClick={addReward}>＋ 新增</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 戳章動畫 */}
      {justStamped && (
        <div style={{ position:"fixed",top:"38%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#fde68a,#f59e0b)",color:"#fff",fontWeight:900,fontSize:26,padding:"18px 36px",borderRadius:22,boxShadow:"0 8px 32px #f59e0b66",zIndex:999,pointerEvents:"none" }}>
          ⭐ 獲得今日戳章！
        </div>
      )}

      {/* 兌換獎品確認 */}
      {redeemTarget && (
        <div style={{ position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)" }} onClick={() => setRedeemTarget(null)}>
          <div style={{ background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48 }}>🎁</div>
            <div style={{ fontSize:22,fontWeight:900,margin:"10px 0 8px" }}>確認兌換？</div>
            <p style={{ fontSize:14,color:"#475569",margin:"0 0 4px" }}>{redeemTarget.label}</p>
            <p style={{ fontSize:20,fontWeight:900,color:"#f97316",margin:"4px 0" }}>消耗 {redeemTarget.cost} 分</p>
            <p style={{ fontSize:12,color:"#94a3b8",margin:"0 0 16px" }}>兌換後剩餘：{data.totalScore - redeemTarget.cost} 分</p>
            <div style={{ display:"flex",gap:10 }}>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }} onClick={() => setRedeemTarget(null)}>取消</button>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14 }} onClick={() => doRedeemReward(redeemTarget)}>✅ 確認兌換</button>
            </div>
          </div>
        </div>
      )}

      {/* 戳章兌換確認 */}
      {showStampRedeem && (
        <div style={{ position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)" }} onClick={() => setShowStampRedeem(false)}>
          <div style={{ background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48 }}>🏅</div>
            <div style={{ fontSize:22,fontWeight:900,margin:"10px 0 8px" }}>兌換戳章獎勵</div>
            <p style={{ fontSize:14,color:"#475569" }}>集滿 {STAMP_THRESHOLD} 枚戳章，可以向爸媽要求一個獎勵！</p>
            <p style={{ fontSize:18,fontWeight:900,color:"#f97316" }}>可兌換 {redeemable} 次</p>
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }} onClick={() => setShowStampRedeem(false)}>取消</button>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14 }} onClick={doRedeemStamp}>✅ 確認兌換</button>
            </div>
          </div>
        </div>
      )}

      {/* 家長登入 */}
      {showAdminLogin && (
        <div style={{ position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)" }}
          onClick={() => { setShowAdminLogin(false); setAdminPwd(""); setAdminErr(false); }}>
          <div style={{ background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:40 }}>🔒</div>
            <div style={{ fontSize:22,fontWeight:900,margin:"10px 0 8px" }}>家長模式</div>
            <p style={{ fontSize:13,color:"#64748b",marginBottom:12 }}>預設密碼：<b>parent123</b>（可修改 App.jsx 中的 ADMIN_PASSWORD）</p>
            <input
              type="password"
              style={{ width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:16,marginBottom:8,boxSizing:"border-box",outline:"none" }}
              value={adminPwd}
              onChange={e => { setAdminPwd(e.target.value); setAdminErr(false); }}
              onKeyDown={e => e.key === "Enter" && tryAdminLogin()}
              placeholder="輸入密碼"
              autoFocus
            />
            {adminErr && <p style={{ color:"#ef4444",fontSize:13,marginBottom:8 }}>密碼錯誤！</p>}
            <div style={{ display:"flex",gap:10,marginTop:8 }}>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }}
                onClick={() => { setShowAdminLogin(false); setAdminPwd(""); setAdminErr(false); }}>取消</button>
              <button style={{ flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14 }}
                onClick={tryAdminLogin}>進入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
