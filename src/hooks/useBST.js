// Each node in the BST
export function createNode(name, bpm, id, cover = null) {
    return {
        name,
        bpm,
        cover,
        left: null,
        right: null,
        id: id ?? (Date.now() + Math.random()),
    }
}

// Insert a new song into the BST
export function insert(root, name, bpm, id, cover = null) {
    if (root === null) return createNode(name, bpm, id, cover)
    if (bpm < root.bpm) return { ...root, left: insert(root.left, name, bpm, id, cover) }
    if (bpm > root.bpm) return { ...root, right: insert(root.right, name, bpm, id, cover) }
    return root // duplicate BPM
}

// Find a node by BPM
export function findNode(root, bpm) {
    if (root === null) return null
    if (bpm === root.bpm) return root
    if (bpm < root.bpm) return findNode(root.left, bpm)
    return findNode(root.right, bpm)
}

// Search by BPM
export function search(root, bpm, path = []) {
    if (root === null) return path
    path.push(root.id)
    if (bpm === root.bpm) return path
    if (bpm < root.bpm) return search(root.left, bpm, path)
    return search(root.right, bpm, path)
}

// In-order traversal
export function inOrder(root, result = []) {
    if (root === null) return result
    inOrder(root.left, result)
    result.push(root)
    inOrder(root.right, result)
    return result
}

// Reverse in-order traversal
export function reverseInOrder(root, result = []) {
    if (root === null) return result
    reverseInOrder(root.right, result)
    result.push(root)
    reverseInOrder(root.left, result)
    return result
}

// Post-order traversal
export function postOrder(root, result = []) {
    if (root === null) return result
    postOrder(root.left, result)
    postOrder(root.right, result)
    result.push(root)
    return result
}



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

// BST deletion
export function deleteNode(root, bpm) {
    if (root === null) return null
    if (bpm < root.bpm) return { ...root, left: deleteNode(root.left, bpm) }
    if (bpm > root.bpm) return { ...root, right: deleteNode(root.right, bpm) }
    // Found — handle the three cases
    if (!root.left) return root.right                    //  no left child
    if (!root.right) return root.left                    // no right child
    // Case 3: two children — replace with in-order successor
    let succ = root.right
    while (succ.left) succ = succ.left
    return { ...root, name: succ.name, bpm: succ.bpm, id: succ.id, cover: succ.cover, right: deleteNode(root.right, succ.bpm) }
}
