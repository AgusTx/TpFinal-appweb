import express, { Request, Response } from 'express';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const categories = ['accesorios', 'pantallas', 'audio'];
const products: Product[] = [
  { id: 'sample-1', name: 'Mouse Gamer', price: 1299, category: 'accesorios' },
  { id: 'sample-2', name: 'Teclado Mecánico', price: 2599, category: 'accesorios' },
  { id: 'sample-3', name: 'Monitor 24"', price: 3999, category: 'pantallas' },
  { id: 'sample-4', name: 'Auriculares RGB', price: 1899, category: 'audio' },
];

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'product' }));

app.get('/categories', (_req: Request, res: Response) => {
  res.json(categories);
});

app.get('/products', (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice } = req.query as Record<string, string | undefined>;
  let result = [...products];

  if (q && q.trim().length > 0) {
    const term = q.toLowerCase();
    result = result.filter((product) =>
      product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term)
    );
  }

  if (category && category.trim().length > 0) {
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

app.get('/products/:id', (req: Request, res: Response) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

app.post('/products', (req: Request, res: Response) => {
  const { name, price, category } = req.body as Partial<Product>;
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

  const newProduct: Product = {
    id: `product-${Date.now()}`,
    name: name.trim(),
    price: price as number,
    category: category.toLowerCase().trim(),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put('/products/:id', (req: Request, res: Response) => {
  const { name, price, category } = req.body as Partial<Product>;
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

  const updatedProduct: Product = {
    id: products[productIndex].id,
    name: name.trim(),
    price: price as number,
    category: category.toLowerCase().trim(),
  };

  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
});

const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`Product service running on http://localhost:${PORT}`);
});
