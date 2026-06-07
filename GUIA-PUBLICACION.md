# 🚀 Guía para publicar el CRM (Supabase + GitHub + Vercel)

El CRM es **3 archivos**: `index.html`, `config.js` y `supabase-schema.sql`.
Seguí los pasos en orden. No hace falta instalar nada.

---

## PARTE 1 — Crear la base de datos (Supabase)

1. Entrá a **https://supabase.com** → **Start your project** → registrate (con Google es más rápido).
2. **New project**:
   - Name: `crm-tunegocio`
   - Database Password: poné una y **guardala**.
   - Region: `South America (São Paulo)`.
   - Create new project (tarda ~2 min).
3. Cuando esté listo, andá a **SQL Editor** (ícono `</>` a la izquierda) → **New query**.
4. Abrí el archivo **`supabase-schema.sql`**, copiá TODO y pegalo. Apretá **Run** (abajo a la derecha). Debe decir *Success*.
   *(Esto ya crea las tablas Y carga al equipo: Administrador, Bautista, Mateo y Joaquin. No hay que crear usuarios ni contraseñas.)*

### Copiar las claves
5. Andá a **Project Settings (engranaje) → API**. Copiá:
   - **Project URL** (ej: `https://abcd1234.supabase.co`)
   - **anon public** key (texto largo que empieza con `eyJ...`)

### Pegar las claves en el CRM
6. Abrí **`config.js`** con el Bloc de notas y reemplazá:
   ```js
   window.SUPABASE_URL      = "https://abcd1234.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...tu-clave-larga...";
   ```
   Guardá.

✅ **Ya podés probarlo:** doble clic en `index.html` y entra **directo al CRM** (sin login). Arriba a la izquierda, en la barra lateral, podés tocar tu nombre para **cambiar de usuario** (Bautista / Mateo / Joaquin / Admin).

---

## PARTE 2 — Subir a GitHub

1. Entrá a **https://github.com** → registrate / iniciá sesión.
2. Arriba a la derecha **+ → New repository**:
   - Repository name: `crm-tunegocio`
   - **Private** (recomendado).
   - Create repository.
3. En la página del repo nuevo, clic en **uploading an existing file**.
4. Arrastrá los **3 archivos**: `index.html`, `config.js`, `supabase-schema.sql`.
5. Abajo, **Commit changes**.

> Nota: la `anon key` es pública por diseño (la seguridad la dan las reglas RLS de la base), así que no hay problema en subir `config.js`.

---

## PARTE 3 — Publicar con Vercel

1. Entrá a **https://vercel.com** → **Sign up** → **Continue with GitHub**.
2. **Add New… → Project**.
3. Te lista tus repos de GitHub → al lado de `crm-tunegocio` clic en **Import**.
4. Dejá todo por defecto (es un sitio estático) → **Deploy**.
5. En ~30 seg te da una URL tipo **`https://crm-tunegocio.vercel.app`**. ¡Esa es la app online!

### Para futuros cambios
Cada vez que cambies un archivo en GitHub (botón editar ✏️ o subiendo de nuevo), Vercel **republica solo** en segundos.

---

## ✅ Resultado

- Se entra **directo al CRM**, sin login ni contraseñas.
- Desde la barra lateral se elige quién está usando (Admin / Bautista / Mateo / Joaquin).
- Los cambios se **sincronizan en tiempo real**: lo que carga uno, lo ven todos al instante.
- Funciona desde el celular o la compu, solo con la URL de Vercel.

> Seguridad: la app no aparece en buscadores y solo entra quien tenga el link de Vercel. Si más adelante querés agregar contraseña, se puede sumar.

¿Dudas en algún paso? Avisame en cuál estás y te ayudo.
