// Research model, NOT Tower replacement syntax or a production expander.
// Contract: immutable first-order trees, child-first expansion, one rule per
// constructor, and a fixed rule snapshot during each expansion. New identities,
// binding/hygiene, source locations and allocation failure are not observables.
export const node = (tag, ...children) => Object.freeze({ tag, children: Object.freeze(children) });
export const hole = index => Object.freeze({ hole: index });
const isHole = value => Object.hasOwn(value, 'hole');

export class Rules {
  #rules = new Map();
  #epoch = 0;
  set(tag, arity, body) {
    this.#rules = new Map(this.#rules).set(tag, Object.freeze({ arity, body }));
    ++this.#epoch;
    return this;
  }
  snapshot() { return { rules: this.#rules, epoch: this.#epoch }; }
}

function instantiate(template, captures, stats) {
  if (isHole(template)) return captures[template.hole];
  ++stats.allocations;
  return node(template.tag, ...template.children.map(child => instantiate(child, captures, stats)));
}

// Conservative certificate: every capture appears exactly once; all reachable
// rules are structural templates; the constructor dependency graph is acyclic.
// These restrictions are sufficient here, not necessary in general.
function certify(tag, rules, path, done, budget) {
  if (--budget.left < 0) throw new Error('specialization budget');
  if (path.has(tag)) throw new Error('recursive dependency');
  if (done.has(tag)) return;
  const rule = rules.get(tag);
  if (!rule) { done.add(tag); return; }
  if (typeof rule.body === 'function') throw new Error('dynamic handler');
  const uses = Array(rule.arity).fill(0);
  const next = new Set(path).add(tag);
  function check(template) {
    if (--budget.left < 0) throw new Error('specialization budget');
    if (isHole(template)) {
      if (!Number.isInteger(template.hole) || template.hole < 0 || template.hole >= uses.length)
        throw new Error('invalid capture');
      ++uses[template.hole];
    } else {
      const childRule = rules.get(template.tag);
      if (childRule && childRule.arity !== template.children.length) throw new Error('arity');
      template.children.forEach(check);
      certify(template.tag, rules, next, done, budget);
    }
  }
  check(rule.body);
  if (uses.some(count => count !== 1)) throw new Error('nonlinear or erased capture');
  done.add(tag);
}

function specialize(snapshot, tag, maxWork) {
  const budget = { left: maxWork };
  const tick = () => { if (--budget.left < 0) throw new Error('specialization budget'); };
  try {
    certify(tag, snapshot.rules, new Set(), new Set(), budget);
    const trace = [tag];
    function substitute(template, captures) {
      tick();
      return isHole(template) ? captures[template.hole]
        : node(template.tag, ...template.children.map(child => substitute(child, captures)));
    }
    function normalize(template) {
      tick();
      if (isHole(template)) return template; // Already-normalized, opaque syntax.
      const children = template.children.map(normalize);
      const rule = snapshot.rules.get(template.tag);
      if (!rule) return node(template.tag, ...children);
      trace.push(template.tag);
      return normalize(substitute(rule.body, children));
    }
    const recipe = normalize(snapshot.rules.get(tag).body);
    return Object.freeze({ epoch: snapshot.epoch, recipe, trace: Object.freeze(trace) });
  } catch (error) {
    return Object.freeze({ epoch: snapshot.epoch, refusal: error.message });
  }
}

export class Expander {
  constructor(registry, maxSpecializationWork = 100_000) {
    this.registry = registry;
    this.maxSpecializationWork = maxSpecializationWork;
    this.plans = new Map();
  }
  plan(tag, snapshot = this.registry.snapshot()) {
    let plan = this.plans.get(tag);
    if (!plan || plan.epoch !== snapshot.epoch) {
      plan = specialize(snapshot, tag, this.maxSpecializationWork);
      this.plans.set(tag, plan);
    }
    return plan;
  }
  run(input, { optimized = true, fuel = 10_000 } = {}) {
    const snapshot = this.registry.snapshot();
    const stats = { allocations: 0, dispatches: 0, planUses: 0, logicalSteps: 0 };
    const traceChunks = [], effects = [], normal = new WeakSet();
    const context = { effects };
    function mark(tree) {
      if (normal.has(tree)) return;
      normal.add(tree);
      tree.children.forEach(mark);
    }
    const visit = tree => {
      if (normal.has(tree)) return tree;
      const children = tree.children.map(visit);
      const rule = snapshot.rules.get(tree.tag);
      if (!rule) {
        const changed = children.some((child, i) => child !== tree.children[i]);
        if (changed) ++stats.allocations;
        const result = changed ? node(tree.tag, ...children) : tree;
        normal.add(result);
        return result;
      }
      if (children.length !== rule.arity) throw new Error('arity');
      const plan = optimized ? this.plan(tree.tag, snapshot) : null;
      // Fall back before crossing the logical limit, preserving the exact
      // reference failure prefix. A compressed trace is expanded only on demand.
      if (plan && !plan.refusal && stats.logicalSteps + plan.trace.length <= fuel) {
        ++stats.planUses;
        stats.logicalSteps += plan.trace.length;
        traceChunks.push(plan.trace);
        const result = instantiate(plan.recipe, children, stats);
        mark(result);
        return result;
      }
      if (stats.logicalSteps >= fuel) throw new Error('rewrite budget exhausted');
      ++stats.logicalSteps;
      ++stats.dispatches;
      traceChunks.push([tree.tag]);
      return visit(typeof rule.body === 'function'
        ? rule.body(children, context) : instantiate(rule.body, children, stats));
    };
    let result, error;
    try { result = visit(input); } catch (caught) { error = caught.message; }
    return { result, error, stats, effects, traceChunks,
      trace: () => traceChunks.flat() };
  }
}
