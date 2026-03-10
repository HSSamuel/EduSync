function createChatRateLimiter({ windowMs = 10_000, maxEvents = 8 } = {}) {
  const store = new Map();

  function consume(key) {
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxEvents - 1, retryAfterMs: 0 };
    }

    if (current.count >= maxEvents) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(current.resetAt - now, 0),
      };
    }

    current.count += 1;
    store.set(key, current);

    return {
      allowed: true,
      remaining: Math.max(maxEvents - current.count, 0),
      retryAfterMs: 0,
    };
  }

  return { consume };
}

module.exports = { createChatRateLimiter };
