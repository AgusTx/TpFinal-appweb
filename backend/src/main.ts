import express from 'express';
import { register, login } from './controllers/auth.controller';

const app = express();
app.use(express.json());

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', message: 'Backend skeleton is running', routes: ['/health', '/auth/register', '/auth/login', '/products', '/orders'] });
});

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Auth routes (implemented via controller)
app.post('/auth/register', register);
app.post('/auth/login', login);

// Products routes (basic skeleton)
app.get('/products', (_req: express.Request, res: express.Response) => {
  res.json([
    { id: 'sample-1', name: 'Sample Product', price: 0 }
  ]);
});

app.get('/products/:id', (req: express.Request, res: express.Response) => {
  res.json({ id: req.params.id, name: 'Sample Product', price: 0 });
});

// Orders routes (stubs)
app.post('/orders', (_req: express.Request, res: express.Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

app.get('/orders', (_req: express.Request, res: express.Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend skeleton running on http://localhost:${PORT}`);
});
