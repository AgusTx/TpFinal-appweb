# Fase 1 — Arquitectura Base y Esqueleto (MVP)

## Modelo de negocio (breve)
Proyecto: e-commerce básico de productos físicos y digitales.
- Usuarios: compradores y administradores.
- Flujo principal: listar productos → ver detalle → agregar al carrito → checkout (creación de orden).

Objetivo de la Fase 1: mostrar un MVP con la arquitectura y el esqueleto del sistema (rutas, capas y tipos) suficiente para explicar decisiones arquitectónicas.

## Arquitectura propuesta (Fase 1)
- Tipo: Monolito por capas (Controllers → Services → Repositories).
- Justificación: para un volumen bajo de usuarios y un equipo pequeño, un monolito en capas permite desarrollo rápido, menores costos operativos y despliegue simple.
- Límites: escalabilidad vertical limitada; acoplamiento entre módulos; despliegue global y equipos independientes más difíciles.

## Archivos y artefactos incluidos (esqueleto)
- Backend:
  - `backend/src/main.ts` — servidor Express mínimo con healthcheck y rutas stub (`/auth`, `/products`, `/orders`).
  - `backend/package.json` — script `start` apuntando a `ts-node src/main.ts`.
  - Módulos: `backend/modules/{auth,products,orders}` con `controller` y `service` (stubs).
- Frontend:
  - Estructura Next.js bajo `frontend/src/app` con rutas: `auth/login`, `auth/register`, `products`, `products/[id]`, `cart`.
  - `frontend/src/services/api.ts` — base URL apuntando al backend por defecto.
- Shared:
  - `shared/app.ts` — placeholder para integraciones compartidas.

## Cómo ejecutar el esqueleto localmente (sugerencia)

1) Backend

```bash
cd backend
npm install express
npm install -D typescript ts-node @types/node @types/express
# Ejecutar servidor (usa ts-node)
npm run start
```

El servidor escucha por defecto en `http://localhost:4000` y tiene `/health`, `/products`, `/products/:id`, `/auth/*`, `/orders/*` (stubs).

2) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Por defecto el frontend usa `API_URL` desde entorno o `http://localhost:4000`.

## Justificación de Prisma
- Elegimos Prisma porque es un ORM moderno que facilita el modelado de datos y la evolución del esquema.
- Prisma permite definir modelos con un solo archivo `schema.prisma`, lo cual es ideal para un proyecto que busca demostrar arquitectura y estructura de carpetas.
- Facilita la generación de cliente y el uso de tipos en TypeScript, reduciendo el código "boilerplate" y mejorando la seguridad de tipos.
- Para la fase inicial usamos SQLite local como base de datos de desarrollo, lo que permite probar el backend sin necesidad de configurar un servidor de base de datos complejo.
- En una etapa posterior, la misma configuración se puede migrar fácilmente a Postgres, MySQL o cualquier otro proveedor compatible con Prisma.

## Siguientes pasos recomendados
- Completar modelos/DTOs (`User`, `Product`, `Order`) en `shared/` o `backend/modules/*`.
- Añadir conexión Prisma/DB real cuando se decida persistencia.
- Implementar autenticación básica (JWT) en `auth`.
- Preparar commits por fases: 1) limpieza, 2) esqueleto backend, 3) esqueleto frontend, 4) documentación final.

---
Documento creado para el entregable de la Fase 1 — sirve como punto de partida para justificar la arquitectura en el informe.
