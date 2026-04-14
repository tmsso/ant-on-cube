import React, { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Ant on Cube Logic:
 * Vertices (x,y,z): 0-7
 * Starting at vertex 6.
 */
const BASE_VERTICES = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];

const ADJACENCY = {
  0: [1, 3, 4], 1: [0, 2, 5], 2: [1, 3, 6], 3: [0, 2, 7],
  4: [0, 5, 7], 5: [1, 4, 6], 6: [2, 5, 7], 7: [3, 4, 6],
};

// RELATIVE HEADING LOGIC
// key: "fromIdx-toIdx", value: [LeftNeighbor, RightNeighbor]
// Defined by looking from 'from' towards 'to' on the surface/edges
const RELATIVE_TURNS = {
  "2-6": [7, 5], "5-6": [2, 7], "7-6": [5, 2], // At 6
  "6-2": [1, 3], "1-2": [3, 6], "3-2": [6, 1], // At 2
  "6-5": [4, 1], "4-5": [1, 6], "1-5": [6, 4], // At 5
  "6-7": [3, 4], "3-7": [4, 6], "4-7": [6, 3], // At 7
  "2-1": [0, 5], "0-1": [5, 2], "5-1": [2, 0], // At 1
  "2-3": [7, 0], "7-3": [0, 2], "0-3": [2, 7], // At 3
  "1-0": [3, 4], "3-0": [4, 1], "4-0": [1, 3], // At 0
  "5-4": [0, 7], "0-4": [7, 5], "7-4": [5, 0], // At 4
};

const TRANSLATIONS = {
  en: {
    title: "Ant on Cube 🐜",
    subtitle: "Navigate the cube! Left and Right are relative to the ant's perspective.",
    left: "Left", right: "Right", back: "Back",
    reset: "Reset & Save", saved: "Saved Paths",
    noPath: "START @ 6", exercise: "The Rules",
    undo: "Undo", replay: "Replay Path",
    rotate: "Rotate Cube"
  },
  hu: {
    title: "Hangya a kockán 🐜",
    subtitle: "Irányítsd a hangyát! A Bal és Jobb az ő nézőpontjához képest értendő.",
    left: "Bal", right: "Jobb", back: "Vissza",
    reset: "Alaphelyzet", saved: "Mentett utak",
    noPath: "RAJT @ 6", exercise: "Szabályok",
    undo: "Vissza", replay: "Lejátszás",
    rotate: "Forgatás"
  }
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{t.title}</h1>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'hu' : 'en')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-full hover:bg-slate-200 transition-all"
          >
            {lang === 'en' ? '🇭🇺 HU' : '🇺🇸 EN'}
          </button>
        </header>
        
        <CubeSimulation lang={lang} t={t} />
      </div>
    </div>
  );
}

function CubeSimulation({ lang, t }) {
  const START_NODE = 6;
  const START_PREV = 2; // Initial heading: from 2 to 6

  const [current, setCurrent] = useState(START_NODE);
  const [previous, setPrevious] = useState(START_PREV);
  const [path, setPath] = useState(''); // Stores raw L, R, B
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinned, setPinned] = useState(Array(5).fill(false));
  const [rot, setRot] = useState(0); // 0, 1, 2 (increments of 90deg Y-axis)
  
  const [isReplaying, setIsReplaying] = useState(false);
  const replayRef = useRef(null);

  // Derived decision neighbors based on ant heading
  const turnOptions = useMemo(() => {
    const key = `${previous}-${current}`;
    const [L, R] = RELATIVE_TURNS[key] || [null, null];
    return { L, R, B: previous };
  }, [current, previous]);

  const moveAnt = (turn, silent = false) => {
    if (isReplaying && !silent) {
      stopReplay();
      return;
    }

    const next = turn === 'B' ? turnOptions.B : (turn === 'L' ? turnOptions.L : turnOptions.R);
    if (next === null) return;

    setPrevious(current);
    setCurrent(next);
    
    if (!silent) {
      const label = turn === 'L' ? (lang === 'en' ? 'L' : 'B') : 
                    (turn === 'R' ? (lang === 'en' ? 'R' : 'J') : 
                    (lang === 'en' ? 'B' : 'V'));
      setPath(prev => prev + label);
    }
  };

  const undo = () => {
    if (isReplaying) { stopReplay(); return; }
    if (path.length === 0) return;
    
    // To undo, we effectively need to recalculate from start
    const newPathString = path.slice(0, -1);
    setPath('');
    setCurrent(START_NODE);
    setPrevious(START_PREV);
    
    // Re-run the path
    // Note: This is simpler than tracking full state history for this specific math puzzle
    const chars = [...newPathString];
    let c = START_NODE;
    let p = START_PREV;
    
    chars.forEach(char => {
      const key = `${p}-${c}`;
      const [L, R] = RELATIVE_TURNS[key];
      const turn = (char === 'L' || char === 'B') ? 'L' : (char === 'R' || char === 'J' ? 'R' : 'B');
      const next = turn === 'B' ? p : (turn === 'L' ? L : R);
      p = c;
      c = next;
    });
    
    setPrevious(p);
    setCurrent(c);
    setPath(newPathString);
  };

  const handleReplay = async () => {
    if (isReplaying) return;
    const originalPath = path;
    setCurrent(START_NODE);
    setPrevious(START_PREV);
    setIsReplaying(true);

    const steps = [...originalPath];
    for (let i = 0; i < steps.length; i++) {
      if (replayRef.current === 'stop') break;
      await new Promise(r => setTimeout(r, 600));
      
      const char = steps[i];
      // Map localized char back to logic turn
      let turn = 'B';
      if (char === 'L' || char === 'B') turn = 'L';
      if (char === 'R' || char === 'J') turn = 'R';
      
      // Execute move logic manually to avoid path appending
      setCurrent(curr => {
        setPrevious(prev => {
          const key = `${prev}-${curr}`;
          const [L, R] = RELATIVE_TURNS[key];
          const next = turn === 'B' ? prev : (turn === 'L' ? L : R);
          return curr;
        });
        const prevCurrent = curr;
        // logic repeat
        const turnKey = `${previous}-${curr}`;
        const [tL, tR] = RELATIVE_TURNS[turnKey];
        return turn === 'B' ? previous : (turn === 'L' ? tL : tR);
      });
    }
    
    // Restore end state if stopped or finished
    setIsReplaying(false);
    replayRef.current = null;
    // For simplicity in this UI, we just let the state sit where it ended
  };

  const stopReplay = () => {
    replayRef.current = 'stop';
    setIsReplaying(false);
  };

  const reset = () => {
    if (isReplaying) { stopReplay(); return; }
    if (path.length > 0) {
      const firstEmpty = slots.findIndex((s, i) => s === null && !pinned[i]);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : slots.findIndex((_, i) => !pinned[i]);
      if (targetIndex !== -1) {
        const newSlots = [...slots];
        newSlots[targetIndex] = path;
        setSlots(newSlots);
      }
    }
    setCurrent(START_NODE);
    setPrevious(START_PREV);
    setPath('');
  };

  // Rotation & Projection
  const project = (v) => {
    let [x, y, z] = BASE_VERTICES[v];
    
    // Apply 90deg Y-axis rotations
    for(let i=0; i<rot; i++) {
      const oldX = x;
      x = 1 - y;
      y = oldX;
    }

    const scale = 120;
    const offsetX = 150;
    const offsetY = 140;
    
    // Oblique projection with depth factor
    const px = offsetX + (x * scale) - (y * 0.4 * scale);
    const py = offsetY - (z * scale) + (y * 0.3 * scale);
    return { px, py };
  };

  const getIndicator = (toIdx, color, label) => {
    const to = project(toIdx);
    const from = project(current);
    const dx = to.px - from.px;
    const dy = to.py - from.py;
    const mx = from.px + dx * 0.6;
    const my = from.py + dy * 0.6;
    
    return (
      <g className="transition-all duration-300">
        <line x1={from.px} y1={from.py} x2={to.px} y2={to.py} stroke={color} strokeWidth="4" strokeDasharray="5 3" className="animate-pulse" />
        <circle cx={mx} cy={my} r="12" fill={color} className="shadow-lg" />
        <text x={mx} y={my+4} fontSize="12" fontWeight="black" fill="white" textAnchor="middle">{label}</text>
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Dashboard/Controls */}
      <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">{t.rotate}</h3>
             <button 
               onClick={() => setRot((rot + 1) % 4)}
               className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 active:rotate-90 transition-transform"
             >
               🔄 90°
             </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={() => moveAnt('L')} className="bg-rose-500 hover:bg-rose-600 text-white font-black py-6 rounded-2xl shadow-rose-200 shadow-lg transform transition active:scale-95 text-2xl">{lang === 'en' ? 'L' : 'B'}</button>
            <button onClick={() => moveAnt('R')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-emerald-200 shadow-lg transform transition active:scale-95 text-2xl">{lang === 'en' ? 'R' : 'J'}</button>
            <button onClick={() => moveAnt('B')} className="bg-slate-700 hover:bg-slate-800 text-white font-black py-6 rounded-2xl shadow-slate-200 shadow-lg transform transition active:scale-95 text-lg">{lang === 'en' ? 'B' : 'V'}</button>
          </div>

          <div className="flex gap-2">
            <button onClick={undo} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all border border-slate-200">
              ⌫ {t.undo}
            </button>
            <button onClick={handleReplay} disabled={isReplaying || path.length === 0} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-xl transition-all border border-blue-200 disabled:opacity-30">
              ▶️ {t.replay}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl text-white">
          <h3 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest">{t.saved}</h3>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className={`flex items-center space-x-3 p-3 rounded-2xl ${s ? 'bg-slate-800 border border-slate-700' : 'border border-slate-800/50 opacity-40'}`}>
                <div className="flex-1 font-mono text-xs tracking-tighter truncate text-amber-400 font-bold">{s || "---"}</div>
                {s && <button onClick={() => {const n = [...pinned]; n[i]=!n[i]; setPinned(n)}} className={pinned[i] ? 'opacity-100' : 'opacity-30 hover:opacity-100'}>📌</button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: The Cube */}
      <div className="lg:col-span-8 bg-white p-4 md:p-12 rounded-[3rem] shadow-inner border border-slate-100 flex flex-col items-center justify-center relative min-h-[500px] order-1 lg:order-2">
        <div className="absolute top-8 left-8 flex flex-col items-start">
           <div className="text-5xl font-black text-slate-200 absolute -top-4 -left-2 select-none">
             {path.length}
           </div>
           <div className="relative z-10 px-4 py-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-2xl font-mono text-xl font-bold text-slate-800 tracking-widest max-w-[200px] break-all">
             {path || t.noPath}
           </div>
        </div>

        <button onClick={reset} className="absolute top-8 right-8 bg-rose-50 text-rose-600 px-6 py-2 rounded-full font-bold border border-rose-100 hover:bg-rose-100 transition-colors">
          {t.reset}
        </button>

        <div className="w-full max-w-[400px] h-[350px]">
          <svg className="w-full h-full overflow-visible">
            {/* Edges */}
            {Object.entries(ADJACENCY).map(([start, neighbors]) => 
              neighbors.map(end => {
                const p1 = project(start);
                const p2 = project(end);
                return <line key={`${start}-${end}`} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />;
              })
            )}
            
            {/* Visual Indicators for NEXT choices */}
            {!isReplaying && turnOptions.L !== null && getIndicator(turnOptions.L, '#f43f5e', lang === 'en' ? 'L' : 'B')}
            {!isReplaying && turnOptions.R !== null && getIndicator(turnOptions.R, '#10b981', lang === 'en' ? 'R' : 'J')}

            {/* Vertices */}
            {BASE_VERTICES.map((_, i) => {
              const { px, py } = project(i);
              const isActive = current === i;
              const isStart = i === START_NODE;
              const isTarget = i === 0;
              return (
                <g key={i} className="transition-all duration-500">
                  <circle 
                    cx={px} cy={py} 
                    r={isActive ? 12 : 6} 
                    fill={isActive ? '#f43f5e' : (isStart ? '#fbbf24' : (isTarget ? '#10b981' : '#cbd5e1'))} 
                    className={`${isActive ? 'animate-bounce' : ''}`}
                  />
                  <text x={px + 14} y={py + 4} fontSize="14" fill="#94a3b8" fontWeight="black">{i}</text>
                </g>
              );
            })}

            {/* Path Connection Arrow (Arrival) */}
            {(() => {
              const from = project(previous);
              const to = project(current);
              return (
                <path 
                  d={`M ${from.px} ${from.py} L ${to.px} ${to.py}`}
                  stroke="#3b82f6" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)"
                  className="opacity-40 transition-all duration-500"
                />
              );
            })()}
            
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="mt-8 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center"><div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div> Start (6)</div>
          <div className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div> Target (0)</div>
          <div className="flex items-center"><div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div> Ant</div>
        </div>
      </div>
    </div>
  );
}
