import { useState } from 'react'
import { createDS, makeSet, union, findSet, getComponents } from '../hooks/useDisjointSets'
import DisjointSetsTree from './DisjointSetsTree'

const COLORS = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#ef4444'
]

export default function DisjointSetsVisualizer({ songs }) {
    const [ds, setDs] = useState(() => createDS())
    const [selected, setSelected] = useState([])
    const [rootColors, setRootColors] = useState({})

    const syncedDs = songs.reduce((acc, song) => {
        if (acc.parent[song.name] === undefined) {
            return makeSet(acc, song.name)
        }
        return acc
    }, ds)

    const components = getComponents(syncedDs)
    const roots = Object.keys(components)

    const getColor = (songName) => {
        const root = findSet(syncedDs, songName)
        if (rootColors[root]) return rootColors[root]
        const originalIndex = songs.findIndex(s => s.name === root)
        if (originalIndex !== -1) return COLORS[originalIndex % COLORS.length]
        return COLORS[0]
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

            if (root1 === root2) {
                setSelected([])
                return
            }

            const rank1 = syncedDs.rank[root1]
            const rank2 = syncedDs.rank[root2]

            let survivingRoot
            if (rank1 > rank2) survivingRoot = root1
            else if (rank2 > rank1) survivingRoot = root2
            else survivingRoot = root1

            const survivingColor = rootColors[survivingRoot]
                || COLORS[songs.findIndex(s => s.name === survivingRoot) % COLORS.length]

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
        for (const song of songs) {
            fresh = makeSet(fresh, song.name)
        }
        setDs(fresh)
        setSelected([])
        setRootColors({})
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                    Click two songs to connect them into the same group
                </p>
                <button
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg transition-all text-sm"
                >
                    Reset Connections
                </button>
            </div>

            {/* Song cards */}
            <div className="flex flex-wrap gap-4">
                {songs.map(song => {
                    const color = getColor(song.name)
                    const isSelected = selected.includes(song.name)
                    return (
                        <div
                            key={song.name}
                            onClick={() => handleCardClick(song.name)}
                            className="cursor-pointer rounded-xl p-4 w-36 flex flex-col items-center gap-2 transition-all border-2"
                            style={{
                                backgroundColor: color + '22',
                                borderColor: isSelected ? 'white' : color,
                                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                            }}
                        >
                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                                {song.cover ? (
                                    <img src={song.cover} alt={song.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: color + '44' }}
                                    >
                                        🎵
                                    </div>
                                )}
                            </div>
                            <p className="text-white text-xs font-bold text-center leading-tight">
                                {song.name}
                            </p>
                            <p className="text-xs font-semibold" style={{ color }}>
                                {song.bpm} BPM
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Forest visualization */}
            <div className="bg-gray-900 rounded-xl p-4">
                <DisjointSetsTree ds={syncedDs} />
            </div>

            {/* Components legend */}
            <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-3">Current components:</p>
                <div className="flex flex-col gap-2">
                    {roots.map((root) => (
                        <div key={root} className="flex items-center gap-2 flex-wrap">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getColor(root) }}
                            />
                            <span className="text-gray-300 text-sm">
                {components[root].join(' · ')}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}