/**
 * Obtiene y cachea el contribution graph publico de un usuario de GitHub.
 */
window.GF = window.GF || {};

GF.github = (function () {
  function isValidUsername(username) {
    return typeof username === 'string' && GF.config.USERNAME_REGEX.test(username);
  }

  function cacheKey(username) {
    return GF.config.CACHE_PREFIX + username.toLowerCase();
  }

  function readCache(username) {
    try {
      const raw = window.localStorage.getItem(cacheKey(username));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.fetchedAt !== 'number' || !parsed.data) return null;
      if (Date.now() - parsed.fetchedAt > GF.config.CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (err) {
      // localStorage puede fallar (modo privado, cuota, etc). Degradamos
      // sin cachear en vez de romper la app.
      return null;
    }
  }

  function writeCache(username, data) {
    try {
      window.localStorage.setItem(
        cacheKey(username),
        JSON.stringify({ fetchedAt: Date.now(), data: data })
      );
    } catch (err) {
      // Silenciosamente ignorado: la app funciona igual sin cache.
    }
  }

  /**
   * @param {string} username
   * @returns {Promise<{years: string[], total: Object, contributions: Array}>}
   */
  async function fetchContributions(username) {
    if (!isValidUsername(username)) {
      throw new Error('Invalid username. Use only letters, numbers, and hyphens.');
    }

    const cached = readCache(username);
    if (cached) return cached;

    const url = GF.config.API_BASE + encodeURIComponent(username) + '?y=all';

    let response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('The data source took too long to respond. Please try again.');
      }
      throw new Error('Could not connect to the data source. Check your connection.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 404) {
      throw new Error('User "' + username + '" was not found on GitHub.');
    }
    if (response.status === 429) {
      throw new Error('Too many requests right now. Please try again in a bit.');
    }
    if (!response.ok) {
      throw new Error('The data source responded with an error (' + response.status + ').');
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error('The data source response is not valid JSON.');
    }
    if (!data || !Array.isArray(data.contributions)) {
      throw new Error('The data source response is not in the expected format.');
    }

    writeCache(username, data);
    return data;
  }

  return {
    isValidUsername: isValidUsername,
    fetchContributions: fetchContributions,
  };
})();
