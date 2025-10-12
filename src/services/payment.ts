export interface CreateOrderParams {
  amount: number;
  orderId: string;
  customerMobile: string;
  redirectUrl?: string;
  remark?: string;
}

export interface CreateOrderResponse {
  status: 'success' | 'error';
  message: string;
  payment_url?: string;
  order_id?: string;
  payment_data?: string;
  auto_check_every_2_sec?: string;
  utr_check?: string;
}

export interface OrderStatusResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    custumer_mobile: string;
    utr: string;
    remark: string;
    txn_id: string;
    create_at: string;
    order_id: string;
    status: string;
    amount: string;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const buildUrl = (path: string) => {
  const base = API_BASE?.trim();
  return `${base || ''}${path}`;
};

export const createPaymentOrder = async (
  params: CreateOrderParams
): Promise<CreateOrderResponse> => {
  try {
    const response = await fetch(buildUrl('/api/create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        orderId: params.orderId,
        customerMobile: params.customerMobile,
        redirectUrl: params.redirectUrl,
        remark: params.remark,
      }),
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      console.error('Unexpected non-JSON response from create-order:', text);
      return {
        status: 'error',
        message: `Payment service returned unexpected response: ${response.status} ${response.statusText}`,
      };
    }

    const data: CreateOrderResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Payment order creation failed:', error);
    return {
      status: 'error',
      message:
        'Unable to reach the payment service. Make sure the backend proxy (npm run server) is running and try again.',
    };
  }
};

export const fetchOrderStatus = async (
  orderId: string
): Promise<OrderStatusResponse> => {
  try {
    const response = await fetch(buildUrl('/api/order-status'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      console.error('Unexpected non-JSON response from order-status:', text);
      return {
        status: 'error',
        message: `Payment service returned unexpected response: ${response.status} ${response.statusText}`,
      };
    }

    const data: OrderStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Order status fetch failed:', error);
    return {
      status: 'error',
      message:
        'Unable to reach the payment service. Double-check that the backend proxy (npm run server) is still running and try again.',
    };
  }
};

export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD${timestamp}${random}`;
};
