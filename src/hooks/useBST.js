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

// In-order traversal — left → root → right (sorted by BPM)
export function inOrder(root, result = []) {
    if (root === null) return result
    inOrder(root.left, result)
    result.push(root)
    inOrder(root.right, result)
    return result
}

// Pre-order traversal — root → left → right
export function preOrder(root, result = []) {
    if (root === null) return result
    result.push(root)
    preOrder(root.left, result)
    preOrder(root.right, result)
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