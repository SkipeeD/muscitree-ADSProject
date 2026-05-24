import { useState, useEffect, useRef, useCallback } from 'react'
import { insert, search, inOrder, preOrder, postOrder } from './hooks/useBST'
import BSTVisualizer from './components/BSTVisualizer'
import DisjointSetsVisualizer from './components/DisjointSetsVisualizer'

const TRAVERSAL_MODES = ['inorder', 'preorder', 'postorder']
const MODE_LABELS = {
    search:    'Search',
    inorder:   'In-Order',
    preorder:  'Pre-Order',
    postorder: 'Post-Order',
}
const STRIP_LABELS = {
    inorder:   'IN-ORDER',
    preorder:  'PRE-ORDER',
    postorder: 'POST-ORDER',
}

function App() {
    const [activeTab, setActiveTab]               = useState('bst')
    const [songs, setSongs]                       = useState([])
    const [highlightedIds, setHighlightedIds]     = useState([])
    const [traversalResult, setTraversalResult]   = useState([])
    const [isInserting, setIsInserting]           = useState(false)
    const [bstMode, setBstMode]                   = useState('search')
    const [lastSongName, setLastSongName]         = useState(null)

    // Uncontrolled inputs — zero re-renders while typing
    const nameRef      = useRef(null)
    const bpmRef       = useRef(null)
    const searchBpmRef = useRef(null)

    // Cancellation token for animated search
    const searchRunId  = useRef(0)
    // Keep songs in a ref so async handlers see latest value without being in deps
    const songsRef     = useRef(songs)
    useEffect(() => { songsRef.current = songs }, [songs])

    const buildTree = useCallback((songList) => {
        let root = null
        for (const song of songList) root = insert(root, song.name, song.bpm, song.id)
        return root
    }, [])

    // Auto-run traversal whenever songs or traversal mode changes
    useEffect(() => {
        if (!TRAVERSAL_MODES.includes(bstMode) || songs.length === 0) return
        const root = buildTree(songs)
        const fn = bstMode === 'inorder'   ? inOrder
                 : bstMode === 'preorder'  ? preOrder
                 : postOrder
        const result = fn(root)
        setTraversalResult(result)
        setHighlightedIds(result.map(n => n.id))
        searchRunId.current++
    }, [songs, bstMode, buildTree])

    const handleInsert = useCallback(async () => {
        const name = nameRef.current?.value.trim()
        const bpm  = bpmRef.current?.value
        if (!name || !bpm || isInserting) return
        setIsInserting(true)
        // Stable ID assigned once here — same id is always used when the tree is rebuilt
        const id = Date.now() + Math.random()
        // Cancel any in-progress search animation and wipe stale highlights.
        // Traversal modes re-populate via useEffect immediately after songs updates.
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
        try {
            const query = encodeURIComponent(name)
            const res   = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
            const data  = await res.json()
            const cover = data.results[0]?.artworkUrl100 || null
            setLastSongName(name)
            setSongs(prev => [...prev, { id, name, bpm: parseInt(bpm), cover }])
        } catch {
            setLastSongName(name)
            setSongs(prev => [...prev, { id, name, bpm: parseInt(bpm), cover: null }])
        } finally {
            if (nameRef.current)  nameRef.current.value  = ''
            if (bpmRef.current)   bpmRef.current.value   = ''
            setIsInserting(false)
        }
        // Expire the entry-animation marker after it has had time to play (480ms + buffer)
        setTimeout(() => setLastSongName(prev => prev === name ? null : prev), 700)
    }, [isInserting])

    // Animated step-by-step BST search
    const handleSearch = useCallback(async () => {
        const bpmVal = searchBpmRef.current?.value
        if (!bpmVal) return
        const runId = ++searchRunId.current
        const root  = buildTree(songsRef.current)
        const path  = search(root, parseInt(bpmVal))
        setHighlightedIds([])
        setTraversalResult([])

        // Step through path nodes one by one — 600ms gives the 320ms transition room to land
        for (let i = 1; i <= path.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600))
            if (searchRunId.current !== runId) return
            setHighlightedIds(path.slice(0, i))
        }

        // Pause so the last node's highlight settles, then collapse to just the found node
        await new Promise(resolve => setTimeout(resolve, 500))
        if (searchRunId.current !== runId) return
        setHighlightedIds(path.length > 0 ? [path[path.length - 1]] : [])
    }, [buildTree])

    const handleModeChange = useCallback((mode) => {
        setBstMode(mode)
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
    }, [])

    const clearState = useCallback(() => {
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
    }, [])

    const hasActiveState = highlightedIds.length > 0 || traversalResult.length > 0

    const INPUT_STYLE = {
        padding: '5px 10px',
        fontSize: '12px',
        borderRadius: '5px',
        border: '1px solid var(--c-border)',
        backgroundColor: 'var(--c-panel)',
        color: 'var(--c-text)',
        fontFamily: 'inherit',
        transition: 'border-color var(--spring)',
    }

    const BTN_BASE = {
        padding: '5px 12px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '5px',
        border: '1px solid var(--c-border)',
        backgroundColor: 'var(--c-panel)',
        color: 'var(--c-text)',
        cursor: 'pointer',
        fontFamily: 'inherit',
    }

    const DIVIDER = (
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--c-border-sub)', flexShrink: 0 }} />
    )

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--c-base)', minHeight: 0 }}>

            {/* ── Nav ──────────────────────────────────────────── */}
            <nav style={{
                height: '48px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                backgroundColor: 'var(--c-surface)',
                borderBottom: '1px solid var(--c-border-sub)',
            }}>
                <span className="mono" style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--c-accent)',
                }}>
                    MusicTree
                </span>

                <div style={{ display: 'flex', gap: '2px' }}>
                    {[
                        { id: 'bst', label: 'BST Visualizer' },
                        { id: 'djs', label: 'Disjoint Sets' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '5px 14px',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '5px',
                                border: activeTab === tab.id ? '1px solid var(--c-border)' : '1px solid transparent',
                                backgroundColor: activeTab === tab.id ? 'var(--c-panel)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--c-text)' : 'var(--c-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* ── BST Control Toolbar ──────────────────────────── */}
            {activeTab === 'bst' && (
                <div style={{
                    height: '44px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '0 24px',
                    backgroundColor: 'var(--c-surface)',
                    borderBottom: '1px solid var(--c-border-sub)',
                    overflowX: 'auto',
                }}>
                    {/* ADD */}
                    <span className="mono" style={{ fontSize: '10px', fontWeight: 500, color: 'var(--c-dim)', letterSpacing: '0.06em', flexShrink: 0 }}>ADD</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <input
                            ref={nameRef}
                            type="text"
                            placeholder="Song name"
                            onKeyDown={e => e.key === 'Enter' && handleInsert()}
                            style={{ ...INPUT_STYLE, width: '136px' }}
                        />
                        <input
                            ref={bpmRef}
                            type="number"
                            placeholder="BPM"
                            onKeyDown={e => e.key === 'Enter' && handleInsert()}
                            className="mono"
                            style={{ ...INPUT_STYLE, width: '70px' }}
                        />
                        <button
                            onClick={handleInsert}
                            disabled={isInserting}
                            style={{
                                ...BTN_BASE,
                                fontWeight: 600,
                                border: 'none',
                                backgroundColor: isInserting ? 'var(--c-lift)' : 'var(--c-accent)',
                                color: isInserting ? 'var(--c-dim)' : 'oklch(11.5% 0.010 62)',
                                cursor: isInserting ? 'default' : 'pointer',
                            }}
                        >
                            {isInserting ? '…' : 'Insert'}
                        </button>
                    </div>

                    {DIVIDER}

                    {/* MODE TOGGLE */}
                    <div style={{
                        display: 'flex',
                        borderRadius: '5px',
                        border: '1px solid var(--c-border)',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        {Object.entries(MODE_LABELS).map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => handleModeChange(id)}
                                style={{
                                    padding: '5px 11px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    border: 'none',
                                    backgroundColor: bstMode === id ? 'var(--c-lift)' : 'transparent',
                                    color: bstMode === id ? 'var(--c-text)' : 'var(--c-dim)',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    flexShrink: 0,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* BPM input — Search only */}
                    {bstMode === 'search' && (
                        <input
                            ref={searchBpmRef}
                            type="number"
                            placeholder="BPM"
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="mono"
                            style={{ ...INPUT_STYLE, width: '70px', flexShrink: 0 }}
                        />
                    )}

                    {/* Run (Search only — traversals auto-run) */}
                    {bstMode === 'search' && (
                        <button onClick={handleSearch} style={{ ...BTN_BASE, flexShrink: 0 }}>
                            Run
                        </button>
                    )}

                    {/* Clear */}
                    {hasActiveState && (
                        <button
                            onClick={clearState}
                            style={{
                                marginLeft: 'auto',
                                padding: '5px 10px',
                                fontSize: '11px',
                                border: 'none',
                                background: 'none',
                                color: 'var(--c-dim)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                flexShrink: 0,
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}

            {/* ── Traversal Result Strip ────────────────────────── */}
            {traversalResult.length > 0 && activeTab === 'bst' && (
                <div
                    className="strip-enter"
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 24px',
                        backgroundColor: 'var(--c-panel)',
                        borderBottom: '1px solid var(--c-border-sub)',
                        overflowX: 'auto',
                    }}
                >
                    <span className="mono" style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'var(--c-accent)',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                    }}>
                        {STRIP_LABELS[bstMode] ?? 'TRAVERSAL'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {traversalResult.map((s, i) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="mono" style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--c-lift)',
                                    color: 'var(--c-text)',
                                    border: '1px solid var(--c-accent-ring)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {s.name} · {s.bpm}
                                </span>
                                {i < traversalResult.length - 1 && (
                                    <span style={{ color: 'var(--c-dim)', fontSize: '10px' }}>→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Main Canvas ───────────────────────────────────── */}
            <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {activeTab === 'bst' ? (
                    <BSTVisualizer
                        songs={songs}
                        highlightedIds={highlightedIds}
                        lastSongName={lastSongName}
                    />
                ) : (
                    <DisjointSetsVisualizer songs={songs} />
                )}
            </main>

        </div>
    )
}

export default App
