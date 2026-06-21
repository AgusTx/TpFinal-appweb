# Guía de Testing - Paso A (Microservicios Tradicionales)

Esta guía te ayudará a validar que toda la arquitectura de Paso A funciona correctamente.

## 📋 Pre-requisitos

Asegúrate de tener:
- Node.js v18+ instalado
- npm funcionando
- PowerShell (Windows) o Bash (Linux/Mac)
- Puertos disponibles: 4000 (gateway), 4100 (auth), 4200 (product), 4300 (order)

---

## 🚀 Opción A: Testing Manual Paso a Paso

### 1. Iniciar todos los servicios

Abre **4 terminales separadas** en el directorio raíz del proyecto:

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm install
npm run prisma:migrate    # Crear BD
npm run dev
# Esperado: "Auth Service running on http://localhost:4100"
```

**Terminal 2 - Product Service:**
```bash
cd services/product-service
npm install
npm run prisma:migrate    # Crear BD
npm run dev
# Esperado: "Product Service running on http://localhost:4200"
```

**Terminal 3 - Order Service:**
```bash
cd services/order-service
npm install
npm run prisma:migrate    # Crear BD
npm run dev
# Esperado: "Order Service running on http://localhost:4300"
```

**Terminal 4 - API Gateway:**
```bash
cd backend
npm install
npm run dev
# Esperado: "Backend gateway running on http://localhost:4000"
```

Espera 2-3 segundos después de iniciar cada servicio para que se conecte.

### 2. Pruebas Manuales

#### Test 1: Health Checks

```bash
# En una nueva terminal (terminal 5)

# Gateway health
curl http://localhost:4000/health
# Esperado: { "status": "ok", "message": "Backend gateway is running", ... }

# Circuit Breaker status
curl http://localhost:4000/health/circuit-breakers
# Esperado: { "productService": { "state": "CLOSED", ... } }
```

#### Test 2: Autenticación

```bash
# Registrarse
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
# Esperado: { "id": "...", "email": "user@example.com", ... }

# Login (obtener JWT)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
# Esperado: { "token": "eyJhbGc..." }
# Copia el token para los siguientes tests
```

#### Test 3: Productos

```bash
# Listar todos los productos
curl http://localhost:4000/products

# Listar categorías
curl http://localhost:4000/categories

# Filtrar por categoría
curl http://localhost:4000/products?category=accesorios

# Filtrar por precio
curl http://localhost:4000/products?minPrice=100&maxPrice=500

# Buscar por nombre
curl http://localhost:4000/products?q=GPU
```

#### Test 4: Órdenes (Protegidas con JWT)

```bash
# IMPORTANTE: Reemplaza <JWT_TOKEN> con el token que obtuviste en Test 2

# Ver órdenes del usuario (requiere JWT)
curl http://localhost:4000/orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
# Esperado: { "orders": [...] }

# Crear nueva orden (requiere JWT)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "items": [
      { "productId": "1", "quantity": 2 },
      { "productId": "2", "quantity": 1 }
    ]
  }'
# Esperado: { "id": "...", "status": "PENDING", ... }
```

#### Test 5: JWT Validation

```bash
# Intentar acceder a /orders SIN token
curl http://localhost:4000/orders
# Esperado: { "message": "Unauthorized", "detail": "Missing Authorization header" }

# Intentar con token inválido
curl http://localhost:4000/orders \
  -H "Authorization: Bearer invalid.token.here"
# Esperado: { "message": "Unauthorized", "detail": "jwt malformed" }

# Intentar con formato incorrecto
curl http://localhost:4000/orders \
  -H "Authorization: InvalidFormat token"
# Esperado: { "message": "Unauthorized", "detail": "Invalid Authorization header format" }
```

#### Test 6: Circuit Breaker

```bash
# Ver estado del Circuit Breaker
curl http://localhost:4000/health/circuit-breakers | jq .

# Respuesta esperada:
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
    "state": "CLOSED",
    "failureCount": 0,
    "serviceName": "Order Service"
  }
}

# Si detiene un servicio y hace requests, verá:
# "state": "OPEN" (después de 5 fallos)
# "failureCount": 5

# Después de 30 segundos pasará a "HALF_OPEN"
# Si el servicio se recupera, volverá a "CLOSED"
```

---

## 🤖 Opción B: Script Automático (PowerShell - Windows)

### Paso 1: Asegurar que todos los servicios están corriendo

Abre 4 terminales y ejecuta el setup anterior (Opción A pasos 1-4).

### Paso 2: Ejecutar el script de testing

```powershell
# En una terminal nueva
cd C:\Users\AgusTx\Documents\GitHub\TpFinal-appweb

# Ejecutar script
.\PASO_A_TESTING.ps1
```

El script ejecutará automáticamente:
- ✓ Health checks
- ✓ Register user
- ✓ Login & obtener JWT
- ✓ List products
- ✓ Create order (con JWT)
- ✓ JWT validation (sin token, con token inválido)
- ✓ Circuit Breaker status

**Output esperado:**
```
✓ PASS (HTTP 200)
✓ PASS (HTTP 200)
...
```

---

## ✅ Checklist de Validación

Después de ejecutar las pruebas, verifica que todos estos puntos sean ✓:

### Health
- [ ] GET /health → 200 OK
- [ ] GET /health/circuit-breakers → 200 OK

### Autenticación
- [ ] POST /auth/register → 201 Created
- [ ] POST /auth/login → 200 OK (con token)
- [ ] JWT token es un string válido (comienza con "eyJ")

### Productos
- [ ] GET /products → 200 OK (devuelve array)
- [ ] GET /categories → 200 OK (devuelve array)
- [ ] GET /products?category=X → 200 OK
- [ ] GET /products?minPrice=100&maxPrice=500 → 200 OK

### Órdenes (Protected)
- [ ] GET /orders (con JWT) → 200 OK
- [ ] POST /orders (con JWT) → 201 Created (devuelve orderId)
- [ ] GET /orders (sin JWT) → 401 Unauthorized
- [ ] GET /orders (con JWT inválido) → 401 Unauthorized

### Circuit Breaker
- [ ] State es "CLOSED" en condiciones normales
- [ ] failureCount es 0
- [ ] Todos los servicios listados (product, auth, order)

---

## 🐛 Troubleshooting

### Puertos ocupados

```bash
# Windows - ver qué está usando puerto 4000
netstat -ano | findstr :4000

# Matar proceso
taskkill /PID <PID> /F
```

### Conexión rechazada a RabbitMQ (si intentas Paso B)

En Paso A no necesitas RabbitMQ. Solo en Paso B.

### Errores de Prisma

```bash
# En cada servicio
cd services/auth-service
rm -r node_modules/.prisma
npm run prisma:generate
npm run prisma:migrate
```

### JWT token expirado o inválido

- En desarrollo, los tokens expiran en 1 hora
- Simplemente haz login de nuevo

### Circuit Breaker siempre abierto

Verifica que todos los servicios estén corriendo:
```bash
# Windows
Get-NetTCPConnection -LocalPort 4000,4100,4200,4300
```

---

## 📊 Resultados Esperados

Si todas las pruebas pasan:

```
✓ Gateway conecta y responde en puerto 4000
✓ Auth Service genera JWTs válidos
✓ Product Service devuelve catálogo desde BD
✓ Order Service crea órdenes en BD
✓ Circuit Breaker monitorea estado de servicios
✓ JWT validation protege rutas /orders
✓ CORS permite requests desde frontend (localhost:3000)
```

---

## 📝 Notas

- **Emails únicos**: En Test de autenticación, cambia el email cada vez o usa timestamp
- **Datos persistentes**: Después de ejecutar tests, los datos quedan en las SQLite DBs locales
- **Logs**: Cada servicio muestra logs detallados. Miralos para ver qué está pasando
- **Timezones**: Los timestamps están en UTC

---

## 🔗 Próximos Pasos

Una vez que todos los tests pasen:

1. **Pasar a Paso B** (microservicios-modern)
   - Integrar RabbitMQ
   - Publicar/consumir eventos
   - SAGA pattern

2. **Frontend Testing**
   - Conectar Next.js frontend con gateway
   - Validar flujos de UI

3. **CSS & UI**
   - Mejorar estilos si faltan

---

**Versión**: 1.0 | **Última actualización**: 2026-06-20
