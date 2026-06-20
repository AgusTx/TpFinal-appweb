import express from 'express';
import { register, login } from './controllers/auth.controller';

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

async function proxyRequest(req: express.Request, res: express.Response, targetUrl: string) {
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
    res.status(response.status);
    res.setHeader('content-type', contentType);
    return res.send(responseBody);
  } catch (error: any) {
    return res.status(502).json({ message: 'Bad gateway', detail: error.message });
  }
}

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'Backend gateway is running', routes: ['/health', '/auth/*', '/products/*', '/orders/*'] });
});

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/auth/register', async (req, res) => await proxyRequest(req, res, `${authService}/register`));
app.post('/auth/login', async (req, res) => await proxyRequest(req, res, `${authService}/login`));

// Product routes
app.get('/products', async (req, res) => {
  const query = new URLSearchParams(req.query as Record<string, string>);
  await proxyRequest(req, res, `${productService}/products?${query.toString()}`);
});
app.get('/products/:id', async (req, res) => await proxyRequest(req, res, `${productService}/products/${req.params.id}`));
app.get('/categories', async (req, res) => await proxyRequest(req, res, `${productService}/categories`));
app.post('/products', async (req, res) => await proxyRequest(req, res, `${productService}/products`));
app.put('/products/:id', async (req, res) => await proxyRequest(req, res, `${productService}/products/${req.params.id}`));

// Orders routes (forward to order service)
app.get('/orders', async (req, res) => await proxyRequest(req, res, `${orderService}/orders`));
app.post('/orders', async (req, res) => await proxyRequest(req, res, `${orderService}/orders`));

app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, () => {
  console.log(`Backend gateway running on http://localhost:${process.env.PORT || 4000}`);
});
