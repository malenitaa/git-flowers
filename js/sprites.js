/**
 * Pixel art de las plantas del jardin.
 *
 * Cada sprite es una grilla de 9x12 caracteres (fila por fila, de arriba
 * hacia abajo). '.' significa pixel transparente; cualquier otro caracter
 * se busca en la paleta (GROUND_PALETTE o la paleta propia del tipo de
 * planta) para obtener su color.
 *
 * Las etapas 0 (semilla) a 2 (tallo) comparten silueta entre especies -
 * la diferencia visible fuerte llega en la etapa 3 (flor/fruto), que es
 * distinta para cada una de las 4 especies. Asi cada jardin se siente
 * propio sin tener que dibujar 16 plantas totalmente distintas a mano.
 */
window.GF = window.GF || {};

GF.sprites = (function () {
  const GROUND_PALETTE = {
    s: '#c8a06a', // tierra
    S: '#dab989', // tierra clara (textura)
  };

  const GROUND_ROWS = [
    's','s','s','s','s','s','s','s','s',
  ];

  // Filas de tierra (ultimas 3 filas de toda parcela, sin importar la etapa).
  const SOIL = [
    'sssssssss',
    'sSSsSSsSs',
    'sssssssss',
  ];

  const BLANK3 = ['.........', '.........', '.........'];

  const STAGE0 = [ // SEMILLA: tierra en reposo con apenas una puntita verde
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '....v....',
  ].concat(SOIL);

  const STAGE1 = [ // BROTE: dos hojitas chicas
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '..l...l..',
    '...ttt...',
  ].concat(SOIL);

  const STAGE2 = [ // TALLO: tallo mas alto con dos pares de hojas
    '.........',
    '.........',
    '.........',
    '....t....',
    '...ttt...',
    '..l.t.l..',
    '...ttt...',
    '..lttl...',
    '...ttt...',
  ].concat(SOIL);

  // Base del tallo compartida por la etapa 3 de todas las especies.
  const STEM_BASE = [
    '...ttt...',
    '..l.t.l..',
    '...ttt...',
    '..lttl...',
    '...ttt...',
  ];

  function stage3(bloomRows) {
    return bloomRows.concat(STEM_BASE, SOIL);
  }

  const PLANT_TYPES = [
    {
      id: 0,
      name: 'Tulip',
      palette: Object.assign({}, GROUND_PALETTE, {
        t: '#4a8f4a', l: '#5fa85f', v: '#5fa85f',
        p: '#e8799a', P: '#f5a3bd',
      }),
      stages: [
        STAGE0, STAGE1, STAGE2,
        stage3([
          '...ppp...',
          '..pPPPp..',
          '..pPPPp..',
          '...ppp...',
        ]),
      ],
    },
    {
      id: 1,
      name: 'Blackberry Bush',
      palette: Object.assign({}, GROUND_PALETTE, {
        t: '#3f7d3f', l: '#4f9a4f', v: '#4f9a4f',
        b: '#5b4b8a', B: '#8672c2',
      }),
      stages: [
        STAGE0, STAGE1, STAGE2,
        stage3([
          '.ll.t.ll.',
          'lllbbblll',
          '.llbBbll.',
          '..lllll..',
        ]),
      ],
    },
    {
      id: 2,
      name: 'Tomato Plant',
      palette: Object.assign({}, GROUND_PALETTE, {
        t: '#4a8f4a', l: '#5fa85f', v: '#5fa85f',
        r: '#c94a3a', R: '#e6705c',
      }),
      stages: [
        STAGE0, STAGE1, STAGE2,
        stage3([
          '.........',
          '..l...l..',
          '.rR...rR.',
          '..r...r..',
        ]),
      ],
    },
    {
      id: 3,
      name: 'Sunflower',
      palette: Object.assign({}, GROUND_PALETTE, {
        t: '#4a8f4a', l: '#5fa85f', v: '#5fa85f',
        y: '#e8c547', Y: '#f7de7a', c: '#8a5a2b',
      }),
      stages: [
        STAGE0, STAGE1, STAGE2,
        stage3([
          '..yyyyy..',
          '.yyYcYyy.',
          '..yyyyy..',
          '....y....',
        ]),
      ],
    },
  ];

  /**
   * Dibuja un sprite en la posicion (x,y) del canvas, escalado por pixelSize.
   */
  function drawSprite(ctx, rows, palette, x, y, pixelSize) {
    for (let row = 0; row < rows.length; row++) {
      const line = rows[row];
      for (let col = 0; col < line.length; col++) {
        const ch = line[col];
        if (ch === '.') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x + col * pixelSize),
          Math.round(y + row * pixelSize),
          pixelSize + 0.5,
          pixelSize + 0.5
        );
      }
    }
  }

  function getPlantType(index) {
    return PLANT_TYPES[index % PLANT_TYPES.length];
  }

  return {
    PLANT_TYPES: PLANT_TYPES,
    GROUND_PALETTE: GROUND_PALETTE,
    getPlantType: getPlantType,
    drawSprite: drawSprite,
  };
})();
