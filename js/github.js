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
      throw new Error('Nombre de usuario invalido. Usa solo letras, numeros y guiones.');
    }

    const cached = readCache(username);
    if (cached) return cached;

    const url = GF.config.API_BASE + encodeURIComponent(username) + '?y=all';

    let response;
    try {
      response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
    } catch (err) {
      throw new Error('No se pudo conectar con la fuente de datos. Revisa tu conexion.');
    }

    if (response.status === 404) {
      throw new Error('No se encontro el usuario "' + username + '" en GitHub.');
    }
    if (response.status === 429) {
      throw new Error('Demasiadas consultas por ahora. Probá de nuevo en un ratito.');
    }
    if (!response.ok) {
      throw new Error('La fuente de datos respondio con un error (' + response.status + ').');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.contributions)) {
      throw new Error('La respuesta de la fuente de datos no tiene el formato esperado.');
    }

    writeCache(username, data);
    return data;
  }

  return {
    isValidUsername: isValidUsername,
    fetchContributions: fetchContributions,
  };
})();
