// Each node in the BST
export function createNode(name, bpm) {
    return {
        name,
        bpm,
        left: null,
        right: null,
        id: Date.now() + Math.random(), // unique id for React rendering
    }
}

// Insert a new song into the BST
export function insert(root, name, bpm) {
    if (root === null) return createNode(name, bpm)
    if (bpm < root.bpm) {
        root.left = insert(root.left, name, bpm)
    } else if (bpm > root.bpm) {
        root.right = insert(root.right, name, bpm)
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

// In-order traversal — returns nodes sorted by BPM
export function inOrder(root, result = []) {
    if (root === null) return result
    inOrder(root.left, result)
    result.push(root)
    inOrder(root.right, result)
    return result
}