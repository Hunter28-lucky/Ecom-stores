# Premium Mobile Checkout

A polished mobile-first React + Vite landing and checkout experience featuring secure ZapUPI payment collection. The flow now uses a lightweight Express proxy so the public site never exposes payment credentials and provides an in-app QR code once an order is created.

## Requirements

- Node.js 18+ (for built-in `fetch` and `--env-file` support)
- npm 9+
- ZapUPI merchant credentials (token & secret)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file using the sample and add your ZapUPI keys:

```bash
cp .env.example .env
# open .env and set ZAPUPI_API_KEY / ZAPUPI_SECRET_KEY
```

3. Optional: if your backend proxy will live on a different domain, expose it to the client by setting `VITE_API_BASE_URL` in a `.env.local` file (e.g. `VITE_API_BASE_URL=https://your-backend.example.com`). By default the frontend talks to the same origin.

## Running locally

Start both the API proxy and the Vite dev server:

```bash
npm run dev:full
```

That runs:

- `npm run server` — Express proxy on `http://localhost:4000` (port can be overridden via `PORT` in `.env`)
- `npm run dev` — Vite dev server on `http://localhost:5173`

> Prefer a manual split? Run `npm run server` in one terminal and `npm run dev` in another.

## Building for production

```bash
npm run build
```

The static bundle is emitted to `dist/`. Deploy the Express server alongside it (e.g. as a small Node app or serverless function) and make sure it receives the same environment variables.

## Deployment checklist

- Never expose ZapUPI keys in the browser; keep them in server-side config only.
- Ensure the backend exposes `/api/create-order` and `/api/order-status` routes as provided in `server/index.mjs`.
- If hosting the frontend on a separate origin, set `VITE_API_BASE_URL` to the proxy’s public URL before building.
- Optionally schedule `npm audit` upgrades to address the moderate vulnerabilities reported by npm.

## Deploying on Vercel

This repo is preconfigured for Vercel’s static hosting + serverless functions stack:

1. **Import the project** into Vercel and choose the default `npm install` / `npm run build` pipeline (already declared in `vercel.json`).
2. **Set environment variables** in the Vercel dashboard (`Settings → Environment Variables`):
	- `ZAPUPI_API_KEY`
	- `ZAPUPI_SECRET_KEY`
	- Optionally `VITE_API_BASE_URL` if you expose a different proxy domain.
3. Deploy. The Vite build is served from `dist/`, while the `/api/create-order` and `/api/order-status` calls are handled by the serverless functions under `api/`.

> Need local parity with Vercel? Continue using `npm run dev:full` (Express proxy + Vite) so the browser still talks to `/api/*` paths and mirrors production.

## Order flow

1. User lands on the product page and taps **Buy Now**.
2. Checkout opens with the customer detail form at the top.
3. After submitting, the server creates a ZapUPI order and sends back `payment_url`/`payment_data`.
4. The app displays a QR code, direct payment link, and tools to copy the order ID or poll order status.

Happy shipping! 🛒
