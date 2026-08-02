# 🌱 Git Flowers — Jardín de commits

Página web **standalone** (HTML/CSS/JS puro, sin backend, sin bundler) que
convierte el historial real de commits públicos de un usuario de GitHub en
un jardín pixel que crece con el tiempo. Cada semana del año se representa
como una parcela con una planta cuya etapa de crecimiento depende de la
actividad real de esa semana.

> ¿Buscás la guía para gente no técnica que solo quiere publicar su propio
> jardín? Mirá [`INSTALL.md`](./INSTALL.md).

## Demo rápida

Abrí `index.html` con un servidor estático (ver [Cómo hostearlo](#cómo-hostearlo))
y cargá `?user=<usuario_de_github>`, o escribilo en el input.

## Fuente de datos

GitHub no ofrece una API pública y sin autenticación para el contribution
graph:

- El endpoint interno `github.com/users/{user}/contributions` devuelve un
  **SVG**, pero **no envía cabeceras CORS**, así que un `fetch()` desde JS
  corriendo en otro origen (como GitHub Pages) es rechazado por el
  navegador. Sirve para incrustar `<img>` pero no para leer los datos.
- La API GraphQL oficial de GitHub sí expone `contributionsCollection`,
  pero **requiere autenticación** (token personal), lo cual es inaceptable
  en una app 100% cliente sin backend: cualquier token embebido en el JS
  quedaría expuesto públicamente.

Por eso se usa **[`github-contributions-api`](https://github.com/grubersjoe/github-contributions-api)**
(`https://github-contributions-api.jogruber.de/v4/{username}`), una API de
terceros de código abierto y mantenida activamente que:

- No requiere autenticación ni API key.
- Responde JSON con CORS habilitado (`Access-Control-Allow-Origin: *`),
  pensada explícitamente para consumirse desde el navegador.
- Cachea internamente 1 hora, por lo que además de nuestra propia caché en
  `localStorage` evitamos pegarle a GitHub en cada visita.

La app pide `?y=all` una sola vez por usuario y deriva de esa respuesta
tanto la lista de años disponibles (`total`, con una clave por año) como
los días de cada año (`contributions`, filtrando por prefijo de fecha), así
que cambiar de año en el selector no dispara una nueva petición de red.

Si esta API dejara de estar disponible, el único punto de cambio es
`GF.config.API_BASE` en [`js/config.js`](./js/config.js) y el parseo de
respuesta en [`js/github.js`](./js/github.js).

## Lógica de crecimiento (el corazón del proyecto)

Cada **parcela** del jardín representa **una semana completa** (domingo a
sábado, igual alineación que el grid de GitHub) — no un día — para que el
jardín no quede sobrecargado de celdas diminutas. Esto vive en
[`js/garden.js`](./js/garden.js), documentado también inline.

```
commits de la semana        etapa            nombre
──────────────────────      ─────            ──────────────
0                            0                Semilla (reposo)
1 a 3                        1                Brote
4 a 7                        2                Tallo
8 o más                      3                Flor / Fruto
  o parte de una racha de
  5+ semanas consecutivas
  con actividad
```

Puntos clave del algoritmo:

1. **Agrupamos** los días del año en semanas (`groupIntoWeeks`).
2. Para cada semana calculamos `commits` (suma de counts) y `activeDays`
   (cuántos días tuvieron al menos 1 commit).
3. Detectamos **rachas**: corridas de semanas consecutivas con al menos 1
   commit cada una. Si una racha dura 5 semanas o más, **todas** las
   semanas de esa racha quedan marcadas `inLongStreak = true`.
4. La etapa final es una función de ambos datos: una semana floja en
   volumen (por ejemplo 1 solo commit) puede **florecer igual** si forma
   parte de una racha larga sostenida — la consistencia en el tiempo pesa
   tanto como el volumen bruto de commits, que es la idea central del
   proyecto ("no de un salto, sino de forma progresiva según la intensidad
   y consistencia real de la racha").
5. Una semana sin ningún commit **nunca queda vacía**: se dibuja tierra en
   reposo con una motita verde apenas visible (etapa 0, "Semilla"), como
   pide la consigna.

Los umbrales concretos están centralizados en `GF.config.GROWTH`
(`js/config.js`) para poder ajustarlos sin tocar la lógica.

### Variedad de plantas

Existen 4 "especies" (`js/sprites.js`): Tulipán, Arbusto de moras,
Tomatera y Girasol. Comparten silueta en las etapas 0-2 y se distinguen
fuerte en la etapa 3 (flor/fruto). La especie de cada jardín se elige con
un hash determinístico (djb2) del username módulo 4
(`GF.garden.plantTypeForUsername`) — mismo usuario, misma especie siempre;
no hay aleatoriedad en cada visita.

### Animación

El render (`js/render.js`) usa `<canvas>` con `imageSmoothingEnabled =
false` para mantener el pixel art nítido. Al cargar, cada parcela **no**
salta directo a su etapa final: avanza una etapa por vez cada
`ANIMATION_STEP_MS` (ver `js/config.js`), con un pequeño desfasaje por
parcela para que el jardín "crezca" de forma escalonada y visible en vez
de aparecer de golpe. Encima de esa animación discreta corren dos efectos
continuos puramente decorativos y no distractivos: un balanceo suave tipo
viento en las plantas con follaje, y 2-3 abejas/mariposas pixeladas
moviéndose de fondo.

## Paleta: diurna, no nocturna

A diferencia de otros proyectos hermanos (el de las criaturas saltando el
contribution graph) que usan una paleta nocturna violeta, acá se eligió
una **paleta pastel diurna** (cielo celeste, verdes suaves, tierra cálida).
Motivo: un jardín necesita que las flores y frutos contrasten contra el
fondo para leerse a simple vista; de noche esos mismos tonos pastel se
apagan y hace falta agregar fuentes de luz artificial que terminan
compitiendo visualmente con las propias plantas en vez de resaltarlas. Con
luz de día el contraste es gratis.

## Interfaz

- Input de usuario + botón "Cultivar" carga el jardín.
- Parámetro `?user=<usuario>` en la URL para compartir el jardín de
  alguien puntual (se lee al cargar la página y se actualiza con
  `history.replaceState` al cultivar un jardín nuevo, sin recargar).
- Botón "Compartir jardín" copia la URL actual al portapapeles
  (`navigator.clipboard`, con fallback a `document.execCommand('copy')`
  para navegadores viejos).
- Selector de año: si el usuario tiene más de un año de historial, por
  defecto se muestra el año actual (o el más reciente disponible) y el
  selector permite ver años anteriores **como jardines separados** — nunca
  todo superpuesto — para no perder rendimiento ni legibilidad con
  usuarios de muchos años de antigüedad.
- Tooltip al pasar el mouse por una parcela: muestra el rango de fechas de
  esa semana y la cantidad real de commits.

## Seguridad (OWASP)

Checklist de las decisiones de seguridad relevantes para una app estática
sin backend:

| Riesgo | Mitigación |
|---|---|
| **XSS** (A03:2021 – Injection) | Todo el contenido dinámico (tooltip, leyenda, mensajes de estado) se escribe con `textContent`, nunca `innerHTML`. No hay `eval`, `Function()` ni inyección de scripts dinámica. |
| **CSP débil / inline scripts** | Content-Security-Policy estricta vía `<meta>` (GitHub Pages no permite mandar cabeceras HTTP custom): `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self'`, `connect-src` limitado únicamente al dominio de la API de contribuciones. No hay `'unsafe-inline'` en ningún lado: todo el JS y CSS vive en archivos externos, no hay `onclick=` ni `style=""` inline. |
| **Entrada de usuario no validada / SSRF-like** | El username se valida con la regex oficial de GitHub (`^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$`, máx. 39 caracteres) **antes** de usarse para construir la URL de fetch o de reflejarse en `?user=`, tanto en el submit del formulario como al leer el parámetro de la URL al cargar la página. Además se aplica `encodeURIComponent` como defensa en profundidad. |
| **Secretos en el cliente** | No hay tokens, API keys ni credenciales en ningún archivo: la API usada no requiere autenticación, por diseño (ver sección "Fuente de datos"). |
| **Dependencias / cadena de suministro** | Cero dependencias de terceros cargadas en runtime (sin CDN, sin npm en producción). Todo el código que corre en el navegador es el que está en este repo. |
| **Datos sensibles en `localStorage`** | Solo se cachea la respuesta pública de contribuciones (ya pública en el perfil de GitHub), con TTL corto (30 min) y con manejo defensivo (`try/catch`) por si `localStorage` no está disponible (modo privado, cuota agotada, etc.). |
| **Clickjacking** | `frame-ancestors 'none'` está declarado en la CSP, aunque el navegador la ignora por venir de un `<meta>` en vez de una cabecera HTTP — limitación documentada de GitHub Pages. Si se hostea en un servidor propio (ver abajo), agregar la cabecera `Content-Security-Policy` real (o `X-Frame-Options: DENY`) para que esta directiva se aplique de verdad. |
| **Mixed content** | La API externa se consume siempre por `https://`; GitHub Pages/Vercel sirven el sitio por `https://` también. |
| **Rate limiting propio** | La caché en `localStorage` evita pegarle a la API en cada recarga; no hay lógica de reintento automático agresivo ante errores. |

## Estructura de archivos

```
index.html          Markup, CSP, carga de scripts (sin bundler)
css/style.css        Estilos, paleta pastel diurna
js/config.js          Constantes: endpoint, umbrales de crecimiento, layout
js/github.js          Fetch + validación de username + caché en localStorage
js/garden.js          Agrupación por semana, cálculo de rachas y etapas
js/sprites.js         Pixel art de las 4 especies (arrays de caracteres)
js/render.js          Canvas: fondo, parcelas, animación, tooltip
js/app.js             Orquestación: formulario, URL, selector de año, compartir
favicon.svg           Ícono (mismo origen, no viola la CSP)
```

## Cómo hostearlo

No hace falta build ni bundler: es HTML/CSS/JS servidos tal cual.

### GitHub Pages

1. Subí este repo a GitHub (o hacé fork).
2. Repo → **Settings → Pages**.
3. En "Build and deployment" elegí **Deploy from a branch**, rama `main`
   (o la que uses), carpeta `/ (root)`.
4. Guardá. En 1-2 minutos el sitio queda publicado en
   `https://<usuario>.github.io/<repo>/`.

### Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other** (no hay build step).
3. Deploy. Vercel sirve los archivos estáticos tal cual.

### Local (para desarrollar)

Cualquier servidor estático sirve, por ejemplo:

```bash
python3 -m http.server 8000
# o
npx serve .
```

No abras `index.html` directo con `file://`: algunos navegadores bloquean
`fetch()` a orígenes remotos desde el esquema `file://`.

## Licencia

[MIT](./LICENSE).
