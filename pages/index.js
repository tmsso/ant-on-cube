import React, { useState, useEffect, useMemo } from 'react';

/**
 * Ant on Cube Logic:
 * Vertices (x,y,z):
 * 0: (0,0,0), 1: (1,0,0), 2: (1,1,0), 3: (0,1,0)
 * 4: (0,0,1), 5: (1,0,1), 6: (1,1,1), 7: (0,1,1)
 */
const VERTICES = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];

const ADJACENCY = {
  0: [1, 3, 4], 1: [0, 2, 5], 2: [1, 3, 6], 3: [0, 2, 7],
  4: [0, 5, 7], 5: [1, 4, 6], 6: [2, 5, 7], 7: [3, 4, 6],
};

// Help map to find Left/Right consistently
// Based on current orientation arrival -> current
// This map defines the "Left" neighbor. "Right" will be the remaining neighbor.
const LEFT_MAP = {
  // From 0...
  "1-0": 3, "3-0": 4, "4-0": 1,
  // From 1...
  "0-1": 5, "2-1": 0, "5-1": 2,
  // From 2...
  "1-2": 6, "3-2": 1, "6-2": 3,
  // From 3...
  "0-3": 2, "2-3": 7, "7-3": 0,
  // From 4...
  "0-4": 7, "5-4": 0, "7-4": 5,
  // From 5...
  "1-5": 4, "4-5": 6, "6-5": 1,
  // From 6...
  "2-6": 5, "5-6": 7, "7-6": 2,
  // From 7...
  "3-7": 4, "4-7": 6, "6-7": 3,
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Ant on Cube</h1>
          <p className="text-gray-600 italic">
            "An ant moves along the edges of a cube. At each junction, it turns Left, Right, or Back."
          </p>
        </header>
        
        <CubeSimulation />
        
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">The Exercise</h2>
          <div className="text-gray-700 space-y-4">
            <p>
              Imagine an ant starting at vertex <strong>0</strong>. It makes its first move to vertex <strong>1</strong>.
              From vertex 1 onwards, at each junction, it can choose to turn:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>L (Left):</strong> One of the two new edges.</li>
              <li><strong>R (Right):</strong> The other new edge.</li>
              <li><strong>B (Back):</strong> The edge it just came from.</li>
            </ul>
            <p className="font-semibold text-blue-800">
              Goal: Find sequences of L, R, B that lead the ant back to vertex 0.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function CubeSimulation() {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(4); // Assume it came from 4 to start at 0 and move to 1
  const [path, setPath] = useState('');
  const [history, setHistory] = useState([]);
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinned, setPinned] = useState(Array(5).fill(false));

  const moveAnt = (turn) => {
    const neighbors = ADJACENCY[current];
    let next;

    if (turn === 'B') {
      next = previous;
    } else {
      const key = `${previous}-${current}`;
      const leftNeighbor = LEFT_MAP[key];
      if (turn === 'L') {
        next = leftNeighbor;
      } else {
        // Right is the neighbor that isn't previous and isn't left
        next = neighbors.find(n => n !== previous && n !== leftNeighbor);
      }
    }

    setPrevious(current);
    setCurrent(next);
    setPath(prev => prev + turn);
    setHistory(prev => [...prev, current]);
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
    setHistory([]);
  };

  const togglePin = (i) => {
    const newPinned = [...pinned];
    newPinned[i] = !newPinned[i];
    setPinned(newPinned);
  };

  const clearSlot = (i) => {
    const newSlots = [...slots];
    newSlots[i] = null;
    setSlots(newSlots);
  };

  // Simple Isometric Projection
  const project = (v) => {
    const [x, y, z] = VERTICES[v];
    const scale = 100;
    const offsetX = 120;
    const offsetY = 120;
    // Isometric formula
    const px = offsetX + (x - y) * scale * 0.8;
    const py = offsetY + (x + y - 2 * z) * scale * 0.4;
    return { px, py };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Visualizer */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
        <div className="relative w-[300px] h-[250px]">
          <svg className="w-full h-full overflow-visible">
            {/* Edges */}
            {Object.entries(ADJACENCY).map(([start, neighbors]) => 
              neighbors.map(end => {
                if (start > end) return null;
                const p1 = project(start);
                const p2 = project(end);
                return (
                  <line 
                    key={`${start}-${end}`} 
                    x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} 
                    stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"
                  />
                );
              })
            )}
            {/* Nodes */}
            {VERTICES.map((_, i) => {
              const { px, py } = project(i);
              const isActive = current === i;
              const isStart = i === 0;
              return (
                <g key={i}>
                  <circle 
                    cx={px} cy={py} r={isActive ? 8 : 5} 
                    fill={isActive ? '#ef4444' : (isStart ? '#10b981' : '#64748b')}
                    className="transition-all duration-300"
                  />
                  <text x={px + 8} y={py - 8} fontSize="12" fill="#94a3b8" fontWeight="bold">{i}</text>
                </g>
              );
            })}
          </svg>
        </div>
        
        <div className="mt-4 flex space-x-6 text-sm">
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div> Start (0)</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div> Ant</div>
        </div>
      </div>

      {/* Controls & Output */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Movement</h3>
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => moveAnt('L')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">L</button>
            <button onClick={() => moveAnt('R')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">R</button>
            <button onClick={() => moveAnt('B')} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">B</button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 min-h-[60px] flex items-center justify-center">
            <span className="text-2xl font-mono tracking-widest text-gray-800 uppercase">{path || 'START'}</span>
          </div>

          <button onClick={reset} className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition-colors border border-red-200">
            Reset & Save Path
          </button>
        </div>

        <div className="bg-blue-900 p-6 rounded-2xl shadow-xl text-white">
          <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
            Saved Sequences (LIFO)
            <span className="text-xs bg-blue-800 px-2 py-1 rounded">Max 5</span>
          </h3>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={i} className={`flex items-center space-x-2 p-2 rounded-lg ${s ? 'bg-blue-800' : 'bg-blue-950/50 border border-blue-800'}`}>
                <div className="w-6 text-xs text-blue-400 font-bold">{i+1}</div>
                <div className="flex-1 font-mono text-sm overflow-hidden truncate">
                  {s || <span className="opacity-30">...</span>}
                </div>
                {s && (
                  <div className="flex space-x-1">
                    <button onClick={() => togglePin(i)} className={`p-1 rounded opacity-80 hover:opacity-100 ${pinned[i] ? 'text-yellow-400' : 'text-blue-300'}`}>
                      {pinned[i] ? '📌' : '📍'}
                    </button>
                    {!pinned[i] && (
                      <button onClick={() => clearSlot(i)} className="p-1 text-blue-300 hover:text-red-400 opacity-80 hover:opacity-100">
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
