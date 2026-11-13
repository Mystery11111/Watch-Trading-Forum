async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function createCatalog(apiBase, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const ttlMs = options.ttlMs ?? 5 * 60 * 1000;
  let cached = null;
  let cachedAt = 0;
  let cachedTtl = ttlMs;
  let pending = null;

  async function load() {
    const [postsResult, threadsResult] = await Promise.allSettled([
      fetchJson(`${apiBase}/blog`, timeoutMs),
      fetchJson(`${apiBase}/threads`, timeoutMs),
    ]);

    const postsOk = postsResult.status === 'fulfilled' && Array.isArray(postsResult.value);
    const threadPayload = threadsResult.status === 'fulfilled' ? threadsResult.value : null;
    const threadsOk = Boolean(threadPayload && Array.isArray(threadPayload.threads));

    const next = {
      posts: postsOk ? postsResult.value : cached ? cached.posts : [],
      threads: threadsOk ? threadPayload.threads : cached ? cached.threads : [],
      postsOk: postsOk || Boolean(cached && cached.postsOk),
      threadsOk: threadsOk || Boolean(cached && cached.threadsOk),
    };

    cached = next;
    cachedAt = Date.now();
    cachedTtl = postsOk || threadsOk ? ttlMs : 30 * 1000;

    if (!postsOk) console.warn('[seo] Blog API unavailable; serving cached or empty posts.');
    if (!threadsOk) console.warn('[seo] Threads API unavailable; serving cached or empty threads.');
    return cached;
  }

  return {
    async getCatalog() {
      if (cached && Date.now() - cachedAt < cachedTtl) return cached;
      if (!pending) {
        pending = load().finally(() => {
          pending = null;
        });
      }
      return pending;
    },
  };
}

module.exports = { createCatalog, fetchJson };
