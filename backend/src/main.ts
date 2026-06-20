import express from 'express';
import { register, login } from './controllers/auth.controller';
import { circuitBreakers } from './patterns/circuitBreaker';
import { jwtMiddleware } from './middleware/jwt.middleware';

const app = express();
app.use(express.json());
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

const productService = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4200';
const authService = process.env.AUTH_SERVICE_URL || 'http://localhost:4100';
const orderService = process.env.ORDER_SERVICE_URL || 'http://localhost:4300';

async function proxyRequest(
  req: express.Request, 
  res: express.Response, 
  targetUrl: string,
  circuitBreaker: any
) {
  // Check circuit breaker before making request
  if (!circuitBreaker.canExecute()) {
    return res.status(503).json({ 
      message: 'Service Unavailable', 
      detail: 'Circuit breaker is OPEN. Service is temporarily unavailable.'
    });
  }

  const url = new URL(targetUrl);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined;
    const response = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const responseBody = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';
    
    // Record success if status is 2xx or 3xx
    if (response.status < 400) {
      circuitBreaker.recordSuccess();
    } else {
      circuitBreaker.recordFailure();
    }
    
    res.status(response.status);
    res.setHeader('content-type', contentType);
    return res.send(responseBody);
  } catch (error: any) {
    // Record failure
    circuitBreaker.recordFailure();
    return res.status(502).json({ message: 'Bad gateway', detail: error.message });
  }
}

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'Backend gateway is running', routes: ['/health', '/auth/*', '/products/*', '/orders/*'] });
});

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Circuit Breaker Status Endpoint (for monitoring)
app.get('/health/circuit-breakers', (_req: express.Request, res: express.Response) => {
  res.json({
    productService: circuitBreakers.product.getState(),
    authService: circuitBreakers.auth.getState(),
    orderService: circuitBreakers.order.getState()
  });
});

// Auth routes
app.post('/auth/register', async (req, res) => await proxyRequest(req, res, `${authService}/register`, circuitBreakers.auth));
app.post('/auth/login', async (req, res) => await proxyRequest(req, res, `${authService}/login`, circuitBreakers.auth));

// Product routes
app.get('/products', async (req, res) => {
  const query = new URLSearchParams(req.query as Record<string, string>);
  await proxyRequest(req, res, `${productService}/products?${query.toString()}`, circuitBreakers.product);
});
app.get('/products/:id', async (req, res) => await proxyRequest(req, res, `${productService}/products/${req.params.id}`, circuitBreakers.product));
app.get('/categories', async (req, res) => await proxyRequest(req, res, `${productService}/categories`, circuitBreakers.product));
app.post('/products', async (req, res) => await proxyRequest(req, res, `${productService}/products`, circuitBreakers.product));
app.put('/products/:id', async (req, res) => await proxyRequest(req, res, `${productService}/products/${req.params.id}`, circuitBreakers.product));

// Orders routes (forward to order service)
// Protected by JWT validation middleware
app.get('/orders', jwtMiddleware, async (req, res) => await proxyRequest(req, res, `${orderService}/orders`, circuitBreakers.order));
app.post('/orders', jwtMiddleware, async (req, res) => await proxyRequest(req, res, `${orderService}/orders`, circuitBreakers.order));

app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, () => {
  console.log(`Backend gateway running on http://localhost:${process.env.PORT || 4000}`);
});
