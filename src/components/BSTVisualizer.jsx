import { memo } from 'react'
import { insert } from '../hooks/useBST'
import { computeLayout } from '../hooks/useTreeLayout'

const R  = 34   // node radius
const LY = 18   // label Y below node bottom (name)
const BY = 33   // BPM label Y below node bottom

const FONT_SANS = "'Geist', system-ui, sans-serif"
const FONT_MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"

export default memo(function BSTVisualizer({ songs, highlightedIds, lastSongName }) {
    let root = null
    for (const song of songs) {
        root = insert(root, song.name, song.bpm, song.id)
    }

    const { nodes, edges } = computeLayout(root)

    // Clip edge endpoints to circle perimeter
    const clippedEdges = edges.map(edge => {
        const dx = edge.x2 - edge.x1
        const dy = edge.y2 - edge.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const ux = dx / len
        const uy = dy / len
        return {
            ...edge,
            x1: edge.x1 + ux * (R + 2),
            y1: edge.y1 + uy * (R + 2),
            x2: edge.x2 - ux * (R + 2),
            y2: edge.y2 - uy * (R + 2),
        }
    })

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <svg
                viewBox="0 0 1600 820"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: '100%', display: 'block' }}
            >
                <defs>
                    {nodes.map(node => (
                        <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                            <circle cx={node.x} cy={node.y} r={R - 2} />
                        </clipPath>
                    ))}
                </defs>

                {/* Empty state */}
                {nodes.length === 0 && (
                    <g>
                        <circle
                            cx={800} cy={390} r={52}
                            fill="none"
                            stroke="var(--c-border-sub)"
                            strokeWidth="1"
                            strokeDasharray="5 5"
                        />
                        <text
                            x={800} y={386}
                            textAnchor="middle"
                            fill="var(--c-dim)"
                            fontSize="13"
                            fontFamily={FONT_SANS}
                            fontWeight="500"
                        >
                            Insert a song
                        </text>
                        <text
                            x={800} y={406}
                            textAnchor="middle"
                            fill="var(--c-dim)"
                            fontSize="12"
                            fontFamily={FONT_SANS}
                        >
                            to begin
                        </text>
                    </g>
                )}

                {/* Edges */}
                {clippedEdges.map(edge => (
                    <line
                        key={edge.id}
                        x1={edge.x1} y1={edge.y1}
                        x2={edge.x2} y2={edge.y2}
                        stroke="var(--c-border)"
                        strokeWidth="1.5"
                    />
                ))}

                {/* Nodes */}
                {nodes.map(node => {
                    const songData = songs.find(s => s.name === node.name)
                    const cover    = songData?.cover || null
                    const hl       = highlightedIds.includes(node.id)
                    // Key changes on lastSongName to force re-mount → re-trigger CSS animation
                    const isNew    = node.name === lastSongName
                    const groupKey = isNew ? `${node.id}-new` : node.id

                    return (
                        <g
                            key={groupKey}
                            className={isNew ? 'node-new' : undefined}
                        >
                            {/* Halo — always rendered, fades in/out */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R + 16}
                                fill="var(--c-accent-low)"
                                style={{
                                    opacity: hl ? 1 : 0,
                                    transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />

                            {/* Node base */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R}
                                fill={hl ? 'var(--c-accent-mid)' : 'var(--c-panel)'}
                                stroke={hl ? 'var(--c-accent)' : 'var(--c-border)'}
                                strokeWidth={hl ? 2.5 : 1.5}
                                style={{ transition: 'fill 320ms cubic-bezier(0.16,1,0.3,1), stroke 320ms cubic-bezier(0.16,1,0.3,1), stroke-width 320ms cubic-bezier(0.16,1,0.3,1)' }}
                            />

                            {/* Album art */}
                            {cover && (
                                <image
                                    href={cover}
                                    x={node.x - R + 2}
                                    y={node.y - R + 2}
                                    width={(R - 2) * 2}
                                    height={(R - 2) * 2}
                                    clipPath={`url(#clip-${node.id})`}
                                    preserveAspectRatio="xMidYMid slice"
                                    style={{
                                        opacity: hl ? 0.55 : 1,
                                        transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1)',
                                    }}
                                />
                            )}

                            {/* Initial letter when no art */}
                            {!cover && (
                                <text
                                    x={node.x} y={node.y + 7}
                                    textAnchor="middle"
                                    fill={hl ? 'var(--c-accent)' : 'var(--c-muted)'}
                                    fontSize="19"
                                    fontWeight="600"
                                    fontFamily={FONT_SANS}
                                    style={{ transition: 'fill 320ms cubic-bezier(0.16,1,0.3,1)' }}
                                >
                                    {node.name[0]?.toUpperCase()}
                                </text>
                            )}

                            {/* Amber ring — always rendered, fades in/out */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R}
                                fill="none"
                                stroke="var(--c-accent)"
                                strokeWidth="3.5"
                                style={{
                                    opacity: hl ? 1 : 0,
                                    transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />

                            {/* Song name */}
                            <text
                                x={node.x} y={node.y + R + LY}
                                textAnchor="middle"
                                fill={hl ? 'var(--c-text)' : 'oklch(74% 0.010 78)'}
                                fontSize="12"
                                fontWeight="500"
                                fontFamily={FONT_SANS}
                                style={{ transition: 'fill 320ms cubic-bezier(0.16,1,0.3,1)' }}
                            >
                                {node.name}
                            </text>

                            {/* BPM — monospace, clearly readable */}
                            <text
                                x={node.x} y={node.y + R + BY}
                                textAnchor="middle"
                                fill={hl ? 'var(--c-accent)' : 'oklch(58% 0.010 78)'}
                                fontSize="11"
                                fontFamily={FONT_MONO}
                                style={{ transition: 'fill 320ms cubic-bezier(0.16,1,0.3,1)' }}
                            >
                                {node.bpm}
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
})
