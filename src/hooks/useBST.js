// Each node in the BST
export function createNode(name, bpm, id) {
    return {
        name,
        bpm,
        left: null,
        right: null,
        id: id ?? (Date.now() + Math.random()), // stable id passed in from song data
    }
}

// Insert a new song into the BST
// Pass song.id so node IDs are stable across tree rebuilds
export function insert(root, name, bpm, id) {
    if (root === null) return createNode(name, bpm, id)
    if (bpm < root.bpm) {
        root.left = insert(root.left, name, bpm, id)
    } else if (bpm > root.bpm) {
        root.right = insert(root.right, name, bpm, id)
    }
    return root
}

// Search by BPM — returns array of node ids on the path
export function search(root, bpm, path = []) {
    if (root === null) return path
    path.push(root.id)
    if (bpm === root.bpm) return path
    if (bpm < root.bpm) return search(root.left, bpm, path)
    return search(root.right, bpm, path)
}

// In-order traversal — left → root → right (lowest BPM to highest)
export function inOrder(root, result = []) {
    if (root === null) return result
    inOrder(root.left, result)
    result.push(root)
    inOrder(root.right, result)
    return result
}

// Reverse in-order traversal — right → root → left (highest BPM to lowest)
export function reverseInOrder(root, result = []) {
    if (root === null) return result
    reverseInOrder(root.right, result)
    result.push(root)
    reverseInOrder(root.left, result)
    return result
}

// Post-order traversal — left → right → root
export function postOrder(root, result = []) {
    if (root === null) return result
    postOrder(root.left, result)
    postOrder(root.right, result)
    result.push(root)
    return result
}

// Returns all metadata needed to animate a delete operation:
// searchPath  — node ids visited while locating the target
// targetId    — id of the node to delete (null if not found)
// targetName  — name of the target node
// deleteCase  — 1 = leaf, 2 = one child, 3 = two children
// successorPath — ids visited while finding the in-order successor (case 3 only)
// successorId / successorName / successorBpm — the successor node (case 3 only)
export function getDeleteInfo(root, bpm) {
    const searchPath = []
    let node = root
    let targetId         = null
    let targetName       = null
    let deleteCase       = null
    const successorPath  = []
    let successorId      = null
    let successorName    = null
    let successorBpm     = null

    while (node) {
        searchPath.push(node.id)
        if (bpm === node.bpm) {
            targetId   = node.id
            targetName = node.name
            if (!node.left && !node.right) {
                deleteCase = 1
            } else if (!node.left || !node.right) {
                deleteCase = 2
            } else {
                deleteCase = 3
                // in-order successor: go right once, then left as far as possible
                let succ = node.right
                successorPath.push(succ.id)
                while (succ.left) {
                    succ = succ.left
                    successorPath.push(succ.id)
                }
                successorId   = succ.id
                successorName = succ.name
                successorBpm  = succ.bpm
            }
            break
        }
        node = bpm < node.bpm ? node.left : node.right
    }

    return { searchPath, targetId, targetName, deleteCase, successorPath, successorId, successorName, successorBpm }
}

// Pure BST deletion — returns new root
// (App state rebuilds the tree from the filtered songs array, but this
//  is kept here as a standalone utility and for educational reference)
export function deleteNode(root, bpm) {
    if (root === null) return null
    if (bpm < root.bpm) return { ...root, left: deleteNode(root.left, bpm) }
    if (bpm > root.bpm) return { ...root, right: deleteNode(root.right, bpm) }
    // Found — handle the three cases
    if (!root.left) return root.right           // case 1 & 2 (no left child)
    if (!root.right) return root.left           // case 2 (no right child)
    // Case 3: two children — replace with in-order successor
    let succ = root.right
    while (succ.left) succ = succ.left
    return { ...root, name: succ.name, bpm: succ.bpm, id: succ.id, right: deleteNode(root.right, succ.bpm) }
}