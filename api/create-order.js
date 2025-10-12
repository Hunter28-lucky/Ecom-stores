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

  const { amount, orderId, customerMobile, redirectUrl, remark } = await parseRequestBody(req);

  if (!ZAPUPI_API_KEY || !ZAPUPI_SECRET_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'Payment gateway credentials are not configured on the server.',
    });
  }

  if (!amount || !orderId || !customerMobile) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: amount, orderId, and customerMobile are required.',
    });
  }

  const response = await forwardToZapUpi('/api/create-order', {
    amount,
    order_id: orderId,
    custumer_mobile: customerMobile,
    redirect_url: redirectUrl,
    remark,
  });

  return res.status(response.ok ? 200 : response.status).json(response.data);
}
