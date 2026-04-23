import { useState, useEffect, useCallback } from "react";

const DAYS_ZH   = ["日","一","二","三","四","五","六"];
const DAYS_FULL = ["週日","週一","週二","週三","週四","週五","週六"];

const STAMP_MIN  = 3;  // 完成 3 項 → 🐾
const STAMP_FULL = 5;  // 完成 5 項 → 🐱

const DEFAULT_SCHEDULE = {
  0: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
  1: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
  2: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","HESS 複習＆作業 📝"],
  3: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
  4: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
  5: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","背英文 3 個單字 📖"],
  6: ["早晚刷牙洗臉 🪥","主動吃中藥 🌿","跳繩 100 下 🪢","寫日記 📔","HESS 複習＆作業 📝"],
};
const DEFAULT_WEEKLY_TASKS = [
  { id:"w1",  label:"背五個單字 📖",      score:1  },
  { id:"w2",  label:"預習國語 📗",         score:1  },
  { id:"w3",  label:"預習數學 📐",         score:1  },
  { id:"w4",  label:"預習自然 🔬",         score:1  },
  { id:"w5",  label:"預習社會 🌏",         score:1  },
  { id:"w6",  label:"複習國語 📗",         score:1  },
  { id:"w7",  label:"複習數學 📐",         score:1  },
  { id:"w8",  label:"複習自然 🔬",         score:1  },
  { id:"w9",  label:"複習社會 🌏",         score:1  },
  { id:"w10", label:"跳繩 200 下 🪢",      score:1  },
  { id:"w11", label:"幫忙收衣服 👕",       score:1  },
  { id:"w12", label:"幫忙洗碗筷 🍽️",      score:1  },
  { id:"w13", label:"冷靜讓妹妹 🕊️",      score:2  },
  { id:"w14", label:"國甲乙本 甲上 📒",    score:5  },
  { id:"w15", label:"圈詞本 甲上 📒",      score:5  },
  { id:"w16", label:"數練 90 分 🔢",       score:1  },
  { id:"w17", label:"數練 100 分 🔢",      score:5  },
  { id:"w18", label:"大考 90 分 🏅",       score:1  },
  { id:"w19", label:"大考 95 分 🥈",       score:5  },
  { id:"w20", label:"大考 100 分 🥇",      score:10 },
];
const DEFAULT_REWARDS = [
  { id:"r1", label:"遊戲 1 分鐘 🎮",  cost:1     },
  { id:"r2", label:"遊戲 5 分鐘 🎮",  cost:5     },
  { id:"r3", label:"文具 ✏️",          cost:100   },
  { id:"r4", label:"書 📖",            cost:200   },
  { id:"r5", label:"小玩具 🧸",        cost:500   },
  { id:"r6", label:"大玩具 🎁",        cost:1000  },
  { id:"r7", label:"狗狗一隻 🐕",      cost:10000 },
];

const STAMP_THRESHOLD  = 7;
const ALLOWANCE_AMOUNT = 50;
const ADMIN_PASSWORD   = "parent123";

const todayKey  = () => new Date().toISOString().slice(0,10);
const weekStart = () => { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10); };
const uid       = () => Math.random().toString(36).slice(2,8);
const getDow    = () => new Date().getDay();

const load = async () => { try { const r=localStorage.getItem("kids_v8"); return r?JSON.parse(r):null; } catch{return null;} };
const save = async d  => { try { localStorage.setItem("kids_v8",JSON.stringify(d)); } catch{} };
const init = () => ({
  stamps:{}, bonusProgress:{}, totalScore:0,
  redeemHistory:[], allowanceHistory:[], allowanceRedeemed:0,
  dailyProgress:{},
  // stamps now stores stamp type: "paw" | "cat"
  stampType:{},
  schedule: DEFAULT_SCHEDULE,
  weeklyTasks: DEFAULT_WEEKLY_TASKS,
  rewards: DEFAULT_REWARDS,
});

// ── 戳章 emoji 元件 ───────────────────────────────────────
// stampLevel: 0=空白, 1=🐾(完成3項), 2=🐱(完成5項)
const StampIcon = ({ level=0, size=40 }) => {
  const fontSize = size * 0.72;
  if (level === 2) return <span style={{fontSize, lineHeight:1, display:"block", textAlign:"center"}}>🐱</span>;
  if (level === 1) return <span style={{fontSize, lineHeight:1, display:"block", textAlign:"center"}}>🐾</span>;
  return (
    <div style={{
      width: size, height: size, borderRadius:"50%",
      border: "2.5px dashed #CBD5E1",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#CBD5E1", fontSize: size * 0.3,
    }}>○</div>
  );
};

export default function App() {
  const [data,           setData]           = useState(null);
  const [loaded,         setLoaded]         = useState(false);
  const [tab,            setTab]            = useState("daily");
  const [justStamped,    setJustStamped]    = useState(null); // null | "paw" | "cat"
  const [gdExporting,    setGdExporting]    = useState(false);
  const [adminMode,      setAdminMode]      = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPwd,       setAdminPwd]       = useState("");
  const [adminErr,       setAdminErr]       = useState(false);
  const [adminTab,       setAdminTab]       = useState("schedule");
  const [schedDay,       setSchedDay]       = useState(getDow());
  const [schedEditing,   setSchedEditing]   = useState(null);
  const [redeemTarget,   setRedeemTarget]   = useState(null);
  const [showAllowance,  setShowAllowance]  = useState(false);
  const [allowanceDone,  setAllowanceDone]  = useState(false);
  const [editingWeekly,  setEditingWeekly]  = useState(null);
  const [editingReward,  setEditingReward]  = useState(null);
  const [newWeekly,      setNewWeekly]      = useState({label:"",score:1});
  const [newReward,      setNewReward]      = useState({label:"",cost:10});

  useEffect(()=>{ load().then(d=>{ setData(d||init()); setLoaded(true); }); },[]);
  useEffect(()=>{ if(loaded&&data) save(data); },[data,loaded]);

  const today      = todayKey();
  const dow        = getDow();
  const ws         = weekStart();
  const todayTasks = data?.schedule?.[dow] || [];
  const dp         = data?.dailyProgress?.[today] || {};
  const doneCount  = todayTasks.filter((_,i)=>dp[`t${i}`]).length;

  // 今天的戳章等級
  const todayStampType  = data?.stampType?.[today] || null; // "paw" | "cat" | null
  const todayStampLevel = todayStampType==="cat" ? 2 : todayStampType==="paw" ? 1 : 0;

  const totalStamps = data ? Object.keys(data.stamps||{}).length : 0;
  const alRed       = data?.allowanceRedeemed||0;
  const redeemable  = Math.floor(totalStamps/STAMP_THRESHOLD)-alRed;
  const cycleStamps = Math.min(totalStamps-alRed*STAMP_THRESHOLD, STAMP_THRESHOLD);
  const todayBonus  = data?.bonusProgress?.[today]||{};
  const bonusScore  = data ? data.weeklyTasks.reduce((s,t)=>s+(todayBonus[t.id]?t.score:0),0) : 0;

  const weekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(ws); d.setDate(d.getDate()+i);
    const key=d.toISOString().slice(0,10);
    const sType = data?.stampType?.[key]||null;
    return {key, day:DAYS_ZH[i], isToday:key===today,
      stampLevel: sType==="cat"?2:sType==="paw"?1:0};
  });

  const upd = fn => setData(prev=>fn(JSON.parse(JSON.stringify(prev))));

  const toggleDaily = i => upd(d=>{
    if(!d.dailyProgress[today]) d.dailyProgress[today]={};
    d.dailyProgress[today][`t${i}`] = !d.dailyProgress[today][`t${i}`];
    const tasks = d.schedule[dow]||[];
    const cnt   = tasks.filter((_,j)=>d.dailyProgress[today][`t${j}`]).length;

    if(!d.stampType) d.stampType={};

    const prev = d.stampType[today]||null;

    if(cnt>=STAMP_FULL){
      // 升為 🐱
      if(prev!=="cat"){
        d.stamps[today]=true;
        d.stampType[today]="cat";
        setJustStamped("cat");
        setTimeout(()=>setJustStamped(null),3000);
      }
    } else if(cnt>=STAMP_MIN){
      // 升為 🐾（但若之前已是 cat 不降級）
      if(prev!=="cat" && prev!=="paw"){
        d.stamps[today]=true;
        d.stampType[today]="paw";
        setJustStamped("paw");
        setTimeout(()=>setJustStamped(null),3000);
      }
      // 若從 cat 降下來（取消勾選）
      if(prev==="cat"){
        d.stampType[today]="paw";
      }
    } else {
      // 低於 3 項，移除戳章
      delete d.stamps[today];
      delete d.stampType[today];
    }
    return d;
  });

  const completeBonus = task => upd(d=>{
    if(!d.bonusProgress[today]) d.bonusProgress[today]={};
    if(d.bonusProgress[today][task.id]) return d;
    d.bonusProgress[today][task.id]=true; d.totalScore+=task.score; return d;
  });
  const doRedeemAllowance = ()=>{
    upd(d=>{ d.allowanceRedeemed=(d.allowanceRedeemed||0)+1; if(!d.allowanceHistory)d.allowanceHistory=[]; d.allowanceHistory.unshift({id:uid(),date:today,amount:ALLOWANCE_AMOUNT}); return d; });
    setShowAllowance(false); setAllowanceDone(true); setTimeout(()=>setAllowanceDone(false),2800);
  };
  const doRedeemReward = r=>{
    upd(d=>{ if(d.totalScore<r.cost)return d; d.totalScore-=r.cost; d.redeemHistory.unshift({id:uid(),rewardLabel:r.label,cost:r.cost,date:today}); return d; });
    setRedeemTarget(null);
  };
  const tryAdmin=()=>{ if(adminPwd===ADMIN_PASSWORD){setAdminMode(true);setShowAdminLogin(false);setAdminPwd("");setAdminErr(false);}else setAdminErr(true); };
  const saveSchedItem=()=>{ if(!schedEditing)return; upd(d=>{ if(!d.schedule[schedDay])d.schedule[schedDay]=["","","","",""]; d.schedule[schedDay][schedEditing.idx]=schedEditing.value; return d; }); setSchedEditing(null); };
  const saveWE=()=>{ if(!editingWeekly?.label.trim())return; upd(d=>{const i=d.weeklyTasks.findIndex(t=>t.id===editingWeekly.id);if(i>=0)d.weeklyTasks[i]={...editingWeekly,score:Number(editingWeekly.score)||1};return d;}); setEditingWeekly(null); };
  const delW =id=>upd(d=>{d.weeklyTasks=d.weeklyTasks.filter(t=>t.id!==id);return d;});
  const addW =()=>{ if(!newWeekly.label.trim())return; upd(d=>{d.weeklyTasks.push({id:"w"+uid(),label:newWeekly.label.trim(),score:Number(newWeekly.score)||1});return d;}); setNewWeekly({label:"",score:1}); };
  const saveRE=()=>{ if(!editingReward?.label.trim())return; upd(d=>{const i=d.rewards.findIndex(r=>r.id===editingReward.id);if(i>=0)d.rewards[i]={...editingReward,cost:Number(editingReward.cost)||1};return d;}); setEditingReward(null); };
  const delR =id=>upd(d=>{d.rewards=d.rewards.filter(r=>r.id!==id);return d;});
  const addR =()=>{ if(!newReward.label.trim())return; upd(d=>{d.rewards.push({id:"r"+uid(),label:newReward.label.trim(),cost:Number(newReward.cost)||1});return d;}); setNewReward({label:"",cost:10}); };
  const exportData=useCallback(()=>{ setGdExporting(true); const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const u=URL.createObjectURL(b); const a=document.createElement("a");a.href=u;a.download=`kids_${today}.json`;a.click();URL.revokeObjectURL(u);setGdExporting(false); },[data,today]);
  const importData=e=>{ const f=e.target.files[0];if(!f)return; const r=new FileReader();r.onload=ev=>{try{setData({...init(),...JSON.parse(ev.target.result)});}catch{alert("格式錯誤！");}};r.readAsText(f); };

  if(!loaded) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:16,background:"#fef9c3",fontFamily:"sans-serif"}}>
      <span style={{fontSize:64}}>🐱</span><p style={{color:"#f59e0b"}}>載入中…</p>
    </div>
  );

  /* shared styles */
  const bge=(bg,c)=>({background:bg,color:c,fontSize:12,padding:"2px 8px",borderRadius:99,fontWeight:700,whiteSpace:"nowrap"});
  const inp=(ex={})=>({border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none",...ex});
  const card={position:"relative",zIndex:1,margin:"0 12px",background:"#ffffffcc",borderRadius:18,padding:14,boxShadow:"0 2px 16px #00000011"};
  const modalBg={position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"};
  const modal={background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"90%",boxShadow:"0 12px 40px #00000033",textAlign:"center"};
  const btn=(bg,c="#fff")=>({border:"none",borderRadius:12,color:c,fontWeight:900,cursor:"pointer",fontSize:14,padding:"11px",background:bg,flex:1});

  // 今日任務框底色 & 邊框邏輯
  const taskBg   = done => done ? "#f0fdf4" : "#f8fafc";
  const taskBord = done => done ? "2px solid #86efac" : "2px solid #e2e8f0";

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fef9c3 0%,#fce7f3 50%,#dbeafe 100%)",fontFamily:"'Segoe UI','PingFang TC',sans-serif",position:"relative",overflow:"hidden",paddingBottom:48}}>
      <div style={{position:"fixed",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,#fde68a55,#fb7185aa)",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,#a5f3fc55,#818cf8aa)",zIndex:0}}/>

      {/* ── Header ── */}
      <div style={{position:"relative",zIndex:1,background:"linear-gradient(135deg,#f97316,#ec4899)",padding:"18px 16px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px #f9731644"}}>
        <span style={{fontSize:38}}>🐱</span>
        <h1 style={{flex:1,margin:0,color:"#fff",fontSize:21,fontWeight:900,letterSpacing:2,textShadow:"0 2px 8px #00000033"}}>楷芯的任務</h1>
        <div style={{background:"#fff3",borderRadius:14,padding:"6px 14px",textAlign:"center"}}>
          <span style={{display:"block",color:"#fef3c7",fontSize:10}}>積分</span>
          <span style={{display:"block",color:"#fff",fontSize:26,fontWeight:900}}>{data.totalScore}</span>
        </div>
        <button style={{background:"#fff3",border:"none",borderRadius:10,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18}} onClick={()=>adminMode?setAdminMode(false):setShowAdminLogin(true)}>{adminMode?"🔓":"🔒"}</button>
      </div>

      {/* ── 週曆戳章欄 ── */}
      <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"center",gap:2,padding:"12px 4px 10px",background:"#fff8",backdropFilter:"blur(8px)"}}>
        {weekDays.map(({key,day,isToday,stampLevel})=>(
          <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",borderRadius:14,minWidth:44,
            ...(isToday?{background:"linear-gradient(135deg,#fde68a,#fbbf24)",boxShadow:"0 3px 10px #f59e0b55"}:{})}}>
            <div style={{fontSize:10,color:isToday?"#92400e":"#6b7280",fontWeight:800}}>週{day}</div>
            <div style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <StampIcon level={stampLevel} size={40}/>
            </div>
            {isToday&&stampLevel===0&&<div style={{fontSize:8,color:"#f97316",fontWeight:900}}>今天</div>}
          </div>
        ))}
      </div>



      {/* ── 資訊卡 ── */}
      <div style={{position:"relative",zIndex:1,display:"flex",gap:8,padding:"6px 12px 10px"}}>
        {[{icon:"🐾",val:totalStamps,lbl:"總戳章數"},{icon:"💰",val:redeemable,lbl:"可領零用錢"},{icon:"✨",val:data.totalScore,lbl:"總積分"}].map(({icon,val,lbl})=>(
          <div key={lbl} style={{flex:1,background:"#ffffffcc",borderRadius:14,padding:"10px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 10px #00000011"}}>
            <div style={{fontSize:22}}>{icon}</div>
            <div><div style={{fontSize:20,fontWeight:900,color:"#1e293b",lineHeight:1}}>{val}</div><div style={{fontSize:10,color:"#94a3b8"}}>{lbl}</div></div>
          </div>
        ))}
      </div>

      {/* ── 集章進度 ── */}
      <div style={{position:"relative",zIndex:1,margin:"0 12px 10px",background:"#ffffffcc",borderRadius:20,padding:"14px 16px",boxShadow:"0 2px 12px #00000011"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:900,fontSize:13,color:"#1e293b"}}>集章進度 × {STAMP_THRESHOLD} 枚領零用錢</div>
          <div style={{fontSize:12,color:"#64748b",fontWeight:700}}>{cycleStamps} / {STAMP_THRESHOLD}</div>
        </div>
        {/* 7 格進度 */}
        <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:10}}>
          {weekDays.map(({key,stampLevel},i)=>(
            <div key={key} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <StampIcon level={i<cycleStamps?stampLevel||1:0} size={36}/>
              </div>
              <div style={{width:6,height:6,borderRadius:"50%",background:i<cycleStamps?"#f59e0b":"#e2e8f0"}}/>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:12,color:cycleStamps>=STAMP_THRESHOLD?"#16a34a":"#94a3b8",fontWeight:cycleStamps>=STAMP_THRESHOLD?800:400,marginBottom:redeemable>0?10:0}}>
          {cycleStamps<STAMP_THRESHOLD?`再集 ${STAMP_THRESHOLD-cycleStamps} 枚就可以領 $${ALLOWANCE_AMOUNT} 元零用錢 🎉`:"🎊 已集滿！快去領零用錢吧～"}
        </div>
        {redeemable>0&&<button style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:13,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 4px 16px #22c55e55"}} onClick={()=>setShowAllowance(true)}>💰 領取 ${ALLOWANCE_AMOUNT} 元零用錢 ×{redeemable}</button>}
        {data.allowanceHistory?.length>0&&(
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

      {/* ── Tabs ── */}
      <div style={{position:"relative",zIndex:1,display:"flex",margin:"0 12px 10px",background:"#e2e8f0",borderRadius:14,padding:3}}>
        {[["daily","📋 每日"],["weekly","⭐ 獎勵"],["shop","🏪 商店"],["sync","☁️ 同步"]].map(([k,l])=>(
          <button key={k} style={{flex:1,padding:"7px 0",background:tab===k?"#fff":"none",border:"none",borderRadius:11,fontSize:12,fontWeight:700,color:tab===k?"#f97316":"#64748b",cursor:"pointer",transition:"all .2s",boxShadow:tab===k?"0 2px 8px #00000015":"none"}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══ 每日任務 ══ */}
      {tab==="daily"&&(
        <div style={card}>
          {/* 標題列 */}
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {DAYS_FULL[dow]}的任務
            {todayStampLevel===2&&<span style={bge("#fde68a","#92400e")}>🐱 全部完成！</span>}
            {todayStampLevel===1&&<span style={bge("#fce7f3","#9d174d")}>🐾 已得戳章</span>}
          </div>

          {/* 進度條 */}
          <div style={{marginBottom:14}}>
            {/* 5 圓點進度 */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <div style={{display:"flex",gap:5}}>
                {todayTasks.map((_,i)=>{
                  const done=dp[`t${i}`];
                  return(
                    <div key={i} style={{width:20,height:20,borderRadius:"50%",
                      background: done
                        ? (doneCount>=STAMP_FULL?"#f97316":doneCount>=STAMP_MIN?"#a855f7":"#22c55e")
                        : "#e2e8f0",
                      border: done?"none":"1.5px solid #cbd5e1",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,color:"#fff",fontWeight:900,transition:"all .3s"}}>
                      {done?"✓":""}
                    </div>
                  );
                })}
              </div>
              <span style={{fontSize:12,fontWeight:700,
                color: doneCount>=STAMP_FULL?"#f97316":doneCount>=STAMP_MIN?"#a855f7":"#64748b"}}>
                {doneCount} / 5
                {doneCount<STAMP_MIN&&` — 再 ${STAMP_MIN-doneCount} 項得 🐾`}
                {doneCount>=STAMP_MIN&&doneCount<STAMP_FULL&&` — 再 ${STAMP_FULL-doneCount} 項升 🐱`}
                {doneCount>=STAMP_FULL&&" — 🐱 全滿！"}
              </span>
            </div>


          </div>

          {/* 任務清單 — 統一框 */}
          {todayTasks.map((label,i)=>{
            const done=dp[`t${i}`];
            return(
              <div key={i}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"12px 14px", marginBottom:8,
                  background: taskBg(done),
                  borderRadius:13,
                  border: taskBord(done),
                  cursor:"pointer", userSelect:"none", transition:"all .2s",
                }}
                onClick={()=>toggleDaily(i)}>
                {/* 勾選框 */}
                <div style={{
                  width:26, height:26, borderRadius:"50%", flexShrink:0,
                  background: done?"#22c55e":"transparent",
                  border: done?"none":"2px solid #cbd5e1",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:900, color:"#fff", transition:"all .2s",
                }}>
                  {done?"✓":""}
                </div>
                {/* 任務文字 */}
                <span style={{
                  flex:1, fontSize:14,
                  textDecoration: done?"line-through":"none",
                  opacity: done?0.45:1,
                  color:"#1e293b",
                }}>
                  {label||`（任務 ${i+1} 尚未設定）`}
                </span>
                {/* 右側小提示 */}
                {!done && i===STAMP_MIN-1-todayTasks.slice(0,i).filter((_,j)=>dp[`t${j}`]).length && doneCount===STAMP_MIN-1 &&(
                  <span style={{fontSize:11,color:"#a855f7",fontWeight:700,whiteSpace:"nowrap"}}>差這項！</span>
                )}
              </div>
            );
          })}

          {/* 底部提示 */}
          {todayStampLevel===0&&doneCount===0&&(
            <div style={{marginTop:4,padding:"10px 14px",background:"#f8fafc",borderRadius:12,fontSize:12,color:"#94a3b8",textAlign:"center"}}>
              完成任意 3 項就能得到 🐾 戳章，5 項全完成升級 🐱！
            </div>
          )}
          {todayStampLevel===1&&(
            <div style={{marginTop:4,padding:"10px 14px",background:"#faf5ff",borderRadius:12,fontSize:13,color:"#7c3aed",fontWeight:700,textAlign:"center",border:"1.5px solid #e9d5ff"}}>
              🐾 已獲得戳章！再完成 {STAMP_FULL-doneCount} 項可升級 🐱
            </div>
          )}
          {todayStampLevel===2&&(
            <div style={{marginTop:4,padding:"10px 14px",background:"#fef9c3",borderRadius:12,fontSize:13,color:"#92400e",fontWeight:800,textAlign:"center",border:"1.5px solid #fde68a"}}>
              🐱 太棒了！今天全部完成，獲得最高等級戳章！
            </div>
          )}
        </div>
      )}

      {/* ══ 獎勵任務 ══ */}
      {tab==="weekly"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            今日獎勵任務 <span style={bge("#dcfce7","#15803d")}>今日得 {bonusScore} 分</span>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>✅ 完成後不可取消，每天重新開始</div>
          {data.weeklyTasks.map(t=>{
            const done=todayBonus[t.id];
            return(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:8,background:done?"#fef9c3":"#f8fafc",borderRadius:13,cursor:done?"default":"pointer",border:done?"2px solid #fde68a":"2px solid #e2e8f0",userSelect:"none",opacity:done?0.78:1,transition:"all .2s"}} onClick={()=>!done&&completeBonus(t)}>
                <div style={{width:26,height:26,borderRadius:"50%",border:done?"none":"2px solid #cbd5e1",background:done?"#f59e0b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
                <span style={{flex:1,fontSize:14,textDecoration:done?"line-through":"none",opacity:done?0.6:1,color:"#1e293b"}}>{t.label}</span>
                <span style={bge(done?"#d1fae5":"#fde68a",done?"#065f46":"#92400e")}>{done?`+${t.score}分 ✓`:`+${t.score}分`}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ 商店 ══ */}
      {tab==="shop"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>🏪 獎品商店 <span style={bge("#dbeafe","#1e40af")}>餘額 {data.totalScore} 分</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {data.rewards.map(r=>{const c=data.totalScore>=r.cost; return <div key={r.id} style={{background:"#f8fafc",borderRadius:16,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 2px 10px #00000010",opacity:c?1:0.5}}>
              <div style={{fontSize:14,fontWeight:700,textAlign:"center",color:"#1e293b"}}>{r.label}</div>
              <div style={{fontSize:20,fontWeight:900,color:"#f97316"}}>{r.cost} 分</div>
              <button style={{width:"100%",padding:"8px",background:c?"linear-gradient(135deg,#f97316,#ec4899)":"#e2e8f0",border:"none",borderRadius:10,color:c?"#fff":"#94a3b8",fontWeight:800,fontSize:13,cursor:c?"pointer":"not-allowed"}} disabled={!c} onClick={()=>setRedeemTarget(r)}>{c?"兌換 🎉":"積分不足"}</button>
            </div>;})}
          </div>
          {data.redeemHistory?.length>0&&<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:800,color:"#64748b",marginBottom:8}}>兌換紀錄</div>{data.redeemHistory.slice(0,8).map(h=><div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8fafc",borderRadius:10,marginBottom:5,fontSize:13}}><span style={{flex:1}}>{h.rewardLabel}</span><span style={{color:"#ef4444",fontWeight:700}}>-{h.cost}分</span><span style={{color:"#94a3b8",fontSize:11}}>{h.date}</span></div>)}</div>}
        </div>
      )}

      {/* ══ 同步 ══ */}
      {tab==="sync"&&(
        <div style={card}>
          <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:12}}>☁️ Google Drive 同步</div>
          <p style={{fontSize:13,color:"#64748b",lineHeight:1.7,marginBottom:16}}>匯出 JSON 後手動存入 Google Drive；還原時再匯入。</p>
          <button style={{display:"block",width:"100%",padding:"12px",marginBottom:8,background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}} onClick={exportData} disabled={gdExporting}>{gdExporting?"匯出中…":"📥 匯出資料"}</button>
          <div style={{textAlign:"center",color:"#94a3b8",margin:"8px 0",fontSize:13}}>── 或 ──</div>
          <label style={{display:"block",width:"100%",padding:"12px",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center",boxSizing:"border-box"}}>📤 從檔案匯入<input type="file" accept=".json" style={{display:"none"}} onChange={importData}/></label>
          <div style={{marginTop:16,padding:12,background:"#f8fafc",borderRadius:12,fontSize:13,color:"#475569",lineHeight:1.9}}><b>目前資料：</b><br/>總戳章：{totalStamps} | 已領零用錢：{alRed} 次<br/>總積分：{data.totalScore} | 兌換：{data.redeemHistory?.length||0} 筆</div>
        </div>
      )}

      {/* ══ 家長管理 ══ */}
      {adminMode&&(
        <div style={{position:"relative",zIndex:1,margin:"10px 12px 0",background:"#fffbeb",borderRadius:18,padding:14,border:"2px solid #f97316",boxShadow:"0 4px 20px #f9731622"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#f97316",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            🔓 家長管理模式
            <div style={{display:"inline-flex",background:"#f1f5f9",borderRadius:10,padding:2,gap:2}}>
              {[["schedule","📋 每日"],["weekly","⭐ 獎勵"],["rewards","🏪 獎品"]].map(([k,l])=>(
                <button key={k} style={{padding:"4px 9px",background:adminTab===k?"#fff":"none",border:"none",borderRadius:8,fontSize:11,fontWeight:700,color:adminTab===k?"#f97316":"#64748b",cursor:"pointer"}} onClick={()=>setAdminTab(k)}>{l}</button>
              ))}
            </div>
          </div>

          {adminTab==="schedule"&&(
            <div>
              <div style={{display:"flex",gap:3,marginBottom:14}}>
                {[1,2,3,4,5,6,0].map(d=>(
                  <button key={d} style={{flex:1,padding:"6px 2px",background:schedDay===d?"linear-gradient(135deg,#f97316,#ec4899)":"#f1f5f9",border:"none",borderRadius:10,fontSize:11,fontWeight:800,color:schedDay===d?"#fff":"#64748b",cursor:"pointer",position:"relative",boxShadow:schedDay===d?"0 2px 8px #f9731633":"none"}} onClick={()=>{setSchedDay(d);setSchedEditing(null);}}>
                    週{DAYS_ZH[d]}
                    {d===dow&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:schedDay===d?"#fff":"#f97316"}}/>}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:schedDay===dow?"#f97316":"#94a3b8",fontWeight:schedDay===dow?700:400,marginBottom:10}}>
                {schedDay===dow?"📍 今天（"+DAYS_FULL[dow]+"）":"設定 "+DAYS_FULL[schedDay]}　|　完成 3 項得 🐾，完成 5 項得 🐱
              </div>
              {[0,1,2,3,4].map(i=>{
                const val=(data.schedule?.[schedDay]?.[i])||"";
                const isEd=schedEditing?.idx===i;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:i<STAMP_MIN?"linear-gradient(135deg,#a855f7,#7c3aed)":"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:900,flexShrink:0}}>{i+1}</div>
                    {isEd?(
                      <>
                        <input style={inp({flex:1})} value={schedEditing.value} onChange={e=>setSchedEditing(p=>({...p,value:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveSchedItem()} autoFocus placeholder={`第 ${i+1} 項任務`}/>
                        <button style={{padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,whiteSpace:"nowrap"}} onClick={saveSchedItem}>✓ 儲存</button>
                        <button style={{padding:"5px 8px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setSchedEditing(null)}>✕</button>
                      </>
                    ):(
                      <>
                        <span style={{flex:1,fontSize:13,color:val?"#1e293b":"#cbd5e1"}}>{val||"（尚未設定）"}</span>
                        <button style={{padding:"5px 10px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,color:"#92400e",whiteSpace:"nowrap"}} onClick={()=>setSchedEditing({idx:i,value:val})}>✏️ 修改</button>
                      </>
                    )}
                  </div>
                );
              })}
              <div style={{marginTop:8,padding:12,background:"#f8fafc",borderRadius:12}}>
                <div style={{fontSize:11,fontWeight:800,color:"#94a3b8",marginBottom:8}}>📅 全週任務一覽</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {[1,2,3,4,5,6,0].map(d=>(
                    <div key={d} style={{background:d===dow?"#fef9c3":"#fff",borderRadius:10,padding:"7px 12px",border:d===dow?"1.5px solid #fbbf24":"1.5px solid #f1f5f9",display:"flex",gap:8,alignItems:"flex-start"}}>
                      <div style={{fontSize:11,fontWeight:800,color:d===dow?"#f97316":"#64748b",minWidth:36,paddingTop:1}}>週{DAYS_ZH[d]}{d===dow?"🐱":""}</div>
                      <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:"1px 10px"}}>
                        {(data.schedule?.[d]||["","","","",""]).map((t,i)=>(
                          <span key={i} style={{fontSize:11,color:t.trim()?"#475569":"#d1d5db"}}>{i+1}. {t.trim()||"未設定"}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab==="weekly"&&<div>
            {data.weeklyTasks.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {editingWeekly?.id===t.id?<><input style={inp({flex:1,minWidth:80})} value={editingWeekly.label} onChange={e=>setEditingWeekly(p=>({...p,label:e.target.value}))}/><input style={inp({width:55})} type="number" value={editingWeekly.score} onChange={e=>setEditingWeekly(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span><button style={{padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveWE}>✓</button><button style={{padding:"5px 8px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingWeekly(null)}>✕</button></>:<><span style={{flex:1,fontSize:13}}>{t.label}</span><span style={bge("#fde68a","#92400e")}>{t.score}分</span><button style={{padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>setEditingWeekly({...t})}>✏️</button><button style={{padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>delW(t.id)}>🗑</button></>}
            </div>)}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <input style={inp({flex:1,minWidth:80})} value={newWeekly.label} onChange={e=>setNewWeekly(p=>({...p,label:e.target.value}))} placeholder="新增任務名稱"/>
              <input style={inp({width:55})} type="number" value={newWeekly.score} onChange={e=>setNewWeekly(p=>({...p,score:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span>
              <button style={{padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addW}>＋</button>
            </div>
          </div>}

          {adminTab==="rewards"&&<div>
            {data.rewards.map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {editingReward?.id===r.id?<><input style={inp({flex:1,minWidth:80})} value={editingReward.label} onChange={e=>setEditingReward(p=>({...p,label:e.target.value}))}/><input style={inp({width:70})} type="number" value={editingReward.cost} onChange={e=>setEditingReward(p=>({...p,cost:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span><button style={{padding:"5px 10px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={saveRE}>✓</button><button style={{padding:"5px 8px",background:"#e2e8f0",border:"none",borderRadius:8,color:"#64748b",fontWeight:700,cursor:"pointer"}} onClick={()=>setEditingReward(null)}>✕</button></>:<><span style={{flex:1,fontSize:13}}>{r.label}</span><span style={bge("#dbeafe","#1e40af")}>{r.cost}分</span><button style={{padding:"4px 8px",background:"#fef9c3",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>setEditingReward({...r})}>✏️</button><button style={{padding:"4px 8px",background:"#fee2e2",border:"none",borderRadius:8,cursor:"pointer",fontSize:14}} onClick={()=>delR(r.id)}>🗑</button></>}
            </div>)}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <input style={inp({flex:1,minWidth:80})} value={newReward.label} onChange={e=>setNewReward(p=>({...p,label:e.target.value}))} placeholder="新增獎品名稱"/>
              <input style={inp({width:70})} type="number" value={newReward.cost} onChange={e=>setNewReward(p=>({...p,cost:e.target.value}))}/><span style={{fontSize:11,color:"#94a3b8"}}>分</span>
              <button style={{padding:"5px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={addR}>＋</button>
            </div>
          </div>}
        </div>
      )}

      {/* 🐾 慶祝 popup */}
      {justStamped==="paw"&&(
        <div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#faf5ff,#e9d5ff)",padding:"24px 40px",borderRadius:28,boxShadow:"0 8px 48px #a855f799",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #c084fc"}}>
          <div style={{fontSize:72}}>🐾</div>
          <div style={{color:"#7c3aed",fontWeight:900,fontSize:22,marginTop:6}}>獲得腳印戳章！</div>
          <div style={{color:"#a855f7",fontSize:13,marginTop:4}}>再完成 {STAMP_FULL-doneCount} 項可升級 🐱</div>
        </div>
      )}

      {/* 🐱 慶祝 popup */}
      {justStamped==="cat"&&(
        <div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#fef9c3,#fde68a)",padding:"28px 40px",borderRadius:28,boxShadow:"0 8px 48px #f59e0b99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #fbbf24"}}>
          <div style={{fontSize:80}}>🐱</div>
          <div style={{color:"#92400e",fontWeight:900,fontSize:22,marginTop:8}}>你好棒！</div>
          <div style={{color:"#b45309",fontWeight:700,fontSize:15,marginTop:4}}>完成全部任務，獲得貓咪戳章！</div>
        </div>
      )}

      {/* 領零用錢慶祝 */}
      {allowanceDone&&(
        <div style={{position:"fixed",top:"28%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#dcfce7,#bbf7d0)",padding:"24px 36px",borderRadius:28,boxShadow:"0 8px 48px #22c55e99",zIndex:999,pointerEvents:"none",textAlign:"center",border:"3px solid #22c55e"}}>
          <div style={{fontSize:72}}>💰</div><div style={{color:"#14532d",fontWeight:900,fontSize:22,marginTop:6}}>領到 ${ALLOWANCE_AMOUNT} 元零用錢！</div>
        </div>
      )}

      {/* 零用錢 modal */}
      {showAllowance&&<div style={modalBg} onClick={()=>setShowAllowance(false)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{fontSize:64}}>🐱</div><div style={{fontSize:22,fontWeight:900,margin:"12px 0 8px"}}>領取零用錢</div><p style={{fontSize:14,color:"#475569"}}>已集滿 {STAMP_THRESHOLD} 枚戳章！</p><div style={{fontSize:38,fontWeight:900,color:"#16a34a",margin:"10px 0"}}>💰 ${ALLOWANCE_AMOUNT} 元</div><p style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>可領 {redeemable} 次　|　戳章紀錄繼續累積</p><div style={{display:"flex",gap:10,marginTop:16}}><button style={{...btn("#e2e8f0","#64748b"),flex:1}} onClick={()=>setShowAllowance(false)}>取消</button><button style={{...btn("linear-gradient(135deg,#22c55e,#16a34a)"),flex:1}} onClick={doRedeemAllowance}>✅ 確認領取</button></div></div></div>}

      {/* 兌換獎品 modal */}
      {redeemTarget&&<div style={modalBg} onClick={()=>setRedeemTarget(null)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{fontSize:52}}>🎁</div><div style={{fontSize:22,fontWeight:900,margin:"10px 0 8px"}}>確認兌換？</div><p style={{fontSize:14,color:"#475569",margin:"0 0 4px"}}>{redeemTarget.label}</p><p style={{fontSize:20,fontWeight:900,color:"#f97316",margin:"4px 0"}}>消耗 {redeemTarget.cost} 分</p><p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>兌換後剩餘：{data.totalScore-redeemTarget.cost} 分</p><div style={{display:"flex",gap:10}}><button style={{...btn("#e2e8f0","#64748b"),flex:1}} onClick={()=>setRedeemTarget(null)}>取消</button><button style={{...btn("linear-gradient(135deg,#f59e0b,#f97316)"),flex:1}} onClick={()=>doRedeemReward(redeemTarget)}>✅ 確認兌換</button></div></div></div>}

      {/* 家長登入 modal */}
      {showAdminLogin&&<div style={modalBg} onClick={()=>{setShowAdminLogin(false);setAdminPwd("");setAdminErr(false);}}><div style={modal} onClick={e=>e.stopPropagation()}><div style={{fontSize:40}}>🔒</div><div style={{fontSize:22,fontWeight:900,margin:"10px 0 8px"}}>家長模式</div><p style={{fontSize:13,color:"#64748b",marginBottom:12}}>預設密碼：<b>parent123</b></p><input type="password" style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:16,marginBottom:8,boxSizing:"border-box",outline:"none"}} value={adminPwd} onChange={e=>{setAdminPwd(e.target.value);setAdminErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} placeholder="輸入密碼" autoFocus/>{adminErr&&<p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>密碼錯誤！</p>}<div style={{display:"flex",gap:10,marginTop:8}}><button style={{...btn("#e2e8f0","#64748b"),flex:1}} onClick={()=>{setShowAdminLogin(false);setAdminPwd("");setAdminErr(false);}}>取消</button><button style={{...btn("linear-gradient(135deg,#f59e0b,#f97316)"),flex:1}} onClick={tryAdmin}>進入</button></div></div></div>}
    </div>
  );
}
