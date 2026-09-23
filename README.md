# ORVIX

ORVIX is a customer-support and root-cause investigation prototype. It routes an issue to a specialist, checks customer orders, payments, refunds, support tickets, and company policies, then answers from those records. It opens a stored support ticket when the case needs a human review.

## What is implemented

- Billing, delivery, account, and technical issue routing, with English and common Hinglish keywords.
- Grounded investigations over MongoDB customer, order, payment, refund, ticket, and policy records.
- Follow-up responses that explain known causes and resolutions, including order cancellation and refund status.
- A deterministic mock responder that runs without a model API key.
- Optional Gemini intent classification and response wording. Verified business records remain the source of facts.
- A human agent inbox for open support cases, showing the investigation and conversation and letting an agent reply and resolve the case.
- Safe, repeatable demo seeding: `pnpm seed` only inserts demo records that are missing; it does not delete existing records.

The agent inbox is an in-app prototype queue; it does not send notifications or sync with an external ticketing platform. Open cases are visible from the **Agent inbox** button, and agents can reply and resolve a case there. Customer conversation history shows the agent reply after reload.

## Requirements

- Node.js 20 or later
- pnpm 9 or later
- MongoDB running locally or an Atlas connection URI

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` and optionally `MONGO_DB_NAME` for your MongoDB database. Keep `.env` private.
3. Install packages with `pnpm install`.
4. Add the deterministic demo records with `pnpm seed`. This is safe to rerun and does not overwrite existing records.
5. Start the API and web client together with `node scripts/dev-all.mjs` (or `pnpm dev:all` after dependencies are installed).

The web client runs at `http://localhost:5173`; the API runs at `http://localhost:4000`. The health endpoint is `http://localhost:4000/api/health`.

## Optional Gemini setup

The default `LLM_PROVIDER=mock` uses local routing and response templates. To enable Gemini:

1. Set `LLM_PROVIDER=gemini` in `.env`.
2. Set `LLM_API_KEY` to a Gemini API key in `.env`; do not commit or share the key.
3. Set `LLM_MODEL` if you want to select a different supported Gemini model.

When Gemini is unavailable, ORVIX falls back to local intent routing and grounded response templates. The model is instructed to use the verified investigation and retrieved policy evidence, and it cannot create a refund or other business action.

## API

- `GET /api/health` — API health
- `POST /api/chat` — submit `{ "customerId": "CUS_1001", "message": "Why was my order cancelled?" }`
- `GET /api/chat/:customerId` — restore a customer's latest conversation
- `GET /api/support/tickets` — list open cases for the in-app agent inbox
- `POST /api/support/tickets/:ticketId/replies` — reply to and resolve an open case
- `GET /api/customers/:id/tickets` — retrieve tickets for a demo customer
- `GET /api/customers/:id` — customer record
- `GET /api/orders/:id`, `GET /api/payments/:id`, `GET /api/refunds/:id` — business records by ID

Demo customers include Rahul Sharma (`CUS_1001`), Aisha Mehta (`CUS_1002`), and Vikram Rao (`CUS_1003`).
