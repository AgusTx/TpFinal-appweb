/**
 * Domain Events Definitions
 * Eventos que pueden emitirse entre microservicios
 */

export interface DomainEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  aggregateId: string;
  payload: Record<string, any>;
}

// ============ ORDER EVENTS ============

export interface OrderCreatedEvent extends DomainEvent {
  eventType: 'OrderCreated';
  payload: {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
  };
}

// ============ CATALOG/STOCK EVENTS ============

export interface StockReservedEvent extends DomainEvent {
  eventType: 'StockReserved';
  payload: {
    orderId: string;
    productId: string;
    quantity: number;
    reservedAt: string;
  };
}

export interface StockRejectedEvent extends DomainEvent {
  eventType: 'StockRejected';
  payload: {
    orderId: string;
    reason: string;
    rejectedAt: string;
  };
}

// ============ PAYMENT EVENTS ============

export interface PaymentApprovedEvent extends DomainEvent {
  eventType: 'PaymentApproved';
  payload: {
    orderId: string;
    amount: number;
    transactionId: string;
    approvedAt: string;
  };
}

export interface PaymentFailedEvent extends DomainEvent {
  eventType: 'PaymentFailed';
  payload: {
    orderId: string;
    reason: string;
    failedAt: string;
  };
}

// Type union of all events
export type AnyDomainEvent =
  | OrderCreatedEvent
  | StockReservedEvent
  | StockRejectedEvent
  | PaymentApprovedEvent
  | PaymentFailedEvent;

/**
 * Event type discriminator
 * Útil para type narrowing en consumidores
 */
export const EventTypes = {
  ORDER_CREATED: 'OrderCreated',
  STOCK_RESERVED: 'StockReserved',
  STOCK_REJECTED: 'StockRejected',
  PAYMENT_APPROVED: 'PaymentApproved',
  PAYMENT_FAILED: 'PaymentFailed'
} as const;
