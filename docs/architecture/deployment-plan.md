# Deployment Plan

1. Set environment variables for database, session secret, Cloudinary, and SSLCommerz.
2. Run `npm run db:migrate` on the deployment database.
3. Run `npm run build`.
4. Smoke test login, listing creation, order creation, payment checkout start, image upload, and admin moderation.
5. Monitor failed payment callbacks and upload failures after release.

## Required Environment Variables

- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL` as an alternative to the three separate Cloudinary values
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASS`
- `SSLCOMMERZ_BASE_URL`
- `SSLCOMMERZ_VALIDATION_URL`

## Optional Environment Variables

- `BREVO_API_KEY`
- `BREVO_SENDER_NAME`
- `BREVO_SENDER_EMAIL`
