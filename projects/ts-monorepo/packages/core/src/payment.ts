export interface Order {
  quantity: number;
  status: 'pending' | 'paid';
  transactionId?: string;
}

export interface ShopState {
  stock: number;
  orders: Record<string, Order>;
}

export interface PaymentNotification {
  orderId: string;
  transactionId: string;
}

export function applyPayment(state: ShopState, notification: PaymentNotification): ShopState {
  const order = state.orders[notification.orderId];
  if (!order) throw new Error('Order not found');
  if (!notification.transactionId.trim()) throw new Error('Transaction ID is required');
  if (!Number.isSafeInteger(order.quantity) || order.quantity <= 0) {
    throw new RangeError('Order quantity must be a positive integer');
  }
  if (state.stock < order.quantity) throw new RangeError('Insufficient stock');

  return {
    ...state,
    stock: state.stock - order.quantity,
    orders: {
      ...state.orders,
      [notification.orderId]: {
        ...order,
        status: 'paid',
        transactionId: notification.transactionId,
      },
    },
  };
}
