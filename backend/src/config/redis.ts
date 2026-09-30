import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;
if (redisUrl) {
  redisClient = new Redis(redisUrl);
  console.log('🟢 Connected to Redis cache');
}

// Fallback in-memory store
interface StoreEntry {
  value: string;
  expiresAt: number | null;
}
const store = new Map<string, StoreEntry>();

if (!redisClient) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);
  console.log('🟢 In-memory store initialized (no Redis URL provided)');
}

const memoryStore = {
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (redisClient) {
      await redisClient.setex(key, ttlSeconds, value);
    } else {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  },

  async get(key: string): Promise<string | null> {
    if (redisClient) {
      return await redisClient.get(key);
    } else {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }
  },

  async del(key: string): Promise<void> {
    if (redisClient) {
      await redisClient.del(key);
    } else {
      store.delete(key);
    }
  },
};

export default memoryStore;
