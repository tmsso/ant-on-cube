# Ant on Cube Simulation

An interactive web application that simulates an ant moving on a cube, designed as a math exercise.

## Features

- **Interactive Cube Visualization**: Modern, schematic cube wireframe with ant position tracking
- **Ant Movement Control**: Navigate the ant using Left (L), Right (R), or Back (B) directions
- **Path Recording**: Track all movements as a sequence of commands
- **Reset Functionality**: Return ant to starting position while saving current path
- **Slot System**: 5 slots to store movement sequences with LIFO (Last In, First Out) logic
- **Pin System**: Pin slots to exclude them from LIFO operations
- **Keyboard Support**: Use L, R, B keys for navigation

## How It Works

1. The ant starts at the upper corner nearest to the observer (corner 0)
2. At each corner, the ant has three possible directions: Left, Right, or Back
3. Directions are always relative to the ant's heading (the edge it just
   arrived along): Back returns along that edge, while Left and Right pick
   between the two remaining edges as seen by an ant crawling on the outside
   surface of the cube
4. Movements are recorded in the path string below the visualization
5. Use the Reset button to return the ant to the starting position
6. Upon reset, the current path is saved to the first available non-pinned slot (LIFO)
7. Pin slots to prevent them from being overwritten during resets

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tmsso/ant-on-cube.git
   cd ant-on-cube
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

#### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

#### Manual Deployment

```bash
npm run build
npm start
```

## Project Status

✅ **Completed Features:**
- Basic cube visualization with ant position tracking
- Heading-relative movement logic (the ant's orientation is tracked, so
  L/R/B always mean the same thing from the ant's point of view)
- Movement controls (L, R, B buttons and keyboard)
- Path recording display
- Reset functionality
- 5-slot LIFO system with pinning
- Responsive design with Tailwind CSS

⚠️ **Current Limitations:**
- Cube visualization is a 2D projection (3D could be enhanced with Three.js)

## Mathematical Context

This simulation helps explore graph theory concepts:
- **Graph Traversal**: Moving between vertices of a cube graph
- **Hamiltonian Paths**: Finding paths that visit each vertex exactly once
- **State Machines**: Tracking position and orientation
- **LIFO Data Structures**: Stack operations for path storage

## License

MIT License