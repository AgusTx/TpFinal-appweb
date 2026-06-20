# Fase 2 - Paso A: Microservicios Tradicionales

Documentación completa de la arquitectura de microservicios tradicionales con comunicación síncrona HTTP/REST, resiliencia y seguridad.

## 📋 Requisitos Implementados

Este paso implementa todos los requisitos del informe para microservicios tradicionales:

- ✅ **Database-per-Microservice**: Cada servicio tiene su propia base de datos SQLite (Prisma ORM)
- ✅ **API Gateway**: Proxy inverso centralizado con rutas y balanceo inicial
- ✅ **Circuit Breaker**: Patrón de resiliencia para evitar cascading failures
- ✅ **JWT Validation**: Seguridad periférica en rutas protegidas (`/orders`)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                    (http://localhost:3000)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           API Gateway (Express)                              │
│           (http://localhost:4000)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • CORS Middleware                                    │   │
│  │ • Circuit Breaker Pattern (per service)             │   │
│  │ • JWT Validation (on /orders routes)                │   │
│  │ • Request Routing & Proxying                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬──────────────────┬──────────────────────┬───────────────┘
     │                  │                      │
     │ Circuit Breaker  │ Circuit Breaker      │ Circuit Breaker
     │ (Auth)           │ (Product)            │ (Order)
     ▼                  ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Auth Service │  │Product Service│  │  Order Service   │
│ :4100        │  │ :4200        │  │  :4300           │
├──────────────┤  ├──────────────┤  ├──────────────────┤
│ • Register   │  │ • List       │  │ • Create Order   │
│ • Login      │  │ • Filter     │  │ • Get Orders     │
│ • JWT Issuance│  │ • Categories │  │ • Order Status   │
└──────────────┘  └──────────────┘  └──────────────────┘
     │                  │                      │
     ▼                  ▼                      ▼
 ┌─────────┐        ┌─────────┐           ┌─────────┐
 │ SQLite  │        │ SQLite  │           │ SQLite  │
 │ DB      │        │ DB      │           │ DB      │
 │(auth)   │        │(product)│           │(order)  │
 └─────────┘        └─────────┘           └─────────┘
```

---

## 1. Database-per-Microservice Pattern

### Concepto

Cada microservicio gestiona su propia base de datos de forma exclusiva. Ningún servicio accede directamente a los datos de otro servicio; toda comunicación es a través de APIs públicas.

### Implementación en Hardware of Legends

**Servicios e instancias de BD:**

| Servicio | Puerto | BD SQLite | Modelos |
|----------|--------|-----------|---------|
| Auth Service | 4100 | `dev-auth.db` | User |
| Product Service | 4200 | `dev-product.db` | Product, Category |
| Order Service | 4300 | `dev-order.db` | Order, OrderItem |

### Setup Local

Cada servicio tiene su archivo `.env.local`:

```bash
# services/auth-service/.env.local
PORT=4100
DATABASE_URL="file:./dev-auth.db"
AUTH_JWT_SECRET="tu-secreto-jwt"
AUTH_JWT_EXPIRES_IN="1h"

# services/product-service/.env.local
PORT=4200
DATABASE_URL="file:./dev-product.db"

# services/order-service/.env.local
PORT=4300
DATABASE_URL="file:./dev-order.db"
```

### Ejecutar Migraciones

En cada carpeta de servicio:

```bash
cd services/auth-service
npm install
npm run prisma:migrate      # Crea/aplica migraciones
npm run prisma:generate     # Genera Prisma Client
npm run dev                 # Inicia servicio

# Repetir para product y order services
```

**Resultado**: Se crean 3 archivos `.db` independientes con esquemas separados.

---

## 2. API Gateway

### Responsabilidades

El gateway en `backend/src/main.ts` actúa como proxy inverso y punto único de entrada:

```javascript
├─ Punto único de entrada (localhost:4000)
├─ Abstracción de rutas internas
│  ├─ /auth/* → Auth Service (4100)
│  ├─ /products/* → Product Service (4200)
│  └─ /orders/* → Order Service (4300)
├─ CORS Middleware
├─ Circuit Breaker (3 instancias)
├─ JWT Validation (rutas protegidas)
└─ Error Handling centralizado
```

### Rutas Disponibles

#### Públicas (sin autenticación)

```bash
# Auth
POST /auth/register        # { email, password, name }
POST /auth/login           # { email, password } → returns JWT

# Productos
GET /products              # Query params: q, category, minPrice, maxPrice
GET /products/:id
GET /categories
POST /products            # Admin
PUT /products/:id         # Admin
```

#### Protegidas (requieren JWT)

```bash
# Headers requerido:
# Authorization: Bearer <token>

GET /orders               # Lista órdenes del usuario
POST /orders              # { items: [{productId, qty}] }
```

### Ejemplo de Uso

```bash
# 1. Registrarse
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"pass123", "name":"User"}'

# 2. Login (obtener JWT)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"pass123"}'
# Response: { "token": "eyJhbGc..." }

# 3. Listar productos
curl http://localhost:4000/products

# 4. Crear orden (protegida)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"items": [{"productId":"1", "qty":2}]}'
```

---

## 3. Circuit Breaker Pattern

### Problema que Resuelve

En el "Launch Day", el sistema colapsó porque:

1. **Cascading Failures**: Si un servicio tardaba, bloqueaba todos los threads
2. **Efecto Dominó**: Un fallo en pagos desactivaba el catálogo completo
3. **Pérdida de Resiliencia**: No hay degradación elegante

### Solución: Circuit Breaker

**3 Estados:**

```
CLOSED → (>5 fallos) → OPEN → (30s timeout) → HALF_OPEN → (2 éxitos) → CLOSED
```

| Estado | Comportamiento |
|--------|---|
| **CLOSED** | ✅ Funciona normal. Cuenta fallos. |
| **OPEN** | 🔴 Rechaza peticiones con 503. Evita consumir recursos. |
| **HALF_OPEN** | ⚠️ Testea si el servicio se recuperó. 2 éxitos → CLOSED |

### Implementación

Archivo: `backend/src/patterns/circuitBreaker.ts`

```typescript
class CircuitBreaker {
  canExecute(): boolean        // ¿Permite la petición?
  recordSuccess(): void        // Registra éxito
  recordFailure(): void        // Registra fallo
  getState()                   // Estado actual para monitoring
}

// Un circuito por servicio:
circuitBreakers = {
  product: CircuitBreaker(...),
  auth: CircuitBreaker(...),
  order: CircuitBreaker(...)
}
```

### Monitorear Estado

```bash
curl http://localhost:4000/health/circuit-breakers
```

Response:
```json
{
  "productService": {
    "state": "CLOSED",
    "failureCount": 0,
    "serviceName": "Product Service"
  },
  "authService": {
    "state": "CLOSED",
    "failureCount": 0,
    "serviceName": "Auth Service"
  },
  "orderService": {
    "state": "OPEN",
    "failureCount": 5,
    "serviceName": "Order Service"
  }
}
```

### Comportamiento en Cascada

**Escenario**: Order Service se cae

1. **T=0s**: Primer fallo registrado
2. **T=5s**: Quinto fallo → Circuit se abre
3. **T=6s**: Nueva petición a /orders → 503 inmediato (sin esperar timeout)
4. **T=36s**: Circuit pasa a HALF_OPEN
5. **T=37s**: Intenta una petición
6. Si funciona → Circuit vuelve a CLOSED ✅
7. Si falla → Circuit vuelve a OPEN 🔴

**Beneficio**: El catálogo sigue funcionando sin percibir la caída

---

## 4. JWT Validation

### Concepto

Protege rutas sensibles (`/orders`) requiriendo un token válido en el header `Authorization`.

### Flow

```
1. User → POST /auth/login
   ↓
2. Auth Service genera JWT: { sub: user.id, role: user.role }
   ↓
3. Frontend almacena token
   ↓
4. Frontend → GET /orders (con Authorization: Bearer <token>)
   ↓
5. Gateway valida token
   ├─ ✅ Válido → Proxea a Order Service
   └─ ❌ Inválido → 401 Unauthorized
```

### Implementación

Archivo: `backend/src/middleware/jwt.middleware.ts`

```typescript
jwtMiddleware(req, res, next) {
  1. Extrae token del header "Authorization: Bearer <token>"
  2. Verifica firma con JWT_SECRET
  3. Si válido → req.user = { sub, role }
  4. Si inválido → 401 Unauthorized
}
```

### Rutas Protegidas

En `backend/src/main.ts`:

```typescript
app.get('/orders', jwtMiddleware, async (req, res) => {
  // req.user disponible aquí
  await proxyRequest(req, res, orderService, circuitBreaker);
});

app.post('/orders', jwtMiddleware, async (req, res) => {
  // Requiere JWT válido
  await proxyRequest(req, res, orderService, circuitBreaker);
});
```

### Errores Posibles

```bash
# 1. Sin header Authorization
curl http://localhost:4000/orders
# 401 Unauthorized - Missing Authorization header

# 2. Formato inválido
curl -H "Authorization: InvalidFormat token" http://localhost:4000/orders
# 401 Unauthorized - Invalid Authorization header format

# 3. Token expirado/inválido
curl -H "Authorization: Bearer invalid.token.here" http://localhost:4000/orders
# 401 Unauthorized - jwt malformed
```

---

## 📚 Estructura de Archivos

```
backend/
├─ src/
│  ├─ main.ts                           # Gateway principal
│  ├─ middleware/
│  │  └─ jwt.middleware.ts             # Validación JWT
│  ├─ patterns/
│  │  └─ circuitBreaker.ts             # Patrón Circuit Breaker
│  ├─ controllers/
│  │  └─ auth.controller.ts
│  └─ services/
│     └─ auth.service.ts

services/
├─ auth-service/
│  ├─ src/index.ts                     # Endpoints: /register, /login
│  ├─ prisma/schema.prisma             # User model
│  ├─ .env.local                       # DATABASE_URL, JWT_SECRET
│  └─ dev-auth.db                      # SQLite database
├─ product-service/
│  ├─ src/index.ts                     # Endpoints: GET/POST/PUT /products
│  ├─ prisma/schema.prisma             # Product, Category models
│  ├─ .env.local                       # DATABASE_URL
│  └─ dev-product.db                   # SQLite database
└─ order-service/
   ├─ src/index.ts                     # Endpoints: GET/POST /orders
   ├─ prisma/schema.prisma             # Order, OrderItem models
   ├─ .env.local                       # DATABASE_URL
   └─ dev-order.db                     # SQLite database
```

---

## 🚀 Ejecutar Fase 2 - Paso A

### Iniciar todos los servicios

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm install
npm run prisma:migrate
npm run dev
# Escuchar en http://localhost:4100
```

**Terminal 2 - Product Service:**
```bash
cd services/product-service
npm install
npm run prisma:migrate
npm run dev
# Escuchar en http://localhost:4200
```

**Terminal 3 - Order Service:**
```bash
cd services/order-service
npm install
npm run prisma:migrate
npm run dev
# Escuchar en http://localhost:4300
```

**Terminal 4 - API Gateway:**
```bash
cd backend
npm install
npm run dev
# Escuchar en http://localhost:4000
```

**Terminal 5 - Frontend (opcional):**
```bash
cd frontend
npm install
npm run dev
# Escuchar en http://localhost:3000
```

### Verificar Health

```bash
# Gateway health
curl http://localhost:4000/health
# { "status": "ok" }

# Circuit Breaker status
curl http://localhost:4000/health/circuit-breakers
```

---

## 📊 Esquemas de Base de Datos

### Auth Service

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Product Service

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  products  Product[]
}

model Product {
  id         String   @id @default(cuid())
  name       String
  price      Float
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  categoryId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Order Service

```prisma
model Order {
  id        String      @id @default(cuid())
  userId    String
  status    String      @default("PENDING")
  total     Float
  items     OrderItem[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  productId String
  quantity  Int
}
```

---

## 🔧 Variables de Entorno

### API Gateway (`backend/.env.local`)

```
PORT=4000
JWT_SECRET=tu-secreto-jwt
PRODUCT_SERVICE_URL=http://localhost:4200
AUTH_SERVICE_URL=http://localhost:4100
ORDER_SERVICE_URL=http://localhost:4300
```

### Cada Microservicio (`services/*/.env.local`)

```
PORT=<4100|4200|4300>
DATABASE_URL=file:./dev-<service>.db

# Solo Auth Service
AUTH_JWT_SECRET=tu-secreto-jwt
AUTH_JWT_EXPIRES_IN=1h
```

---

## ✅ Validar Paso A Completado

- [x] **Database-per-Microservice**: 3 servicios, 3 DBs independientes
- [x] **API Gateway**: Proxy centralizado con routing
- [x] **Circuit Breaker**: Previene cascading failures
- [x] **JWT Validation**: Protege rutas /orders
- [x] **CORS**: Frontend puede comunicarse con gateway
- [x] **Health Endpoints**: Monitoreo disponible

---

## 📖 Próximos Pasos

**Paso B: Microservicios Modernos (Event-Driven)**

- Message Broker (RabbitMQ)
- Arquitectura Orientada a Eventos (EDA)
- Patrón SAGA para consistencia distribuida
- Comunicación asíncrona entre servicios

Ver: `PASO_B_MODERNO.md`

---

## 🐛 Troubleshooting

### Las migraciones no se ejecutan

```bash
cd services/auth-service
npm run prisma:migrate
# Si falla: rm -r prisma/migrations && npm run prisma:migrate
```

### Circuit breaker siempre OPEN

Verifica que los servicios estén corriendo en los puertos correctos:

```bash
# Verificar puertos
netstat -ano | findstr :4100  # Auth
netstat -ano | findstr :4200  # Product
netstat -ano | findstr :4300  # Order
netstat -ano | findstr :4000  # Gateway
```

### JWT validation falla

```bash
# Verificar token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"pass123"}'

# Usar token en header
curl -H "Authorization: Bearer <token>" http://localhost:4000/orders
```

### Conflictos de puertos

```bash
# Windows: cambiar puertos en .env.local de cada servicio
PORT=4101  # En lugar de 4100
```

---

**Versión**: 1.0 | **Última actualización**: 2026-06-20
