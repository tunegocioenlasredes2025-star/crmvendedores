# Importar prospectos desde Google Maps — Guía de activación

Esta función deja que el vendedor **pegue un link de Google Maps** y el CRM
autocomplete los datos del negocio (nombre, rubro, dirección, ciudad, teléfono,
sitio web). Funciona perfecto desde el celular.

La clave de Google **vive en el servidor (Vercel)**, nunca en el navegador, así que
no se expone a nadie.

Para que funcione hay que hacer **2 configuraciones de una sola vez**:

---

## 1) Obtener la API key de Google (Places API)

1. Entrá a **https://console.cloud.google.com/** con tu cuenta de Google.
2. Arriba, creá un proyecto nuevo (ej: `CRM TNR`) o usá uno existente.
3. Activá la facturación del proyecto: menú **Facturación → Vincular una cuenta de facturación**.
   - Google pide una tarjeta, pero da **USD 200 gratis por mes** de uso. Cargar leads
     a mano nunca llega ni cerca de ese límite (cada búsqueda cuesta centavos de dólar).
4. Andá a **APIs y servicios → Biblioteca**, buscá **"Places API (New)"** y tocá **Habilitar**.
5. Andá a **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
6. Copiá la clave (algo como `AIza...`).
7. (Recomendado) En la clave, **Restricciones de API → Restringir clave → Places API (New)**.
   Guardá. *No* pongas restricción por sitio web/HTTP, porque la usa el servidor, no el navegador.

> Importante: tiene que ser **"Places API (New)"**, no la vieja. Si solo aparece la vieja,
> habilitá igual "Places API (New)" desde la Biblioteca.

---

## 2) Cargar la clave en Vercel

1. Entrá a **https://vercel.com/** y abrí el proyecto del CRM (`crmvendedores`).
2. **Settings → Environment Variables**.
3. Agregá una variable:
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** la clave que copiaste (`AIza...`)
   - **Environments:** dejá las tres tildadas (Production, Preview, Development).
4. **Save**.
5. Volvé a desplegar: **Deployments → (último) → ⋯ → Redeploy** (para que tome la variable).

---

## 3) Listo — cómo se usa

1. En el CRM, **Leads → Nuevo Lead**.
2. Arriba aparece **"Importar desde Google Maps"**.
3. Desde el celular: en Google Maps, abrí el negocio → **Compartir** → **Copiar enlace**.
4. Pegá el link en el CRM y tocá **Obtener datos**.
5. Se completan solos: Empresa, Rubro, Ciudad, WhatsApp y Sitio Web.
   La dirección y la fuente quedan en **Observaciones**.
6. Completá Nombre y Apellido del contacto (eso Google no lo tiene) y **Crear Lead**.

---

## Notas técnicas

- El backend es `api/places.js` (función serverless de Vercel). No necesitás Node en tu PC:
  Vercel la ejecuta sola al desplegar.
- Acepta links cortos (`maps.app.goo.gl/...`) y largos (`google.com/maps/place/...`).
- Si un link no trae el negocio, usá siempre el botón **Compartir** del negocio en Maps
  (ese link es el más confiable).
- Para probar en local NO funciona con `python -m http.server` (no corre funciones).
  Se prueba ya publicado en Vercel, o con `vercel dev` si algún día instalás el CLI.
