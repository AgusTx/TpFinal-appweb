import express from 'express';
import { register, login } from './controllers/auth.controller';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (implemented via controller)
app.post('/auth/register', register);
app.post('/auth/login', login);

// Products routes (basic skeleton)
app.get('/products', (_req, res) => {
  res.json([
    { id: 'sample-1', name: 'Sample Product', price: 0 }
  ]);
});

app.get('/products/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Sample Product', price: 0 });
});

// Orders routes (stubs)
app.post('/orders', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

app.get('/orders', (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend skeleton running on http://localhost:${PORT}`);
});
