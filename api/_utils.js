import dotenv from 'dotenv';

dotenv.config();

const ZAPUPI_API_KEY = process.env.ZAPUPI_API_KEY;
const ZAPUPI_SECRET_KEY = process.env.ZAPUPI_SECRET_KEY;

if (!ZAPUPI_API_KEY || !ZAPUPI_SECRET_KEY) {
  console.warn('[zapupi] Missing ZAPUPI_API_KEY or ZAPUPI_SECRET_KEY environment variables.');
}

const zapUpiBaseUrl = 'https://api.zapupi.com';

const buildSearchParams = (params) => {
  const form = new URLSearchParams();
  form.append('token_key', ZAPUPI_API_KEY ?? '');
  form.append('secret_key', ZAPUPI_SECRET_KEY ?? '');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });

  return form;
};

const parseRequestBody = async (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
};

const forwardToZapUpi = async (endpoint, params) => {
  try {
    const body = buildSearchParams(params);
    const response = await fetch(`${zapUpiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json().catch(() => ({
      status: 'error',
      message: 'Unexpected response from payment gateway',
    }));

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[zapupi] Request to ${endpoint} failed`, error);
    return {
      ok: false,
      status: 500,
      data: {
        status: 'error',
        message: 'Unable to reach payment gateway. Please try again later.',
      },
    };
  }
};

export {
  ZAPUPI_API_KEY,
  ZAPUPI_SECRET_KEY,
  parseRequestBody,
  forwardToZapUpi,
};
