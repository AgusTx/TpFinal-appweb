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
const categories = ['accesorios', 'pantallas', 'audio'];
const products = [
  { id: 'sample-1', name: 'Mouse Gamer', price: 1299, category: 'accesorios' },
  { id: 'sample-2', name: 'Teclado Mecánico', price: 2599, category: 'accesorios' },
  { id: 'sample-3', name: 'Monitor 24"', price: 3999, category: 'pantallas' },
  { id: 'sample-4', name: 'Auriculares RGB', price: 1899, category: 'audio' }
];

app.get('/products', (req: express.Request, res: express.Response) => {
  const { q, category, minPrice, maxPrice } = req.query;
  let result = [...products];

  if (typeof q === 'string' && q.trim().length > 0) {
    const term = q.toLowerCase();
    result = result.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }

  if (typeof category === 'string' && category.trim().length > 0) {
    result = result.filter((product) => product.category.toLowerCase() === category.toLowerCase());
  }

  const min = Number(minPrice);
  if (!Number.isNaN(min)) {
    result = result.filter((product) => product.price >= min);
  }

  const max = Number(maxPrice);
  if (!Number.isNaN(max)) {
    result = result.filter((product) => product.price <= max);
  }

  res.json(result);
});

app.get('/categories', (_req: express.Request, res: express.Response) => {
  res.json(categories);
});

app.post('/products', (req: express.Request, res: express.Response) => {
  const { name, price, category } = req.body as { name?: string; price?: number; category?: string };
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    errors.push('name must be at least 3 characters');
  }
  if (typeof price !== 'number' || price <= 0) {
    errors.push('price must be a positive number');
  }
  if (!category || typeof category !== 'string' || !categories.includes(category.toLowerCase())) {
    errors.push(`category must be one of: ${categories.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const id = `product-${Date.now()}`;
  const validatedName = name!.trim();
  const validatedPrice = price as number;
  const validatedCategory = category!.toLowerCase();
  const newProduct = { id, name: validatedName, price: validatedPrice, category: validatedCategory };
  products.push(newProduct);
  return res.status(201).json(newProduct);
});

app.put('/products/:id', (req: express.Request, res: express.Response) => {
  const { name, price, category } = req.body as { name?: string; price?: number; category?: string };
  const productIndex = products.findIndex((item) => item.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const errors: string[] = [];
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    errors.push('name must be at least 3 characters');
  }
  if (typeof price !== 'number' || price <= 0) {
    errors.push('price must be a positive number');
  }
  if (!category || typeof category !== 'string' || !categories.includes(category.toLowerCase())) {
    errors.push(`category must be one of: ${categories.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const updatedProduct = {
    ...products[productIndex],
    name: name!.trim(),
    price: price as number,
    category: category!.toLowerCase(),
  };

  products[productIndex] = updatedProduct;
  return res.json(updatedProduct);
});

app.get('/products/:id', (req: express.Request, res: express.Response) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
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
