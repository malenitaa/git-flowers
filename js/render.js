/**
 * Renderizado en canvas del jardin: fondo diurno, parcelas semanales con sus
 * plantas, animacion de crecimiento en pasos discretos, viento suave y
 * abejas/mariposas ambientales, y tooltip al pasar el mouse.
 *
 * Decision de paleta: se eligio una estetica DIURNA pastel (cielo celeste,
 * verdes suaves, tierra calida) en vez de la paleta nocturna violeta de
 * otros proyectos hermanos, porque un jardin de plantas se lee mejor con
 * luz de dia: las flores y frutos necesitan contraste de color contra un
 * fondo claro para distinguirse, y de noche esos mismos tonos se apagan o
 * exigen agregar fuentes de luz artificial que compiten visualmente con las
 * plantas en vez de resaltarlas.
 */
window.GF = window.GF || {};

GF.render = (function () {
  const PIXEL_SIZE = 4;
  const SPRITE_W = 9 * PIXEL_SIZE; // 36
  const SPRITE_H = 12 * PIXEL_SIZE; // 48
  const SKY_H = 46;
  const MARGIN = 16;

  const PALETTE = {
    skyTop: '#bfe3f7',
    skyBottom: '#eaf7e8',
    sun: '#ffe08a',
    sunGlow: 'rgba(255, 224, 138, 0.35)',
    cloud: 'rgba(255,255,255,0.8)',
    grassBorder: '#8fbf6b',
    plotBg: 'rgba(255,255,255,0.35)',
    plotBgHover: 'rgba(255,255,255,0.65)',
    plotBorder: 'rgba(90, 70, 40, 0.15)',
  };

  let canvas, ctx, dpr;
  let state = null; // {plots, cols, rows, plantType, loadStartTime, bugs}

  function setup(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
  }

  function layoutFor(plotCount) {
    const cols = GF.config.GRID_COLS;
    const rows = Math.ceil(plotCount / cols);
    const width = MARGIN * 2 + cols * GF.config.TILE_W;
    const height = MARGIN * 2 + SKY_H + rows * GF.config.TILE_H;
    return { cols, rows, width, height };
  }

  function sizeCanvas(width, height) {
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function makeBugs(count, width, height) {
    const bugs = [];
    for (let i = 0; i < count; i++) {
      bugs.push({
        baseX: MARGIN + Math.random() * (width - MARGIN * 2),
        baseY: SKY_H * 0.4 + Math.random() * (height - SKY_H - MARGIN),
        radius: 12 + Math.random() * 18,
        speed: 0.4 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        isButterfly: i % 2 === 0,
      });
    }
    return bugs;
  }

  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {Array} plots - salida de GF.garden.buildPlots
   * @param {Object} plantType - salida de GF.sprites.getPlantType
   */
  function render(canvasEl, plots, plantType) {
    setup(canvasEl);
    const layout = layoutFor(plots.length);
    sizeCanvas(layout.width, layout.height);

    state = {
      plots: plots.map((p) => Object.assign({ displayStage: 0 }, p)),
      cols: layout.cols,
      rows: layout.rows,
      width: layout.width,
      height: layout.height,
      plantType: plantType,
      loadStartTime: performance.now(),
      bugs: makeBugs(3, layout.width, layout.height),
      hoverIndex: -1,
    };

    cancelAnimationFrame(state._raf);
    tick();
    return state;
  }

  function drawBackground() {
    const w = state.width, h = state.height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Sol pixelado arriba a la derecha
    const sunX = w - 42, sunY = 30;
    ctx.fillStyle = PALETTE.sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Un par de nubes pixeladas simples
    drawCloud(60, 22);
    drawCloud(150, 34);
  }

  function drawCloud(x, y) {
    ctx.fillStyle = PALETTE.cloud;
    [[0, 0, 18, 8], [6, -5, 14, 8], [16, -2, 12, 7]].forEach((r) => {
      ctx.fillRect(x + r[0], y + r[1], r[2], r[3]);
    });
  }

  function plotOrigin(index) {
    const col = index % state.cols;
    const row = Math.floor(index / state.cols);
    return {
      x: MARGIN + col * GF.config.TILE_W,
      y: MARGIN + SKY_H + row * GF.config.TILE_H,
    };
  }

  function drawPlots(now) {
    const elapsedSinceLoad = now - state.loadStartTime;
    state.plots.forEach((plot, i) => {
      const origin = plotOrigin(i);

      // Animacion de crecimiento en pasos discretos (no continua): cada
      // parcela empieza a crecer con un pequenio retraso escalonado segun su
      // posicion, y avanza una etapa por vez hasta llegar a su etapa final.
      const growDelay = i * 14;
      const stepsElapsed = Math.floor(
        Math.max(0, elapsedSinceLoad - growDelay) / GF.config.ANIMATION_STEP_MS
      );
      plot.displayStage = Math.min(plot.stage, stepsElapsed);

      const isHover = state.hoverIndex === i;
      ctx.fillStyle = isHover ? PALETTE.plotBgHover : PALETTE.plotBg;
      ctx.fillRect(origin.x + 1, origin.y + 1, GF.config.TILE_W - 2, GF.config.TILE_H - 2);
      ctx.strokeStyle = PALETTE.plotBorder;
      ctx.strokeRect(origin.x + 0.5, origin.y + 0.5, GF.config.TILE_W - 1, GF.config.TILE_H - 1);

      const rows = state.plantType.stages[plot.displayStage];
      const spriteX = origin.x + (GF.config.TILE_W - SPRITE_W) / 2;
      let spriteY = origin.y + (GF.config.TILE_H - SPRITE_H) / 2;

      // Viento suave: solo las plantas con follaje (etapa >= 1) se balancean.
      if (plot.displayStage >= 1) {
        const sway = Math.sin(now / 900 + i * 0.6) * 1.2;
        ctx.save();
        ctx.translate(spriteX + SPRITE_W / 2 + sway, 0);
        GF.sprites.drawSprite(
          ctx, rows, state.plantType.palette, -SPRITE_W / 2, spriteY, PIXEL_SIZE
        );
        ctx.restore();
      } else {
        GF.sprites.drawSprite(ctx, rows, state.plantType.palette, spriteX, spriteY, PIXEL_SIZE);
      }
    });
  }

  function drawBugs(now) {
    state.bugs.forEach((bug) => {
      const t = now / 1000 * bug.speed + bug.phase;
      const x = bug.baseX + Math.cos(t) * bug.radius;
      const y = bug.baseY + Math.sin(t * 1.7) * (bug.radius * 0.5);
      ctx.save();
      ctx.globalAlpha = 0.85;
      if (bug.isButterfly) {
        const wing = Math.abs(Math.sin(t * 8)) * 3 + 1;
        ctx.fillStyle = '#f2a5c0';
        ctx.fillRect(x - wing, y - 2, wing, 3);
        ctx.fillRect(x + 1, y - 2, wing, 3);
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x, y - 2, 1, 3);
      } else {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x, y, 3, 2);
        ctx.fillStyle = '#e8c547';
        ctx.fillRect(x, y, 1, 2);
      }
      ctx.restore();
    });
  }

  function tick() {
    const now = performance.now();
    drawBackground();
    drawPlots(now);
    drawBugs(now);
    state._raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (state) cancelAnimationFrame(state._raf);
  }

  /**
   * Traduce coordenadas de mouse (relativas al canvas, en CSS px) al indice
   * de parcela bajo el cursor, o -1 si no hay ninguna.
   */
  function plotIndexAt(cssX, cssY) {
    if (!state) return -1;
    const col = Math.floor((cssX - MARGIN) / GF.config.TILE_W);
    const row = Math.floor((cssY - MARGIN - SKY_H) / GF.config.TILE_H);
    if (col < 0 || row < 0 || col >= state.cols) return -1;
    const index = row * state.cols + col;
    if (index < 0 || index >= state.plots.length) return -1;
    return index;
  }

  function setHover(index) {
    if (state) state.hoverIndex = index;
  }

  function getPlot(index) {
    return state && state.plots[index];
  }

  return {
    render: render,
    stop: stop,
    plotIndexAt: plotIndexAt,
    setHover: setHover,
    getPlot: getPlot,
  };
})();
