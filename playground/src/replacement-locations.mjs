// Provenance is inherited by generated descendants. Locate each replacement at
// the first node of its resulting subtree, preserving repeated capture copies.
export function replacementLocations({ nodes, expansions = [] }) {
  const locations = new Map(), active = new Map(), stack = [];
  const histories = new Map();
  const history = id => {
    if (histories.has(id)) return histories.get(id);
    const ids = [], seen = new Set();
    while (id != null && expansions[id] && !seen.has(id)) {
      seen.add(id); ids.push(id); id = expansions[id].previous;
    }
    ids.reverse(); histories.set(ids.at(-1), ids); return ids;
  };
  nodes.forEach((node, index) => {
    while (stack.length && stack.at(-1).index !== node.parent) {
      for (const id of stack.pop().ids) {
        const count = active.get(id) - 1;
        if (count) active.set(id, count); else active.delete(id);
      }
    }
    const ids = new Set();
    if (node.origin) for (const head of [node.origin.expansion, ...(node.origin.splices ?? [])])
      for (const id of history(head)) ids.add(id);
    const starts = [...ids].filter(id => !active.has(id));
    if (starts.length) locations.set(index, starts.map(id => expansions[id]));
    for (const id of ids) active.set(id, (active.get(id) ?? 0) + 1);
    stack.push({ index, ids });
  });
  return locations;
}
