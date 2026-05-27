const FONT_SANS = "'Geist', system-ui, sans-serif"
const FONT_MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"

function buildChildren(ds) {
    const children = {}
    for (const [node, parent] of Object.entries(ds.parent)) {
        if (node === parent) continue
        if (!children[parent]) children[parent] = []
        children[parent].push(node)
    }
    return children
}


function TreeNode({ name, children, x, y, rank, isRoot, color, coverMap, colorMap, rankMap }) {
    const childCount   = children[name]?.length || 0
    const childSpacing = 110
    const childY       = y + 110
    const R            = 28
    const cover        = coverMap?.[name] ?? null

    return (
        <g>
            {/* Lines to children */}
            {(children[name] || []).map((child, i) => {
                const cx = x + (i - (childCount - 1) / 2) * childSpacing
                return (
                    <line
                        key={child}
                        x1={x}  y1={y + R}
                        x2={cx} y2={childY - R}
                        stroke="var(--c-border)"
                        strokeWidth="1.5"
                    />
                )
            })}

            {/* Clip circle for art */}
            <clipPath id={`fc-clip-${name.replace(/[\s'",]/g, '_')}`}>
                <circle cx={x} cy={y} r={R - 2} />
            </clipPath>

            {/* Node base */}
            <circle
                cx={x} cy={y} r={R}
                fill={isRoot && color
                    ? color.replace(')', ' / 0.18)')
                    : 'var(--c-panel)'}
                stroke={isRoot && color ? color : 'var(--c-border)'}
                strokeWidth={isRoot ? 2 : 1.5}
            />

            {/* Album art */}
            {cover && (
                <image
                    href={cover}
                    x={x - R + 2} y={y - R + 2}
                    width={(R - 2) * 2} height={(R - 2) * 2}
                    clipPath={`url(#fc-clip-${name.replace(/[\s'",]/g, '_')})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ opacity: 0.88 }}
                />
            )}

            {/* Initial letter when no art */}
            {!cover && (
                <text
                    x={x} y={y + 6}
                    textAnchor="middle"
                    fill={isRoot && color ? color : 'var(--c-muted)'}
                    fontSize="15"
                    fontWeight="600"
                    fontFamily={FONT_SANS}
                >
                    {name[0]?.toUpperCase()}
                </text>
            )}

            {/* Root color ring on top of art */}
            {isRoot && color && (
                <circle
                    cx={x} cy={y} r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                />
            )}

            {/* Rank badge — bottom-right of circle */}
            <circle
                cx={x + R - 5} cy={y + R - 5} r={8}
                fill="var(--c-lift)"
                stroke="var(--c-border-sub)"
                strokeWidth="1"
            />
            <text
                x={x + R - 5} y={y + R - 1}
                textAnchor="middle"
                fill="var(--c-dim)"
                fontSize="7"
                fontFamily={FONT_MONO}
            >
                {rank}
            </text>

            {/* Song name — below circle */}
            <text
                x={x} y={y + R + 14}
                textAnchor="middle"
                fill={isRoot && color ? color : 'oklch(68% 0.010 78)'}
                fontSize="9"
                fontWeight={isRoot ? 600 : 400}
                fontFamily={FONT_SANS}
            >
                {name.length > 12 ? name.slice(0, 12) + '…' : name}
            </text>

            {/* Recurse children */}
            {(children[name] || []).map((child, i) => {
                const cx = x + (i - (childCount - 1) / 2) * childSpacing
                return (
                    <TreeNode
                        key={child}
                        name={child}
                        children={children}
                        x={cx}
                        y={childY}
                        rank={rankMap?.[child] ?? 0}
                        isRoot={false}
                        color={null}
                        coverMap={coverMap}
                        colorMap={colorMap}
                        rankMap={rankMap}
                    />
                )
            })}
        </g>
    )
}

export default function DisjointSetsTree({ ds, getColor, isEmpty, songs = [] }) {
    // Empty state
    if (isEmpty || !ds || Object.keys(ds.parent).length === 0) {
        return (
            <svg
                viewBox="0 0 600 300"
                style={{ width: '100%', height: '100%', display: 'block' }}
                preserveAspectRatio="xMidYMid meet"
            >
                <circle cx={300} cy={140} r={52}
                    fill="none"
                    stroke="var(--c-border-sub)"
                    strokeWidth="1"
                    strokeDasharray="5 5"
                />
                <text x={300} y={137} textAnchor="middle"
                    fill="var(--c-dim)" fontSize="12"
                    fontFamily={FONT_SANS} fontWeight="500">
                    Add songs
                </text>
                <text x={300} y={155} textAnchor="middle"
                    fill="var(--c-dim)" fontSize="11"
                    fontFamily={FONT_SANS}>
                    to see the forest
                </text>
            </svg>
        )
    }

    const children = buildChildren(ds)
    const roots    = Object.keys(ds.parent).filter(n => ds.parent[n] === n)

    // Center trees within the viewBox so xMidYMin places them correctly
    // in the right panel regardless of how many trees there are
    const treeSpacing  = 220
    const contentWidth = Math.max((roots.length - 1) * treeSpacing, 0)
    const sidePad      = 90
    const svgWidth     = Math.max(contentWidth + sidePad * 2, 500)
    const startX       = Math.round((svgWidth - contentWidth) / 2)

    // Build lookup maps once at this level and pass them all the way down
    const coverMap = {}
    for (const s of songs) coverMap[s.name] = s.cover || null
    const rankMap = ds.rank  // { songName: rank } — needed at every depth

    return (
        <svg
            viewBox={`0 0 ${svgWidth} 460`}
            preserveAspectRatio="xMidYMin meet"
            style={{ width: '100%', height: '100%', display: 'block' }}
        >
            {roots.map((root, i) => (
                <TreeNode
                    key={root}
                    name={root}
                    children={children}
                    x={startX + i * treeSpacing}
                    y={62}
                    rank={ds.rank[root]}
                    isRoot={true}
                    color={getColor ? getColor(root) : null}
                    coverMap={coverMap}
                    rankMap={rankMap}
                />
            ))}
        </svg>
    )
}
