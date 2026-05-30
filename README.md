# SEU Campus Market

Southeast University student marketplace.
It uses Next.js for frontend/backend, shadcn-style Tailwind components, Prisma, and PostgreSQL.

## Main Features

- SEU email registration, demo verification token, login, and signed session cookie
- Product listings with category, price, image URL, unique product code, search, and filters
- Seller profile with listings, ratings, and reviews
- Order placement with safe campus meetup point, quantity, status tracking, and payment confirmation
- Buyer/seller order history, transaction records, notifications, reports, and seller dashboard
- Numeric SEU student email registration, e.g. `2024000000001@seu.edu.bd`
- Seller listing edit, hide, sold, and delete/archive controls
- Buyer cancellation, seller rejection notes, payment references, and contact reveal after confirmation
- Editable seller profiles, password change, unread notifications, and admin report moderation

## Run Locally

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Install and prepare the database:

```bash
npm install
npm run db:push
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

## Seed Accounts

All seed users use password `password123`.

```text
Student seller: 2024000000001@seu.edu.bd
Student buyer:  2024000000002@seu.edu.bd
Admin:          2024000000999@seu.edu.bd
```

## Deploy

Set these environment variables in your host:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
SESSION_SECRET="generate-a-long-random-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.example"
```

Prepare the database before the first production start:

```bash
npm ci
npm run db:push
npm run build
npm run start
```

Docker is also supported:

```bash
docker build -t seu-campus-market .
docker run -p 3000:3000 --env-file .env seu-campus-market
```

