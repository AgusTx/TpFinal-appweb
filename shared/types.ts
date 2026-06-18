/**
 * Tipos compartidos entre frontend y backend para la Fase 1.
 * Son definiciones mínimas pensadas como esqueleto.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  createdAt?: string; // ISO date
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number; // price at time of order
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status?: 'pending' | 'paid' | 'shipped' | 'cancelled';
  createdAt?: string;
}
