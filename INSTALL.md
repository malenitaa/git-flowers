# 🌱 Cómo publicar tu propio Jardín de Commits (sin saber programar)

Esta guía es para vos si nunca usaste GitHub más allá de tener una cuenta,
y querés tener tu propia página del jardín funcionando en internet, gratis,
en unos minutos. No hace falta instalar nada en tu computadora ni escribir
una sola línea de código.

## Qué vas a lograr

Al final vas a tener un link propio, algo como:

```
https://tu-usuario.github.io/git-flowers/?user=tu-usuario
```

que podés mandarle a quien quieras, y muestra un jardín pixel que crece
según tu actividad real en GitHub.

## Paso 1 — Conseguí una copia del proyecto en tu cuenta

1. Andá a la página del repositorio de este proyecto en GitHub (la url que
   te compartieron).
2. Arriba a la derecha vas a ver un botón que dice **"Fork"**. Hacé clic
   ahí.
3. GitHub te va a preguntar en qué cuenta crear la copia — elegí la tuya.
4. Esperá unos segundos: ahora tenés tu propia copia del proyecto, con la
   misma dirección pero con tu usuario adelante.

> "Fork" es simplemente "copiar este proyecto a mi cuenta". No rompés nada
> del original y no hace falta pedirle permiso a nadie.

## Paso 2 — Activá GitHub Pages (así queda publicado en internet)

1. En **tu copia** del repositorio, buscá la pestaña **"Settings"**
   (arriba, junto a "Code", "Issues", etc.).
2. En el menú de la izquierda, hacé clic en **"Pages"**.
3. Donde dice **"Build and deployment"**, en el desplegable **"Source"**,
   elegí **"Deploy from a branch"**.
4. Justo abajo van a aparecer dos desplegables: elegí la rama
   **`main`** (o `master`, la que aparezca por defecto) y la carpeta
   **`/ (root)`**.
5. Hacé clic en **"Save"**.
6. Esperá 1 o 2 minutos. Si volvés a entrar a **Settings → Pages**, arriba
   va a aparecer un cartel verde con el link de tu sitio, algo como:

   ```
   Your site is live at https://tu-usuario.github.io/git-flowers/
   ```

## Paso 3 — Mirá tu jardín

Abrí ese link. Vas a ver una cajita para escribir un usuario de GitHub.
Escribí el usuario del que querés ver el jardín (puede ser el tuyo o el de
cualquier persona con perfil público) y tocá **"Cultivar 🌼"**.

Si querés armar el link directo a un jardín puntual, agregale al final
`?user=` y el nombre de usuario, por ejemplo:

```
https://tu-usuario.github.io/git-flowers/?user=malenavillaabrille
```

## Paso 4 — Compartilo

Una vez que el jardín cargó, aparece un botón **"Compartir jardín"**. Al
tocarlo se copia automáticamente el link a tu portapapeles, listo para
pegarlo donde quieras (WhatsApp, Twitter/X, donde sea).

## Preguntas frecuentes

**¿Esto le pide mi contraseña de GitHub o algún token?**
No. La página solo lee información que ya es pública en cualquier perfil
de GitHub (el mismo cuadrito verde que se ve en tu perfil). Nunca pide
usuario ni contraseña ni token de acceso.

**¿Cuesta algo?**
No, GitHub Pages es gratis para repositorios públicos.

**Puse mi usuario y no aparece nada / dice error**
- Revisá que el nombre de usuario esté bien escrito.
- Si tu perfil de GitHub tiene el historial de contribuciones oculto en la
  configuración de privacidad, la página no va a poder mostrarlo (porque
  justamente no es público).
- Esperá un minuto y probá de nuevo: puede ser que la fuente de datos
  esté momentáneamente ocupada.

**¿Puedo cambiarle el nombre del sitio o los colores?**
Sí, pero eso ya es "tocar código". Para eso te sirve el otro archivo del
proyecto, [`README.md`](./README.md), pensado para gente que programa.

**¿Cómo dejo de mostrar el jardín / borro mi copia?**
En tu repositorio (tu fork), andá a **Settings**, bajá hasta el final a la
zona roja **"Danger Zone"** y elegí **"Delete this repository"**. Esto
borra tu copia y el sitio deja de estar disponible.

## Créditos y licencia

Este proyecto es de código abierto bajo licencia MIT (ver
[`LICENSE`](./LICENSE)): lo podés usar, copiar y modificar libremente,
incluso para fines comerciales, siempre manteniendo el aviso de licencia
original.
