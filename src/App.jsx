import { useState, useEffect, useRef, useCallback } from 'react'
import { insert, search, inOrder, reverseInOrder, postOrder, getDeleteInfo, deleteNode, findNode } from './hooks/useBST'
import BSTVisualizer from './components/BSTVisualizer'
import DisjointSetsVisualizer from './components/DisjointSetsVisualizer'

const TRAVERSAL_MODES = ['inorder', 'reverseorder', 'postorder']
const MODE_LABELS = {
    search:       'Search',
    inorder:      'In-Order',
    reverseorder: 'Reverse In-Order',
    postorder:    'Post-Order',
    delete:       'Delete',
}
const STRIP_LABELS = {
    inorder:      'IN-ORDER',
    reverseorder: 'REVERSE IN-ORDER',
    postorder:    'POST-ORDER',
}
const DELETE_CASE_LABEL = { 1: 'LEAF', 2: 'SINGLE CHILD', 3: 'TWO CHILDREN' }

function App() {
    const [activeTab, setActiveTab]                     = useState('bst')
    const [tree, setTree]                               = useState(null)
    const [highlightedIds, setHighlightedIds]           = useState([])
    const [traversalResult, setTraversalResult]         = useState([])
    const [isInserting, setIsInserting]                 = useState(false)
    const [bstMode, setBstMode]                         = useState('search')
    const [lastSongName, setLastSongName]               = useState(null)

    // Insert error
    const [insertError, setInsertError]                 = useState(null)

    // Delete animation state
    const [deleteTargetId, setDeleteTargetId]           = useState(null)
    const [deleteSuccessorId, setDeleteSuccessorId]     = useState(null)
    const [deleteSuccessorPathIds, setDeleteSuccessorPathIds] = useState([])
    const [deletePhase, setDeletePhase]                 = useState(null)
    const [deleteStripInfo, setDeleteStripInfo]         = useState(null)

    // Uncontrolled inputs — zero re-renders while typing
    const nameRef      = useRef(null)
    const bpmRef       = useRef(null)
    const searchBpmRef = useRef(null)
    const deleteBpmRef = useRef(null)

    // Cancellation token for animated operations
    const searchRunId  = useRef(0)
    // Keep tree in a ref so async handlers always see the latest value without being in deps
    const treeRef = useRef(tree)
    useEffect(() => { treeRef.current = tree }, [tree])

    // Auto-run traversal whenever tree or traversal mode changes
    useEffect(() => {
        if (!TRAVERSAL_MODES.includes(bstMode) || !tree) return
        const fn = bstMode === 'inorder'      ? inOrder
                 : bstMode === 'reverseorder' ? reverseInOrder
                 : postOrder
        const result = fn(tree)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTraversalResult(result)
        setHighlightedIds(result.map(n => n.id))
        searchRunId.current++
    }, [tree, bstMode])

    const handleInsert = useCallback(async () => {
        const name = nameRef.current?.value.trim()
        const bpm  = bpmRef.current?.value
        if (!name || !bpm || isInserting) return

        // Block duplicate BPMs — BST silently drops them, so surface it explicitly
        const bpmInt = parseInt(bpm)
        if (findNode(treeRef.current, bpmInt)) {
            setInsertError(`BPM ${bpmInt} already in tree`)
            bpmRef.current?.select()
            return
        }

        setInsertError(null)
        setIsInserting(true)
        const id = Date.now() + Math.random()
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
        setDeleteTargetId(null)
        setDeleteSuccessorId(null)
        setDeleteSuccessorPathIds([])
        setDeletePhase(null)
        setDeleteStripInfo(null)
        try {
            const query = encodeURIComponent(name)
            const res   = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
            const data  = await res.json()
            const cover = data.results[0]?.artworkUrl100 || null
            setLastSongName(name)
            setTree(prev => insert(prev, name, bpmInt, id, cover))
        } catch {
            setLastSongName(name)
            setTree(prev => insert(prev, name, bpmInt, id, null))
        } finally {
            if (nameRef.current)  nameRef.current.value  = ''
            if (bpmRef.current)   bpmRef.current.value   = ''
            setIsInserting(false)
        }
        setTimeout(() => setLastSongName(prev => prev === name ? null : prev), 700)
    }, [isInserting])

    // Animated step-by-step BST search
    const handleSearch = useCallback(async () => {
        const bpmVal = searchBpmRef.current?.value
        if (!bpmVal) return
        const runId = ++searchRunId.current
        const root  = treeRef.current
        const path  = search(root, parseInt(bpmVal))
        setHighlightedIds([])
        setTraversalResult([])

        for (let i = 1; i <= path.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600))
            if (searchRunId.current !== runId) return
            setHighlightedIds(path.slice(0, i))
        }

        await new Promise(resolve => setTimeout(resolve, 500))
        if (searchRunId.current !== runId) return
        setHighlightedIds(path.length > 0 ? [path[path.length - 1]] : [])
        // Found node stays lit — user clears manually or starts a new operation
    }, [])

    // Animated delete with 3-case visualization
    const handleDelete = useCallback(async () => {
        const bpmVal = parseInt(deleteBpmRef.current?.value)
        if (!bpmVal) return

        const runId = ++searchRunId.current
        const root  = treeRef.current
        const info  = getDeleteInfo(root, bpmVal)

        // Reset all state
        setHighlightedIds([])
        setTraversalResult([])
        setDeleteTargetId(null)
        setDeleteSuccessorId(null)
        setDeleteSuccessorPathIds([])
        setDeletePhase(null)
        setDeleteStripInfo(null)

        if (!info.targetId) {
            // Not found — animate the failed search path and stop
            setDeletePhase('searching')
            for (let i = 1; i <= info.searchPath.length; i++) {
                await new Promise(r => setTimeout(r, 420))
                if (searchRunId.current !== runId) return
                setHighlightedIds(info.searchPath.slice(0, i))
            }
            await new Promise(r => setTimeout(r, 900))
            if (searchRunId.current !== runId) return
            setHighlightedIds([])
            setDeletePhase(null)
            return
        }

        // ── Phase 1: walk search path down to (but not including) the target ──
        setDeletePhase('searching')
        for (let i = 1; i < info.searchPath.length; i++) {
            await new Promise(r => setTimeout(r, 420))
            if (searchRunId.current !== runId) return
            setHighlightedIds(info.searchPath.slice(0, i))
        }

        // ── Phase 2: land on target — highlight red, show strip ──
        await new Promise(r => setTimeout(r, 420))
        if (searchRunId.current !== runId) return
        setHighlightedIds([])
        setDeleteTargetId(info.targetId)
        setDeletePhase('found')
        setDeleteStripInfo({
            deleteCase:    info.deleteCase,
            targetName:    info.targetName,
            targetBpm:     bpmVal,
            successorName: info.successorName,
            successorBpm:  info.successorBpm,
        })

        // ── Phase 3 (case 3 only): walk to in-order successor ──
        if (info.deleteCase === 3) {
            await new Promise(r => setTimeout(r, 750))
            if (searchRunId.current !== runId) return
            setDeletePhase('successor')
            for (let i = 1; i <= info.successorPath.length; i++) {
                await new Promise(r => setTimeout(r, 380))
                if (searchRunId.current !== runId) return
                setDeleteSuccessorPathIds(info.successorPath.slice(0, i))
            }
            // Confirm successor — light it up in teal
            await new Promise(r => setTimeout(r, 300))
            if (searchRunId.current !== runId) return
            setDeleteSuccessorId(info.successorId)
            await new Promise(r => setTimeout(r, 700))
            if (searchRunId.current !== runId) return
        } else {
            await new Promise(r => setTimeout(r, 900))
            if (searchRunId.current !== runId) return
        }

        // ── Phase 4: fade out target, then actually remove ──
        setDeletePhase('removing')
        await new Promise(r => setTimeout(r, 380))
        if (searchRunId.current !== runId) return

        setTree(prev => deleteNode(prev, bpmVal))

        // Clean up all delete state
        setDeleteTargetId(null)
        setDeleteSuccessorId(null)
        setDeleteSuccessorPathIds([])
        setDeletePhase(null)
        setDeleteStripInfo(null)
        setHighlightedIds([])
        if (deleteBpmRef.current) deleteBpmRef.current.value = ''
    }, [])

    const handleModeChange = useCallback((mode) => {
        setBstMode(mode)
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
        setDeleteTargetId(null)
        setDeleteSuccessorId(null)
        setDeleteSuccessorPathIds([])
        setDeletePhase(null)
        setDeleteStripInfo(null)
    }, [])

    const clearState = useCallback(() => {
        searchRunId.current++
        setHighlightedIds([])
        setTraversalResult([])
        setDeleteTargetId(null)
        setDeleteSuccessorId(null)
        setDeleteSuccessorPathIds([])
        setDeletePhase(null)
        setDeleteStripInfo(null)
    }, [])

    const hasActiveState = highlightedIds.length > 0 || traversalResult.length > 0
        || deleteTargetId !== null || deleteStripInfo !== null

    // Derive a flat songs list from the tree for the DisjointSets tab
    const songs = inOrder(tree)

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
                            onKeyDown={e => {
                                setInsertError(null)
                                if (e.key === 'Enter') handleInsert()
                            }}
                            onChange={() => setInsertError(null)}
                            className="mono"
                            style={{
                                ...INPUT_STYLE,
                                width: '70px',
                                borderColor: insertError ? 'oklch(52% 0.16 15)' : undefined,
                                color: insertError ? 'oklch(68% 0.16 15)' : undefined,
                            }}
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
                        {insertError && (
                            <span className="mono" style={{
                                fontSize: '10px',
                                color: 'oklch(58% 0.16 15)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}>
                                {insertError}
                            </span>
                        )}
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
                        {Object.entries(MODE_LABELS).map(([id, label]) => {
                            const isActive   = bstMode === id
                            const isDelete   = id === 'delete'
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleModeChange(id)}
                                    style={{
                                        padding: '5px 11px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        border: 'none',
                                        backgroundColor: isActive
                                            ? isDelete ? 'oklch(22% 0.05 15)' : 'var(--c-lift)'
                                            : 'transparent',
                                        color: isActive
                                            ? isDelete ? 'oklch(72% 0.16 15)' : 'var(--c-text)'
                                            : isDelete ? 'oklch(52% 0.10 15)' : 'var(--c-dim)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        flexShrink: 0,
                                    }}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>

                    {/* BPM input — Search mode */}
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
                    {bstMode === 'search' && (
                        <button onClick={handleSearch} style={{ ...BTN_BASE, flexShrink: 0 }}>
                            Run
                        </button>
                    )}

                    {/* BPM input + Delete button — Delete mode */}
                    {bstMode === 'delete' && (
                        <input
                            ref={deleteBpmRef}
                            type="number"
                            placeholder="BPM"
                            onKeyDown={e => e.key === 'Enter' && handleDelete()}
                            className="mono"
                            style={{ ...INPUT_STYLE, width: '70px', flexShrink: 0 }}
                        />
                    )}
                    {bstMode === 'delete' && (
                        <button
                            onClick={handleDelete}
                            style={{
                                ...BTN_BASE,
                                flexShrink: 0,
                                backgroundColor: 'oklch(22% 0.05 15)',
                                color: 'oklch(72% 0.16 15)',
                                border: '1px solid oklch(36% 0.08 15)',
                            }}
                        >
                            Delete
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

            {/* ── Delete Info Strip ─────────────────────────────── */}
            {deleteStripInfo && activeTab === 'bst' && (
                <div
                    className="strip-enter"
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 24px',
                        backgroundColor: 'var(--c-panel)',
                        borderBottom: '1px solid var(--c-border-sub)',
                        overflowX: 'auto',
                    }}
                >
                    {/* Case label */}
                    <span className="mono" style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'oklch(60% 0.18 15)',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                    }}>
                        DELETE · {DELETE_CASE_LABEL[deleteStripInfo.deleteCase]}
                    </span>

                    <span style={{ color: 'var(--c-border)', fontSize: '10px', flexShrink: 0 }}>·</span>

                    {/* Target node chip */}
                    <span className="mono" style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'oklch(19% 0.05 15 / 0.5)',
                        color: 'oklch(72% 0.16 15)',
                        border: '1px solid oklch(38% 0.09 15)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}>
                        {deleteStripInfo.targetName} · {deleteStripInfo.targetBpm}
                    </span>

                    {/* Case description */}
                    {deleteStripInfo.deleteCase === 1 && (
                        <span style={{ fontSize: '11px', color: 'var(--c-muted)', flexShrink: 0 }}>
                            leaf node — remove directly
                        </span>
                    )}
                    {deleteStripInfo.deleteCase === 2 && (
                        <span style={{ fontSize: '11px', color: 'var(--c-muted)', flexShrink: 0 }}>
                            one child — splice out, promote child
                        </span>
                    )}
                    {deleteStripInfo.deleteCase === 3 && (
                        <>
                            <span style={{ fontSize: '11px', color: 'var(--c-muted)', flexShrink: 0 }}>
                                two children — in-order successor:
                            </span>
                            <span className="mono" style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'oklch(19% 0.04 200 / 0.5)',
                                color: 'oklch(70% 0.13 200)',
                                border: '1px solid oklch(38% 0.10 200)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}>
                                {deleteStripInfo.successorName} · {deleteStripInfo.successorBpm}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* ── Main Canvas ───────────────────────────────────── */}
            {/* Both tabs stay mounted so Disjoint Sets doesn't lose merge state on tab switch */}
            <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: activeTab === 'bst' ? 'block' : 'none' }}>
                    <BSTVisualizer
                        tree={tree}
                        highlightedIds={highlightedIds}
                        lastSongName={lastSongName}
                        deleteTargetId={deleteTargetId}
                        deleteSuccessorId={deleteSuccessorId}
                        deleteSuccessorPathIds={deleteSuccessorPathIds}
                        deletePhase={deletePhase}
                    />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: activeTab === 'djs' ? 'block' : 'none' }}>
                    <DisjointSetsVisualizer songs={songs} />
                </div>
            </main>

        </div>
    )
}

export default App
