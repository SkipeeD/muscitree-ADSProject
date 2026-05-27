import { useState } from 'react'
import { createDS, makeSet, union, findSet, getComponents } from '../hooks/useDisjointSets'
import DisjointSetsTree from './DisjointSetsTree'

const SET_COLORS = [
    'oklch(62% 0.13 74)',    // amber
    'oklch(62% 0.11 200)',   // teal
    'oklch(62% 0.11 280)',   // violet
    'oklch(62% 0.11 140)',   // sage
    'oklch(62% 0.11 330)',   // rose
    'oklch(62% 0.11 30)',    // orange
    'oklch(62% 0.11 240)',   // blue
    'oklch(62% 0.10 100)',   // lime
]

const a = (color, alpha) => color.replace(')', ` / ${alpha})`)

export default function DisjointSetsVisualizer({ songs }) {
    const [ds, setDs] = useState(() => createDS())
    const [selected, setSelected] = useState([])
    const [rootColors, setRootColors] = useState({})

    const syncedDs = songs.reduce((acc, song) => {
        if (acc.parent[song.name] === undefined) return makeSet(acc, song.name)
        return acc
    }, ds)

    const components = getComponents(syncedDs)
    const roots = Object.keys(components)

    const getColor = (songName) => {
        const root = findSet(syncedDs, songName)
        if (rootColors[root]) return rootColors[root]
        const idx = songs.findIndex(s => s.name === root)
        return SET_COLORS[idx !== -1 ? idx % SET_COLORS.length : 0]
    }

    const handleCardClick = (songName) => {
        if (selected.includes(songName)) {
            setSelected(selected.filter(s => s !== songName))
            return
        }
        const newSelected = [...selected, songName]
        if (newSelected.length === 2) {
            const root1 = findSet(syncedDs, newSelected[0])
            const root2 = findSet(syncedDs, newSelected[1])
            if (root1 === root2) { setSelected([]); return }

            const rank1 = syncedDs.rank[root1]
            const rank2 = syncedDs.rank[root2]
            const survivingRoot = rank1 >= rank2 ? root1 : root2
            const survivingColor = rootColors[survivingRoot]
                || SET_COLORS[songs.findIndex(s => s.name === survivingRoot) % SET_COLORS.length]

            const newDs = union(syncedDs, newSelected[0], newSelected[1])
            const newRoot = findSet(newDs, newSelected[0])
            setRootColors(prev => ({ ...prev, [newRoot]: survivingColor }))
            setDs(newDs)
            setSelected([])
        } else {
            setSelected(newSelected)
        }
    }

    const handleReset = () => {
        let fresh = createDS()
        for (const song of songs) fresh = makeSet(fresh, song.name)
        setDs(fresh)
        setSelected([])
        setRootColors({})
    }

    const isEmpty = songs.length === 0
    const statusText = isEmpty
        ? 'Add songs in the BST tab'
        : selected.length === 1
            ? 'Select one more to merge sets'
            : 'Select two songs to merge into the same set'

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* ── Left panel: songs + legend ────────────────── */}
            <div style={{
                width: '288px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--c-border-sub)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '14px 16px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--c-border-sub)',
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: '11px', color: 'var(--c-muted)', lineHeight: 1.4 }}>
                        {statusText}
                    </span>
                    {!isEmpty && (
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '3px 10px',
                                fontSize: '11px',
                                fontWeight: 500,
                                borderRadius: '4px',
                                border: '1px solid var(--c-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--c-dim)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                flexShrink: 0,
                                marginLeft: '10px',
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Song list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {isEmpty ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            padding: '40px 16px',
                        }}>
                            <span style={{ fontSize: '12px', color: 'var(--c-dim)', textAlign: 'center' }}>
                                No songs yet
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {songs.map(song => {
                                const color = getColor(song.name)
                                const isSelected = selected.includes(song.name)
                                return (
                                    <button
                                        key={song.name}
                                        onClick={() => handleCardClick(song.name)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '7px 10px',
                                            borderRadius: '6px',
                                            border: isSelected
                                                ? `1.5px solid var(--c-accent)`
                                                : '1.5px solid transparent',
                                            backgroundColor: isSelected
                                                ? 'var(--c-accent-mid)'
                                                : a(color, 0.10),
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontFamily: 'inherit',
                                            transition: 'background-color 150ms, border-color 150ms',
                                        }}
                                    >
                                        {/* Art / initial */}
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            backgroundColor: a(color, 0.25),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {song.cover ? (
                                                <img src={song.cover} alt={song.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    color: isSelected ? 'var(--c-accent)' : color,
                                                    fontFamily: "'Geist', system-ui, sans-serif",
                                                    lineHeight: 1,
                                                }}>
                                                    {song.name[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <span style={{
                                            flex: 1,
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: isSelected ? 'var(--c-text)' : 'var(--c-muted)',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {song.name}
                                        </span>

                                        {/* BPM */}
                                        <span className="mono" style={{
                                            fontSize: '10px',
                                            fontWeight: 500,
                                            color: isSelected ? 'var(--c-accent)' : color,
                                            flexShrink: 0,
                                        }}>
                                            {song.bpm}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Components legend */}
                {!isEmpty && roots.length > 0 && (
                    <div style={{
                        borderTop: '1px solid var(--c-border-sub)',
                        padding: '12px 16px',
                        flexShrink: 0,
                    }}>
                        <span className="mono" style={{
                            display: 'block',
                            fontSize: '9px',
                            fontWeight: 500,
                            color: 'var(--c-dim)',
                            letterSpacing: '0.07em',
                            marginBottom: '8px',
                        }}>
                            COMPONENTS
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {roots.map(root => {
                                const color = getColor(root)
                                return (
                                    <div key={root} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                                        <div style={{
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            flexShrink: 0,
                                            marginTop: '3px',
                                        }} />
                                        <span className="mono" style={{
                                            fontSize: '10px',
                                            color: 'var(--c-muted)',
                                            lineHeight: 1.5,
                                        }}>
                                            {components[root].join(' · ')}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right panel: forest ───────────────────────── */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '16px 20px 0',
                gap: '10px',
            }}>
                <span className="mono" style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    color: 'var(--c-dim)',
                    letterSpacing: '0.07em',
                    flexShrink: 0,
                }}>
                    FOREST  ·  filled = root  ·  r = rank
                </span>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <DisjointSetsTree ds={syncedDs} getColor={getColor} isEmpty={isEmpty} songs={songs} />
                </div>
            </div>

        </div>
    )
}
