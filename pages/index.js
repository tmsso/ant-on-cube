import React, { useState, useEffect, useMemo } from 'react';

/**
 * Ant on Cube Logic:
 * Vertices (x,y,z): 0-7
 */
const VERTICES = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];

const ADJACENCY = {
  0: [1, 3, 4], 1: [0, 2, 5], 2: [1, 3, 6], 3: [0, 2, 7],
  4: [0, 5, 7], 5: [1, 4, 6], 6: [2, 5, 7], 7: [3, 4, 6],
};

const LEFT_MAP = {
  "1-0": 3, "3-0": 4, "4-0": 1,
  "0-1": 5, "2-1": 0, "5-1": 2,
  "1-2": 6, "3-2": 1, "6-2": 3,
  "0-3": 2, "2-3": 7, "7-3": 0,
  "0-4": 7, "5-4": 0, "7-4": 5,
  "1-5": 4, "4-5": 6, "6-5": 1,
  "2-6": 5, "5-6": 7, "7-6": 2,
  "3-7": 4, "4-7": 6, "6-7": 3,
};

const TRANSLATIONS = {
  en: {
    title: "Ant on Cube 🐜",
    subtitle: "An ant moves along the edges of a cube. At each junction, it turns Left, Right, or Back.",
    left: "Left",
    right: "Right",
    back: "Back",
    reset: "Reset & Save Path",
    saved: "Saved Sequences",
    max: "Max 5",
    noPath: "START",
    exercise: "The Exercise",
    goal: "Goal: Find sequences of L, R, B that lead the ant back to vertex 0.",
    instruction: "Imagine an ant starting at vertex 0. It makes its first move to vertex 1. From there, choose its path:",
  },
  hu: {
    title: "Hangya a kockán 🐜",
    subtitle: "Egy hangya a kocka élein mozog. Minden csomópontnál Balra, Jobbra vagy Vissza fordul.",
    left: "Bal",
    right: "Jobb",
    back: "Vissza",
    reset: "Alaphelyzet és Mentés",
    saved: "Mentett sorozatok",
    max: "Max 5",
    noPath: "RAJT",
    exercise: "A feladat",
    goal: "Cél: Keress olyan B, J, V sorozatokat, amik visszavezetik a hangyát a 0-ás ponthoz.",
    instruction: "Képzeld el, hogy a hangya a 0-ás pontból indul az 1-es felé. Innen válaszd ki az útját:",
  }
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-blue-900 mb-2">{t.title}</h1>
            <p className="text-gray-500 italic max-w-lg">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'hu' : 'en')}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-full hover:bg-blue-200 transition-all border-2 border-blue-200"
          >
            {lang === 'en' ? '🇭🇺 HU' : '🇺🇸 EN'}
          </button>
        </header>
        
        <CubeSimulation lang={lang} t={t} />
        
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            <span className="bg-blue-100 p-2 rounded-lg mr-3">🎓</span> {t.exercise}
          </h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>{t.instruction}</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <li className="bg-red-50 p-3 rounded-lg border border-red-100"><strong>{lang === 'en' ? 'L' : 'B'}:</strong> {t.left}</li>
              <li className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>{lang === 'en' ? 'R' : 'J'}:</strong> {t.right}</li>
              <li className="bg-gray-100 p-3 rounded-lg border border-gray-200"><strong>{lang === 'en' ? 'B' : 'V'}:</strong> {t.back}</li>
            </ul>
            <p className="font-semibold text-blue-800 pt-2 border-t border-gray-100">{t.goal}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function CubeSimulation({ lang, t }) {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(4); // Start logic
  const [path, setPath] = useState('');
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinned, setPinned] = useState(Array(5).fill(false));

  // Determine available moves for indicators
  const decisions = useMemo(() => {
    const neighbors = ADJACENCY[current];
    const key = `${previous}-${current}`;
    const L = LEFT_MAP[key];
    const R = neighbors.find(n => n !== previous && n !== L);
    return { L, R, B: previous };
  }, [current, previous]);

  const moveAnt = (turn) => {
    const next = turn === 'B' ? decisions.B : (turn === 'L' ? decisions.L : decisions.R);
    setPrevious(current);
    setCurrent(next);
    // Path uses localized letters for display
    const label = turn === 'L' ? (lang === 'en' ? 'L' : 'B') : 
                  (turn === 'R' ? (lang === 'en' ? 'R' : 'J') : 
                  (lang === 'en' ? 'B' : 'V'));
    setPath(prev => prev + label);
  };

  const reset = () => {
    if (path.length > 0) {
      const firstEmpty = slots.findIndex((s, i) => s === null && !pinned[i]);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : slots.findIndex((_, i) => !pinned[i]);
      if (targetIndex !== -1) {
        const newSlots = [...slots];
        newSlots[targetIndex] = path;
        setSlots(newSlots);
      }
    }
    setCurrent(0);
    setPrevious(4);
    setPath('');
  };

  // Adjusted projection to prevent overlap
  const project = (v) => {
    const [x, y, z] = VERTICES[v];
    const scale = 110;
    const offsetX = 150;
    const offsetY = 130;
    // Classic Cabinet projection style to distinguish depths
    const px = offsetX + (x * scale) - (y * 0.5 * scale);
    const py = offsetY - (z * scale) + (y * 0.4 * scale);
    return { px, py };
  };

  // Helper for arrow visualization
  const getArrow = (fromIdx, toIdx, color, label) => {
    const from = project(fromIdx);
    const to = project(toIdx);
    const dx = to.px - from.px;
    const dy = to.py - from.py;
    const len = Math.sqrt(dx*dx + dy*dy);
    const mx = from.px + dx * 0.7; // Midpoint-ish
    const my = from.py + dy * 0.7;
    
    return (
      <g className="animate-pulse">
        <line x1={from.px} y1={from.py} x2={to.px} y2={to.py} stroke={color} strokeWidth="3" strokeDasharray="4 2" />
        <circle cx={mx} cy={my} r="10" fill={color} />
        <text x={mx} y={my+4} fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">{label}</text>
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
        <div className="relative w-[300px] h-[260px] cursor-crosshair">
          <svg className="w-full h-full overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            {/* Cube Edges */}
            {Object.entries(ADJACENCY).map(([start, neighbors]) => 
              neighbors.map(end => {
                const p1 = project(start);
                const p2 = project(end);
                return <line key={`${start}-${end}`} x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#e2e8f0" strokeWidth="2" />;
              })
            )}
            
            {/* Direction Indicators */}
            {path.length > 0 && getArrow(current, decisions.L, '#ef4444', lang === 'en' ? 'L' : 'B')}
            {path.length > 0 && getArrow(current, decisions.R, '#22c55e', lang === 'en' ? 'R' : 'J')}
            {getArrow(previous, current, '#3b82f6', '🐜')}

            {/* Vertices */}
            {VERTICES.map((_, i) => {
              const { px, py } = project(i);
              const isActive = current === i;
              return (
                <g key={i} className="transition-all duration-500">
                  <circle cx={px} cy={py} r={isActive ? 10 : 6} fill={isActive ? '#3b82f6' : '#94a3b8'} opacity={isActive ? 1 : 0.6} />
                  <text x={px + 12} y={py + 4} fontSize="12" fill="#64748b" fontWeight="bold">{i}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => moveAnt('L')} className="bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-2xl shadow-lg transform transition active:scale-90 text-xl">{lang === 'en' ? 'L' : 'B'}</button>
            <button onClick={() => moveAnt('R')} className="bg-green-500 hover:bg-green-600 text-white font-black py-5 rounded-2xl shadow-lg transform transition active:scale-90 text-xl">{lang === 'en' ? 'R' : 'J'}</button>
            <button onClick={() => moveAnt('B')} className="bg-gray-700 hover:bg-gray-800 text-white font-black py-5 rounded-2xl shadow-lg transform transition active:scale-90 text-xl font-mono text-base tracking-tighter">{lang === 'en' ? 'BACK' : 'VISSZA'}</button>
          </div>
          
          <div className="mt-6 p-5 bg-blue-50 rounded-xl border-2 border-blue-100 flex items-center justify-center min-h-[80px]">
            <span className="text-3xl font-black tracking-widest text-blue-900 break-all">{path || t.noPath}</span>
          </div>

          <button onClick={reset} className="w-full mt-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3 rounded-xl transition-all border border-orange-200">
            {t.reset}
          </button>
        </div>

        <div className="bg-blue-950 p-6 rounded-2xl shadow-2xl text-white">
          <h3 className="text-lg font-bold mb-4 flex justify-between items-center text-blue-200">
            {t.saved} <span className="text-[10px] uppercase tracking-widest opacity-60">{t.max}</span>
          </h3>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={i} className={`flex items-center space-x-3 p-3 rounded-xl ${s ? 'bg-blue-900/50 border border-blue-800' : 'bg-transparent border border-blue-900/30'}`}>
                <span className="font-mono text-xl opacity-20">{i+1}</span>
                <div className="flex-1 font-mono text-sm tracking-widest font-bold text-orange-300">
                  {s || "---"}
                </div>
                {s && (
                  <button onClick={() => {const n = [...pinned]; n[i]=!n[i]; setPinned(n)}} className={`text-xl transition-transform hover:scale-110 ${pinned[i] ? 'grayscale-0' : 'grayscale opacity-40'}`}>
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
