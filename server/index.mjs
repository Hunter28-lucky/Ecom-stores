import express from 'express';
import cors from 'cors';
import {
  forwardToZapUpi,
  ZAPUPI_API_KEY,
  ZAPUPI_SECRET_KEY,
} from '../api/_utils.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/create-order', async (req, res) => {
  const { amount, orderId, customerMobile, redirectUrl, remark } = req.body;

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

  res.status(response.ok ? 200 : response.status).json(response.data);
});

app.post('/api/order-status', async (req, res) => {
  const { orderId } = req.body;

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

  res.status(response.ok ? 200 : response.status).json(response.data);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});
