# SEU Campus Market

A compact ISD project for a Southeast University student marketplace. It uses Next.js for frontend/backend, shadcn-style Tailwind components, Prisma, and PostgreSQL.

## Main Features

- SEU email registration, demo verification token, login, and signed session cookie
- Product listings with category, price, image URL, unique product code, search, and filters
- Seller profile with listings, ratings, and reviews
- Order placement with safe campus meetup point, quantity, status tracking, and payment confirmation
- Buyer/seller order history, transaction records, notifications, reports, and seller dashboard

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

Seed users all use password `password123`, for example `hiya@seu.edu.bd`.
