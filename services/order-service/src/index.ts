import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'order' }));

app.get('/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true } });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

app.post('/orders', async (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body as { userId?: string; items?: Array<{ productId: string; quantity: number }> };
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

    const newOrder = await prisma.order.create({
      data: {
        userId: userId.trim(),
        status: 'PENDING',
        total: 0,
        items: {
          create: items!.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

const PORT = process.env.PORT || 4300;
app.listen(PORT, () => {
  console.log(`Order service running on http://localhost:${PORT}`);
});

