// Assigns x, y coordinates to every node for SVG rendering
export function computeLayout(root) {
    const nodes = []
    const edges = []

    function traverse(node, depth, left, right) {
        if (node === null) return

        const x = (left + right) / 2
        const y = depth * 100 + 60

        nodes.push({ ...node, x, y })

        if (node.left) {
            const childX = (left + (left + right) / 2) / 2
            const childY = (depth + 1) * 100 + 60
            edges.push({ x1: x, y1: y, x2: childX, y2: childY, id: node.left.id })
            traverse(node.left, depth + 1, left, (left + right) / 2)
        }

        if (node.right) {
            const childX = ((left + right) / 2 + right) / 2
            const childY = (depth + 1) * 100 + 60
            edges.push({ x1: x, y1: y, x2: childX, y2: childY, id: node.right.id })
            traverse(node.right, depth + 1, (left + right) / 2, right)
        }
    }

    traverse(root, 0, 0, 1600)
    return { nodes, edges }
}