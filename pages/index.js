import React, { useState, useEffect, useMemo, useRef } from 'react';

const BASE_VERTICES = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];

const ADJACENCY = {
  0: [1, 3, 4], 1: [0, 2, 5], 2: [1, 3, 6], 3: [0, 2, 7],
  4: [0, 5, 7], 5: [1, 4, 6], 6: [2, 5, 7], 7: [3, 4, 6],
};

/**
 * RE-DERIVED RELATIVE TURNS (PERSPECTIVE AWARE)
 * [LeftNeighbor, RightNeighbor] based on fixed coordinate system and consistent rotation rule.
 */
const RELATIVE_TURNS = {
  // Node 0 (0,0,0)
  "1-0": [4, 3], "3-0": [1, 4], "4-0": [3, 1],
  // Node 1 (1,0,0)
  "0-1": [5, 2], "2-1": [0, 5], "5-1": [2, 0],
  // Node 2 (1,1,0)
  "1-2": [6, 3], "3-2": [1, 6], "6-2": [3, 1],
  // Node 3 (0,1,0)
  "0-3": [2, 7], "2-3": [7, 0], "7-3": [0, 2],
  // Node 4 (0,0,1)
  "0-4": [7, 5], "5-4": [0, 7], "7-4": [5, 0],
  // Node 5 (1,0,1)
  "1-5": [4, 6], "4-5": [6, 1], "6-5": [1, 4],
  // Node 6 (1,1,1)
  "2-6": [7, 5], "5-6": [2, 7], "7-6": [5, 2],
  // Node 7 (0,1,1)
  "3-7": [6, 4], "4-7": [3, 6], "6-7": [4, 3],
};

const TRANSLATIONS = {
  en: {
    title: "Ant on Cube 🐜", subtitle: "Keyboard: L, R, B",
    left: "Left", right: "Right", back: "Back",
    clear: "Clear Path", save: "Save", saved: "Saved Paths",
    noPath: "START", undo: "Undo", replay: "Replay",
    startNode: "Start Point", startFrom: "Heading From",
    rotAxis: "Rotate", autoSave: "AUTO-SAVE",
    node: "Point", chars: { L: 'L', R: 'R', B: 'B' }
  },
  hu: {
    title: "Hangya a kockán 🐜", subtitle: "Billentyűk: B, J, V",
    left: "Bal", right: "Jobb", back: "Vissza",
    clear: "Törlés", save: "Mentés", saved: "Mentett utak",
    noPath: "RAJT", undo: "Visszavon", replay: "Lejátszás",
    startNode: "Kezdőpont", startFrom: "Iránypont",
    rotAxis: "Forgatás", autoSave: "AUTO-MENTÉS",
    node: "Pont", chars: { L: 'B', R: 'J', B: 'V' }
  }
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-black">{t.title}</h1>
            <p className="text-slate-500 text-sm font-medium">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en') ? 'hu' : 'en'}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {lang === 'en' ? 'Magyar' : 'English'}
          </button>
        </header>
        <CubeSimulation lang={lang} t={t} />
      </div>
    </div>
  );
}

function CubeSimulation({ lang, t }) {
  const [startPoint, setStartPoint] = useState({ node: 6, from: 2 });
  const [current, setCurrent] = useState(6);
  const [previous, setPrevious] = useState(2);
  const [logicPath, setPath] = useState([]);
  const [isModified, setIsModified] = useState(false);
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinned, setPinned] = useState(Array(5).fill(false));
  const [rot, setRot] = useState({ x: 25, y: -30, z: 0 }); // Adjusted to -30 for better visibility
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(-1); // New state for highlighting
  const replayRef = useRef(null);

  const displayChars = useMemo(() => lang === 'en' ? TRANSLATIONS.en.chars : TRANSLATIONS.hu.chars, [lang]);
  const formatPath = (pathArr) => {
    if (!pathArr || pathArr.length === 0) return t.noPath;
    return pathArr.map(c => displayChars[c]).join('').match(/.{1,5}/g).join(' ');
  };
  const activePathString = useMemo(() => formatPath(logicPath), [logicPath, displayChars, t.noPath]);

  const opt = useMemo(() => {
    const key = `${previous}-${current}`;
    const [L, R] = RELATIVE_TURNS[key] || [null, null];
    return { L, R, B: previous };
  }, [current, previous]);

  const moveAnt = (turn, isEvent = true) => {
    if (isReplaying && isEvent) { stopReplay(); return; }
    const next = turn === 'B' ? opt.B : (turn === 'L' ? opt.L : opt.R);
    if (next === null || next === undefined) return;

    setPrevious(current);
    setCurrent(next);
    if (isEvent) {
      setPath(prev => [...prev, turn]);
      setIsModified(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'SELECT' || e.repeat) return; // Prevent continuous firing
      const key = e.key.toUpperCase();
      if (lang === 'en') {
        if (key === 'L') moveAnt('L');
        if (key === 'R') moveAnt('R');
        if (key === 'B') moveAnt('B');
      } else {
        if (key === 'B') moveAnt('L'); // 'B' (Bal) for Left
        if (key === 'J') moveAnt('R'); // 'J' (Jobb) for Right
        if (key === 'V') moveAnt('B'); // 'V' (Vissza) for Back
      }
      if (e.key === 'Backspace') undo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opt, lang, isReplaying]);

  const stopReplay = () => {
    if (replayRef.current) clearInterval(replayRef.current);
    setIsReplaying(false);
    setReplayStep(-1);
  };

  const startReplay = () => {
    if (isReplaying || logicPath.length === 0) return;
    stopReplay();
    setIsReplaying(true);
    setReplayStep(0);
    
    let step = 0;
    let c = startPoint.node;
    let p = startPoint.from;
    setCurrent(c); setPrevious(p);

    replayRef.current = setInterval(() => {
      if (step >= logicPath.length) {
        stopReplay();
        return;
      }
      const turn = logicPath[step];
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
      setPrevious(p); setCurrent(c);
      setReplayStep(step);
      step++;
    }, 600);
  };

  const undo = () => {
    if (isReplaying) stopReplay();
    if (logicPath.length === 0) return;
    const newPath = logicPath.slice(0, -1);
    setPath(newPath);
    setIsModified(true);
    let c = startPoint.node, p = startPoint.from;
    newPath.forEach(turn => {
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
    });
    setPrevious(p); setCurrent(c);
  };

  const reset = () => {
    if (isReplaying) stopReplay();
    if (logicPath.length > 0 && isModified) {
      const idx = slots.findIndex((s, i) => !pinned[i]);
      if (idx !== -1) {
        const newSlots = [...slots];
        newSlots[idx] = [...logicPath]; // Save logicPath array
        setSlots(newSlots);
      }
    }
    setPath([]);
    setCurrent(startPoint.node);
    setPrevious(startPoint.from);
    setIsModified(false);
  };

  const loadSlot = (logicArr) => {
    if (!logicArr) return;
    if (logicPath.length > 0 && isModified) {
       const idx = slots.findIndex((s, i) => !pinned[i]);
       if (idx !== -1) {
         const newSlots = [...slots];
         newSlots[idx] = [...logicPath];
         setSlots(newSlots);
       }
    }
    setPath([...logicArr]);
    setIsModified(false);
    let c = startPoint.node, p = startPoint.from;
    logicArr.forEach(turn => {
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
    });
    setPrevious(p); setCurrent(c);
  };

  const project = (v) => {
    let [x, y, z] = BASE_VERTICES[v];
    x -= 0.5; y -= 0.5; z -= 0.5;
    const rx = rot.x * Math.PI / 180, ry = rot.y * Math.PI / 180, rz = rot.z * Math.PI / 180;
    let tx = x * Math.cos(ry) + z * Math.sin(ry), tz = z * Math.cos(ry) - x * Math.sin(ry);
    x = tx; z = tz;
    let ty = y * Math.cos(rx) - z * Math.sin(rx); tz = z * Math.cos(rx) + y * Math.sin(rx);
    y = ty; z = tz;
    tx = x * Math.cos(rz) - y * Math.sin(rz); ty = y * Math.cos(rz) + x * Math.sin(rz);
    x = tx; y = ty;
    const scale = 180;
    return { px: 200 + x * scale, py: 200 - y * scale };
  };

  const getArrow = (target, color, label) => {
    if (target === null || target === undefined) return null;
    const pF = project(current), pT = project(target);
    const dx = pT.px - pF.px, dy = pT.py - pF.py;
    const mx = pF.px + dx * 0.55, my = pF.py + dy * 0.55;
    return (
      <g key={label} className="transition-all duration-300">
        <line x1={pF.px} y1={pF.py} x2={pT.px} y2={pT.py} stroke={color} strokeWidth="3" strokeDasharray="4 4" className="opacity-30" />
        <circle cx={mx} cy={my} r="11" fill={color} className="shadow-lg" />
        <text x={mx} y={my+4} fontSize="11" fontWeight="900" fill="white" textAnchor="middle">{label}</text>
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden min-h-[550px]">
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20 bg-slate-50/80 backdrop-blur p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.rotAxis}</span>
          <div className="flex gap-2">
            <button onClick={() => setRot(r=>({...r, x: (r.x+90)%360}))} className="w-9 h-9 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 font-bold">X</button>
            <button onClick={() => setRot(r=>({...r, y: (r.y+90)%360}))} className="w-9 h-9 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 font-bold">Y</button>
            <button onClick={() => setRot(r=>({...r, z: (r.z+90)%360}))} className="w-9 h-9 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 font-bold">Z</button>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex flex-col gap-2 z-20 text-right">
          <div className="bg-white/80 backdrop-blur p-2 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">{t.startNode}</span>
            <select value={startPoint.node} onChange={e=>{const n=parseInt(e.target.value); setStartPoint({node:n, from: ADJACENCY[n][0]}); reset()}} className="text-xs font-black p-1 border-none focus:ring-0">
              {[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="bg-white/80 backdrop-blur p-2 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">{t.startFrom}</span>
            <select value={startPoint.from} onChange={e=>{setStartPoint(prev=>({...prev, from:parseInt(e.target.value)})); reset()}} className="text-xs font-black p-1 border-none focus:ring-0">
              {ADJACENCY[startPoint.node].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <svg viewBox="0 0 400 400" className="w-full h-full max-w-[400px] overflow-visible">
            {Object.entries(ADJACENCY).map(([s, neighbors]) => neighbors.map(e => {
              if (parseInt(s) > e) return null;
              const p1 = project(s), p2 = project(e);
              return <line key={`${s}-${e}`} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#e2e8f0" strokeWidth="2" />;
            }))}
            
            {(() => {
              const pF = project(previous), pT = project(current);
              return <path d={`M ${pF.px} ${pF.py} L ${pT.px} ${pT.py}`} stroke="#6366f1" strokeWidth="5" strokeLinecap="round" className="opacity-20 transition-all duration-500" />;
            })()}

            {!isReplaying && [
              { target: opt.L, color: '#f43f5e', label: t.chars.L },
              { target: opt.R, color: '#10b981', label: t.chars.R }
            ].map(a => getArrow(a.target, a.color, a.label))}

            {BASE_VERTICES.map((_, i) => {
              const p = project(i), isS = i === startPoint.node;
              return (
                <g key={i}>
                  <circle cx={p.px} cy={p.py} r={isS?7:4} fill={isS?'#fbbf24':'#cbd5e1'} className="transition-all duration-700" />
                  <text x={p.px+8} y={p.py-8} className="text-[10px] fill-slate-300 font-bold select-none">{i}</text>
                </g>
              );
            })}

            {(() => {
              const p = project(current);
              return (
                <g transform={`translate(${p.px},${p.py})`} className="transition-all duration-500 ease-in-out">
                  <circle r="14" fill="white" className="shadow-2xl" />
                  <text fontSize="20" textAnchor="middle" y="7" className="select-none">🐜</text>
                </g>
              );
            })()}
          </svg>
        </div>

        <div className="w-full flex justify-between items-end px-4 mb-4">
          <div className="text-[9px] font-bold text-slate-400 uppercase space-y-1">
            <div className="flex items-center"><div className="w-2 bg-amber-400 h-2 rounded-full mr-1" />{t.startNode}: {startPoint.node}</div>
            <div className="flex items-center"><div className="w-2 bg-indigo-500 h-2 rounded-full mr-1" />{t.node}: {current}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-400">{logicPath.length} STEPS</div>
            <div className="bg-slate-900 px-[1.125rem] py-3 rounded-2xl text-white font-mono text-2xl font-black tracking-[0.2em] shadow-2xl max-w-[280px] break-all leading-none">
              {logicPath.map((char, idx) => (
                <span key={idx} className={replayStep === idx ? 'text-yellow-400' : ''}>
                  {displayChars[char]}
                </span>
              )).reduce((acc, curr, idx) => {
                if (idx > 0 && idx % 5 === 0) {
                  acc.push(<span key={`space-${idx}`} className="w-3 inline-block"> </span>);
                }
                acc.push(curr);
                return acc;
              }, []) || t.noPath}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button onClick={() => moveAnt('L')} className="bg-rose-500 hover:bg-rose-600 text-white rounded-3xl py-6 shadow-xl shadow-rose-100 transition-all active:scale-90 flex flex-col items-center">
              <span className="text-3xl font-black">{t.chars.L}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase">{t.left}</span>
            </button>
            <button onClick={() => moveAnt('R')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl py-6 shadow-xl shadow-emerald-100 transition-all active:scale-90 flex flex-col items-center">
              <span className="text-3xl font-black">{t.chars.R}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase">{t.right}</span>
            </button>
            <button onClick={() => moveAnt('B')} className="bg-slate-700 hover:bg-slate-800 text-white rounded-3xl py-6 shadow-xl shadow-slate-100 transition-all active:scale-90 flex flex-col items-center">
              <span className="text-3xl font-black">{t.chars.B}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase">{t.back}</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={undo} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2">
              ⌫ {t.undo}
            </button>
            <button onClick={startReplay} disabled={isReplaying || logicPath.length===0} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-4 rounded-2xl border border-indigo-100 transition-all disabled:opacity-20 flex items-center justify-center gap-2">
              ▶️ {t.replay}
            </button>
          </div>
          
          <button onClick={reset} className="w-full mt-4 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">{t.clear}</button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{t.saved}</h3>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{t.autoSave}</span>
          </div>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={i} onClick={() => loadSlot(s)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${s ? 'bg-slate-800 border border-slate-700 hover:border-slate-500 shadow-lg' : 'border border-slate-800/50 opacity-20'}`}>
                <span className="text-slate-600 font-black text-xs">{i+1}</span>
                <span className="flex-1 font-mono text-xs font-black tracking-widest text-amber-400 truncate uppercase">
                  {s ? s.map(c => t.chars[c]).join('').match(/.{1,5}/g).join(' ') : "---"}
                </span>
                {s && (
                  <button onClick={e=>{e.stopPropagation(); const n=[...pinned]; n[i]=!n[i]; setPinned(n)}} className={pinned[i]?'opacity-100 drop-shadow-[0_0_5px_#fbbf24]':'opacity-30 hover:opacity-100'}>
                    📌
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
