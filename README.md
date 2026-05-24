# MusicTree

A visual DSA learning tool that uses songs as data. Insert songs by name and BPM, then watch Binary Search Tree operations and Union-Find (Disjoint Sets) execute step by step.

Built for CS students and self-taught developers who want to see *why* algorithms work, not just what they output.

## Features

### BST Visualizer
- **Insert** — add a song by name and BPM; the node is placed in the correct BST position automatically. Album art is fetched from iTunes to make nodes visually distinct.
- **Search** — enter a BPM and watch the search path animate node by node, showing each left/right decision.
- **In-Order Traversal** — outputs songs sorted by BPM (left → root → right).
- **Pre-Order Traversal** — root → left → right.
- **Post-Order Traversal** — left → right → root.

Traversals run automatically when you switch modes or add a new song. The traversal result strip shows the full ordered sequence across the top of the canvas.

### Disjoint Sets Visualizer
- Every inserted song starts as its own set.
- **Click two nodes** to union their sets. Union by rank keeps trees shallow.
- Components are color-coded; each tree in the forest reflects the actual parent structure after path compression.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Font | Geist |
| Package manager | Yarn 4 (Berry) |

## Getting Started

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

Requires Node 18+.

## Project Structure

```
src/
├── App.jsx                        # Root layout, toolbar, tab routing
├── hooks/
│   ├── useBST.js                  # BST insert, search, in/pre/post-order
│   ├── useDisjointSets.js         # Union-find with union by rank
│   └── useTreeLayout.js           # SVG coordinate calculation
└── components/
    ├── BSTVisualizer.jsx           # SVG tree renderer
    ├── DisjointSetsVisualizer.jsx  # Forest renderer + union interaction
    └── DisjointSetsTree.jsx        # Single disjoint-set tree component
```

## Algorithms Implemented

**Binary Search Tree**
- Insertion keyed on BPM — duplicates are ignored.
- Search returns the full path of node IDs visited, used to drive the step animation.
- All three DFS traversal orders.

**Union-Find (Disjoint Sets)**
- `makeSet` — O(1) initialization per element.
- `findSet` — with path compression; flattens the tree on every lookup.
- `union` — union by rank; attaches the shorter tree under the taller one.

## Design Principles

1. **The visualization is the UI.** The SVG canvas is the product; chrome is minimal.
2. **State is always legible.** Search paths and traversal order are communicated through color and weight, not prose.
3. **Music earns its place.** BPM is the sort key; album art makes nodes distinguishable. Neither is decoration.
4. **WCAG AA minimum.** Highlight states use stroke weight as a secondary signal alongside color.
