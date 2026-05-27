import { memo } from 'react'
import { computeLayout } from '../hooks/useTreeLayout'

const R  = 34   // node radius
const LY = 18   // label Y below node bottom (name)
const BY = 33   // BPM label Y below node bottom

const FONT_SANS = "'Geist', system-ui, sans-serif"
const FONT_MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"

// Delete target — red/rose
const CLR_DEL_FILL    = 'oklch(19% 0.05 15)'
const CLR_DEL_STROKE  = 'oklch(60% 0.18 15)'
const CLR_DEL_HALO    = 'oklch(60% 0.18 15 / 0.11)'
const CLR_DEL_TEXT    = 'oklch(72% 0.16 15)'

// In-order successor — teal
const CLR_SUCC_FILL   = 'oklch(19% 0.04 200)'
const CLR_SUCC_STROKE = 'oklch(60% 0.14 200)'
const CLR_SUCC_HALO   = 'oklch(60% 0.14 200 / 0.11)'
const CLR_SUCC_TEXT   = 'oklch(70% 0.13 200)'

export default memo(function BSTVisualizer({
    tree,
    highlightedIds,
    lastSongName,
    deleteTargetId         = null,
    deleteSuccessorId      = null,
    deleteSuccessorPathIds = [],
    deletePhase            = null,
}) {
    const { nodes, edges } = computeLayout(tree)

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

                {/* Edges — colored by role */}
                {clippedEdges.map(edge => {
                    // An edge is on the search/traversal path only when BOTH endpoints are highlighted.
                    // This prevents the edge leading into the final found node from staying lit
                    // after the path collapses to just that single node.
                    const isSearchPath    = highlightedIds.includes(edge.id) && highlightedIds.includes(edge.parentId)
                    const isDeleteTarget  = edge.id === deleteTargetId
                    const isSuccessorPath = deleteSuccessorPathIds.includes(edge.id)

                    const stroke = isDeleteTarget  ? CLR_DEL_STROKE
                        : isSuccessorPath           ? CLR_SUCC_STROKE
                        : isSearchPath              ? 'var(--c-accent)'
                        : 'var(--c-border)'

                    const strokeWidth = (isSearchPath || isDeleteTarget || isSuccessorPath) ? 2.5 : 1.5

                    return (
                        <line
                            key={edge.id}
                            x1={edge.x1} y1={edge.y1}
                            x2={edge.x2} y2={edge.y2}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
                        />
                    )
                })}

                {/* Nodes */}
                {nodes.map(node => {
                    const cover           = node.cover || null
                    const hl              = highlightedIds.includes(node.id)
                    const isDeleteTarget  = node.id === deleteTargetId
                    const isSuccessor     = node.id === deleteSuccessorId
                    const isRemoving      = isDeleteTarget && deletePhase === 'removing'

                    // Key changes on lastSongName to force re-mount → re-trigger CSS animation
                    const isNew    = node.name === lastSongName
                    const groupKey = isNew ? `${node.id}-new` : node.id

                    // Derive colors from role
                    const nodeFill   = isDeleteTarget ? CLR_DEL_FILL
                        : isSuccessor               ? CLR_SUCC_FILL
                        : hl                        ? 'var(--c-accent-mid)'
                        : 'var(--c-panel)'

                    const nodeStroke = isDeleteTarget ? CLR_DEL_STROKE
                        : isSuccessor               ? CLR_SUCC_STROKE
                        : hl                        ? 'var(--c-accent)'
                        : 'var(--c-border)'

                    const nodeStrokeWidth = (isDeleteTarget || isSuccessor || hl) ? 2.5 : 1.5

                    const haloFill = isDeleteTarget ? CLR_DEL_HALO
                        : isSuccessor              ? CLR_SUCC_HALO
                        : 'var(--c-accent-low)'

                    const ringStroke = isDeleteTarget ? CLR_DEL_STROKE
                        : isSuccessor              ? CLR_SUCC_STROKE
                        : 'var(--c-accent)'

                    const nameColor = isDeleteTarget ? CLR_DEL_TEXT
                        : isSuccessor              ? CLR_SUCC_TEXT
                        : hl                       ? 'var(--c-text)'
                        : 'oklch(74% 0.010 78)'

                    const bpmColor = isDeleteTarget ? CLR_DEL_TEXT
                        : isSuccessor             ? CLR_SUCC_TEXT
                        : hl                      ? 'var(--c-accent)'
                        : 'oklch(58% 0.010 78)'

                    const initialColor = isDeleteTarget ? CLR_DEL_STROKE
                        : isSuccessor             ? CLR_SUCC_STROKE
                        : hl                      ? 'var(--c-accent)'
                        : 'var(--c-muted)'

                    const haloVisible = isDeleteTarget || isSuccessor || hl
                    const ringVisible = isDeleteTarget || isSuccessor || hl

                    return (
                        <g
                            key={groupKey}
                            className={isNew ? 'node-new' : undefined}
                            style={{
                                opacity: isRemoving ? 0 : 1,
                                transition: isRemoving
                                    ? 'opacity 350ms ease-out'
                                    : 'opacity 350ms cubic-bezier(0.16,1,0.3,1)',
                            }}
                        >
                            {/* Halo — always rendered, fades in/out */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R + 16}
                                fill={haloFill}
                                style={{
                                    opacity: haloVisible ? 1 : 0,
                                    transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />

                            {/* Node base */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R}
                                fill={nodeFill}
                                stroke={nodeStroke}
                                strokeWidth={nodeStrokeWidth}
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
                                        opacity: (isDeleteTarget || isSuccessor) ? 0.35 : hl ? 0.55 : 1,
                                        transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1)',
                                    }}
                                />
                            )}

                            {/* Initial letter when no art */}
                            {!cover && (
                                <text
                                    x={node.x} y={node.y + 7}
                                    textAnchor="middle"
                                    fill={initialColor}
                                    fontSize="19"
                                    fontWeight="600"
                                    fontFamily={FONT_SANS}
                                    style={{ transition: 'fill 320ms cubic-bezier(0.16,1,0.3,1)' }}
                                >
                                    {node.name[0]?.toUpperCase()}
                                </text>
                            )}

                            {/* Colored ring — always rendered, fades in/out */}
                            <circle
                                cx={node.x} cy={node.y}
                                r={R}
                                fill="none"
                                stroke={ringStroke}
                                strokeWidth="3.5"
                                style={{
                                    opacity: ringVisible ? 1 : 0,
                                    transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), stroke 320ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />

                            {/* Song name */}
                            <text
                                x={node.x} y={node.y + R + LY}
                                textAnchor="middle"
                                fill={nameColor}
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
                                fill={bpmColor}
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
