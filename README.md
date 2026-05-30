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
2. Create a PostgreSQL database locally or with a free hosted provider such as Neon or Supabase, then set `DATABASE_URL` in `.env`.
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

## Deploy On Vercel Free

1. Push the `dev` branch to GitHub.
2. In Vercel, import the repository and choose the branch you want to deploy.
3. Create a free hosted PostgreSQL database with Neon, Supabase, or another provider.
   Use the pooled connection string for Vercel if your provider offers one.
4. Add these environment variables in Vercel Project Settings:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
SESSION_SECRET="generate-a-long-random-secret"
```

5. Use the default Vercel install command and this build command:

```bash
npm run build
```

6. Push the Prisma schema to the hosted database from your local machine before first use. Temporarily set your local `.env` `DATABASE_URL` to the same hosted database URL, then run:

```bash
npm run db:push
npm run db:seed
```

7. Deploy from Vercel. The app is ready when the deployment has the same `DATABASE_URL` and `SESSION_SECRET` values.
