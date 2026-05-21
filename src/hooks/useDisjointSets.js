export function createDS() {
    return { parent: {}, rank: {} }
}

export function makeSet(ds, name) {
    if (ds.parent[name] !== undefined) return ds
    return {
        parent: { ...ds.parent, [name]: name },
        rank: { ...ds.rank, [name]: 0 }
    }
}

export function findSet(ds, name) {
    if (ds.parent[name] === name) return name
    return findSet(ds, ds.parent[name])
}

export function union(ds, name1, name2) {
    const root1 = findSet(ds, name1)
    const root2 = findSet(ds, name2)
    if (root1 === root2) return ds

    let newParent = { ...ds.parent }
    let newRank = { ...ds.rank }

    if (newRank[root1] > newRank[root2]) {
        newParent[root2] = root1
    } else if (newRank[root1] < newRank[root2]) {
        newParent[root1] = root2
    } else {
        newParent[root2] = root1
        newRank[root1] = newRank[root1] + 1
    }

    return { parent: newParent, rank: newRank }
}

export function getComponents(ds) {
    const components = {}
    for (const name of Object.keys(ds.parent)) {
        const root = findSet(ds, name)
        if (!components[root]) components[root] = []
        components[root].push(name)
    }
    return components
}