import React, { useState, useEffect } from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Ant on Cube Simulation</h1>
        <CubeSimulation />
      </div>
    </div>
  );
}

// Cube corners in unit coordinates (x, y, z)
const CORNERS = [
  [0, 0, 0], // 0
  [1, 0, 0], // 1
  [1, 1, 0], // 2
  [0, 1, 0], // 3
  [0, 0, 1], // 4
  [1, 0, 1], // 5
  [1, 1, 1], // 6
  [0, 1, 1], // 7
];

// Edges connecting corners
const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0], // near face (z = 0)
  [4, 5], [5, 6], [6, 7], [7, 4], // far face (z = 1)
  [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
];

// Corners joined by an edge differ in exactly one coordinate
const neighborsOf = (index) =>
  CORNERS.map((_, i) => i).filter(
    (i) =>
      i !== index &&
      CORNERS[i].filter((v, axis) => v !== CORNERS[index][axis]).length === 1
  );

const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// The ant's state is its corner plus the corner it arrived from. The arrival
// edge defines its heading, so L/R/B are always relative to that heading.
// The ant starts at corner 0 as if it had just climbed up from corner 4.
const START_STATE = { position: 0, cameFrom: 4 };

const getNextState = (state, direction) => {
  const { position, cameFrom } = state;
  if (direction === 'B') {
    // Turn around and walk back along the edge it arrived on
    return { position: cameFrom, cameFrom: position };
  }
  const here = CORNERS[position];
  const heading = subtract(here, CORNERS[cameFrom]);
  // Outward corner normal: the "up" of an ant crawling on the outside of the
  // cube. Its left points along normal x heading; of the two edges that don't
  // go back, exactly one lies on each side.
  const normal = here.map((v) => 2 * v - 1);
  const leftAxis = cross(normal, heading);
  for (const neighbor of neighborsOf(position)) {
    if (neighbor === cameFrom) continue;
    const side = dot(subtract(CORNERS[neighbor], here), leftAxis);
    if (direction === 'L' ? side > 0 : side < 0) {
      return { position: neighbor, cameFrom: position };
    }
  }
  return null;
};

// Oblique projection so the cube reads as three-dimensional; the far face
// (z = 1) is shifted up and to the right
const project = ([x, y, z]) => ({
  x: 40 + 130 * x + 55 * z,
  y: 90 + 130 * y - 55 * z,
});

// Corner 7 (far bottom-left) sits inside the cube silhouette, so its three
// edges are hidden and drawn dashed, like a classic schematic cube
const HIDDEN_CORNER = 7;

function CubeSimulation() {
  const [antState, setAntState] = useState(START_STATE);
  const [antPath, setAntPath] = useState('');
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinnedSlots, setPinnedSlots] = useState(Array(5).fill(false));

  const handleMove = (direction) => {
    const next = getNextState(antState, direction);
    if (next) {
      setAntState(next);
      setAntPath(prev => prev + direction);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toUpperCase();
      if (key === 'L' || key === 'R' || key === 'B') {
        handleMove(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleReset = () => {
    if (antPath && slots.filter((_, i) => !pinnedSlots[i]).length > 0) {
      // Find first non-pinned slot (LIFO)
      const nonPinnedIndices = slots
        .map((slot, index) => ({ slot, index }))
        .filter(item => !pinnedSlots[item.index])
        .reverse(); // LIFO

      if (nonPinnedIndices.length > 0) {
        const firstNonPinnedIndex = nonPinnedIndices[0].index;
        const newSlots = [...slots];
        newSlots[firstNonPinnedIndex] = antPath;
        setSlots(newSlots);
      }
    }

    setAntState(START_STATE);
    setAntPath('');
  };

  const togglePin = (index) => {
    const newPinnedSlots = [...pinnedSlots];
    newPinnedSlots[index] = !newPinnedSlots[index];
    setPinnedSlots(newPinnedSlots);
  };

  return (
    <div className="space-y-8">
      {/* Cube Visualization */}
      <div className="flex justify-center">
        <div className="relative w-64 h-64 bg-gray-100 rounded-lg">
          {/* Wireframe edges */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {EDGES.map(([start, end], i) => {
              const a = project(CORNERS[start]);
              const b = project(CORNERS[end]);
              const isHeadingEdge =
                (start === antState.cameFrom && end === antState.position) ||
                (start === antState.position && end === antState.cameFrom);
              const isHidden =
                start === HIDDEN_CORNER || end === HIDDEN_CORNER;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isHeadingEdge ? '#ef4444' : '#555'}
                  strokeWidth={isHeadingEdge ? 2.5 : 1.5}
                  strokeDasharray={isHidden && !isHeadingEdge ? '4 4' : undefined}
                />
              );
            })}
          </svg>

          {/* Corners */}
          {CORNERS.map((corner, index) => {
            const { x, y } = project(corner);
            const isAnt = antState.position === index;
            return (
              <div key={index}>
                <div
                  className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    isAnt
                      ? 'w-5 h-5 bg-red-500 ring-2 ring-red-300'
                      : 'w-3.5 h-3.5 bg-blue-500'
                  }`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                />
                <div
                  className="absolute text-xs text-gray-500"
                  style={{ left: `${x + 7}px`, top: `${y + 5}px` }}
                >
                  {index}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleMove('L')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            L (Left)
          </button>
          <button
            onClick={() => handleMove('R')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            R (Right)
          </button>
          <button
            onClick={() => handleMove('B')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            B (Back)
          </button>
        </div>

        <button
          onClick={handleReset}
          className="px-8 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset
        </button>

        <div className="text-sm text-gray-600">
          Current position: Corner {antState.position} (arrived from corner{' '}
          {antState.cameFrom})
        </div>
      </div>

      {/* Path Display */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Movement Path</h3>
        <div className="bg-gray-100 p-4 rounded font-mono text-lg min-h-[2rem]">
          {antPath || 'No moves yet'}
        </div>
      </div>

      {/* Slots */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Movement Slots (LIFO)</h3>
        <div className="grid grid-cols-5 gap-4">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`border-2 rounded p-2 ${
                pinnedSlots[index] ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
            >
              <div className="text-xs text-gray-600 mb-1">Slot {index + 1}</div>
              <div className="font-mono text-sm bg-white p-1 rounded min-h-[2rem]">
                {slot || 'Empty'}
              </div>
              <button
                onClick={() => togglePin(index)}
                className={`mt-1 text-xs px-2 py-1 rounded ${
                  pinnedSlots[index]
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {pinnedSlots[index] ? 'Pinned' : 'Pin'}
              </button>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          {slots.filter((_, i) => !pinnedSlots[i]).length === 0
            ? 'All slots pinned - new run will not be saved on reset'
            : `${slots.filter((_, i) => !pinnedSlots[i]).length} slot(s) available for LIFO`}
        </div>
      </div>
    </div>
  );
}
