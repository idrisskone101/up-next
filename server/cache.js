/**
 * Simple in-memory cache with TTL support
 * Stores entries as { value, expiry } pairs
 */
export class TTLCache {
  constructor(ttlMinutes, name = "cache") {
    this.cache = new Map();
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.name = name;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] ${this.name} HIT: "${key.substring(0, 50)}..."`);
    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries (call periodically if needed)
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
