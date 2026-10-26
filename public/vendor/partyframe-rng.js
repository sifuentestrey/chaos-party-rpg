// vendor/partyframe/packages/game-core/src/rng.ts
var Rng = class {
  constructor(seed) {
    this.state = seed >>> 0;
  }
  /** Chaos Party persistence extension: the exact PRNG state, not a new random seed. */
  snapshot() {
    return this.state;
  }
  restore(state) {
    this.state = state >>> 0;
  }
  /** Uniform float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Uniform integer in [min, max], inclusive on both ends. */
  int(min, max) {
    if (max < min) throw new RangeError(`Rng.int: max ${max} < min ${min}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Uniform float in [min, max). */
  float(min, max) {
    return min + this.next() * (max - min);
  }
  /** True with the given probability. */
  chance(probability) {
    return this.next() < probability;
  }
  /** Uniformly picks one element. Throws on an empty list rather than returning undefined. */
  pick(items) {
    if (items.length === 0) throw new RangeError("Rng.pick: empty list");
    return items[this.int(0, items.length - 1)];
  }
  /** Returns a shuffled copy, leaving the input untouched (Fisher-Yates). */
  shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
};
function randomSeed() {
  return Math.random() * 4294967295 >>> 0;
}
export {
  Rng,
  randomSeed
};
