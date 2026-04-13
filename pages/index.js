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

function CubeSimulation() {
  const [antPosition, setAntPosition] = useState(0); // 0-7 for cube corners
  const [antPath, setAntPath] = useState('');
  const [slots, setSlots] = useState(Array(5).fill(null));
  const [pinnedSlots, setPinnedSlots] = useState(Array(5).fill(false));
  
  // Cube corners in 3D space (isometric projection)
  const corners = [
    { x: 0, y: 0, z: 0 }, // 0
    { x: 100, y: 0, z: 0 }, // 1
    { x: 100, y: 100, z: 0 }, // 2
    { x: 0, y: 100, z: 0 }, // 3
    { x: 0, y: 0, z: 100 }, // 4
    { x: 100, y: 0, z: 100 }, // 5
    { x: 100, y: 100, z: 100 }, // 6
    { x: 0, y: 100, z: 100 }, // 7
  ];
  
  // Edges connecting corners
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // bottom face
    [4, 5], [5, 6], [6, 7], [7, 4], // top face
    [0, 4], [1, 5], [2, 6], [3, 7], // vertical edges
  ];
  
  const handleMove = (direction) => {
    const newPosition = getNextPosition(antPosition, direction);
    if (newPosition !== null) {
      setAntPosition(newPosition);
      setAntPath(prev => prev + direction.toUpperCase());
    }
  };
  
  const getNextPosition = (currentPos, direction) => {
    // Simplified movement logic - in a real implementation,
    // this would need to track ant's orientation and valid moves
    const transitions = {
      0: { L: 3, R: 1, B: 4 },
      1: { L: 0, R: 2, B: 5 },
      2: { L: 1, R: 3, B: 6 },
      3: { L: 2, R: 0, B: 7 },
      4: { L: 7, R: 5, B: 0 },
      5: { L: 4, R: 6, B: 1 },
      6: { L: 5, R: 7, B: 2 },
      7: { L: 6, R: 4, B: 3 },
    };
    
    return transitions[currentPos]?.[direction];
  };
  
  const handleReset = () => {
    if (slots.filter((_, i) => !pinnedSlots[i]).length > 0) {
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
    
    setAntPosition(0);
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
          {/* 2D projection of cube corners */}
          {corners.map((corner, index) => (
            <div
              key={index}
              className={`absolute w-4 h-4 rounded-full transform -translate-x-2 -translate-y-2 ${
                antPosition === index ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                left: `${corner.x}px`,
                top: `${corner.y}px`,
              }}
            />
          ))}
          
          {/* Edges */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {edges.map(([start, end], i) => (
              <line
                key={i}
                x1={corners[start].x}
                y1={corners[start].y}
                x2={corners[end].x}
                y2={corners[end].y}
                stroke="#666"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      </div>
      
      {/* Controls */}
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleMove('l')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            L (Left)
          </button>
          <button
            onClick={() => handleMove('r')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            R (Right)
          </button>
          <button
            onClick={() => handleMove('b')}
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
          Current position: Corner {antPosition}
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