
function buildChildren(ds) {
    const children = {}
    for (const [node, parent] of Object.entries(ds.parent)) {
        if (node === parent) continue
        if (!children[parent]) children[parent] = []
        children[parent].push(node)
    }
    return children
}

function TreeNode({ name, children, x, y, rank, isRoot }) {
    const childCount = children[name]?.length || 0
    const childSpacing = 80

    return (
        <g>
            {/* Draw lines to children */}
            {(children[name] || []).map((child, i) => {
                const childX = x + (i - (childCount - 1) / 2) * childSpacing
                const childY = y + 80
                return (
                    <line
                        key={child}
                        x1={x} y1={y}
                        x2={childX} y2={childY}
                        stroke="#374151"
                        strokeWidth="1.5"
                    />
                )
            })}

            {/* Node circle */}
            <circle
                cx={x} cy={y} r={22}
                fill={isRoot ? '#22c55e' : '#1f2937'}
                stroke={isRoot ? '#4ade80' : '#374151'}
                strokeWidth="2"
            />

            {/* Song name */}
            <text
                x={x} y={y - 4}
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="bold"
            >
                {name.length > 8 ? name.slice(0, 8) + '…' : name}
            </text>

            {/* Rank */}
            <text
                x={x} y={y + 8}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="8"
            >
                r={rank}
            </text>

            {/* Render children recursively */}
            {(children[name] || []).map((child, i) => {
                const childX = x + (i - (childCount - 1) / 2) * childSpacing
                const childY = y + 80
                return (
                    <TreeNode
                        key={child}
                        name={child}
                        children={children}
                        x={childX}
                        y={childY}
                        rank={0}
                        isRoot={false}
                    />
                )
            })}
        </g>
    )
}

export default function DisjointSetsTree({ ds }) {
    if (!ds || Object.keys(ds.parent).length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 text-sm">Insert songs to see the forest</p>
            </div>
        )
    }

    const children = buildChildren(ds)

    // Find all roots
    const roots = Object.keys(ds.parent).filter(
        node => ds.parent[node] === node
    )

    const treeSpacing = 200
    const startX = 120

    return (
        <div className="flex flex-col gap-2">
            <p className="text-gray-400 text-xs">
                Forest of Disjoint Sets — green = root, r = rank
            </p>
            <svg
                viewBox={`0 0 ${Math.max(roots.length * treeSpacing, 400)} 300`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-auto"
            >
                {roots.map((root, i) => (
                    <TreeNode
                        key={root}
                        name={root}
                        children={children}
                        x={startX + i * treeSpacing}
                        y={50}
                        rank={ds.rank[root]}
                        isRoot={true}
                    />
                ))}
            </svg>
        </div>
    )
}