/**
 * Logica de crecimiento: convierte el array diario de contribuciones en
 * "parcelas" semanales con su etapa de planta.
 *
 * Reglas de crecimiento (ver tambien js/config.js -> GF.config.GROWTH):
 *   - Cada parcela representa una semana calendario (domingo a sabado, igual
 *     que el grafico de contribuciones de GitHub) para no sobrecargar el
 *     jardin con una celda por dia.
 *   - etapa = f(commits de la semana, si la semana pertenece a una racha
 *     larga de semanas consecutivas con actividad):
 *       0 SEMILLA   -> 0 commits en la semana (reposo, no vacio del todo)
 *       1 BROTE     -> 1 a 3 commits
 *       2 TALLO     -> 4 a 7 commits
 *       3 FLOR/FRUTO-> 8+ commits, O la semana esta dentro de una racha de
 *                      5+ semanas consecutivas con al menos 1 commit cada
 *                      una (la consistencia puede "florecer" una semana
 *                      floja si viene sostenida en el tiempo).
 */
window.GF = window.GF || {};

GF.garden = (function () {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function toDateUTC(dateStr) {
    // Los strings vienen como YYYY-MM-DD; forzamos UTC para evitar corrimientos
    // de huso horario al agrupar por semana.
    return new Date(dateStr + 'T00:00:00Z');
  }

  /**
   * Agrupa los dias de un anio en semanas domingo->sabado, alineadas igual
   * que el contribution graph de GitHub.
   */
  function groupIntoWeeks(days) {
    if (days.length === 0) return [];
    const weeks = [];
    let currentWeek = [];

    days.forEach((day) => {
      const dow = toDateUTC(day.date).getUTCDay(); // 0 = domingo
      if (dow === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }

  function computeStage(weekCommits, inLongStreak) {
    const G = GF.config.GROWTH;
    if (weekCommits <= 0) return 0;
    if (weekCommits >= G.BLOOM_MIN || inLongStreak) return 3;
    if (weekCommits >= G.STEM_MIN) return 2;
    return 1;
  }

  /**
   * @param {Array<{date:string, count:number}>} days - dias de UN anio, ordenados
   * @returns {Array<{startDate:Date, endDate:Date, commits:number, activeDays:number, stage:number, inLongStreak:boolean}>}
   */
  function buildPlots(days) {
    const weeks = groupIntoWeeks(days);

    const plots = weeks.map((weekDays) => {
      const commits = weekDays.reduce((sum, d) => sum + (d.count || 0), 0);
      const activeDays = weekDays.filter((d) => (d.count || 0) > 0).length;
      return {
        days: weekDays,
        startDate: toDateUTC(weekDays[0].date),
        endDate: toDateUTC(weekDays[weekDays.length - 1].date),
        commits: commits,
        activeDays: activeDays,
      };
    });

    // Detectar rachas de semanas consecutivas activas (>=1 commit) y marcar
    // como "racha larga" toda semana que pertenezca a una racha de longitud
    // >= STREAK_WEEKS_FOR_BLOOM.
    const minStreak = GF.config.GROWTH.STREAK_WEEKS_FOR_BLOOM;
    let runStart = null;
    for (let i = 0; i <= plots.length; i++) {
      const active = i < plots.length && plots[i].commits > 0;
      if (active) {
        if (runStart === null) runStart = i;
      } else if (runStart !== null) {
        const runLen = i - runStart;
        if (runLen >= minStreak) {
          for (let j = runStart; j < i; j++) plots[j].inLongStreak = true;
        }
        runStart = null;
      }
    }
    plots.forEach((p) => {
      p.inLongStreak = !!p.inLongStreak;
      p.stage = computeStage(p.commits, p.inLongStreak);
    });

    return plots;
  }

  /**
   * Hash deterministico simple (djb2) para elegir la especie de planta de un
   * usuario: mismo username -> mismo tipo de planta siempre, sin azar.
   */
  function plantTypeForUsername(username) {
    let hash = 5381;
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) + hash + username.charCodeAt(i)) >>> 0;
    }
    return hash % GF.config.PLANT_TYPE_COUNT;
  }

  /**
   * Extrae, a partir de la respuesta de la API (?y=all), la lista de anios
   * disponibles (mas reciente primero) y los dias de un anio puntual.
   */
  function extractYears(apiData) {
    return Object.keys(apiData.total || {})
      .filter((y) => y !== 'total')
      .sort((a, b) => Number(b) - Number(a));
  }

  function daysForYear(apiData, year) {
    return apiData.contributions
      .filter((d) => d.date.slice(0, 4) === String(year))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  return {
    buildPlots: buildPlots,
    plantTypeForUsername: plantTypeForUsername,
    extractYears: extractYears,
    daysForYear: daysForYear,
  };
})();
