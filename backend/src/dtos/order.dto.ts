export interface OrderItemDto {
  productId: string;
  quantity: number;
  price?: number;
}

export interface CreateOrderDto {
  userId: string;
  items: OrderItemDto[];
  address?: string;
  phone?: string;
}

export interface UpdateOrderDto {
  status?: 'pending' | 'paid' | 'shipped' | 'cancelled';
}
