# Plan de Microservicios

## Estado actual

- El backend principal (`backend/src/main.ts`) ya no contiene la lógica de productos completa.
- El backend funciona como un gateway ligero que reenvía las solicitudes a servicios dedicados:
  - `services/product-service` → productos y categorías
  - `services/auth-service` → registro y login
  - `services/order-service` → órdenes
- `package.json` de la raíz ya incluye `services/*` en los workspaces.

## Qué se implementó

- `services/product-service`
  - `GET /health`
  - `GET /categories`
  - `GET /products`
  - `GET /products/:id`
  - `POST /products`
  - `PUT /products/:id`
- `services/auth-service`
  - `GET /health`
  - `POST /register`
  - `POST /login`
- `services/order-service`
  - `GET /health`
  - `GET /orders`
  - `POST /orders`

## Cómo encaja con el informe

- No hay un archivo PDF de plan dentro del repositorio actual.
- Sí existen dos documentos importantes:
  - `README_PHASE1.md`: describe la Fase 1 y el MVP monolítico.
  - `README_PHASE2.md`: plantea la evolución hacia persistencia real, auth completa y flujo de checkout.
- La migración actual sigue el espíritu del informe al mover la lógica de dominio hacia servicios independientes mientras se conserva un gateway central.
- Esto es compatible con el plan: no se está rehaciendo todo, solo se está desmontando el monolito en piezas ordenadas.

## Nivel de cambio necesario

- Ya se hizo el cambio estructural clave: el gateway y los servicios existen.
- Lo que falta es principalmente:
  - conectar servicios con persistencia real (Prisma/DB)
  - validar contratos entre frontend y los nuevos endpoints
  - añadir protección de rutas de órdenes/auth si se quiere mayor seguridad
- No hace falta rehacer la aplicación completa: el esquema actual permite continuar con cambios incrementales.

## Ejecución recomendada

1. Instalar dependencias en la raíz y en cada paquete:

```bash
cd c:\Users\AgusTx\Documents\GitHub\TpFinal-appweb
npm install
cd backend
npm install
cd ..\services\product-service
npm install
cd ..\auth-service
npm install
cd ..\order-service
npm install
```

2. Iniciar servicios en consolas separadas:

```bash
cd services\product-service && npm run dev
cd services\auth-service && npm run dev
cd services\order-service && npm run dev
cd backend && npm run dev
```

3. Si el frontend usa el gateway central, deja `API_URL` apuntando a `http://localhost:4000`.

## Recomendación para el siguiente paso

Seguir con la migración sin tocar demasiado la estructura actual:
- implementar persistencia en `services/*` y/o
- añadir JWT y middleware en `backend` para rutas de orden
- mantener el gateway como punto único de entrada

> Si querés, también puedo generar un PDF de este plan a partir de este documento una vez que aprobemos el contenido.
