# Lonche Foods — Landing Angular

## Setup inicial (solo la primera vez)

```bash
npm install
```

## Agregar el logo

Crea la carpeta `src/assets/` y pon ahí:
- `logo.png` → el logo con fondo blanco (el que tienes con el nombre Lonche Foods)

## Correr en local

```bash
ng serve
```
Abre http://localhost:4200

## Build para producción (Cloudflare Pages)

```bash
ng build
```
Sube la carpeta `dist/lonche-landing/browser/` a Cloudflare Pages.

## Actualizar URL de Justo (cuando tengas la cuenta)

En `landing.component.ts` busca `openRappi()` y reemplaza la URL de Rappi por la de Justo:

```typescript
openJusto() {
  window.open('https://tutienda.justo.app', '_blank');
}
```

Y en el HTML cambia `(click)="openRappi()"` por `(click)="openJusto()"`.

## Despliegue en Cloudflare Pages

1. Sube el proyecto a GitHub
2. En Cloudflare → Pages → Create project → conecta el repo
3. Build command: `ng build`
4. Build output directory: `dist/lonche-landing/browser`
5. Cloudflare lo conecta a `lonche.cl` automáticamente

## Posts de Instagram (Supabase + Cloudflare Worker)

La sección Instagram del landing lee posts reales desde una tabla de Supabase
(`instagram_posts`). Un Cloudflare Worker aparte (`worker/instagram-sync/`) es
el único que habla con la API de Instagram y con la `service_role key` de
Supabase — esos secretos nunca llegan al navegador. El frontend solo usa la
`anon key` de Supabase, que es pública por diseño y queda limitada por RLS a
poder leer esa tabla (nada más). Ver `supabase/schema.sql` para el detalle.

### 1. Supabase

1. En tu proyecto Supabase → **SQL Editor**, pega y corre todo el contenido
   de `supabase/schema.sql`.
2. En **Project Settings → API** copia:
   - `Project URL` y `anon public key` → van en `src/environments/environment.ts`
     (reemplaza `TU-PROYECTO` y `TU-ANON-KEY`). Esto sí se sube al repo/bundle,
     es información pública.
   - `service_role key` → **no la pongas en ningún archivo del repo**. Es solo
     para el Worker (paso 3).

### 2. App de Instagram (Meta for Developers)

1. Entra a https://developers.facebook.com/apps y crea una app tipo
   "Business".
2. Agrega el producto **Instagram API** (Instagram Graph API) y vincula tu
   cuenta de Instagram profesional (debe ser Business o Creator, y estar
   conectada a una Página de Facebook).
3. En el flujo de permisos, autoriza al menos `instagram_business_basic`.
4. Genera un **access token** de corta duración desde el Graph API Explorer,
   y cámbialo por uno de larga duración (60 días) con:
   ```
   GET https://graph.instagram.com/access_token
     ?grant_type=ig_exchange_token
     &client_secret=TU_APP_SECRET
     &access_token=TOKEN_CORTO
   ```
5. Guarda ese token de larga duración — es el valor de `INSTAGRAM_ACCESS_TOKEN`
   en el paso 3. El Worker se encarga de renovarlo automáticamente después
   (queda guardado y actualizado en la tabla `instagram_token` de Supabase).

### 3. Deploy del Worker

```bash
cd worker/instagram-sync
npm install
npx wrangler login

npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put INSTAGRAM_ACCESS_TOKEN
npx wrangler secret put SYNC_KEY   # cualquier string random, ej: openssl rand -hex 32

npx wrangler deploy
```

Esto deja el Cron Trigger corriendo cada 6 horas. Para forzar una sincronización
manual sin esperar el cron (útil para probar):

```bash
curl -X POST https://lonche-instagram-sync.<tu-subdominio>.workers.dev/sync \
  -H "x-sync-key: LA_MISMA_SYNC_KEY"
```

Si responde `{"synced": N}` con N > 0, revisa la tabla `instagram_posts` en
Supabase — debería tener los posts. El landing (`ng serve` o el deploy en
Cloudflare Pages) los mostrará automáticamente; si la tabla está vacía sigue
mostrando las 6 fotos placeholder como fallback.
