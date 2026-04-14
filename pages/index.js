import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Ant on Cube Logic:
 * Vertices (x,y,z) normalized 0 to 1
 */
const BASE_VERTICES = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];

const ADJACENCY = {
  0: [1, 3, 4], 1: [0, 2, 5], 2: [1, 3, 6], 3: [0, 2, 7],
  4: [0, 5, 7], 5: [1, 4, 6], 6: [2, 5, 7], 7: [3, 4, 6],
};

const RELATIVE_TURNS = {
  "2-6": [7, 5], "5-6": [2, 7], "7-6": [5, 2],
  "6-2": [1, 3], "1-2": [3, 6], "3-2": [6, 1],
  "6-5": [4, 1], "4-5": [1, 6], "1-5": [6, 4],
  "6-7": [3, 4], "3-7": [4, 6], "4-7": [6, 3],
  "2-1": [0, 5], "0-1": [5, 2], "5-1": [2, 0],
  "2-3": [7, 0], "7-3": [0, 2], "0-3": [2, 7],
  "1-0": [3, 4], "3-0": [4, 1], "4-0": [1, 3],
  "5-4": [0, 7], "0-4": [7, 5], "7-4": [5, 0],
};

const TRANSLATIONS = {
  en: {
    title: "Ant on Cube 🐜", subtitle: "Navigate the cube relative to the ant's perspective.",
    left: "Left", right: "Right", back: "Back",
    reset: "Clear", saved: "Saved Paths", noPath: "START",
    exercise: "The Rules", undo: "Undo", replay: "Replay",
    startNode: "Start Point", startFrom: "Heading From"
  },
  hu: {
    title: "Hangya a kockán 🐜", subtitle: "Irányítsd a hangyát a saját nézőpontjából.",
    left: "Bal", right: "Jobb", back: "Vissza",
    reset: "Törlés", saved: "Mentett utak", noPath: "RAJT",
    exercise: "Szabályok", undo: "Vissza", replay: "Lejátszás",
    startNode: "Kezdőpont", startFrom: "Iránypont"
  }
};

const EN_CHARS = { L: 'L', R: 'R', B: 'B' };
const HU_CHARS = { L: 'B', R: 'J', B: 'V' };

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h1>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'hu' : 'en')}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
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
  // Global Setup
  const [startNode, setStartNode] = useState(6);
  const [startFrom, setStartFrom] = useState(2);
  
  // Current State
  const [current, setCurrent] = useState(6);
  const [previous, setPrevious] = useState(2);
  const [logicPath, setPath] = useState([]); // Array of 'L','R','B'
  const [isModified, setIsModified] = useState(false);
  
  // Persistence
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinned, setPinned] = useState(Array(5).fill(false));
  
  // View State
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimeoutRef = useRef(null);

  const displayPath = useMemo(() => {
    const map = lang === 'en' ? EN_CHARS : HU_CHARS;
    return logicPath.map(c => map[c]).join('');
  }, [logicPath, lang]);

  const turnOptions = useMemo(() => {
    const key = `${previous}-${current}`;
    const [L, R] = RELATIVE_TURNS[key] || [null, null];
    return { L, R, B: previous };
  }, [current, previous]);

  // Handle Logic
  const moveAnt = (turn, isAuto = false) => {
    if (isReplaying && !isAuto) { stopReplay(); return; }
    const next = turn === 'B' ? turnOptions.B : (turn === 'L' ? turnOptions.L : turnOptions.R);
    if (next === null || next === undefined) return;

    setPrevious(current);
    setCurrent(next);
    if (!isAuto) {
      setPath(prev => [...prev, turn]);
      setIsModified(true);
    }
  };

  const stopReplay = () => {
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
    setIsReplaying(false);
  };

  const startReplay = () => {
    if (isReplaying || logicPath.length === 0) return;
    const pathCopy = [...logicPath];
    setCurrent(startNode);
    setPrevious(startFrom);
    setIsReplaying(true);
    
    let i = 0;
    const runStep = () => {
      if (i >= pathCopy.length) {
        setIsReplaying(false);
        return;
      }
      const turn = pathCopy[i];
      // Inline update to ensure state consistency during rapid steps
      setCurrent(c => {
        setPrevious(p => {
          const key = `${p}-${c}`;
          const [L, R] = RELATIVE_TURNS[key];
          return c;
        });
        const turnKey = `${previous}-${c}`; // This uses closure previous, might be stale? 
        // We'll use a better pattern via functional updates
        return c; 
      });
      // Actually refactor moveAnt logic for replay
      const currentTurn = pathCopy[i];
      setPath(p => {
        setCurrent(curr => {
          setPrevious(prev => {
            const key = `${prev}-${curr}`;
            const [L,R] = RELATIVE_TURNS[key];
            const nextNode = currentTurn === 'B' ? prev : (currentTurn === 'L' ? L : R);
            // Non-functional inner update workaround
            return curr;
          });
          return curr; // logic update handled in useEffect trigger or simpler loop
        });
        return p;
      });
      
      // Let's use a simpler state-safe loop
      i++;
      replayTimeoutRef.current = setTimeout(runStep, 500);
    };
    
    // Better Replay implementation
    stopReplay();
    setIsReplaying(true);
    let step = 0;
    let c = startNode;
    let p = startFrom;
    setCurrent(c); setPrevious(p);

    const interval = setInterval(() => {
      if (step >= pathCopy.length) {
        clearInterval(interval);
        setIsReplaying(false);
        return;
      }
      const turn = pathCopy[step];
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
      setPrevious(p); setCurrent(c);
      step++;
    }, 500);
    replayTimeoutRef.current = interval;
  };

  const undo = () => {
    if (isReplaying) stopReplay();
    if (logicPath.length === 0) return;
    
    const newPath = logicPath.slice(0, -1);
    setPath(newPath);
    setIsModified(true);
    
    let c = startNode;
    let p = startFrom;
    newPath.forEach(turn => {
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
    });
    setPrevious(p); setCurrent(c);
  };

  const loadSequence = (pString) => {
    if (!pString) return;
    // Save current if needed
    if (logicPath.length > 0 && isModified) {
      saveToSlot([...logicPath]);
    }
    
    const charMap = { ...EN_CHARS, ...HU_CHARS };
    const revMap = { L: 'L', R: 'R', B: 'B', J: 'R', V: 'B' };
    const newLogic = [...pString].map(char => revMap[char] || 'L');
    
    setPath(newLogic);
    setIsModified(false);
    
    // Position at end
    let c = startNode;
    let p = startFrom;
    newLogic.forEach(turn => {
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c; c = next;
    });
    setPrevious(p); setCurrent(c);
  };

  const saveToSlot = (p) => {
    const pString = p.map(c => EN_CHARS[c]).join('');
    const idx = slots.findIndex((s, i) => !pinned[i]);
    if (idx !== -1) {
      const newSlots = [...slots];
      newSlots[idx] = pString;
      setSlots(newSlots);
    }
  };

  const reset = () => {
    if (logicPath.length > 0 && isModified) saveToSlot(logicPath);
    setPath([]);
    setCurrent(startNode);
    setPrevious(startFrom);
    setIsModified(false);
  };

  // 3D Geometry
  const project = (v) => {
    let [x, y, z] = BASE_VERTICES[v];
    x -= 0.5; y -= 0.5; z -= 0.5; // Center

    // Rotations (simplified)
    const ry = rot.y * Math.PI / 180;
    const rx = rot.x * Math.PI / 180;
    const rz = rot.z * Math.PI / 180;

    // Y Axis
    let tx = x * Math.cos(ry) + y * Math.sin(ry);
    let ty = y * Math.cos(ry) - x * Math.sin(ry);
    x = tx; y = ty;
    // X Axis
    let tz = z * Math.cos(rx) - y * Math.sin(rx);
    ty = y * Math.cos(rx) + z * Math.sin(rx);
    z = tz; y = ty;

    const scale = 160;
    const px = 200 + x * scale;
    const py = 200 - z * scale + y * (scale * 0.3); // Oblique factor
    return { px, py };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Visualizer Panel */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden min-h-[550px]">
        {/* Rotation Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <div className="flex gap-1 text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Rotation Axis</div>
          <div className="flex gap-2">
            <button onClick={() => setRot(r => ({...r, x: r.x+90}))} className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-slate-200 font-bold text-slate-600 shadow-sm">X</button>
            <button onClick={() => setRot(r => ({...r, y: r.y+90}))} className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-slate-200 font-bold text-slate-600 shadow-sm">Y</button>
            <button onClick={() => setRot(r => ({...r, z: r.z+90}))} className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-slate-200 font-bold text-slate-600 shadow-sm">Z</button>
          </div>
        </div>

        {/* Start Selectors */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-20">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 px-2">{t.startNode}</span>
            <select value={startNode} onChange={e => setStartNode(parseInt(e.target.value))} className="bg-white rounded-lg border-none text-xs font-bold text-slate-700 py-1">
              {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 px-2">{t.startFrom}</span>
            <select value={startFrom} onChange={e => setStartFrom(parseInt(e.target.value))} className="bg-white rounded-lg border-none text-xs font-bold text-slate-700 py-1">
              {ADJACENCY[startNode].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 w-full flex items-center justify-center translate-y-4">
          <svg viewBox="0 0 400 400" className="w-full h-full max-w-[450px] overflow-visible drop-shadow-2xl">
            {Object.entries(ADJACENCY).map(([start, neighbors]) => 
              neighbors.map(end => {
                if (parseInt(start) > end) return null;
                const p1 = project(start), p2 = project(end);
                return <line key={`${start}-${end}`} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />;
              })
            )}
            {Object.entries(ADJACENCY).map(([start, neighbors]) => 
              neighbors.map(end => {
                if (parseInt(start) > end) return null;
                const p1 = project(start), p2 = project(end);
                return <line key={`i-${start}-${end}`} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />;
              })
            )}
            
            {/* Start Node Indicator */}
            {(() => {
              const p = project(startNode);
              return <circle cx={p.px} cy={p.py} r="14" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" className="animate-[spin_4s_linear_infinite]" />;
            })()}

            {/* Ant Decision Arrows */}
            {!isReplaying && [
              { target: turnOptions.L, color: '#f43f5e', label: lang === 'en' ? 'L' : 'B' },
              { target: turnOptions.R, color: '#10b981', label: lang === 'en' ? 'R' : 'J' }
            ].map((opt, i) => {
              if (opt.target === null) return null;
              const pF = project(current), pT = project(opt.target);
              const dx = pT.px-pF.px, dy = pT.py-pF.py;
              const mx = pF.px + dx*0.6, my = pF.py + dy*0.6;
              return (
                <g key={i}>
                  <line x1={pF.px} y1={pF.py} x2={pT.px} y2={pT.py} stroke={opt.color} strokeWidth="3" strokeDasharray="4 2" className="opacity-40" />
                  <circle cx={mx} cy={my} r="10" fill={opt.color} />
                  <text x={mx} y={my+4} fontSize="10" fill="white" fontWeight="900" textAnchor="middle">{opt.label}</text>
                </g>
              )
            })}

            {/* Vertices */}
            {BASE_VERTICES.map((_, i) => {
              const p = project(i);
              return (
                <g key={i} className="transition-all duration-700">
                  <circle cx={p.px} cy={p.py} r="5" fill="#94a3b8" />
                  <text x={p.px + 10} y={p.py - 10} fontSize="12" fill="#cbd5e1" fontWeight="bold">{i}</text>
                </g>
              );
            })}

            {/* THE ANT */}
            {(() => {
              const p = project(current);
              return (
                <g className="transition-all duration-500 ease-in-out" transform={`translate(${p.px},${p.py})`}>
                  <circle r="12" fill="white" shadow="lg" className="shadow-black/20" />
                  <text fontSize="18" textAnchor="middle" y="6">🐜</text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* HUD Overlay */}
        <div className="flex w-full justify-between items-end px-4 pb-4">
          <div className="flex gap-4 text-[9px] font-black uppercase text-slate-400">
            <div className="flex items-center"><div className="w-2 h-2 bg-amber-400 rounded-full mr-1.5" />{lang==='en'?'START':'START'}</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-1.5" />NODE {current}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-2xl text-white font-mono text-xl font-black shadow-2xl flex items-center gap-3">
            <span className="text-slate-500 text-xs mt-1">{logicPath.length}</span>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <span className="tracking-widest">{displayPath || t.noPath}</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button onClick={() => moveAnt('L')} className="group flex flex-col items-center bg-rose-500 hover:bg-rose-600 text-white rounded-3xl py-6 shadow-xl shadow-rose-200 transition-all active:scale-95">
              <span className="text-3xl font-black mb-1">{lang === 'en' ? 'L' : 'B'}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t.left}</span>
            </button>
            <button onClick={() => moveAnt('R')} className="group flex flex-col items-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl py-6 shadow-xl shadow-emerald-200 transition-all active:scale-95">
              <span className="text-3xl font-black mb-1">{lang === 'en' ? 'R' : 'J'}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t.right}</span>
            </button>
            <button onClick={() => moveAnt('B')} className="group flex flex-col items-center bg-slate-700 hover:bg-slate-800 text-white rounded-3xl py-6 shadow-xl shadow-slate-200 transition-all active:scale-95">
              <span className="text-xl font-black mb-1">{lang === 'en' ? 'BACK' : 'VISSZA'}</span>
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest font-mono tracking-tighter truncate">{t.back}</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={undo} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">⌫</span> {t.undo}
            </button>
            <button onClick={startReplay} disabled={isReplaying || logicPath.length===0} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold py-4 rounded-2xl border border-indigo-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
              <span className="text-lg">▶️</span> {t.replay}
            </button>
          </div>
          
          <button onClick={reset} className="w-full mt-3 py-3 text-slate-400 font-bold hover:text-rose-500 transition-colors uppercase tracking-widest text-[10px]">
            {t.reset}
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-6 flex justify-between items-center">
              {t.saved}
              <div className="px-2 py-0.5 bg-slate-800 rounded font-mono text-[9px]">{logicPath.length > 0 ? 'AUTO-SAVE ON RESET' : 'EMPTY'}</div>
            </h3>
            <div className="space-y-3">
              {slots.map((s, i) => (
                <div key={i} onClick={() => loadSequence(s)} className={`group/slot flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all ${s ? 'bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:border-slate-600 shadow-lg' : 'border border-slate-800/50 opacity-20 hover:opacity-40'}`}>
                  <span className="font-black text-slate-600 text-sm">{i+1}</span>
                  <div className="flex-1 font-mono text-xs tracking-[0.2em] font-black text-indigo-400 truncate">{s || "---"}</div>
                  {s && (
                    <button 
                      onClick={(e) => {e.stopPropagation(); const n = [...pinned]; n[i]=!n[i]; setPinned(n)}} 
                      className={`text-xl transition-all hover:scale-125 ${pinned[i] ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'grayscale opacity-30 rotate-12'}`}
                    >
                      📌
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
