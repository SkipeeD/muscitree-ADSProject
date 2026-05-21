import { useState } from 'react'
import { insert, search, inOrder } from './hooks/useBST'
import BSTVisualizer from './components/BSTVisualizer'
import DisjointSetsVisualizer from './components/DisjointSetsVisualizer'


function App() {
    const [activeTab, setActiveTab] = useState('bst')
    const [songs, setSongs] = useState([])
    const [nameInput, setNameInput] = useState('')
    const [bpmInput, setBpmInput] = useState('')
    const [searchBpm, setSearchBpm] = useState('')
    const [highlightedIds, setHighlightedIds] = useState([])
    const [sortedSongs, setSortedSongs] = useState([])

    const buildTree = () => {
        let root = null
        for (const song of songs) root = insert(root, song.name, song.bpm)
        return root
    }

    const handleInsert = async () => {
        if (!nameInput || !bpmInput) return
        const query = encodeURIComponent(nameInput)
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
        const data = await res.json()
        const cover = data.results[0]?.artworkUrl100 || null
        setSongs(prev => [...prev, { name: nameInput, bpm: parseInt(bpmInput), cover }])
        setNameInput('')
        setBpmInput('')
    }

    const handleSearch = () => {
        if (!searchBpm) return
        const root = buildTree()
        const path = search(root, parseInt(searchBpm))
        setHighlightedIds(path)
        setSortedSongs([])
    }

    const handleInOrder = () => {
        const root = buildTree()
        const result = inOrder(root)
        setSortedSongs(result)
        setHighlightedIds(result.map(n => n.id))
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="flex items-center justify-between px-8 py-4 bg-gray-900 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-green-400">MusicTree</h1>

                {activeTab === 'bst' && (
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Song name"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500 w-36"
                        />
                        <input
                            type="number"
                            placeholder="BPM"
                            value={bpmInput}
                            onChange={e => setBpmInput(e.target.value)}
                            className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500 w-20"
                        />
                        <button
                            onClick={handleInsert}
                            className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-lg transition-all"
                        >
                            Insert
                        </button>
                        <input
                            type="number"
                            placeholder="Search BPM"
                            value={searchBpm}
                            onChange={e => setSearchBpm(e.target.value)}
                            className="bg-gray-800 text-white text-sm px-2 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500 w-28"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-all"
                        >
                            Search
                        </button>
                        <button
                            onClick={handleInOrder}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg transition-all"
                        >
                            In-Order
                        </button>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('bst')}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${
                            activeTab === 'bst'
                                ? 'bg-green-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        BST Visualizer
                    </button>
                    <button
                        onClick={() => setActiveTab('djs')}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${
                            activeTab === 'djs'
                                ? 'bg-green-500 text-black'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Disjoint Sets
                    </button>
                </div>
            </nav>

            {sortedSongs.length > 0 && (
                <div className="bg-gray-900 border-b border-green-500 px-8 py-3 flex items-center gap-2 overflow-x-auto">
                    <span className="text-green-400 font-bold text-sm whitespace-nowrap">In-Order:</span>
                    {sortedSongs.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
        <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap border border-green-500">
          {s.name} — {s.bpm} BPM
        </span>
                            {i < sortedSongs.length - 1 && (
                                <span className="text-green-500 text-xs">→</span>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => setSortedSongs([])}
                        className="ml-4 text-gray-500 hover:text-white text-xs whitespace-nowrap"
                    >
                        ✕ close
                    </button>
                </div>
            )}

            <main className="p-8">
                {activeTab === 'bst' ? (
                    <BSTVisualizer
                        songs={songs}
                        highlightedIds={highlightedIds}
                        sortedSongs={sortedSongs}
                    />
                ) : (
                    <DisjointSetsVisualizer songs={songs} />
                )}
            </main>
        </div>
    )
}

export default App