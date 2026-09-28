/**
 * In-memory key-value store that replaces Redis.
 * Eliminates the Docker/Redis dependency entirely.
 * Supports TTL (time-to-live) for temporary data like OTP pending registrations.
 */

interface StoreEntry {
  value: string;
  expiresAt: number | null; // timestamp in ms, null = no expiry
}

const store = new Map<string, StoreEntry>();

// Cleanup expired keys every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt && entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

const memoryStore = {
  /**
   * Set a key with a TTL (in seconds)
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Get a key's value (returns null if expired or not found)
   */
  async get(key: string): Promise<string | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    store.delete(key);
  },
};

console.log('🟢 In-memory store initialized (no Redis needed)');

export default memoryStore;
