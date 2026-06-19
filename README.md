# hardware-of-Legends

Proyecto final de e-commerce con esqueleto de backend y frontend en TypeScript.

## Resumen

Este repositorio contiene un monorepo con:
- `backend/`: servidor Express en TypeScript, con rutas de autenticación, productos y órdenes.
- `frontend/`: aplicación Next.js App Router en TypeScript, con páginas para productos, carrito y auth.
- `shared/`: tipos compartidos entre backend y frontend.

El objetivo actual es demostrar una arquitectura base con un MVP funcional, integrando un esqueleto de Prisma para persistencia futura.

## Estructura principal

- `backend/`
  - `src/main.ts`: servidor Express y rutas básicas.
  - `modules/`: controllers y services para auth, products, orders.
  - `prisma/schema.prisma`: esquema Prisma para modelos `User`, `Product`, `Order`.
  - `.env.example`: configuración de base de datos y secret JWT.

- `frontend/`
  - `src/app/`: rutas de Next.js App Router.
  - `src/services/api.ts`: helper para llamadas al backend.
  - `src/store/cartStore.ts`: estado simple del carrito.

- `shared/`
  - `app.ts`: tipos compartidos del dominio.

## Tecnologías

- Backend: Node.js, Express, TypeScript, Prisma (SQLite local), JWT stub.
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Shared: tipos TypeScript para `User`, `Product`, `Order`.

## Ejecución local

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend se inicia en `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend arranca en `http://localhost:3000`.

> El frontend usa `API_URL` desde el entorno si está definido, y por defecto apunta a `http://localhost:4000`.

## Qué está implementado

- Rutas backend básicas:
  - `GET /` y `GET /health`
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /products`
  - `GET /products/:id`
  - `GET /orders` y `POST /orders` (stubs)
- Frontend:
  - Lista de productos en `/products`
  - Detalle de producto en `/products/[id]`
  - Páginas de login y registro
  - Página de carrito
- Integración básica: el frontend consume el backend para listar productos.

## Justificación de Prisma

Prisma se eligió para:
- modelar las entidades con tipos TypeScript claros,
- simplificar la futura persistencia de datos,
- permitir una migración simple desde SQLite local a un motor de producción.

En esta fase inicial se utiliza SQLite local para mantener la instalación simple y enfocada en arquitectura.

## Siguientes pasos recomendados

- Completar la integración real de Prisma con persistencia en `backend`.
- Ampliar `auth` para registrar y autenticar usuarios con JWT.
- Desarrollar el checkout y la creación de órdenes.
- Agregar validaciones y manejo de errores en frontend y backend.

## Notas

Este README se complementa con `README_PHASE1.md`, que documenta la propuesta de arquitectura y la justificación de diseño de Fase 1.
