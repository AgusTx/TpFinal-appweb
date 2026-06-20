import express, { Request, Response } from 'express';

interface OrderItem {
  productId: string;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

const orders: Order[] = [];
const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'order' }));

app.get('/orders', (_req: Request, res: Response) => {
  res.json(orders);
});

app.post('/orders', (req: Request, res: Response) => {
  const { userId, items } = req.body as { userId?: string; items?: OrderItem[] };
  const errors: string[] = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required');
  }
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    items.forEach((item, index) => {
      if (!item.productId || typeof item.productId !== 'string') {
        errors.push(`items[${index}].productId is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`items[${index}].quantity must be a positive number`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const total = items.reduce((sum, item) => sum + item.quantity * 0, 0);
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    userId: userId.trim(),
    items,
    total,
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

const PORT = process.env.PORT || 4300;
app.listen(PORT, () => {
  console.log(`Order service running on http://localhost:${PORT}`);
});
