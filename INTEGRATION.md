# Plan de integración: `git-flowers` ← `test` + `librer-a-`

Este documento es el plan de trabajo para que **git-flowers** deje de tener su
fetch y su renderer propios y pase a apoyarse en dos repos hermanos:

- **[`test`](https://github.com/malenitaa/test)** (dev-activity-api): reemplaza
  el fetch actual a `github-contributions-api.jogruber.de` por un backend
  propio que combina GitHub + GitLab + npm.
- **[`librer-a-`](https://github.com/malenitaa/librer-a-)** (pixel-activity-scene):
  reemplaza el renderer de jardín hecho a mano (`js/garden.js`, `js/render.js`,
  `js/sprites.js`) por la librería genérica de escenas pixel.

No es un simple `import` porque `git-flowers` tiene lógica propia que la
librería no cubre todavía "de fábrica": agrupación **semanal** (no diaria) y
un bonus de floración por **racha de 5+ semanas** (`js/garden.js:51-97`), más
4 especies de planta (`js/sprites.js`). Ese comportamiento hay que
preservarlo, no perderlo.

Cada fase está separada en pasos **de tu lado** (cuentas, credenciales,
decisiones de producto, revisión visual) y **de mi lado** (código). Nada de
esto se ejecuta todavía — es la hoja de ruta para acordar el orden antes de
tocar código de verdad.

## Arquitectura resultante

```
                     ┌─────────────┐
                     │   test      │  GET /v1/activity?github=...
                     │ (Cloudflare │  (reemplaza jogruber.de)
                     │  Worker)    │
                     └──────┬──────┘
                             │ { days: [{date, count, sources}] }
                             ▼
┌──────────────────────────────────────────────────┐
│  git-flowers                                       │
│  js/github.js  → fetch a test en vez de jogruber.de │
│  js/garden.js  → agrupa semanas + rachas (igual que  │
│                  hoy), pero entrega niveles ya listos │
│                  para la librería                     │
│                             │                          │
│                             ▼                          │
│              pixel-activity-scene (vendorizada)         │
│              modo custom "garden-streak" (extiende       │
│              el modo `garden` de librer-a-)                │
└──────────────────────────────────────────────────┘
```

`test` y `librer-a-` no se tocan para esto — son consumidos tal cual (con una
extensión vía plugin en el caso de la librería, no un fork).

---

## Fase 0 — Prerrequisitos compartidos con `git`

Estos dos pasos son comunes a la migración de `git` y de `git-flowers`; si ya
los hiciste para uno, no hace falta repetirlos.

**De tu lado:**
1. Cuenta gratuita de Cloudflare (si no tenés una).
2. En el repo `test`: `cd workers && npm install && npx wrangler login && npm run deploy`.
   Guardá la URL `*.workers.dev` que te devuelve — la vamos a necesitar en la
   Fase 2. (El código ya está listo para esto, según el README de `test`; no
   requiere cambios previos.)
3. Decidir si querés dominio propio para esa Worker (opcional, no bloqueante).

**De mi lado:** nada en esta fase — no tengo credenciales tuyas de Cloudflare,
así que el deploy es 100% manual de tu parte. Si el deploy falla puedo ayudar
a diagnosticar el error de `wrangler`.

---

## Fase 1 — Vendorizar `pixel-activity-scene` en este repo

`git-flowers` es un sitio estático sin bundler y con una CSP estricta
(`script-src 'self'`, sin `unsafe-inline`, ver `index.html:19-24`). Cargar la
librería desde un CDN (unpkg, jsDelivr) rompería esa política y el principio
de "cero dependencias de terceros en runtime" que el propio README declara.
Por eso la resolvemos **vendorizando** el build, no con un `<script src="https://...">`.

**De mi lado:**
1. En `librer-a-`: `npm install && npm run build` → genera
   `dist/pixel-activity-scene.umd.cjs`.
2. Copiar ese archivo a `git-flowers/vendor/pixel-activity-scene.umd.js`
   (nuevo directorio `vendor/` en este repo, mismo origen → no viola CSP).
3. Agregar `<script src="vendor/pixel-activity-scene.umd.js"></script>` en
   `index.html`, antes de `js/app.js`.
4. Documentar en este mismo repo cómo actualizar el vendor cuando
   `librer-a-` publique cambios (script corto o instrucción manual — a
   definir, no bloqueante).

**De tu lado:** ninguno estrictamente necesario; opcionalmente revisar que
estés de acuerdo con vendorizar en vez de publicar `pixel-activity-scene` a
npm y usar CDN (esa sería la alternativa si en algún momento querés que la
CSP sea menos estricta).

---

## Fase 2 — Migrar el fetch: `js/github.js` → `test`

**De tu lado:**
- Confirmar la URL de la Worker desplegada en la Fase 0.
- Decidir: ¿mantenemos fallback a `jogruber.de` si `test` no responde (ya
  que es un free tier sin SLA), o cortamos limpio? Recomendación: sí,
  mantener fallback — es barato de implementar y `test` es nuevo/sin
  historial de uptime todavía.

**De mi lado:**
1. En `js/config.js`: reemplazar `API_BASE` por la URL de `test` + agregar
   `API_BASE_FALLBACK` apuntando a la API actual de jogruber.de (si se
   aprueba el fallback).
2. En `js/github.js` (`fetchContributions`, líneas 45-79): adaptar el parseo
   de respuesta — `test` devuelve `{ days: [{date, count, sources}], meta }`,
   no `{ contributions: [...], total: {...} }` como jogruber.de. Hay que:
   - Ajustar `js/garden.js` (`extractYears`, `daysForYear`, líneas 119-129)
     a la nueva forma, o normalizar la respuesta de `test` al shape actual
     dentro de `github.js` para no tocar `garden.js` — a decidir cuál ensucia
     menos código (probablemente lo segundo, para minimizar el diff).
   - `test` no expone `?y=all` (todos los años en una sola llamada); su
     parámetro `year` es obligatorio por request. Hay que decidir: pedir
     el año actual solamente al cargar, y refetch al cambiar de año en el
     selector (cambia el comportamiento actual de "una sola petición por
     usuario" documentado en el README) — esto es una desviación real de
     comportamiento a validar con vos antes de implementarla.
3. Actualizar `index.html`, CSP `connect-src` (línea ~19-24) para incluir el
   host de la Worker de `test` en vez de (o además de, si hay fallback)
   `github-contributions-api.jogruber.de`.
4. Actualizar `README.md` (sección "Fuente de datos") y `INSTALL.md` para
   reflejar el nuevo origen de datos.

**De tu lado (cierre de fase):** revisar visualmente con 2-3 usuarios reales
(uno con mucha actividad, uno con poca, uno inexistente) que el jardín siga
mostrando lo mismo que hoy con la API vieja, antes de pasar a la Fase 3.

> Nota sobre GitLab/npm: `test` permite combinar `github` + `gitlab` + `npm`
> en un solo request. Si más adelante querés que `git-flowers` acepte
> también usuario de GitLab, es un cambio de UI (un input más) apoyado en
> esta misma migración — lo dejo anotado pero no es parte de este plan.

---

## Fase 3 — Migrar el render: modo custom `garden-streak`

Este es el paso que requiere más cuidado, porque el modo `garden` que trae
`librer-a-` (`src/modes/garden.js`) solo mira el **nivel de una celda**, sin
noción de semana ni de racha. Si lo usáramos tal cual, `git-flowers`
perdería:

- La agrupación semanal (una parcela = 7 días, no 1).
- El bonus de floración por racha de 5+ semanas consecutivas
  (`inLongStreak`, `js/garden.js:78-94`).
- Las 4 especies de planta con hash determinístico por username
  (`plantTypeForUsername`, `js/garden.js:107-113`).

La librería está pensada justo para este caso — soporta modos custom vía
`PixelActivityScene.registerMode(id, mode)` (ver `docs/CUSTOM_MODES.md` en
`librer-a-`).

**De mi lado:**
1. Pre-agregar los datos **antes** de pasarlos a la escena: transformar los
   `days` diarios en un array `{date, count}` de **una entrada por semana**
   (usando `groupIntoWeeks` ya existente en `js/garden.js`, con `date` =
   primer día de la semana y `count` = suma semanal) — así `librer-a-` dibuja
   una celda por semana sin cambios en su core.
2. Escribir un modo custom `garden-streak` en un nuevo archivo
   `js/gardenStreakMode.js`, que:
   - Reutilice `groupIntoWeeks` / detección de racha de `js/garden.js` tal
     cual están (no reinventar esa lógica).
   - Copie la estructura del modo `garden` de la librería
     (`src/modes/garden.js`) para el ciclo de vida (`setup`, `update`,
     `render`, animación de crecimiento por etapas) pero calculando el
     `stage` con `computeStage(weekCommits, inLongStreak)` en vez del
     `cell.level` genérico.
   - Registre las 4 especies de `js/sprites.js` como overrides de sprites
     (opción `sprites` del constructor, ver README de `librer-a-`, o el hook
     de sprites del modo custom) en vez de la única especie que trae
     `garden` por defecto — eligiendo la especie con
     `plantTypeForUsername` como ya se hace hoy.
3. Reemplazar en `js/app.js` la llamada a `GF.render`/canvas manual actual
   por la instanciación de `PixelActivityScene` con `mode: 'garden-streak'`
   y `theme: 'pastel-day'` (tema que ya trae `librer-a-` y coincide con la
   paleta diurna que este repo eligió a propósito, según el README).
4. Mantener intactos: input de usuario, selector de año, botón compartir,
   tooltip (puede engancharse vía `onCellHover`, que la librería ya expone).
5. Eliminar `js/render.js` una vez confirmado que `garden-streak` cubre todo
   lo que hacía (dejarlo unos commits sin borrar por las dudas, o revertible
   vía git, tu decisión).

**De tu lado:**
- Revisar visualmente que el jardín se vea/anime igual (o mejor) que antes,
  especialmente el caso de racha larga con pocos commits por semana (el caso
  más específico de este repo, el que más fácil se pierde en una migración
  apurada).
- Aprobar antes de que borre `js/render.js`/`js/sprites.js` originales.

---

## Fase 4 — Verificación y despliegue

**De mi lado:** correr localmente (`python3 -m http.server` o `npx serve .`,
como indica el README) y verificar los casos de `INSTALL.md`/`README.md`:
usuario válido, usuario inexistente, usuario sin actividad, cambio de año,
compartir link.

**De tu lado:**
- Aprobación visual final.
- Push a la branch de deploy (`main` u otra, según cómo tengas configurado
  GitHub Pages/Vercel) — Pages/Vercel se redespliegan solos con el push, no
  hace falta ningún paso manual adicional más allá de eso.

---

## Plan de rollback

Cada fase es un commit separado y reversible:

- Si `test` tiene downtime prolongado → revertir solo la Fase 2 (volver a
  `jogruber.de` como `API_BASE`), sin tocar la Fase 3.
- Si el modo `garden-streak` custom tiene un bug visual → revertir solo la
  Fase 3 (volver a `js/render.js`/`js/garden.js` originales), sin tocar la
  Fase 2.
- Recomendación: migrar fetch (Fase 2) y render (Fase 3) en PRs/commits
  separados, no juntos, justamente para poder revertir cada uno de forma
  independiente si algo falla.

---

## Checklist resumen

- [ ] **Vos:** desplegar `test` en Cloudflare Workers, pasar la URL
- [ ] **Yo:** vendorizar `pixel-activity-scene` (Fase 1)
- [ ] **Yo:** migrar `js/github.js`/`js/config.js` a `test`, actualizar CSP (Fase 2)
- [ ] **Vos:** revisar visualmente Fase 2, aprobar
- [ ] **Yo:** modo custom `garden-streak` + migración de `js/app.js` (Fase 3)
- [ ] **Vos:** revisar visualmente Fase 3 (especialmente el caso de racha larga), aprobar
- [ ] **Yo:** verificación local de casos borde (Fase 4)
- [ ] **Vos:** aprobación final + push a la branch de deploy
