# Fase 2 — Evolución y Mejora del MVP

## Objetivo de Fase 2

Mejorar el esqueleto actual con persistencia real, autenticación completa, flujo de carrito/checkout y una experiencia de usuario mínima viable.

En esta fase se propone avanzar desde un MVP de arquitectura hacia un prototipo funcional con:
- backend persistente usando Prisma + SQLite (o migrable a Postgres)
- frontend con consumo real de API y navegación entre productos, carrito y checkout
- auth con JWT, registro/login y protección de rutas
- órdenes básicas y estado de carrito persistente en sesión/DB

## Entregables de Fase 2

1. Backend completo
   - Conexión de Prisma a la base de datos
   - Modelos `User`, `Product`, `Order`, `OrderItem`
   - CRUD de productos y órdenes
   - Registro y login con JWT
   - Middleware de autorización

2. Frontend mejorado
   - Página de detalle de producto funcional
   - Carrito con cantidades, total y persistencia de estado
   - Checkout/orden de compra simplificada
   - Formulario de login y registro con manejo de errores
   - Navegación entre `products`, `cart`, `auth` y `orders`

3. Infraestructura y documentación
   - `README_PHASE2.md` con plan y pasos de ejecución
   - Scripts de migración Prisma
   - Ejemplos de `env` para desarrollo
   - Documentación de rutas y contratos API

## Plan de trabajo

### Paso 1 — Modelo de datos y Prisma
- Revisar `backend/prisma/schema.prisma`
- Agregar entidad `OrderItem`
- Generar cliente Prisma y correr migraciones
- Configurar `backend/.env.example` con `DATABASE_URL` y `JWT_SECRET`

### Paso 2 — Auth y seguridad
- Implementar endpoints `POST /auth/register` y `POST /auth/login`
- Guardar usuarios en la DB con contraseña hasheada
- Generar token JWT en login
- Middleware para rutas protegidas `GET /orders`, `POST /orders`

### Paso 3 — Productos y órdenes
- Endpoints REST para `products`
  - `GET /products`
  - `GET /products/:id`
  - `POST /products` (opcional admin)
- Endpoint de creación de orden:
  - `POST /orders`
  - `GET /orders` para usuario autenticado

### Paso 4 — Frontend y flujo UX
- Implementar fetch real en `frontend/src/services/api.ts`
- Consumir `GET /products` y `GET /products/:id`
- Agregar lógica de carrito y checkout
- Proteger rutas de orden si el usuario no está logueado
- Mostrar mensajes de error y estados de carga

### Paso 5 — Validaciones y feedback
- Validación de formularios
- Manejo de errores de backend en frontend
- Mensajes de éxito en registro/login/orden
- Revisar consistencia entre los modelos compartidos

## Criterios de éxito

- El proyecto levanta localmente con `npm run dev` en ambos `backend` y `frontend`
- El frontend lista productos desde el backend
- Se puede ver detalle de producto, agregar al carrito y crear una orden
- El login/registro funciona con JWT válido
- La arquitectura de capas se mantiene clara y documentada

## Recomendaciones

- Mantener commits pequeños por función: `auth`, `prisma`, `frontend cart`, `checkout`, `docs`.
- Usar `backend` y `frontend` como paquetes separados dentro del monorepo.
- No convertir Fase 2 en un producto completo: foco en flujo mínimo funcional.

---

Esta fase 2 es un plan de evolución para la entrega posterior al MVP inicial, ideal para anotar los próximos pasos y evaluar el alcance realista del proyecto.