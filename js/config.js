/**
 * Configuracion global de Git Flowers.
 * Namespace unico `GF` para no ensuciar el scope global del navegador.
 */
window.GF = window.GF || {};

GF.config = {
  // API de terceros mantenida (grubersjoe/github-contributions-api) que expone
  // el contribution graph publico de GitHub como JSON, con CORS habilitado y
  // sin necesidad de autenticacion ni tokens en el cliente.
  // Se eligio en vez del endpoint interno github.com/users/{user}/contributions
  // (que devuelve un SVG) porque ese endpoint no envia cabeceras CORS y no
  // puede leerse desde JS corriendo en otro origen (GitHub Pages).
  API_BASE: 'https://github-contributions-api.jogruber.de/v4/',

  // Cuanto tiempo se reusa una respuesta guardada en localStorage antes de
  // volver a pedirla. La propia API cachea 1h; nosotros usamos menos tiempo
  // para no servir datos demasiado viejos, pero seguimos sin pegarle en cada
  // visita/recarga.
  CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutos

  CACHE_PREFIX: 'gf_cache_v1_',

  // Usernames validos de GitHub: alfanumerico y guiones, sin guion al
  // principio/final, sin guiones consecutivos, maximo 39 caracteres.
  USERNAME_REGEX: /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/,

  // --- Layout del jardin ---
  GRID_COLS: 13, // columnas fijas -> con ~52 semanas quedan ~4 filas parejas
  TILE_W: 44,
  TILE_H: 56,
  TILE_PAD: 4,

  // --- Umbrales de crecimiento ---
  // Se documentan tambien en garden.js junto a la funcion que los aplica.
  // Cada "parcela" del jardin representa UNA semana (7 dias) del calendario
  // de contribuciones, para que el jardin no quede sobrecargado de celdas.
  //
  // Etapa 0 SEMILLA  : 0 commits en la semana -> tierra en reposo (no vacia)
  // Etapa 1 BROTE    : 1-3 commits en la semana
  // Etapa 2 TALLO    : 4-7 commits en la semana
  // Etapa 3 FLOR/FRUTO: 8+ commits en la semana
  //                     O la semana forma parte de una racha de 5 o mas
  //                     semanas consecutivas con actividad (consistencia
  //                     premiada por encima del volumen bruto de commits).
  GROWTH: {
    SPROUT_MIN: 1,
    STEM_MIN: 4,
    BLOOM_MIN: 8,
    STREAK_WEEKS_FOR_BLOOM: 5,
  },

  STAGE_NAMES: ['Seed', 'Sprout', 'Stem', 'Flower/Fruit'],

  // Cantidad de "especies" de planta disponibles. La especie de cada jardin
  // se elige de forma deterministica a partir de un hash del username, para
  // que el mismo usuario vea siempre el mismo tipo de planta.
  PLANT_TYPE_COUNT: 4,

  ANIMATION_STEP_MS: 90, // tiempo entre cada etapa al animar el crecimiento inicial
};
