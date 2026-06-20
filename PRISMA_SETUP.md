# Ejecutar Microservicios con Prisma

## Estructura Database-per-Microservice

Cada servicio tiene su propia base de datos SQLite:
- `product-service`: `dev-product.db`
- `auth-service`: `dev-auth.db`
- `order-service`: `dev-order.db`

## Pasos Iniciales

### 1. Instalar dependencias en la raíz

```bash
cd c:\Users\AgusTx\Documents\GitHub\TpFinal-appweb
npm install
```

### 2. Instalar dependencias de cada servicio

```bash
cd services\product-service
npm install
cd ..\auth-service
npm install
cd ..\order-service
npm install
cd ..\..
```

### 3. Generar clientes Prisma y ejecutar migraciones

Para cada servicio (en consolas separadas):

**Product Service:**
```bash
cd services\product-service
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

**Auth Service:**
```bash
cd services\auth-service
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

**Order Service:**
```bash
cd services\order-service
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 4. Backend Gateway (en otra consola)

```bash
cd backend
npm install  # si no lo hizo ya
npm run dev
```

### 5. Frontend (en otra consola)

```bash
cd frontend
npm install  # si no lo hizo ya
npm run dev
```

## Endpoints

- **Product Service**: `http://localhost:4200`
  - `GET /health`
  - `GET /categories`
  - `GET /products`
  - `POST /products`
  - `PUT /products/:id`

- **Auth Service**: `http://localhost:4100`
  - `GET /health`
  - `POST /register`
  - `POST /login`

- **Order Service**: `http://localhost:4300`
  - `GET /health`
  - `GET /orders`
  - `POST /orders`

- **Backend Gateway**: `http://localhost:4000` (proxy a los servicios)
- **Frontend**: `http://localhost:3000`

## Prisma Studio

Para visualizar y editar datos de una base de datos:

```bash
cd services\product-service
npm run prisma:studio
# Abre en navegador: http://localhost:5555
```

Lo mismo para `auth-service` y `order-service` (cambiar puertos automáticamente).

## Variables de Entorno

Copiar `.env.example` a `.env.local` en cada servicio:

```bash
cp services\product-service\.env.example services\product-service\.env.local
cp services\auth-service\.env.example services\auth-service\.env.local
cp services\order-service\.env.example services\order-service\.env.local
```

Luego personalizar si es necesario (especialmente `AUTH_JWT_SECRET` en production).

## Estado del Proyecto

- ✅ Prisma configurado en cada servicio
- ✅ Esquemas de database-per-microservice
- ✅ Servicios actualizados para usar Prisma ORM
- ⏳ Falta: Circuit Breaker en el gateway
- ⏳ Falta: JWT validation en rutas protegidas (/orders)
- ⏳ Falta: Fase moderna con RabbitMQ/eventos

