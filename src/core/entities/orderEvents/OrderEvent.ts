export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateOrderEventData {
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
}
