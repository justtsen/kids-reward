import { useState, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const DAYS_ZH   = ["日","一","二","三","四","五","六"];
const DAYS_FULL = ["週日","週一","週二","週三","週四","週五","週六"];
const STAMP_MIN  = 3;
const STAMP_FULL = 5;
const STAMP_THRESHOLD  = 7;
const ALLOWANCE_AMOUNT = 50;
const ADMIN_PASSWORD   = "parent123";

const KIDS = [
  {
    id:"kaixian", name:"楷芯", emoji:"🐱",
    color:"#f97316", grad:"linear-gradient(135deg,#f97316,#ec4899)",
    defaultSchedule: {
      0: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
      1: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
      2: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","HESS 複習＆作業 📝"],
      3: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
      4: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
      5: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
      6: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","HESS 複習＆作業 📝"],
    },
    defaultBonus: [
      { id:"w1",  label:"背五個單字 📖",    score:1  },
      { id:"w2",  label:"預習國語 📗",       score:1  },
      { id:"w3",  label:"預習數學 📐",       score:1  },
      { id:"w4",  label:"預習自然 🔬",       score:1  },
      { id:"w5",  label:"預習社會 🌏",       score:1  },
      { id:"w6",  label:"複習國語 📗",       score:1  },
      { id:"w7",  label:"複習數學 📐",       score:1  },
      { id:"w8",  label:"複習自然 🔬",       score:1  },
      { id:"w9",  label:"複習社會 🌏",       score:1  },
      { id:"w10", label:"跳繩 200 下 🪢",   score:1  },
      { id:"w11", label:"幫忙收衣服 👕",     score:1  },
      { id:"w12", label:"幫忙洗碗筷 🍽️",   score:1  },
      { id:"w13", label:"冷靜讓妹妹 🕊️",   score:2  },
      { id:"w14", label:"國甲乙本 甲上 📒", score:5  },
      { id:"w15", label:"圈詞本 甲上 📒",   score:5  },
      { id:"w16", label:"數練 90 分 🔢",    score:1  },
      { id:"w17", label:"數練 100 分 🔢",   score:5  },
      { id:"w18", label:"大考 90 分 🏅",    score:1  },
      { id:"w19", label:"大考 95 分 🥈",    score:5  },
      { id:"w20", label:"大考 100 分 🥇",   score:10 },
    ],
    defaultDeductions: [
      { id:"d1", label:"頂嘴 😤",         score:2 },
      { id:"d2", label:"不收書包 🎒",     score:1 },
      { id:"d3", label:"沒刷牙就睡 🪥",  score:2 },
      { id:"d4", label:"亂發脾氣 😠",     score:2 },
    ],
    defaultRewards: [
      { id:"r1", label:"遊戲 1 分鐘 🎮", cost:1     },
      { id:"r2", label:"遊戲 5 分鐘 🎮", cost:5     },
      { id:"r3", label:"文具 ✏️",         cost:100   },
      { id:"r4", label:"書 📖",           cost:200   },
      { id:"r5", label:"小玩具 🧸",       cost:500   },
      { id:"r6", label:"大玩具 🎁",       cost:1000  },
      { id:"r7", label:"狗狗一隻 🐕",     cost:10000 },
    ],
  },
  {
    id:"xingyu", name:"星瑀", emoji:"🌟",
    color:"#6366f1", grad:"linear-gradient(135deg,#6366f1,#06b6d4)",
    defaultSchedule: {
      0: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      1: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      2: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      3: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      4: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      5: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
      6: ["自己刷牙洗臉 🪥","自己睡覺","早餐不生氣","起床不生氣","唸英文書"],
    },
    defaultBonus: [
      { id:"w1", label:"幫忙自己收衣服 👕",   score:1 },
      { id:"w2", label:"不跟姊姊吵架", score:1 },
      { id:"w3", label:"自己整理玩具 🧸", score:1 },
      { id:"w4", label:"練習念英文", score:1 },
      { id:"w5", label:"跟阿公下圍棋 ❤️",    score:1 },
    ],
    defaultDeductions: [
      { id:"d1", label:"亂發脾氣 😠",    score:2 },
      { id:"d2", label:"不收玩具 🧸",    score:1 },
      { id:"d3", label:"沒刷牙就睡 🪥", score:2 },
    ],
    defaultRewards: [
      { id:"r1", label:"遊戲 5 分鐘 🎮", cost:5    },
      { id:"r2", label:"貼紙 🌟",         cost:20   },
      { id:"r3", label:"小零食 🍬",       cost:30   },
      { id:"r4", label:"小玩具 🧸",       cost:200  },
      { id:"r5", label:"大玩具 🎁",       cost:500  },
      { id:"r6", label:"貴賓狗娃娃",       cost:1000  },
    ],
  },
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const todayKey  = () => new Date().toISOString().slice(0,10);
const getDow    = () => new Date().getDay();
const uid       = () => Math.random().toString(36).slice(2,8);
const weekOf    = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0,10);
};
const weekStart = () => weekOf(todayKey());
const formatDate = (str) => {
  const d = new Date(str);
  return `${d.getMonth()+1}/${d.getDate()} 週${DAYS_ZH[d.getDay()]}`;
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr); d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
};

const STORE_KEY = (kidId) => `kids_v9_${kidId}`;
const loadKid = async (kidId) => {
  try { const r=localStorage.getItem(STORE_KEY(kidId)); return r?JSON.parse(r):null; } catch{return null;}
};
const saveKid = async (kidId, data) => {
  try { localStorage.setItem(STORE_KEY(kidId), JSON.stringify(data)); } catch{}
};
const initKid = (kid) => ({
  stamps: {}, stampType: {}, bonusProgress: {}, totalScore: 0,
  scoreLog: [],
  redeemHistory: [],
  allowanceHistory: [], allowanceRedeemed: 0,
  dailyProgress: {},
  schedule: kid.defaultSchedule,
  bonusTasks: kid.defaultBonus,
  deductions: kid.defaultDeductions,
  rewards: kid.defaultRewards,
});

/* ═══════════════════════════════════════════════
   STAMP EMOJI
═══════════════════════════════════════════════ */
const StampIcon = ({ level=0, size=40 }) => {
  const fs = size * 0.72;
  if (level===2) return <span style={{fontSize:fs,lineHeight:1,display:"block",textAlign:"center"}}>🐱</span>;
  if (level===1) return <span style={{fontSize:fs,lineHeight:1,display:"block",textAlign:"center"}}>🐾</span>;
  return <div style={{width:size,height:size,borderRadius:"50%",border:"2.5px dashed #CBD5E1",display:"flex",alignItems:"center",justifyContent:"center",color:"#CBD5E1",fontSize:size*0.28}}>○</div>;
};

/* ═══════════════════════════════════════════════
   MINI LINE CHART
═══════════════════════════════════════════════ */
const MiniChart = ({ data, color="#f97316" }) => {
  if (!data || data.length < 2) return <div style={{textAlign:"center",color:"#94a3b8",fontSize:12,padding:"20px 0"}}>資料不足</div>;
  const vals = data.map(d=>d.score);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max-min || 1;
  const W=280, H=80, pad=10;
  const pts = data.map((d,i)=>{
    const x = pad + (i/(data.length-1))*(W-pad*2);
    const y = H-pad-(((d.score-min)/range)*(H-pad*2));
    return {x,y,label:d.label,score:d.score};
  });
  const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color}/>
          <text x={p.x} y={H} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.label}</text>
          <text x={p.x} y={p.y-8} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{p.score>0?"+":""}{p.score}</text>
        </g>
      ))}
    </svg>
  );
};

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
export default function App() {
  const [activeKid, setActiveKid] = useState(null); // null = home screen
  const [kidData,   setKidData]   = useState({});
  const [loaded,    setLoaded]    = useState(false);

  // Load both kids
  useEffect(()=>{
    Promise.all(KIDS.map(k=>loadKid(k.id))).then(results=>{
      const d = {};
      KIDS.forEach((k,i)=>{ d[k.id]=results[i]||initKid(k); });
      setKidData(d); setLoaded(true);
    });
  },[]);

  // Save on change
  useEffect(()=>{
    if(!loaded) return;
    KIDS.forEach(k=>{ if(kidData[k.id]) saveKid(k.id, kidData[k.id]); });
  },[kidData,loaded]);

  if(!loaded) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:16,background:"#fef9c3",fontFamily:"sans-serif"}}>
      <span style={{fontSize:64}}>🐱</span><p style={{color:"#f59e0b"}}>載入中…</p>
    </div>
  );

  const updKid = (kidId, fn) => setKidData(prev=>{
    const next = JSON.parse(JSON.stringify(prev));
    next[kidId] = fn(next[kidId]);
    return next;
  });

  if(!activeKid) return <HomeScreen kids={KIDS} kidData={kidData} onSelect={setActiveKid}/>;

  const kid = KIDS.find(k=>k.id===activeKid);
  const data = kidData[activeKid];
  return (
    <KidScreen
      key={activeKid}
      kid={kid}
      data={data}
      onUpdate={fn=>updKid(activeKid, fn)}
      onBack={()=>setActiveKid(null)}
    />
  );
}

/* ═══════════════════════════════════════════════
   HOME SCREEN
═══════════════════════════════════════════════ */
function HomeScreen({ kids, kidData, onSelect }) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fef9c3 0%,#fce7f3 50%,#dbeafe 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,fontFamily:"'Segoe UI','PingFang TC',sans-serif",padding:"0 24px"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:8}}>🏠</div>
        <h1 style={{margin:0,fontSize:26,fontWeight:900,color:"#1e293b",letterSpacing:2}}>任務星球</h1>
        <p style={{margin:"8px 0 0",fontSize:14,color:"#64748b"}}>請選擇你是誰</p>
      </div>
      <div style={{display:"flex",gap:16,width:"100%",maxWidth:360}}>
        {kids.map(kid=>{
          const data = kidData[kid.id];
          const stamps = data ? Object.keys(data.stamps||{}).length : 0;
          const score  = data?.totalScore || 0;
          return(
            <button key={kid.id} onClick={()=>onSelect(kid.id)}
              style={{flex:1,padding:"28px 16px",background:"#fff",border:"3px solid transparent",borderRadius:24,cursor:"pointer",boxShadow:"0 4px 20px #00000015",transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}
              onMouseEnter={e=>{e.currentTarget.style.border=`3px solid ${kid.color}`;e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.border="3px solid transparent";e.currentTarget.style.transform="none";}}>
              <span style={{fontSize:52}}>{kid.emoji}</span>
              <div style={{fontSize:20,fontWeight:900,color:"#1e293b"}}>{kid.name}</div>
              <div style={{display:"flex",gap:12,fontSize:12,color:"#64748b"}}>
                <span>🐾 {stamps} 章</span>
                <span>✨ {score} 分</span>
              </div>
              <div style={{width:"100%",padding:"8px 0",background:kid.grad,borderRadius:12,color:"#fff",fontWeight:800,fontSize:14}}>進入 →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KID SCREEN
═══════════════════════════════════════════════ */
function KidScreen({ kid, data, onUpdate, onBack }) {
  const [tab,           setTab]           = useState("daily");
  const [justStamped,   setJustStamped]   = useState(null);
  const [adminMode,     setAdminMode]     = useState(false);
  const [showLogin,     setShowLogin]     = useState(false);
  const [adminPwd,      setAdminPwd]      = useState("");
  const [adminErr,      setAdminErr]      = useState(false);
  const [adminTab,      setAdminTab]      = useState("schedule");
  const [schedDay,      setSchedDay]      = useState(getDow());
  const [schedEditing,  setSchedEditing]  = useState(null);
  const [redeemTarget,  setRedeemTarget]  = useState(null);
  const [showAllowance, setShowAllowance] = useState(false);
  const [allowanceDone, setAllowanceDone] = useState(false);
  const [deductTarget,  setDeductTarget]  = useState(null);
  const [showMakeup,    setShowMakeup]    = useState(false);
  const [makeupDate,    setMakeupDate]    = useState(todayKey());
  const [editingBonus,  setEditingBonus]  = useState(null);
  const [editingDeduct, setEditingDeduct] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [newBonus,      setNewBonus]      = useState({label:"",score:1});
  const [newDeduct,     setNewDeduct]     = useState({label:"",score:1});
  const [newReward,     setNewReward]     = useState({label:"",cost:10});
  const [logFilter,     setLogFilter]     = useState("all"); // all|bonus|deduct|redeem
  const [chartWeeks,    setChartWeeks]    = useState(6);

  const today = todayKey();
  const dow   = getDow();
  const ws    = weekStart();

  const todayTasks = data.schedule?.[dow] || [];
  const dp         = data.dailyProgress?.[today] || {};
  const doneCount  = todayTasks.filter((_,i)=>dp[`t${i}`]).length;
  const todayStampType  = data.stampType?.[today]||null;
  const todayStampLevel = todayStampType==="cat"?2:todayStampType==="paw"?1:0;
  const totalStamps= Object.keys(data.stamps||{}).length;
  const alRed      = data.allowanceRedeemed||0;
  const redeemable = Math.floor(totalStamps/STAMP_THRESHOLD)-alRed;
  const cycleStamps= Math.min(totalStamps-alRed*STAMP_THRESHOLD, STAMP_THRESHOLD);
  const todayBonus = data.bonusProgress?.[today]||{};
  const bonusScore = data.bonusTasks.reduce((s,t)=>s+(todayBonus[t.id]?t.score:0),0);

  const weekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(ws); d.setDate(d.getDate()+i);
    const key=d.toISOString().slice(0,10);
    const sType=data.stampType?.[key]||null;
    return {key,day:DAYS_ZH[i],isToday:key===today,stampLevel:sType==="cat"?2:sType==="paw"?1:0};
  });

  // Weekly trend data
  const weeklyTrend = useMemo(()=>{
    const weeks = [];
    for(let w=chartWeeks-1;w>=0;w--){
      const wStart = addDays(ws, -w*7);
      const wEnd   = addDays(wStart, 6);
      const logs   = (data.scoreLog||[]).filter(l=>l.date>=wStart&&l.date<=wEnd);
      const score  = logs.reduce((s,l)=>s+l.delta,0);
      const d = new Date(wStart);
      weeks.push({label:`${d.getMonth()+1}/${d.getDate()}`,score,wStart});
    }
    return weeks;
  },[data.scoreLog,ws,chartWeeks]);

  const upd = fn => onUpdate(fn);

  // ── Daily tasks ──
  const toggleDaily = i => upd(d=>{
    if(!d.dailyProgress[today]) d.dailyProgress[today]={};
    d.dailyProgress[today][`t${i}`]=!d.dailyProgress[today][`t${i}`];
    const cnt=(d.schedule[dow]||[]).filter((_,j)=>d.dailyProgress[today][`t${j}`]).length;
    if(!d.stampType) d.stampType={};
    const prev=d.stampType[today]||null;
    if(cnt>=STAMP_FULL){
      if(prev!=="cat"){ d.stamps[today]=true; d.stampType[today]="cat"; setJustStamped("cat"); setTimeout(()=>setJustStamped(null),3000); }
    } else if(cnt>=STAMP_MIN){
      if(prev==="cat") d.stampType[today]="paw";
      else if(prev!=="paw"){ d.stamps[today]=true; d.stampType[today]="paw"; setJustStamped("paw"); setTimeout(()=>setJustStamped(null),3000); }
    } else { delete d.stamps[today]; delete d.stampType[today]; }
    return d;
  });

  // ── Bonus tasks (daily, no undo) ──
  const completeBonus = task => upd(d=>{
    if(!d.bonusProgress[today]) d.bonusProgress[today]={};
    if(d.bonusProgress[today][task.id]) return d;
    d.bonusProgress[today][task.id]=true;
    d.totalScore+=task.score;
    d.scoreLog=[{id:uid(),date:today,label:task.label,delta:task.score,type:"bonus"},...(d.scoreLog||[])];
    return d;
  });

  // ── Deduction ──
  const doDeduct = task => upd(d=>{
    d.totalScore=Math.max(0,d.totalScore-task.score);
    d.scoreLog=[{id:uid(),date:today,label:task.label,delta:-task.score,type:"deduct"},...(d.scoreLog||[])];
    return d;
  });

  // ── Allowance ──
  const doAllowance = ()=>{
    upd(d=>{
      d.allowanceRedeemed=(d.allowanceRedeemed||0)+1;
      d.allowanceHistory=[{id:uid(),date:today,amount:ALLOWANCE_AMOUNT},...(d.allowanceHistory||[])];
      d.scoreLog=[{id:uid(),date:today,label:`領取零用錢 $${ALLOWANCE_AMOUNT}`,delta:0,type:"allowance"},...(d.scoreLog||[])];
      return d;
    });
    setShowAllowance(false); setAllowanceDone(true); setTimeout(()=>setAllowanceDone(false),2800);
  };

  // ── Redeem reward ──
  const doRedeem = r => {
    upd(d=>{
      if(d.totalScore<r.cost) return d;
      d.totalScore-=r.cost;
      d.redeemHistory=[{id:uid(),date:today,rewardLabel:r.label,cost:r.cost},...(d.redeemHistory||[])];
      d.scoreLog=[{id:uid(),date:today,label:`兌換：${r.label}`,delta:-r.cost,type:"redeem"},...(d.scoreLog||[])];
      return d;
    });
    setRedeemTarget(null);
  };

  // ── Makeup checkin ──
  const doMakeup = (dateStr, taskIdx) => upd(d=>{
    const makeDow = new Date(dateStr).getDay();
    if(!d.dailyProgress[dateStr]) d.dailyProgress[dateStr]={};
    d.dailyProgress[dateStr][`t${taskIdx}`]=true;
    const tasks = d.schedule[makeDow]||[];
    const cnt = tasks.filter((_,j)=>d.dailyProgress[dateStr][`t${j}`]).length;
    if(!d.stampType) d.stampType={};
    if(cnt>=STAMP_FULL){ d.stamps[dateStr]=true; d.stampType[dateStr]="cat"; }
    else if(cnt>=STAMP_MIN){ d.stamps[dateStr]=true; if(d.stampType[dateStr]!=="cat") d.stampType[dateStr]="paw"; }
    return d;
  });

  const tryAdmin=()=>{ if(adminPwd===ADMIN_PASSWORD){setAdminMode(true);setShowLogin(false);setAdminPwd("");setAdminErr(false);}else setAdminErr(true); };
  const saveSchedItem=()=>{ if(!schedEditing)return; upd(d=>{ if(!d.schedule[schedDay])d.schedule[schedDay]=["","","","",""]; d.schedule[schedDay][schedEditing.idx]=schedEditing.value; return d; }); setSchedEditing(null); };

  const saveBE=()=>{ if(!editingBonus?.label.trim())return; upd(d=>{const i=d.bonusTasks.findIndex(t=>t.id===editingBonus.id);if(i>=0)d.bonusTasks[i]={...editingBonus,score:Number(editingBonus.score)||1};return d;}); setEditingBonus(null); };
  const delB=id=>upd(d=>{d.bonusTasks=d.bonusTasks.filter(t=>t.id!==id);return d;});
  const addB=()=>{ if(!newBonus.label.trim())return; upd(d=>{d.bonusTasks=[...d.bonusTasks,{id:"w"+uid(),label:newBonus.label.trim(),score:Number(newBonus.score)||1}];return d;}); setNewBonus({label:"",score:1}); };
  const saveDE=()=>{ if(!editingDeduct?.label.trim())return; upd(d=>{const i=d.deductions.findIndex(t=>t.id===editingDeduct.id);if(i>=0)d.deductions[i]={...editingDeduct,score:Number(editingDeduct.score)||1};return d;}); setEditingDeduct(null); };
  const delD=id=>upd(d=>{d.deductions=d.deductions.filter(t=>t.id!==id);return d;});
  const addD=()=>{ if(!newDeduct.label.trim())return; upd(d=>{d.deductions=[...d.deductions,{id:"d"+uid(),label:newDeduct.label.trim(),score:Number(newDeduct.score)||1}];return d;}); setNewDeduct({label:"",score:1}); };
  const saveRE=()=>{ if(!editingReward?.label.trim())return; upd(d=>{const i=d.rewards.findIndex(r=>r.id===editingReward.id);if(i>=0)d.rewards[i]={...editingReward,cost:Number(editingReward.cost)||1};return d;}); setEditingReward(null); };
  const delR=id=>upd(d=>{d.rewards=d.rewards.filter(r=>r.id!==id);return d;});
  const addR=()=>{ if(!newReward.label.trim())return; upd(d=>{d.rewards=[...d.rewards,{id:"r"+uid(),label:newReward.label.trim(),cost:Number(newReward.cost)||1}];return d;}); setNewReward({label:"",cost:10}); };

  /* shared styles */
  const bge=(bg,c)=>({background:bg,color:c,fontSize:12,padding:"2px 8px",borderRadius:99,fontWeight:700,whiteSpace:"nowrap"});
  const inp=(ex={})=>({border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none",...ex});
  const card={position:"relative",zIndex:1,margin:"0 12px 10px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"};
  const modalBg={position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"};
  const modal={background:"#fff",borderRadius:24,padding:"24px",maxWidth:360,width:"92%",boxShadow:"0 12px 40px #00000033"};

  // Filtered log
  const filteredLog = (data.scoreLog||[]).filter(l=>logFilter==="all"||l.type===logFilter);

  // Makeup: past 14 days
  const makeupTasks = (data.schedule[new Date(makeupDate).getDay()]||[]);
  const makeupDp    = data.dailyProgress?.[makeupDate]||{};

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fef9c3 0%,#fce7f3 50%,#dbeafe 100%)",fontFamily:"'Segoe UI','PingFang TC',sans-serif",position:"relative",overflow:"hidden",paddingBottom:48}}>
      <div style={{position:"fixed",top:-80,right:-80,width:240,height:240,borderRadius:"50%",background:"radial-gradient(circle,#fde68a44,#fb718588)",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-60,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,#a5f3fc44,#818cf888)",zIndex:0}}/>

      {/* Header */}
      <div style={{position:"relative",zIndex:1,background:kid.grad,padding:"16px 14px 12px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px #00000033"}}>
        <button style={{background:"#fff3",border:"none",borderRadius:10,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18}} onClick={onBack}>←</button>
        <span style={{fontSize:32}}>{kid.emoji}</span>
        <h1 style={{flex:1,margin:0,color:"#fff",fontSize:20,fontWeight:900,letterSpacing:1,textShadow:"0 2px 8px #00000033"}}>{kid.name}的任務</h1>
        <div style={{background:"#fff3",borderRadius:12,padding:"5px 12px",textAlign:"center"}}>
          <span style={{display:"block",color:"#ffffffaa",fontSize:10}}>積分</span>
          <span style={{display:"block",color:"#fff",fontSize:24,fontWeight:900,lineHeight:1}}>{data.totalScore}</span>
        </div>
        <button style={{background:"#fff3",border:"none",borderRadius:10,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18}} onClick={()=>adminMode?setAdminMode(false):setShowLogin(true)}>{adminMode?"🔓":"🔒"}</button>
      </div>

      {/* 週曆 */}
      <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"center",gap:2,padding:"10px 4px 6px",background:"#fff8",backdropFilter:"blur(8px)"}}>
        {weekDays.map(({key,day,isToday,stampLevel})=>(
          <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 3px",borderRadius:12,minWidth:43,
            ...(isToday?{background:"linear-gradient(135deg,#fde68a,#fbbf24)",boxShadow:"0 3px 10px #f59e0b55"}:{})}}>
            <div style={{fontSize:10,color:isToday?"#92400e":"#6b7280",fontWeight:800}}>週{day}</div>
            <div style={{width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <StampIcon level={stampLevel} size={38}/>
            </div>
            {isToday&&stampLevel===0&&<div style={{fontSize:7,color:kid.color,fontWeight:900}}>今天</div>}
          </div>
        ))}
      </div>

      {/* 資訊卡 */}
      <div style={{position:"relative",zIndex:1,display:"flex",gap:8,padding:"8px 12px"}}>
        {[{icon:"🐾",val:totalStamps,lbl:"總戳章"},{icon:"💰",val:redeemable,lbl:"可領零用錢"},{icon:"✨",val:data.totalScore,lbl:"總積分"}].map(({icon,val,lbl})=>(
          <div key={lbl} style={{flex:1,background:"#ffffffcc",borderRadius:14,padding:"10px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 10px #00000011"}}>
            <div style={{fontSize:20}}>{icon}</div>
            <div><div style={{fontSize:19,fontWeight:900,color:"#1e293b",lineHeight:1}}>{val}</div><div style={{fontSize:10,color:"#94a3b8"}}>{lbl}</div></div>
          </div>
        ))}
      </div>

      {/* 集章進度 */}
      <div style={{...card,marginTop:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:900,fontSize:13,color:"#1e293b"}}>集章進度 × {STAMP_THRESHOLD} 枚領零用錢</div>
          <div style={{fontSize:12,color:"#64748b",fontWeight:700}}>{cycleStamps} / {STAMP_THRESHOLD}</div>
        </div>
        <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:8}}>
          {weekDays.map(({key,stampLevel},i)=>(
            <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <StampIcon level={i<cycleStamps?stampLevel||1:0} size={34}/>
              </div>
              <div style={{width:5,height:5,borderRadius:"50%",background:i<cycleStamps?kid.color:"#e2e8f0"}}/>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:12,color:cycleStamps>=STAMP_THRESHOLD?"#16a34a":"#94a3b8",marginBottom:redeemable>0?8:0}}>
          {cycleStamps<STAMP_THRESHOLD?`再集 ${STAMP_THRESHOLD-cycleStamps} 枚就可以領 $${ALLOWANCE_AMOUNT} 元`:"🎊 已集滿！快去領零用錢吧～"}
        </div>
        {redeemable>0&&<button style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer"}} onClick={()=>setShowAllowance(true)}>💰 領取 ${ALLOWANCE_AMOUNT} 元零用錢 ×{redeemable}</button>}
      </div>

      {/* Tabs */}
      <div style={{position:"relative",zIndex:1,display:"flex",margin:"0 12px 10px",background:"#e2e8f0",borderRadius:14,padding:3}}>
        {[["daily","📋 每日"],["bonus","⭐ 獎勵"],["shop","🏪 商店"],["log","📊 紀錄"]].map(([k,l])=>(
          <button key={k} style={{flex:1,padding:"7px 0",background:tab===k?"#fff":"none",border:"none",borderRadius:11,fontSize:11,fontWeight:700,color:tab===k?kid.color:"#64748b",cursor:"pointer",transition:"all .2s",boxShadow:tab===k?"0 2px 8px #00000015":"none"}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── 每日任務 ── */}
      {tab==="daily"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {DAYS_FULL[dow]}的任務
            {todayStampLevel===2&&<span style={bge("#fde68a","#92400e")}>🐱 全部完成！</span>}
            {todayStampLevel===1&&<span style={bge("#f3e8ff","#7c3aed")}>🐾 已得戳章</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
            <div style={{display:"flex",gap:4}}>
              {todayTasks.map((_,i)=>(
                <div key={i} style={{width:20,height:20,borderRadius:"50%",background:dp[`t${i}`]?(doneCount>=STAMP_FULL?kid.color:"#a855f7"):"#e2e8f0",border:dp[`t${i}`]?"none":"1.5px solid #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:900,transition:"all .3s"}}>
                  {dp[`t${i}`]?"✓":""}
                </div>
              ))}
            </div>
            <span style={{fontSize:12,fontWeight:700,color:doneCount>=STAMP_FULL?kid.color:doneCount>=STAMP_MIN?"#a855f7":"#64748b"}}>
              {doneCount}/5
              {doneCount<STAMP_MIN&&` — 再${STAMP_MIN-doneCount}項得🐾`}
              {doneCount>=STAMP_MIN&&doneCount<STAMP_FULL&&` — 再${STAMP_FULL-doneCount}項升🐱`}
              {doneCount>=STAMP_FULL&&" — 🐱 全滿！"}
            </span>
          </div>
          {todayTasks.map((label,i)=>{
            const done=dp[`t${i}`];
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:8,background:done?"#f0fdf4":"#f8fafc",borderRadius:13,cursor:"pointer",border:done?"2px solid #86efac":"2px solid #e2e8f0",userSelect:"none",transition:"all .2s"}} onClick={()=>toggleDaily(i)}>
                <div style={{width:26,height:26,borderRadius:"50%",background:done?"#22c55e":"transparent",border:done?"none":"2px solid #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
                <span style={{flex:1,fontSize:14,textDecoration:done?"line-through":"none",opacity:done?0.45:1,color:"#1e293b"}}>{label||`（任務 ${i+1} 尚未設定）`}</span>
              </div>
            );
          })}
          {todayStampLevel===1&&<div style={{marginTop:4,padding:"10px 14px",background:"#faf5ff",borderRadius:12,fontSize:13,color:"#7c3aed",fontWeight:700,textAlign:"center",border:"1.5px solid #e9d5ff"}}>🐾 已獲得戳章！再完成 {STAMP_FULL-doneCount} 項可升級 🐱</div>}
          {todayStampLevel===2&&<div style={{marginTop:4,padding:"10px 14px",background:"#fef9c3",borderRadius:12,fontSize:13,color:"#92400e",fontWeight:800,textAlign:"center",border:"1.5px solid #fde68a"}}>🐱 你好棒！完成全部任務，獲得貓咪戳章！</div>}
        </div>
      )}

      {/* ── 獎勵任務 ── */}
      {tab==="bonus"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            今日獎勵任務 <span style={bge("#dcfce7","#15803d")}>今日 +{bonusScore} 分</span>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:10}}>✅ 完成後不可取消，每天重新開始</div>
          {data.bonusTasks.map(t=>{
            const done=todayBonus[t.id];
            return(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",marginBottom:7,background:done?"#fef9c3":"#f8fafc",borderRadius:13,cursor:done?"default":"pointer",border:done?"2px solid #fde68a":"2px solid #e2e8f0",userSelect:"none",opacity:done?0.75:1,transition:"all .2s"}} onClick={()=>!done&&completeBonus(t)}>
                <div style={{width:26,height:26,borderRadius:"50%",background:done?"#f59e0b":"transparent",border:done?"none":"2px solid #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
                <span style={{flex:1,fontSize:14,textDecoration:done?"line-through":"none",opacity:done?0.6:1,color:"#1e293b"}}>{t.label}</span>
                <span style={bge(done?"#d1fae5":"#fde68a",done?"#065f46":"#92400e")}>{done?`+${t.score}分 ✓`:`+${t.score}分`}</span>
              </div>
            );
          })}

          {/* 扣分區 */}
          <div style={{marginTop:16,borderTop:"1px solid #f1f5f9",paddingTop:12}}>
            <div style={{fontSize:13,fontWeight:800,color:"#ef4444",marginBottom:8}}>⚠️ 扣分項目</div>
            {data.deductions.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",marginBottom:7,background:"#fff5f5",borderRadius:13,border:"2px solid #fecaca",cursor: adminMode?"pointer":"default"}} onClick={()=>adminMode&&setDeductTarget(t)}>
                <span style={{flex:1,fontSize:14,color:"#1e293b"}}>{t.label}</span>
                <span style={bge("#fee2e2","#ef4444")}>-{t.score}分</span>
                {adminMode&&<span style={{fontSize:12,color:"#ef4444",fontWeight:700}}>點擊扣分</span>}
              </div>
            ))}
            {!adminMode&&<div style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>家長模式下可執行扣分</div>}
          </div>
        </div>
      )}

      {/* ── 商店 ── */}
      {tab==="shop"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>🏪 獎品商店 <span style={bge("#dbeafe","#1e40af")}>餘額 {data.totalScore} 分</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {data.rewards.map(r=>{const c=data.totalScore>=r.cost; return(
              <div key={r.id} style={{background:"#f8fafc",borderRadius:16,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 2px 10px #00000010",opacity:c?1:0.5}}>
                <div style={{fontSize:14,fontWeight:700,textAlign:"center",color:"#1e293b"}}>{r.label}</div>
                <div style={{fontSize:20,fontWeight:900,color:kid.color}}>{r.cost} 分</div>
                <button style={{width:"100%",padding:"8px",background:c?kid.grad:"#e2e8f0",border:"none",borderRadius:10,color:c?"#fff":"#94a3b8",fontWeight:800,fontSize:13,cursor:c?"pointer":"not-allowed"}} disabled={!c} onClick={()=>setRedeemTarget(r)}>{c?"兌換 🎉":"積分不足"}</button>
              </div>
            );})}
          </div>
        </div>
      )}

      {/* ── 積分紀錄 + 趨勢 ── */}
      {tab==="log"&&(
        <>
          {/* 每週趨勢 */}
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>📈 每週積分趨勢</div>
              <select value={chartWeeks} onChange={e=>setChartWeeks(Number(e.target.value))} style={{...inp(),padding:"4px 8px",fontSize:12}}>
                <option value={4}>近 4 週</option>
                <option value={6}>近 6 週</option>
                <option value={8}>近 8 週</option>
              </select>
            </div>
            <MiniChart data={weeklyTrend} color={kid.color}/>
          </div>

          {/* 積分明細 */}
          <div style={card}>
            <div style={{fontSize:14,fontWeight:800,color:"#1e293b",marginBottom:10}}>📋 積分明細</div>
            {/* Filter */}
            <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
              {[["all","全部"],["bonus","加分"],["deduct","扣分"],["redeem","兌換"],["allowance","零用錢"]].map(([v,l])=>(
                <button key={v} style={{padding:"4px 10px",background:logFilter===v?kid.color:"#f1f5f9",border:"none",borderRadius:99,fontSize:11,fontWeight:700,color:logFilter===v?"#fff":"#64748b",cursor:"pointer"}} onClick={()=>setLogFilter(v)}>{l}</button>
              ))}
            </div>
            {filteredLog.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"20px 0"}}>暫無紀錄</div>}
            {filteredLog.slice(0,50).map(l=>(
              <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#f8fafc",borderRadius:11,marginBottom:6,fontSize:13}}>
                <span style={{fontSize:16}}>
                  {l.type==="bonus"?"✅":l.type==="deduct"?"⚠️":l.type==="redeem"?"🎁":"💰"}
                </span>
                <span style={{flex:1,color:"#1e293b"}}>{l.label}</span>
                <span style={{fontWeight:800,color:l.delta>0?"#16a34a":l.delta<0?"#ef4444":"#94a3b8",whiteSpace:"nowrap"}}>
                  {l.delta>0?"+":""}{l.delta===0?"—":l.delta}
                </span>
                <span style={{color:"#94a3b8",fontSize:11,whiteSpace:"nowrap"}}>{formatDate(l.date)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══ 家長管理 ══ */}
      {adminMode&&(
        <div style={{...card,background:"#fffbeb",border:"2px solid #f97316"}}>
          <div style={{fontSize:14,fontWeight:800,color:"#f97316",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            🔓 家長管理模式
            <div style={{display:"inline-flex",background:"#f1f5f9",borderRadius:10,padding:2,gap:1}}>
              {[["schedule","📋"],["bonus","⭐"],["deduct","⚠️"],["rewards","🏪"],["makeup","📅"]].map(([k,l])=>(
                <button key={k} style={{padding:"4px 8px",background:adminTab===k?"#fff":"none",border:"none",borderRadius:8,fontSize:13,fontWeight:700,color:adminTab===k?"#f97316":"#64748b",cursor:"pointer"}} onClick={()=>setAdminTab(k)} title={k}>{l}</button>
              ))}
            </div>
          </div>

          {/* 每日任務排程 */}
          {adminTab==="schedule"&&(
            <div>
              <div style={{display:"flex",gap:3,marginBottom:12}}>
                {[1,2,3,4,5,6,0].map(d=>(
                  <button key={d} style={{flex:1,padding:"5px 2px",background:schedDay===d?kid.grad:"#f1f5f9",border:"none",borderRadius:10,fontSize:11,fontWeight:800,color:schedDay===d?"#fff":"#64748b",cursor:"pointer",position:"relative"}} onClick={()=>{setSchedDay(d);setSchedEditing(null);}}>
                    週{DAYS_ZH[d]}
                    {d===dow&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:schedDay===d?"#fff":kid.color}}/>}
                  </button>
                ))}
              </div>
              {[0,1,2,3,4].map(i=>{
                const val=(data.schedule?.[schedDay]?.[i])||"";
                const isEd=schedEditing?.idx===i;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:kid.grad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900,flexShrink:0}}>{i+1}</div>
                    {isEd?(
                      <>
                        <input style={inp({flex:1})} value={schedEditing.value} onChange={e=>setSchedEditing(p=>({...p,value:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveSchedItem()} autoFocus/>
                        <button style={{padding:"4px 8px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}} onClick={saveSchedItem}>✓</button>
                        <button style={{padding:"4px 6px",background:"#e2e8f0",border:"none",borderRadius:7,color:"#64748b",fontWeight:700,cursor:"pointer",fontSize:12}} onClick={()=>setSchedEditing(null)}>✕</button>
                      </>
                    ):(
                      <>
                        <span style={{flex:1,fontSize:13,color:val?"#1e293b":"#cbd5e1"}}>{val||"（未設定）"}</span>
                        <button style={{padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,color:"#92400e"}} onClick={()=>setSchedEditing({idx:i,value:val})}>✏️</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 獎勵任務管理 */}
          {adminTab==="bonus"&&(
            <div>
              {data.bonusTasks.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  {editingBonus?.id===t.id?<><input style={inp({flex:1,minWidth:80})} value={editingBonus.label} onChange={e=>setEditingBonus(p=>({...p,label:e.target.value}))}/><input style={inp({width:50})} type="number" value={editingBonus.score} onChange={e=>setEditingBonus(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span><button style={{padding:"4px 8px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveBE}>✓</button><button style={{padding:"4px 6px",background:"#e2e8f0",border:"none",borderRadius:7,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingBonus(null)}>✕</button></>:<><span style={{flex:1,fontSize:13}}>{t.label}</span><span style={bge("#fde68a","#92400e")}>{t.score}分</span><button style={{padding:"3px 7px",background:"#fef9c3",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>setEditingBonus({...t})}>✏️</button><button style={{padding:"3px 7px",background:"#fee2e2",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>delB(t.id)}>🗑</button></>}
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <input style={inp({flex:1,minWidth:80})} value={newBonus.label} onChange={e=>setNewBonus(p=>({...p,label:e.target.value}))} placeholder="新增任務"/>
                <input style={inp({width:50})} type="number" value={newBonus.score} onChange={e=>setNewBonus(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span>
                <button style={{padding:"4px 12px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addB}>＋</button>
              </div>
            </div>
          )}

          {/* 扣分項目管理 */}
          {adminTab==="deduct"&&(
            <div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>在「⭐ 獎勵」頁面點扣分項目即可執行扣分</div>
              {data.deductions.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  {editingDeduct?.id===t.id?<><input style={inp({flex:1,minWidth:80})} value={editingDeduct.label} onChange={e=>setEditingDeduct(p=>({...p,label:e.target.value}))}/><input style={inp({width:50})} type="number" value={editingDeduct.score} onChange={e=>setEditingDeduct(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span><button style={{padding:"4px 8px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveDE}>✓</button><button style={{padding:"4px 6px",background:"#e2e8f0",border:"none",borderRadius:7,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingDeduct(null)}>✕</button></>:<><span style={{flex:1,fontSize:13}}>{t.label}</span><span style={bge("#fee2e2","#ef4444")}>-{t.score}分</span><button style={{padding:"3px 7px",background:"#fef9c3",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>setEditingDeduct({...t})}>✏️</button><button style={{padding:"3px 7px",background:"#fee2e2",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>delD(t.id)}>🗑</button></>}
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <input style={inp({flex:1,minWidth:80})} value={newDeduct.label} onChange={e=>setNewDeduct(p=>({...p,label:e.target.value}))} placeholder="新增扣分項目"/>
                <input style={inp({width:50})} type="number" value={newDeduct.score} onChange={e=>setNewDeduct(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span>
                <button style={{padding:"4px 12px",background:"#ef4444",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addD}>＋</button>
              </div>
            </div>
          )}

          {/* 獎品管理 */}
          {adminTab==="rewards"&&(
            <div>
              {data.rewards.map(r=>(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  {editingReward?.id===r.id?<><input style={inp({flex:1,minWidth:80})} value={editingReward.label} onChange={e=>setEditingReward(p=>({...p,label:e.target.value}))}/><input style={inp({width:70})} type="number" value={editingReward.cost} onChange={e=>setEditingReward(p=>({...p,cost:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span><button style={{padding:"4px 8px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveRE}>✓</button><button style={{padding:"4px 6px",background:"#e2e8f0",border:"none",borderRadius:7,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingReward(null)}>✕</button></>:<><span style={{flex:1,fontSize:13}}>{r.label}</span><span style={bge("#dbeafe","#1e40af")}>{r.cost}分</span><button style={{padding:"3px 7px",background:"#fef9c3",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>setEditingReward({...r})}>✏️</button><button style={{padding:"3px 7px",background:"#fee2e2",border:"none",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>delR(r.id)}>🗑</button></>}
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <input style={inp({flex:1,minWidth:80})} value={newReward.label} onChange={e=>setNewReward(p=>({...p,label:e.target.value}))} placeholder="新增獎品"/>
                <input style={inp({width:70})} type="number" value={newReward.cost} onChange={e=>setNewReward(p=>({...p,cost:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span>
                <button style={{padding:"4px 12px",background:"#22c55e",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addR}>＋</button>
              </div>
            </div>
          )}

          {/* 補打卡 */}
          {adminTab==="makeup"&&(
            <div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>為過去某天補勾選已完成的任務，補完後會自動更新戳章。</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:700,color:"#1e293b",whiteSpace:"nowrap"}}>選擇日期</span>
                <input type="date" style={inp({flex:1})} value={makeupDate} max={today}
                  onChange={e=>setMakeupDate(e.target.value)}/>
              </div>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>
                {DAYS_FULL[new Date(makeupDate).getDay()]}　{makeupDate===today?"（今天）":""}
              </div>
              {makeupTasks.map((label,i)=>{
                const done=makeupDp[`t${i}`];
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:7,background:done?"#f0fdf4":"#f8fafc",borderRadius:13,cursor:done?"default":"pointer",border:done?"2px solid #86efac":"2px solid #e2e8f0",userSelect:"none"}} onClick={()=>!done&&doMakeup(makeupDate,i)}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:done?"#22c55e":"transparent",border:done?"none":"2px solid #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
                    <span style={{flex:1,fontSize:13,textDecoration:done?"line-through":"none",opacity:done?0.5:1}}>{label||`任務 ${i+1}`}</span>
                    {!done&&<span style={{fontSize:11,color:kid.color,fontWeight:700}}>補打卡</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Popups */}
      {justStamped==="paw"&&<div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#faf5ff,#e9d5ff)",padding:"24px 40px",borderRadius:28,boxShadow:"0 8px 48px #a855f799",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #c084fc"}}><div style={{fontSize:72}}>🐾</div><div style={{color:"#7c3aed",fontWeight:900,fontSize:20,marginTop:6}}>獲得腳印戳章！</div></div>}
      {justStamped==="cat"&&<div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#fef9c3,#fde68a)",padding:"28px 40px",borderRadius:28,boxShadow:"0 8px 48px #f59e0b99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #fbbf24"}}><div style={{fontSize:80}}>🐱</div><div style={{color:"#92400e",fontWeight:900,fontSize:20,marginTop:8}}>你好棒！</div><div style={{color:"#b45309",fontWeight:700,fontSize:14,marginTop:4}}>完成全部任務，獲得貓咪戳章！</div></div>}
      {allowanceDone&&<div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",padding:"24px 36px",borderRadius:28,boxShadow:"0 8px 48px #22c55e99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #22c55e"}}><div style={{fontSize:72}}>💰</div><div style={{color:"#14532d",fontWeight:900,fontSize:20,marginTop:6}}>領到 ${ALLOWANCE_AMOUNT} 元零用錢！</div></div>}

      {/* 零用錢 modal */}
      {showAllowance&&<div style={modalBg} onClick={()=>setShowAllowance(false)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center"}}><div style={{fontSize:56}}>💰</div><div style={{fontSize:20,fontWeight:900,margin:"10px 0 6px"}}>領取零用錢</div><p style={{fontSize:14,color:"#475569"}}>已集滿 {STAMP_THRESHOLD} 枚戳章！</p><div style={{fontSize:34,fontWeight:900,color:"#16a34a",margin:"8px 0"}}>$ {ALLOWANCE_AMOUNT} 元</div><p style={{fontSize:12,color:"#94a3b8"}}>可領 {redeemable} 次　|　戳章繼續累積</p></div><div style={{display:"flex",gap:10,marginTop:16}}><button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>setShowAllowance(false)}>取消</button><button style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14}} onClick={doAllowance}>✅ 確認領取</button></div></div></div>}

      {/* 兌換獎品 modal */}
      {redeemTarget&&<div style={modalBg} onClick={()=>setRedeemTarget(null)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center"}}><div style={{fontSize:52}}>🎁</div><div style={{fontSize:20,fontWeight:900,margin:"10px 0 6px"}}>確認兌換？</div><p style={{fontSize:14,color:"#475569",margin:"0 0 4px"}}>{redeemTarget.label}</p><p style={{fontSize:20,fontWeight:900,color:kid.color,margin:"4px 0"}}>消耗 {redeemTarget.cost} 分</p><p style={{fontSize:12,color:"#94a3b8"}}>兌換後剩餘：{data.totalScore-redeemTarget.cost} 分</p></div><div style={{display:"flex",gap:10,marginTop:16}}><button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>setRedeemTarget(null)}>取消</button><button style={{flex:1,padding:11,borderRadius:12,border:"none",background:kid.grad,color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14}} onClick={()=>doRedeem(redeemTarget)}>✅ 確認兌換</button></div></div></div>}

      {/* 扣分確認 modal */}
      {deductTarget&&<div style={modalBg} onClick={()=>setDeductTarget(null)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center"}}><div style={{fontSize:52}}>⚠️</div><div style={{fontSize:20,fontWeight:900,margin:"10px 0 6px"}}>確認扣分？</div><p style={{fontSize:14,color:"#475569",margin:"0 0 4px"}}>{deductTarget.label}</p><p style={{fontSize:20,fontWeight:900,color:"#ef4444",margin:"4px 0"}}>扣除 {deductTarget.score} 分</p><p style={{fontSize:12,color:"#94a3b8"}}>扣分後剩餘：{Math.max(0,data.totalScore-deductTarget.score)} 分</p></div><div style={{display:"flex",gap:10,marginTop:16}}><button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>setDeductTarget(null)}>取消</button><button style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14}} onClick={()=>{doDeduct(deductTarget);setDeductTarget(null);}}>確認扣分</button></div></div></div>}

      {/* 家長登入 modal */}
      {showLogin&&<div style={modalBg} onClick={()=>{setShowLogin(false);setAdminPwd("");setAdminErr(false);}}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center"}}><div style={{fontSize:40}}>🔒</div><div style={{fontSize:20,fontWeight:900,margin:"10px 0 8px"}}>家長模式</div><p style={{fontSize:13,color:"#64748b",marginBottom:12}}>預設密碼：<b>parent123</b></p></div><input type="password" style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:16,marginBottom:8,boxSizing:"border-box",outline:"none"}} value={adminPwd} onChange={e=>{setAdminPwd(e.target.value);setAdminErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} placeholder="輸入密碼" autoFocus/>{adminErr&&<p style={{color:"#ef4444",fontSize:13,marginBottom:8,textAlign:"center"}}>密碼錯誤！</p>}<div style={{display:"flex",gap:10,marginTop:8}}><button style={{flex:1,padding:11,borderRadius:12,border:"2px solid #e2e8f0",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}} onClick={()=>{setShowLogin(false);setAdminPwd("");setAdminErr(false);}}>取消</button><button style={{flex:1,padding:11,borderRadius:12,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:14}} onClick={tryAdmin}>進入</button></div></div></div>}
    </div>
  );
}
