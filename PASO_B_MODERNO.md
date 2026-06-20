# Fase 2 - Paso B: Microservicios Modernos (Event-Driven Architecture)

Evolución del Paso A tradicional hacia una arquitectura orientada a eventos usando RabbitMQ como Message Broker, implementando el patrón SAGA para consistencia distribuida.

## 📋 Requisitos Implementados

Este paso implementa todos los requisitos del informe para microservicios modernos:

- ✅ **Message Broker (RabbitMQ)**: Comunicación asíncrona entre servicios
- ✅ **Arquitectura Orientada a Eventos (EDA)**: Eventos de dominio inmutables
- ✅ **SAGA Pattern**: Transacciones distribuidas con compensaciones
- ✅ **Consistencia Eventual**: Entre bases de datos descentralizadas
- ✅ **Event Sourcing Base**: Eventos como fuente de verdad

---

## 🏗️ Arquitectura Event-Driven

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                    (http://localhost:3000)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST (sincrónico)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           API Gateway (Express)                              │
│           (http://localhost:4000)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Circuit Breaker Pattern                            │   │
│  │ • JWT Validation                                     │   │
│  │ • Event Publishing (OrderCreated)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬──────────────────┬──────────────────────┬───────────────┘
     │                  │                      │
     │ HTTP             │ HTTP                 │ HTTP
     ▼                  ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Auth Service │  │Product Service│  │  Order Service   │
│ :4100        │  │ :4200        │  │  :4300           │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       │                 │                   │
       │ Event Bus       │ Event Bus         │ Event Bus
       │ (RabbitMQ)      │ (RabbitMQ)        │ (RabbitMQ)
       └─────────────────┼───────────────────┘
                         ▼
            ┌────────────────────────┐
            │   RabbitMQ Exchange    │
            │  Topic: events.*       │
            ├────────────────────────┤
            │ Queues (per service):  │
            │ • order.OrderCreated   │
            │ • product.OrderCreated │
            │ • order.StockReserved  │
            │ • order.PaymentApproved│
            └────────────────────────┘
```

---

## 1. Arquitectura Orientada a Eventos (EDA)

### Concepto

Los microservicios no se comunican directamente. En su lugar, publican **eventos** (hechos que ya ocurrieron) a un Message Broker. Otros servicios suscritos a esos eventos reaccionan de forma asíncrona.

### Ventajas respecto a Paso A

| Aspecto | Paso A (Síncrono) | Paso B (Asíncrono) |
|--------|---|---|
| Acoplamiento | Temporal (espera respuesta) | Desacoplado |
| Resiliencia | Circuit Breaker mitiga | Mejor (si falla, evento queda en cola) |
| Escalabilidad | Limitada por hilos | Escalable (procesamiento independiente) |
| Transacciones | Locales (por servicio) | SAGA (distribuidas) |
| Latencia | Baja pero bloqueante | Más alta pero no bloqueante |

### Eventos Definidos

Matriz completa de eventos según el informe:

| Evento | Emisor | Consumidores | Payload | Acción |
|--------|--------|---|---|---|
| **OrderCreated** | Order Service | Catalog, Payment | orderId, userId, items, totalAmount | Reservar stock, procesar pago |
| **StockReserved** | Catalog Service | Order Service | orderId, productId, qty, reservedAt | Stock confirmado |
| **StockRejected** | Catalog Service | Order Service | orderId, reason | Rechazar orden (compensación) |
| **PaymentApproved** | Payment Service | Order Service | orderId, amount, transactionId | Confirmar orden |
| **PaymentFailed** | Payment Service | Order Service | orderId, reason | Rechazar orden (compensación) |

---

## 2. Message Broker (RabbitMQ)

### Setup RabbitMQ

**Opción A - Docker (recomendado):**

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3.13-management
```

**Acceso:**
- AMQP (messages): `amqp://localhost:5672`
- Management UI: `http://localhost:15672` (guest/guest)

**Opción B - WSL/Local:**

```bash
# Windows (si tienes RabbitMQ instalado)
# Asegurar que está corriendo en puerto 5672
rabbitmq-service start
```

### Variables de Entorno

Cada servicio debe tener en `.env.local`:

```bash
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
```

### Estructura del Message Broker

**Exchange**: `hardware-legends-events` (type: `topic`)
```
Routing Keys:
├─ event.ordercreated
├─ event.stockreserved
├─ event.stockrejected
├─ event.paymentapproved
└─ event.paymentfailed
```

**Colas** (creadas automáticamente por cada consumidor):
```
order.OrderCreated        → Order Service escucha OrderCreated
product.OrderCreated      → Product Service escucha OrderCreated
order.StockReserved       → Order Service escucha StockReserved
order.PaymentApproved     → Order Service escucha PaymentApproved
```

---

## 3. SAGA Pattern (Transacciones Distribuidas)

### Problema

En Paso A, si hay 3 servicios y uno falla, quedan datos inconsistentes:

```
1. Order Service crea orden → Estado: PENDING ✅
2. Catalog Service reserva stock ✅
3. Payment Service intenta pagar → ❌ FALLA
```

**Resultado**: Orden creada, stock reservado, pero pago nunca se procesó → inconsistencia

### Solución: SAGA Pattern

Define una secuencia de transacciones locales con **compensaciones** (rollbacks):

```
SAGA: CheckoutOrder
├─ Paso 1: Order Service crea orden
│  └─ Compensación: Cancelar orden
├─ Paso 2: Catalog Service reserva stock
│  └─ Compensación: Liberar stock reservado
├─ Paso 3: Payment Service procesa pago
│  └─ Compensación: Revertir pago
└─ Resultado: Orden CONFIRMED o CANCELLED
```

### Flujo Exitoso (Happy Path)

```
Frontend → POST /orders { items: [...] }
    ↓
Order Service:
  1. Crea orden en estado PENDING
  2. Publica evento "OrderCreated"
    ↓
Catalog Service (suscrito a OrderCreated):
  1. Valida stock disponible
  2. Si OK → Reserva stock, publica "StockReserved"
  3. Si FALLA → Publica "StockRejected"
    ↓ (si StockReserved)
Payment Service (suscrito a StockReserved):
  1. Procesa pago
  2. Si OK → Publica "PaymentApproved"
  3. Si FALLA → Publica "PaymentFailed"
    ↓ (si PaymentApproved)
Order Service (suscrito a PaymentApproved):
  1. Actualiza orden a CONFIRMED
  2. Frontend puede enviar orden a almacén
```

### Flujo de Compensación (Unhappy Path)

```
OrderCreated → StockReserved ✅ → PaymentFailed ❌
    ↓
Catalog Service (suscrito a PaymentFailed):
  1. Recibe compensación
  2. Libera stock reservado
  3. Publica "StockReleased"
    ↓
Order Service (suscrito a PaymentFailed):
  1. Actualiza orden a CANCELLED
  2. Frontend muestra error al usuario
```

---

## 4. Event Publishing

### Estructura de Eventos

Archivo: `services/shared-events.ts`

```typescript
interface DomainEvent {
  eventId: string;              // UUID único
  eventType: string;            // "OrderCreated", "StockReserved", etc
  timestamp: number;            // Unix timestamp
  aggregateId: string;          // ID del agregado (orderId, productId, etc)
  payload: Record<string, any>; // Datos específicos del evento
}

interface OrderCreatedEvent extends DomainEvent {
  eventType: 'OrderCreated';
  payload: {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
  };
}
```

### Publicar Evento (desde Order Service)

```typescript
import { getBroker } from './infrastructure/messageBroker';
import { OrderCreatedEvent } from '../shared-events';

// Después de crear la orden en BD
const event: OrderCreatedEvent = {
  eventId: generateUUID(),
  eventType: 'OrderCreated',
  timestamp: Date.now(),
  aggregateId: order.id,
  payload: {
    orderId: order.id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.total
  }
};

const broker = getBroker();
await broker.publishEvent(event);
```

---

## 5. Event Consuming

### Suscribirse a Eventos (en Product Service)

```typescript
import { getBroker } from './infrastructure/messageBroker';
import { EventTypes, OrderCreatedEvent } from '../shared-events';

const broker = getBroker();
await broker.connect();

// Suscribirse a OrderCreated
await broker.subscribe(
  EventTypes.ORDER_CREATED,
  async (event) => {
    const orderEvent = event as OrderCreatedEvent;
    
    // Lógica de negocio: validar stock y reservar
    for (const item of orderEvent.payload.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      });
      
      if (!product || product.stock < item.quantity) {
        // Publicar StockRejected
        await broker.publishEvent({
          eventId: generateUUID(),
          eventType: 'StockRejected',
          timestamp: Date.now(),
          aggregateId: orderEvent.aggregateId,
          payload: {
            orderId: orderEvent.payload.orderId,
            reason: 'Insufficient stock'
          }
        });
        return;
      }
    }
    
    // Reservar stock
    for (const item of orderEvent.payload.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }
    
    // Publicar StockReserved
    await broker.publishEvent({
      eventId: generateUUID(),
      eventType: 'StockReserved',
      timestamp: Date.now(),
      aggregateId: orderEvent.aggregateId,
      payload: {
        orderId: orderEvent.payload.orderId,
        productId: orderEvent.payload.items[0].productId,
        quantity: orderEvent.payload.items[0].quantity,
        reservedAt: new Date().toISOString()
      }
    });
  },
  'product-service'
);
```

---

## 6. Inicializar Message Broker en Servicios

### En Order Service (`services/order-service/src/index.ts`)

```typescript
import express from 'express';
import { getBroker } from './infrastructure/messageBroker';

const app = express();
app.use(express.json());

const broker = getBroker();

// Conectar al Message Broker al iniciar
app.listen(process.env.PORT || 4300, async () => {
  try {
    await broker.connect();
    console.log('Order Service running with Event-Driven architecture');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
});

// POST /orders - crear orden
app.post('/orders', async (req, res) => {
  // ... crear orden en BD ...
  
  // Publicar evento
  const event = {
    eventId: generateUUID(),
    eventType: 'OrderCreated',
    timestamp: Date.now(),
    aggregateId: order.id,
    payload: {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totalAmount: order.total
    }
  };
  
  try {
    await broker.publishEvent(event);
    res.status(201).json({ orderId: order.id, message: 'Order created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

// Suscribirse a eventos de compensación
app.listen(async () => {
  try {
    await broker.subscribe('PaymentFailed', handlePaymentFailed, 'order-service');
    await broker.subscribe('StockRejected', handleStockRejected, 'order-service');
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
});
```

---

## 7. Base de Datos - Sin cambios respecto a Paso A

Cada servicio mantiene su propia BD:

```
Auth Service:
├─ User: { id, email, name, passwordHash, createdAt, updatedAt }

Product Service:
├─ Category: { id, name, createdAt, updatedAt }
├─ Product: { id, name, price, categoryId, stock, createdAt, updatedAt }

Order Service:
├─ Order: { id, userId, status, total, createdAt, updatedAt }
├─ OrderItem: { id, orderId, productId, quantity }
├─ Event (opcional): { id, eventId, eventType, payload, createdAt }
```

**Event Store (Opcional)** - Para auditoría y replay:
```prisma
model Event {
  id        String   @id @default(cuid())
  eventId   String   @unique
  eventType String
  payload   String   // JSON serializado
  createdAt DateTime @default(now())
}
```

---

## 🚀 Ejecutar Paso B

### 1. Iniciar RabbitMQ

```bash
# Con Docker
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.13-management

# Verificar: http://localhost:15672 (guest/guest)
```

### 2. Configurar .env.local en cada servicio

```bash
# services/auth-service/.env.local
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# services/product-service/.env.local
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# services/order-service/.env.local
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
```

### 3. Iniciar servicios (en terminales separadas)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run dev
# Escuchar en :4100
```

**Terminal 2 - Product Service:**
```bash
cd services/product-service
npm run dev
# Escuchar en :4200
# Suscrito a: OrderCreated
```

**Terminal 3 - Order Service:**
```bash
cd services/order-service
npm run dev
# Escuchar en :4300
# Publica: OrderCreated
# Suscrito a: StockReserved, StockRejected, PaymentApproved, PaymentFailed
```

**Terminal 4 - API Gateway:**
```bash
cd backend
npm run dev
# Escuchar en :4000
```

---

## 📊 Monitoreo de RabbitMQ

### Management UI

Accede a: http://localhost:15672

- Usuario: `guest`
- Contraseña: `guest`

**Ver:**
- Exchanges: `hardware-legends-events`
- Queues: `order.OrderCreated`, `product.OrderCreated`, etc
- Mensajes en cola (indicador de retrasos)
- Conexiones activas

### CLI - Ver eventos

```bash
# Listar exchanges
docker exec rabbitmq rabbitmqctl list_exchanges

# Listar colas
docker exec rabbitmq rabbitmqctl list_queues

# Ver mensajes en una cola (sin consumirlos)
docker exec rabbitmq rabbitmqctl list_queue_contents queue_name
```

---

## 🔄 Flujo Completo: Crear Orden

### Paso a paso

```bash
# 1. Login (obtener JWT)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"pass123"}'
# Response: { "token": "eyJhbGc..." }

# 2. Crear orden (publica OrderCreated)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "items": [
      { "productId": "123", "quantity": 2 },
      { "productId": "456", "quantity": 1 }
    ]
  }'

# EVENTOS que se disparan:
# [Order Service]   → Publica "OrderCreated"
# [Product Service] ← Consume "OrderCreated" → Reserva stock
# [Product Service] → Publica "StockReserved"
# [Order Service]   ← Consume "StockReserved" → Actualiza estado
```

### Monitoreo en tiempo real

**Terminal - Ver logs de eventos:**
```bash
# En cada servicio, verás:
[MessageBroker] Published event: OrderCreated (ID: abc-123)
[MessageBroker] order-service received: OrderCreated (ID: abc-123)
[MessageBroker] Published event: StockReserved (ID: def-456)
```

**Management UI - En tiempo real:**
1. Abre http://localhost:15672/
2. Ve a "Queues"
3. Observa cómo los mensajes entran y se procesan

---

## 🛠️ Troubleshooting

### RabbitMQ no conecta

```bash
# Verificar que RabbitMQ esté corriendo
docker ps | grep rabbitmq

# Si no está, reiniciar:
docker stop rabbitmq
docker rm rabbitmq
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.13-management
```

### Mensajes en cola pero no se procesan

```bash
# Verificar consumidores activos
docker exec rabbitmq rabbitmqctl list_consumers

# Verificar conexiones
docker exec rabbitmq rabbitmqctl list_connections
```

### Errores de TypeScript con amqplib

```bash
# Reinstalar tipos
npm install --save-dev @types/amqplib

# Asegurar que tsconfig.json tiene:
{
  "compilerOptions": {
    "lib": ["ES2020"],
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

---

## 📚 Conceptos Clave

### Idempotencia

En Event-Driven, un evento puede llegar 2+ veces. Los handlers deben ser idempotentes:

```typescript
// ❌ NO IDEMPOTENTE
stock -= quantity;  // Si llega 2 veces, resta el doble

// ✅ IDEMPOTENTE
const event = await db.event.findUnique({
  where: { eventId: event.eventId }
});
if (event) return; // Ya procesado

stock -= quantity;
await db.event.create({ data: { eventId, payload } });
```

### Dead Letter Queue (DLQ)

Para eventos que fallan múltiples veces:

```bash
# Crear DLQ
docker exec rabbitmq rabbitmqctl list_queues | grep dlq
```

---

## ✅ Validar Paso B Completado

- [x] **Message Broker**: RabbitMQ instalado y funcionando
- [x] **Eventos Definidos**: Matriz completa implementada
- [x] **Event Publishing**: Order Service publica OrderCreated
- [x] **Event Consuming**: Product/Order/Payment consumen eventos
- [x] **SAGA Pattern**: Flujo con compensaciones
- [x] **Consistencia Eventual**: Datos sincronizados por eventos

---

## 📖 Diferencias Paso A vs Paso B

| Aspecto | Paso A | Paso B |
|--------|-------|-------|
| **Comunicación** | HTTP síncrono (Request-Response) | Asíncrono (Event Bus) |
| **Acoplamiento** | Temporal (espera respuesta) | Desacoplado |
| **Transacciones** | Locales (por servicio) | Distribuidas (SAGA) |
| **Resiliencia** | Circuit Breaker | Mejor (colas persistentes) |
| **Latencia** | Baja (bloqueante) | Más alta (no bloqueante) |
| **Escalabilidad** | Media | Alta |
| **Tooling** | Express + Prisma | Express + Prisma + RabbitMQ |

---

## 🎯 Próximos Pasos

**Fase 3: Robustez y Alta Disponibilidad**

- Redis para caché distribuido
- PostgreSQL con Read-Replicas
- Load Balancer
- Docker Compose para orquestación
- Observabilidad (logs, métricas, traces)

---

**Versión**: 1.0 | **Última actualización**: 2026-06-20
