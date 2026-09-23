# ORVIX

Autonomous customer support and root-cause engine.

## Phase 1: backend and seeded business data

The Phase 1 backend includes Express, TypeScript, Mongoose models, a MongoDB connection, and deterministic demo records for:

- Customers
- Orders
- Payments
- Refunds
- Support tickets
- Company policies

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` to a MongoDB Atlas or local MongoDB connection string. Keep `.env` private.
3. Optionally set `MONGO_DB_NAME` and `PORT`.
4. Install dependencies with `pnpm install` or `npm install`.
5. Seed the database:

```bash
pnpm seed
```

6. Start the API:

```bash
pnpm dev
```

The health endpoint is available at `http://localhost:4000/api/health`.

## Verification

The current Phase 1 source passes the TypeScript compiler:

```bash
./node_modules/.bin/tsc -p server/tsconfig.json
```

The seed command requires a reachable MongoDB instance configured through `MONGO_URI`.
