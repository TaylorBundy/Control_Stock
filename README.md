# Control de Stock Yerbas — GitHub Pages + Render

## Arquitectura

- `frontend/`: sitio estático (HTML/CSS/JS), publicado en GitHub Pages.
- `backend/`: API Flask, publicada en Render.
- Los datos se guardan en `DATA_DIR/stock.json`. El Blueprint configura un disco persistente de Render montado en `/var/data`.

No necesitás instalar ni ejecutar Python en tu PC para usar la aplicación. Python corre únicamente en Render.

## 1. Subir el proyecto a GitHub

Subí el contenido de `frontend/` a la rama/carpeta que publiques con GitHub Pages. Para la configuración más simple, copiá los archivos `index.html`, `style.css`, `app.js` y `config.js` a la raíz del repositorio (o configurá Pages para publicar la carpeta `frontend` si tu configuración lo permite).

## 2. Publicar el backend en Render

1. Subí también la carpeta `backend/` y el archivo `render.yaml` al repositorio.
2. En Render, elegí **New > Blueprint** y conectá el repositorio.
3. Render detectará `render.yaml` y creará el servicio web.
4. Esperá a que termine el deploy. La URL será similar a `https://control-stock-yerbas-api.onrender.com`.
5. Probá `https://TU-SERVICIO.onrender.com/health`; debe responder `{"status":"ok"}`.

El `render.yaml` solicita un servicio Starter y un disco persistente de 1 GB. El disco es importante: sin almacenamiento persistente, los datos guardados en el sistema de archivos de una instancia pueden perderse cuando Render reemplaza o reinicia la instancia.

## 3. Conectar GitHub Pages con Render

Abrí `frontend/config.js` y reemplazá:

```js
window.API_BASE = "https://TU-SERVICIO.onrender.com";
```

por la URL real de tu backend. Subí el cambio a GitHub.

Si publicás en GitHub Pages, la dirección normalmente tendrá esta forma:
`https://USUARIO.github.io/NOMBRE-REPOSITORIO/`

## 4. Restringir CORS

Al principio `FRONTEND_ORIGIN` está en `*` para facilitar la primera prueba. Cuando conozcas la URL de GitHub Pages, en Render configurá la variable:

`FRONTEND_ORIGIN=https://USUARIO.github.io`

Si la aplicación usa un dominio personalizado, configurá ese origen en su lugar. Después hacé redeploy.

## 5. Importar y usar los datos

El backend arranca con una copia inicial del `stock.json` incluido. También podés importar tu XLSM/XLSX desde la sección Importar/Exportar. La importación reemplaza los productos y movimientos actuales del servidor.

## Importante

- El navegador carga la web desde GitHub Pages; las operaciones de datos se hacen contra la API de Render.
- No hay servidor Python local.
- La exportación es XLSX y no conserva macros VBA.
- Antes de habilitar el acceso público real, conviene agregar autenticación. En esta primera versión cualquier persona que conozca la URL de la API podría modificar los datos.
- El INI se analiza como listado auxiliar; la generación automática de productos/códigos y el uso de fotos aún requieren completar esa lógica.
