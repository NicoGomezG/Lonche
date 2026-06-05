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
