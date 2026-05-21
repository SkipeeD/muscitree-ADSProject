import { insert } from '../hooks/useBST'
import { computeLayout } from '../hooks/useTreeLayout'

export default function BSTVisualizer({ songs, highlightedIds, sortedSongs }) {
    let root = null
    for (const song of songs) {
        root = insert(root, song.name, song.bpm)
    }

    const { nodes, edges } = computeLayout(root)

    return (
        <div className="flex flex-col gap-6">
            {/* SVG Tree */}
            <svg
                viewBox="0 0 1600 700"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-auto"
            >
                {edges.map(edge => (
                    <line
                        key={edge.id}
                        x1={edge.x1} y1={edge.y1}
                        x2={edge.x2} y2={edge.y2}
                        stroke="#374151"
                        strokeWidth="2"
                    />
                ))}
                {nodes.map(node => {
                    const songData = songs.find(s => s.name === node.name)
                    const cover = songData?.cover || null
                    return (
                        <g key={node.id}>
                            <circle
                                cx={node.x} cy={node.y} r={28}
                                fill={highlightedIds.includes(node.id) ? '#22c55e' : '#1f2937'}
                                stroke={highlightedIds.includes(node.id) ? '#4ade80' : '#374151'}
                                strokeWidth="2"
                            />
                            {cover ? (
                                <>
                                    <clipPath id={`clip-${node.id}`}>
                                        <circle cx={node.x} cy={node.y} r={26} />
                                    </clipPath>
                                    <image
                                        href={cover}
                                        x={node.x - 26} y={node.y - 26}
                                        width={52} height={52}
                                        clipPath={`url(#clip-${node.id})`}
                                        preserveAspectRatio="xMidYMid slice"
                                    />
                                </>
                            ) : null}
                            <text
                                x={node.x} y={node.y + 44}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                            >
                                {node.name}
                            </text>
                            <text
                                x={node.x} y={node.y + 57}
                                textAnchor="middle"
                                fill="#9ca3af"
                                fontSize="10"
                            >
                                {node.bpm} BPM
                            </text>
                        </g>
                    )
                })}
            </svg>

            {/* In-order result */}
            {sortedSongs.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">In-order traversal (sorted by BPM):</p>
                    <div className="flex gap-2 flex-wrap">
                        {sortedSongs.map(s => (
                            <span key={s.id} className="bg-purple-700 text-white text-sm px-3 py-1 rounded-full">
                {s.name} — {s.bpm}
              </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}