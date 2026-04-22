import { useState, useEffect, useCallback } from "react";

const DEFAULT_DAILY_TASKS = [
  { id: "d1", label: "閱讀 20 分鐘 📚" },
  { id: "d2", label: "整理房間 🧹" },
  { id: "d3", label: "練習才藝 🎹" },
];
const DEFAULT_WEEKLY_TASKS = [
  { id: "w1",  label: "幫忙洗碗 🍽️",      score: 1 },
  { id: "w2",  label: "澆花 🌱",           score: 1 },
  { id: "w3",  label: "幫忙曬衣服 👕",     score: 2 },
  { id: "w4",  label: "倒垃圾 🗑️",        score: 1 },
  { id: "w5",  label: "整理書包 🎒",       score: 1 },
  { id: "w6",  label: "幫忙擦桌子 🧽",     score: 1 },
  { id: "w7",  label: "自己洗澡不催促 🛁", score: 2 },
  { id: "w8",  label: "提早完成作業 ✏️",   score: 3 },
  { id: "w9",  label: "主動學英文 🔤",     score: 3 },
  { id: "w10", label: "幫助家人 ❤️",       score: 2 },
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
const STAMP_THRESHOLD = 7;
const ALLOWANCE_AMOUNT = 50;
const ADMIN_PASSWORD = "parent123";

const todayKey = () => new Date().toISOString().slice(0, 10);
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); };
const uid = () => Math.random().toString(36).slice(2, 8);

const loadStorage = async () => { try { const r = localStorage.getItem("kids_tracker_v5"); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveStorage = async (data) => { try { localStorage.setItem("kids_tracker_v5", JSON.stringify(data)); } catch {} };
const initData = () => ({
  stamps: {}, bonusProgress: {}, totalScore: 0,
  redeemHistory: [], allowanceHistory: [], allowanceRedeemed: 0,
  dailyProgress: {}, dailyTasks: DEFAULT_DAILY_TASKS,
  weeklyTasks: DEFAULT_WEEKLY_TASKS, rewards: DEFAULT_REWARDS,
});

// ── 貓咪 SVG ─────────────────────────────────────────────

const CatEmpty = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="15,35 5,8 30,26" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round"/>
    <polygon points="18,32 10,13 28,25" fill="#FBCFE8"/>
    <polygon points="65,35 75,8 50,26" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round"/>
    <polygon points="62,32 70,13 52,25" fill="#FBCFE8"/>
    <ellipse cx="40" cy="50" rx="28" ry="23" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2"/>
    <ellipse cx="30" cy="46" rx="5" ry="6" fill="#94A3B8"/>
    <ellipse cx="50" cy="46" rx="5" ry="6" fill="#94A3B8"/>
    <ellipse cx="31.5" cy="43.5" rx="1.8" ry="2.5" fill="white"/>
    <ellipse cx="51.5" cy="43.5" rx="1.8" ry="2.5" fill="white"/>
    <path d="M37 54 L40 57 L43 54 Z" fill="#E2E8F0"/>
    <path d="M37 57 Q40 61 43 57" stroke="#CBD5E1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="8"  y1="52" x2="32" y2="54" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="8"  y1="57" x2="32" y2="57" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="72" y1="52" x2="48" y2="54" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="72" y1="57" x2="48" y2="57" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const CatFilled = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* glow */}
    <ellipse cx="40" cy="50" rx="34" ry="29" fill="#FDE68A" opacity="0.45"/>
    {/* ears */}
    <polygon points="15,35 5,8 30,26" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="18,32 10,13 28,25" fill="#FDE68A"/>
    <polygon points="65,35 75,8 50,26" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="62,32 70,13 52,25" fill="#FDE68A"/>
    {/* head */}
    <ellipse cx="40" cy="50" rx="28" ry="23" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"/>
    {/* forehead stripes */}
    <path d="M32,31 Q40,26 48,31" stroke="#F59E0B" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M35,27 Q40,23 45,27" stroke="#F59E0B" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    {/* blush */}
    <ellipse cx="23" cy="53" rx="6" ry="4" fill="#FCA5A5" opacity="0.65"/>
    <ellipse cx="57" cy="53" rx="6" ry="4" fill="#FCA5A5" opacity="0.65"/>
    {/* happy crescent eyes */}
    <path d="M25,45 Q30,39 35,45" stroke="#92400E" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M45,45 Q50,39 55,45" stroke="#92400E" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    {/* nose */}
    <path d="M37,55 L40,58 L43,55 Z" fill="#F97316"/>
    {/* mouth */}
    <path d="M36,58 Q40,63 44,58" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* whiskers */}
    <line x1="8"  y1="52" x2="33" y2="55" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8"  y1="58" x2="33" y2="58" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="72" y1="52" x2="47" y2="55" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="72" y1="58" x2="47" y2="58" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
    {/* sparkles */}
    <text x="1"  y="16" fontSize="13">⭐</text>
    <text x="60" y="14" fontSize="11">✨</text>
  </svg>
);

const CatCelebrate = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="50" rx="36" ry="31" fill="#FDE68A" opacity="0.38"/>
    <polygon points="15,35 5,8 30,26" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="18,32 10,13 28,25" fill="#FDE68A"/>
    <polygon points="65,35 75,8 50,26" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round"/>
    <polygon points="62,32 70,13 52,25" fill="#FDE68A"/>
    <ellipse cx="40" cy="50" rx="28" ry="23" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"/>
    <path d="M32,31 Q40,26 48,31" stroke="#F59E0B" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <ellipse cx="23" cy="53" rx="7" ry="4.5" fill="#FCA5A5" opacity="0.72"/>
    <ellipse cx="57" cy="53" rx="7" ry="4.5" fill="#FCA5A5" opacity="0.72"/>
    {/* big happy eyes */}
    <path d="M23,44 Q30,36 37,44" stroke="#92400E" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
    <path d="M43,44 Q50,36 57,44" stroke="#92400E" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
    <path d="M37,55 L40,59 L43,55 Z" fill="#F97316"/>
    <path d="M35,59 Q40,65 45,59" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <line x1="7"  y1="51" x2="33" y2="55" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="7"  y1="57" x2="33" y2="57" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="73" y1="51" x2="47" y2="55" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="73" y1="57" x2="47" y2="57" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round"/>
    <text x="0"  y="14" fontSize="13">🌟</text>
    <text x="60" y="12" fontSize="12">⭐</text>
    <text x="28" y="6"  fontSize="11">✨</text>
  </svg>
);

// ── 主元件 ────────────────────────────────────────────────
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
  const [showAllowance, setShowAllowance] = useState(false);
  const [allowanceJustDone, setAllowanceJustDone] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [newWeekly, setNewWeekly] = useState({ label: "", score: 1 });
  const [newReward, setNewReward] = useState({ label: "", cost: 10 });

  useEffect(() => { loadStorage().then(d => { setData(d || initData()); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded && data) saveStorage(data); }, [data, loaded]);

  const today = todayKey();
  const dailyProgress = data?.dailyProgress?.[today] || {};
  const allDailyDone = data ? data.dailyTasks.every(t => dailyProgress[t.id]) : false;
  const hasStampToday = data?.stamps?.[today] || false;
  const totalStamps = data ? Object.keys(data.stamps || {}).length : 0;
  const allowanceRedeemed = data?.allowanceRedeemed || 0;
  const redeemable = Math.floor(totalStamps / STAMP_THRESHOLD) - allowanceRedeemed;
  const cycleStamps = Math.min(totalStamps - allowanceRedeemed * STAMP_THRESHOLD, STAMP_THRESHOLD);
  const todayBonus = data?.bonusProgress?.[today] || {};
  const todayBonusScore = data ? data.weeklyTasks.reduce((s, t) => s + (todayBonus[t.id] ? t.score : 0), 0) : 0;
  const ws = weekStart();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, day: DAYS_ZH[i], isToday: key === today, hasStamp: data?.stamps?.[key] };
  });

  const update = fn => setData(prev => fn(JSON.parse(JSON.stringify(prev))));

  const toggleDaily = taskId => update(d => {
    if (!d.dailyProgress[today]) d.dailyProgress[today] = {};
    d.dailyProgress[today][taskId] = !d.dailyProgress[today][taskId];
    if (d.dailyTasks.every(t => d.dailyProgress[today][t.id]) && !d.stamps[today]) {
      d.stamps[today] = true;
      setJustStamped(true); setTimeout(() => setJustStamped(false), 3200);
    }
    return d;
  });

  const completeBonus = task => update(d => {
    if (!d.bonusProgress[today]) d.bonusProgress[today] = {};
    if (d.bonusProgress[today][task.id]) return d;
    d.bonusProgress[today][task.id] = true;
    d.totalScore += task.score;
    return d;
  });

  const doRedeemReward = reward => {
    update(d => {
      if (d.totalScore < reward.cost) return d;
      d.totalScore -= reward.cost;
      d.redeemHistory.unshift({ id: uid(), rewardLabel: reward.label, cost: reward.cost, date: today });
      return d;
    });
    setRedeemTarget(null);
  };

  const doRedeemAllowance = () => {
    update(d => {
      d.allowanceRedeemed = (d.allowanceRedeemed || 0) + 1;
      if (!d.allowanceHistory) d.allowanceHistory = [];
      d.allowanceHistory.unshift({ id: uid(), date: today, amount: ALLOWANCE_AMOUNT });
      return d;
    });
    setShowAllowance(false);
    setAllowanceJustDone(true); setTimeout(() => setAllowanceJustDone(false), 2800);
  };

  const tryAdminLogin = () => { if (adminPwd === ADMIN_PASSWORD) { setAdminMode(true); setShowAdminLogin(false); setAdminPwd(""); setAdminErr(false); } else setAdminErr(true); };

  const saveWeeklyEdit = () => { if (!editingWeekly?.label.trim()) return; update(d => { const i = d.weeklyTasks.findIndex(t => t.id === editingWeekly.id); if (i >= 0) d.weeklyTasks[i] = { ...editingWeekly, score: Number(editingWeekly.score)||1 }; return d; }); setEditingWeekly(null); };
  const deleteWeekly = id => update(d => { d.weeklyTasks = d.weeklyTasks.filter(t => t.id !== id); return d; });
  const addWeekly = () => { if (!newWeekly.label.trim()) return; update(d => { d.weeklyTasks.push({ id:"w"+uid(), label:newWeekly.label.trim(), score:Number(newWeekly.score)||1 }); return d; }); setNewWeekly({ label:"", score:1 }); };
  const saveRewardEdit = () => { if (!editingReward?.label.trim()) return; update(d => { const i = d.rewards.findIndex(r => r.id === editingReward.id); if (i >= 0) d.rewards[i] = { ...editingReward, cost:Number(editingReward.cost)||1 }; return d; }); setEditingReward(null); };
  const deleteReward = id => update(d => { d.rewards = d.rewards.filter(r => r.id !== id); return d; });
  const addReward = () => { if (!newReward.label.trim()) return; update(d => { d.rewards.push({ id:"r"+uid(), label:newReward.label.trim(), cost:Number(newReward.cost)||1 }); return d; }); setNewReward({ label:"", cost:10 }); };

  const exportData = useCallback(() => { setGdExporting(true); const b = new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href=u; a.download=`kids_tracker_${today}.json`; a.click(); URL.revokeObjectURL(u); setGdExporting(false); }, [data, today]);
  const importData = e => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => { try { setData({...initData(),...JSON.parse(ev.target.result)}); } catch { alert("格式錯誤！"); } }; r.readAsText(f); };

  if (!loaded) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:16,background:"#fef9c3",fontFamily:"sans-serif"}}><CatFilled size={72}/><p style={{color:"#f59e0b",fontSize:16}}>載入中…</p></div>;

  const bge = (bg, color) => ({ background:bg, color, fontSize:12, padding:"2px 8px", borderRadius:99, fontWeight:700, whiteSpace:"nowrap" });
  const inp = { border:"1.5px solid #e2e8f0", borderRadius:8, padding:"6px 10px", fontSize:13, outline:"none" };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fef9c3 0%,#fce7f3 50%,#dbeafe 100%)",fontFamily:"'Segoe UI','PingFang TC',sans-serif",position:"relative",overflow:"hidden",paddingBottom:48}}>
      <div style={{position:"fixed",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,#fde68a55,#fb7185aa)",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,#a5f3fc55,#818cf8aa)",zIndex:0}}/>

      {/* Header */}
      <div style={{position:"relative",zIndex:1,background:"linear-gradient(135deg,#f97316,#ec4899)",padding:"18px 16px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px #f9731644"}}>
        <CatFilled size={42}/>
        <h1 style={{flex:1,margin:0,color:"#fff",fontSize:21,fontWeight:900,letterSpacing:2,textShadow:"0 2px 8px #00000033"}}>楷芯的任務</h1>
        <div style={{background:"#fff3",borderRadius:14,padding:"6px 14px",textAlign:"center"}}>
          <span style={{display:"block",color:"#fef3c7",fontSize:10}}>積分</span>
          <span style={{display:"block",color:"#fff",fontSize:26,fontWeight:900}}>{data.totalScore}</span>
        </div>
        <button style={{background:"#fff3",border:"none",borderRadius:10,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18}} onClick={()=>adminMode?setAdminMode(false):setShowAdminLogin(true)}>{adminMode?"🔓":"🔒"}</button>
      </div>

      {/* 週曆貓咪戳章 */}
      <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"center",gap:2,padding:"12px 4px 8px",background:"#fff8",backdropFilter:"blur(8px)"}}>
        {weekDays.map(({key,day,isToday,hasStamp})=>(
          <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 4px",borderRadius:14,minWidth:44,
            ...(isToday?{background:"linear-gradient(135deg,#fde68a,#fbbf24)",boxShadow:"0 3px 10px #f59e0b55"}:{})}}>
            <div style={{fontSize:10,color:isToday?"#92400e":"#6b7280",fontWeight:800}}>週{day}</div>
            {hasStamp ? <CatFilled size={42}/> : <CatEmpty size={42}/>}
            {isToday && !hasStamp && <div style={{fontSize:8,color:"#f97316",fontWeight:900}}>今天</div>}
          </div>
        ))}
      </div>

      {/* 資訊卡 */}
      <div style={{position:"relative",zIndex:1,display:"flex",gap:8,padding:"10px 12px"}}>
        {[{icon:"🐱",val:totalStamps,lbl:"總貓咪章"},{icon:"💰",val:redeemable,lbl:"可領零用錢"},{icon:"✨",val:data.totalScore,lbl:"總積分"}].map(({icon,val,lbl})=>(
          <div key={lbl} style={{flex:1,background:"#ffffffcc",borderRadius:14,padding:"10px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 10px #00000011"}}>
            <div style={{fontSize:22}}>{icon}</div>
            <div><div style={{fontSize:20,fontWeight:900,color:"#1e293b",lineHeight:1}}>{val}</div><div style={{fontSize:10,color:"#94a3b8"}}>{lbl}</div></div>
          </div>
        ))}
      </div>

      {/* 集章進度 */}
      <div style={{position:"relative",zIndex:1,margin:"0 12px 10px",background:"#ffffffcc",borderRadius:20,padding:"14px 16px",boxShadow:"0 2px 12px #00000011"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:900,fontSize:13,color:"#1e293b"}}>🐱 集貓咪章 × {STAMP_THRESHOLD} 枚領零用錢</div>
          <div style={{fontSize:12,color:"#64748b",fontWeight:700}}>{cycleStamps} / {STAMP_THRESHOLD}</div>
        </div>
        {/* 7 格貓咪點點 */}
        <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:10}}>
          {Array.from({length:STAMP_THRESHOLD},(_,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              {i < cycleStamps ? <CatFilled size={36}/> : <CatEmpty size={36}/>}
              <div style={{width:6,height:6,borderRadius:"50%",background:i<cycleStamps?"#f59e0b":"#e2e8f0",transition:"background .3s"}}/>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:12,color:cycleStamps>=STAMP_THRESHOLD?"#16a34a":"#94a3b8",fontWeight:cycleStamps>=STAMP_THRESHOLD?800:400,marginBottom:redeemable>0?10:0}}>
          {cycleStamps < STAMP_THRESHOLD ? `再集 ${STAMP_THRESHOLD-cycleStamps} 枚就可以領 $${ALLOWANCE_AMOUNT} 元零用錢 🎉` : "🎊 已集滿！快去領零用錢吧～"}
        </div>
        {redeemable > 0 && (
          <button style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:13,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 4px 16px #22c55e55",letterSpacing:1}} onClick={()=>setShowAllowance(true)}>
            💰 領取 ${ALLOWANCE_AMOUNT} 元零用錢 ×{redeemable}
          </button>
        )}
        {data.allowanceHistory?.length > 0 && (
          <div style={{marginTop:12,borderTop:"1px solid #f1f5f9",paddingTop:10}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>零用錢領取紀錄</div>
            {data.allowanceHistory.slice(0,5).map(h=>(
              <div key={h.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#475569",padding:"3px 0"}}>
                <span>{h.date}</span><span style={{color:"#16a34a",fontWeight:700}}>+${h.amount} 元</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{position:"relative",zIndex:1,display:"flex",margin:"0 12px 10px",background:"#e2e8f0",borderRadius:14,padding:3}}>
        {[["daily","📋 每日"],["weekly","⭐ 獎勵"],["shop","🏪 商店"],["sync","☁️ 同步"]].map(([k,l])=>(
          <button key={k} style={{flex:1,padding:"7px 0",background:tab===k?"#fff":"none",border:"none",borderRadius:11,fontSize:12,fontWeight:700,color:tab===k?"#f97316":"#64748b",cursor:"pointer",transition:"all .2s",boxShadow:tab===k?"0 2px 8px #00000015":"none"}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* 每日任務 */}
      {tab==="daily" && (
        <div style={{position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            今天的任務 {hasStampToday && <span style={bge("#fde68a","#92400e")}>🐱 已獲貓咪章</span>}
          </div>
          {data.dailyTasks.map(t=>{
            const done = dailyProgress[t.id];
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",marginBottom:7,background:done?"#f0fdf4":"#f8fafc",borderRadius:12,cursor:"pointer",border:done?"2px solid #86efac":"2px solid transparent",userSelect:"none"}} onClick={()=>toggleDaily(t.id)}>
              <div style={{width:26,height:26,borderRadius:"50%",border:done?"none":"2px solid #cbd5e1",background:done?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
              <span style={{textDecoration:done?"line-through":"none",opacity:done?0.5:1,flex:1}}>{t.label}</span>
            </div>;
          })}
          {allDailyDone && <div style={{marginTop:10,padding:12,background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",borderRadius:12,textAlign:"center",color:"#15803d",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><CatFilled size={30}/> 今天全部完成！獲得貓咪章！ <CatFilled size={30}/></div>}
        </div>
      )}

      {/* 獎勵任務 */}
      {tab==="weekly" && (
        <div style={{position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            今日獎勵任務 <span style={bge("#dcfce7","#15803d")}>今日得 {todayBonusScore} 分</span>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>✅ 完成後不可取消，每天重新開始</div>
          {data.weeklyTasks.map(t=>{
            const done = todayBonus[t.id];
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",marginBottom:7,background:done?"#fef9c3":"#f8fafc",borderRadius:12,cursor:done?"default":"pointer",border:done?"2px solid #fde68a":"2px solid transparent",userSelect:"none",opacity:done?0.78:1,transition:"all .2s"}} onClick={()=>!done&&completeBonus(t)}>
              <div style={{width:26,height:26,borderRadius:"50%",border:done?"none":"2px solid #cbd5e1",background:done?"#f59e0b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
              <span style={{flex:1,textDecoration:done?"line-through":"none",opacity:done?0.6:1}}>{t.label}</span>
              <span style={bge(done?"#d1fae5":"#fde68a",done?"#065f46":"#92400e")}>{done?`+${t.score}分 ✓`:`+${t.score}分`}</span>
            </div>;
          })}
        </div>
      )}

      {/* 商店 */}
      {tab==="shop" && (
        <div style={{position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>🏪 獎品商店 <span style={bge("#dbeafe","#1e40af")}>餘額 {data.totalScore} 分</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {data.rewards.map(r=>{const c=data.totalScore>=r.cost; return <div key={r.id} style={{background:"#f8fafc",borderRadius:16,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 2px 10px #00000010",opacity:c?1:0.5}}>
              <div style={{fontSize:14,fontWeight:700,textAlign:"center",color:"#1e293b"}}>{r.label}</div>
              <div style={{fontSize:20,fontWeight:900,color:"#f97316"}}>{r.cost} 分</div>
              <button style={{width:"100%",padding:"8px",background:c?"linear-gradient(135deg,#f97316,#ec4899)":"#e2e8f0",border:"none",borderRadius:10,color:c?"#fff":"#94a3b8",fontWeight:800,fontSize:13,cursor:c?"pointer":"not-allowed"}} disabled={!c} onClick={()=>setRedeemTarget(r)}>{c?"兌換 🎉":"積分不足"}</button>
            </div>;})}
          </div>
          {data.redeemHistory?.length > 0 && <div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:800,color:"#64748b",marginBottom:8}}>兌換紀錄</div>{data.redeemHistory.slice(0,8).map(h=><div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8fafc",borderRadius:10,marginBottom:5,fontSize:13}}><span style={{flex:1}}>{h.rewardLabel}</span><span style={{color:"#ef4444",fontWeight:700}}>-{h.cost}分</span><span style={{color:"#94a3b8",fontSize:11}}>{h.date}</span></div>)}</div>}
        </div>
      )}

      {/* 同步 */}
      {tab==="sync" && (
        <div style={{position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12}}>☁️ Google Drive 同步</div>
          <p style={{fontSize:13,color:"#64748b",lineHeight:1.7,marginBottom:16}}>匯出 JSON 後手動存入 Google Drive；還原時再匯入。</p>
          <button style={{display:"block",width:"100%",padding:"12px",marginBottom:8,background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}} onClick={exportData} disabled={gdExporting}>{gdExporting?"匯出中…":"📥 匯出資料"}</button>
          <div style={{textAlign:"center",color:"#94a3b8",margin:"8px 0",fontSize:13}}>── 或 ──</div>
          <label style={{display:"block",width:"100%",padding:"12px",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center",boxSizing:"border-box"}}>📤 從檔案匯入<input type="file" accept=".json" style={{display:"none"}} onChange={importData}/></label>
          <div style={{marginTop:16,padding:12,background:"#f8fafc",borderRadius:12,fontSize:13,color:"#475569",lineHeight:1.9}}>
            <b>目前資料：</b><br/>總貓咪章：{totalStamps} 枚 | 已領零用錢：{allowanceRedeemed} 次<br/>總積分：{data.totalScore} | 兌換紀錄：{data.redeemHistory?.length||0} 筆
          </div>
        </div>
      )}

      {/* 家長管理面板 */}
      {adminMode && (
        <div style={{position:"relative",zIndex:1,margin:"10px 12px 0",background:"#fffbeb",borderRadius:18,padding:14,border:"2px solid #f97316",boxShadow:"0 4px 20px #f9731622"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#f97316",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            🔓 家長管理模式
            <div style={{display:"inline-flex",background:"#f1f5f9",borderRadius:10,padding:2,gap:2}}>
              {[["weekly","獎勵任務"],["rewards","獎品"]].map(([k,l])=><button key={k} style={{padding:"4px 12px",background:adminTab===k?"#fff":"none",border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:adminTab===k?"#f97316":"#64748b",cursor:"pointer"}} onClick={()=>setAdminTab(k)}>{l}</button>)}
            </div>
          </div>
          {adminTab==="weekly" && <div>
            {data.weeklyTasks.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {editingWeekly?.id===t.id ? <>
                <input style={{...inp,flex:1,minWidth:80}} value={editingWeekly.label} onChange={e=>setEditingWeekly(p=>({...p,label:e.target.value}))}/>
                <input style={{...inp,width:60}} type="number" value={editingWeekly.score} onChange={e=>setEditingWeekly(p=>({...p,score:e.target.value}))}/>
                <span style={{fontSize:11,color:"#94a3b8"}}>分</span>
                <button style={{padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveWeeklyEdit}>✓</button>
                <button style={{padding:"5px 10px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingWeekly(null)}>✕</button>
              </> : <>
                <span style={{flex:1,fontSize:13}}>{t.label}</span>
                <span style={bge("#fde68a","#92400e")}>{t.score}分</span>
                <button style={{padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>setEditingWeekly({...t})}>✏️</button>
                <button style={{padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>deleteWeekly(t.id)}>🗑</button>
              </>}
            </div>)}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <input style={{...inp,flex:1,minWidth:80}} value={newWeekly.label} onChange={e=>setNewWeekly(p=>({...p,label:e.target.value}))} placeholder="新增任務名稱"/>
              <input style={{...inp,width:60}} type="number" value={newWeekly.score} onChange={e=>setNewWeekly(p=>({...p,score:e.target.value}))}/>
              <span style={{fontSize:11,color:"#94a3b8"}}>分</span>
              <button style={{padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addWeekly}>＋ 新增</button>
            </div>
          </div>}
          {adminTab==="rewards" && <div>
            {data.rewards.map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {editingReward?.id===r.id ? <>
                <input style={{...inp,flex:1,minWidth:80}} value={editingReward.label} onChange={e=>setEditingReward(p=>({...p,label:e.target.value}))}/>
                <input style={{...inp,width:80}} type="number" value={editingReward.cost} onChange={e=>setEditingReward(p=>({...p,cost:e.target.value}))}/>
                <span style={{fontSize:11,color:"#94a3b8"}}>分</span>
                <button style={{padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveRewardEdit}>✓</button>
                <button style={{padding:"5px 10px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingReward(null)}>✕</button>
              </> : <>
                <span style={{flex:1,fontSize:13}}>{r.label}</span>
                <span style={bge("#dbeafe","#1e40af")}>{r.cost}分</span>
                <button style={{padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>setEditingReward({...r})}>✏️</button>
                <button style={{padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>deleteReward(r.id)}>🗑</button>
              </>}
            </div>)}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <input style={{...inp,flex:1,minWidth:80}} value={newReward.label} onChange={e=>setNewReward(p=>({...p,label:e.target.value}))} placeholder="新增獎品名稱"/>
              <input style={{...inp,width:80}} type="number" value={newReward.cost} onChange={e=>setNewReward(p=>({...p,cost:e.target.value}))}/>
              <span style={{fontSize:11,color:"#94a3b8"}}>分</span>
              <button style={{padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addReward}>＋ 新增</button>
            </div>
          </div>}
        </div>
      )}

      {/* 貓咪章慶祝 popup */}
      {justStamped && (
        <div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#fef9c3,#fde68a)",padding:"24px 36px",borderRadius:28,boxShadow:"0 8px 48px #f59e0b99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #fbbf24"}}>
          <CatCelebrate size={100}/><div style={{color:"#92400e",fontWeight:900,fontSize:22,marginTop:6}}>🎉 獲得貓咪章！</div>
        </div>
      )}

      {/* 領零用錢慶祝 */}
      {allowanceJustDone && (
        <div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",padding:"24px 36px",borderRadius:28,boxShadow:"0 8px 48px #22c55e99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #22c55e"}}>
          <div style={{fontSize:72}}>💰</div><div style={{color:"#14532d",fontWeight:900,fontSize:22,marginTop:6}}>領到 ${ALLOWANCE_AMOUNT} 元零用錢！</div>
        </div>
      )}

      {/* 零用錢確認 modal */}
      {showAllowance && (
        <div style={{position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}} onClick={()=>setShowAllowance(false)}>
          <div style={{background:"#fff",borderRadius:28,padding:"32px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 48px #00000033",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <CatCelebrate size={90}/>
            <div style={{fontSize:22,fontWeight:900,margin:"12px 0 8px",color:"#1e293b"}}>領取零用錢</div>
            <p style={{fontSize:14,color:"#475569"}}>已集滿 {STAMP_THRESHOLD} 枚貓咪章！</p>
            <div style={{fontSize:38,fontWeight:900,color:"#16a34a",margin:"10px 0"}}>💰 ${ALLOWANCE_AMOUNT} 元</div>
            <p style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>可領 {redeemable} 次　|　貓咪章紀錄繼續累積</p>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button style={{flex:1,padding:12,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>setShowAllowance(false)}>取消</button>
              <button style={{flex:1,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14}} onClick={doRedeemAllowance}>✅ 確認領取</button>
            </div>
          </div>
        </div>
      )}

      {/* 兌換獎品 modal */}
      {redeemTarget && (
        <div style={{position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}} onClick={()=>setRedeemTarget(null)}>
          <div style={{background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:52}}>🎁</div>
            <div style={{fontSize:22,fontWeight:900,margin:"10px 0 8px"}}>確認兌換？</div>
            <p style={{fontSize:14,color:"#475569",margin:"0 0 4px"}}>{redeemTarget.label}</p>
            <p style={{fontSize:20,fontWeight:900,color:"#f97316",margin:"4px 0"}}>消耗 {redeemTarget.cost} 分</p>
            <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>兌換後剩餘：{data.totalScore-redeemTarget.cost} 分</p>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>setRedeemTarget(null)}>取消</button>
              <button style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14}} onClick={()=>doRedeemReward(redeemTarget)}>✅ 確認兌換</button>
            </div>
          </div>
        </div>
      )}

      {/* 家長登入 modal */}
      {showAdminLogin && (
        <div style={{position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}} onClick={()=>{setShowAdminLogin(false);setAdminPwd("");setAdminErr(false);}}>
          <div style={{background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40}}>🔒</div>
            <div style={{fontSize:22,fontWeight:900,margin:"10px 0 8px"}}>家長模式</div>
            <p style={{fontSize:13,color:"#64748b",marginBottom:12}}>預設密碼：<b>parent123</b></p>
            <input type="password" style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:16,marginBottom:8,boxSizing:"border-box",outline:"none"}} value={adminPwd} onChange={e=>{setAdminPwd(e.target.value);setAdminErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryAdminLogin()} placeholder="輸入密碼" autoFocus/>
            {adminErr && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>密碼錯誤！</p>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>{setShowAdminLogin(false);setAdminPwd("");setAdminErr(false);}}>取消</button>
              <button style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14}} onClick={tryAdminLogin}>進入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
