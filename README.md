# Ant on Cube - Interactive Math Exercise

An interactive Next.js application to demonstrate a math problem: an ant moving along the edges of a cube.

## The Problem
An ant starts at vertex **0** of a cube. It makes its first move to vertex **1**.
From vertex **1** onwards, at each junction (vertex), the ant has three choices:
- **Left (L):** Turn left relative to the edge it arrived from.
- **Right (R):** Turn right relative to the edge it arrived from.
- **Back (B):** Return along the edge it just traversed.

The goal is to find sequences of moves (e.g., `LLRR`) that return the ant to the starting vertex **0**.

## Features
- **Interactive Cube Visualization**: Real-time tracking of the ant's position on a 3D isometric cube.
- **Path Recording**: Automatically logs your sequence of L, R, B moves.
- **LIFO Slots**: Save up to 5 path sequences. Pin your favorites to prevent them from being overwritten.
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop use.

## Technical Details
Built with:
- **Next.js 14**
- **React 18**
- **Tailwind CSS**

## Getting Started
To run locally:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the simulation.

## License
MIT
