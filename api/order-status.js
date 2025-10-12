import {
  forwardToZapUpi,
  parseRequestBody,
  ZAPUPI_API_KEY,
  ZAPUPI_SECRET_KEY,
} from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use POST.',
    });
  }

  const { orderId } = await parseRequestBody(req);

  if (!ZAPUPI_API_KEY || !ZAPUPI_SECRET_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'Payment gateway credentials are not configured on the server.',
    });
  }

  if (!orderId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: orderId',
    });
  }

  const response = await forwardToZapUpi('/api/order-status', {
    order_id: orderId,
  });

  return res.status(response.ok ? 200 : response.status).json(response.data);
}
