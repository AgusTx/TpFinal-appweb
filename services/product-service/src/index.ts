import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'product' }));

app.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories.map((c) => c.name));
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

app.get('/products', async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query as Record<string, string | undefined>;
    const filters: any = {};

    if (category && category.trim().length > 0) {
      const cat = await prisma.category.findUnique({ where: { name: category.toLowerCase().trim() } });
      if (cat) filters.categoryId = cat.id;
    }

    if (typeof minPrice === 'string') {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) filters.price = { gte: min };
    }

    if (typeof maxPrice === 'string') {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        filters.price = filters.price ? { ...filters.price, lte: max } : { lte: max };
      }
    }

    let products = await prisma.product.findMany({ where: filters, include: { category: true } });

    if (q && q.trim().length > 0) {
      const term = q.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(term) || p.category.name.toLowerCase().includes(term));
    }

    res.json(products.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category.name })));
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

app.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ id: product.id, name: product.name, price: product.price, category: product.category.name });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

app.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, price, category } = req.body as { name?: string; price?: number; category?: string };
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      errors.push('name must be at least 3 characters');
    }
    if (typeof price !== 'number' || price <= 0) {
      errors.push('price must be a positive number');
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('category is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const normalizedCategory = category!.toLowerCase().trim();
    let cat = await prisma.category.findUnique({ where: { name: normalizedCategory } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: normalizedCategory } });
    }

    const newProduct = await prisma.product.create({
      data: { name: name!.trim(), price: price!, categoryId: cat.id },
      include: { category: true },
    });

    res.status(201).json({ id: newProduct.id, name: newProduct.name, price: newProduct.price, category: newProduct.category.name });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

app.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, price, category } = req.body as { name?: string; price?: number; category?: string };
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      errors.push('name must be at least 3 characters');
    }
    if (typeof price !== 'number' || price <= 0) {
      errors.push('price must be a positive number');
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('category is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const normalizedCategory = category!.toLowerCase().trim();
    let cat = await prisma.category.findUnique({ where: { name: normalizedCategory } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: normalizedCategory } });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { name: name!.trim(), price: price!, categoryId: cat.id },
      include: { category: true },
    });

    res.json({ id: updatedProduct.id, name: updatedProduct.name, price: updatedProduct.price, category: updatedProduct.category.name });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

const PORT = process.env.PORT || 4200;
app.listen(PORT, async () => {
  console.log(`Product service running on http://localhost:${PORT}`);
  // Seed initial categories if empty
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'accesorios' },
        { name: 'pantallas' },
        { name: 'audio' },
      ],
    });
    console.log('Initial categories seeded');
  }
});

