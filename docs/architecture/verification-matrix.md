# Verification Matrix

| Requirement area | Code to verify | Suggested check |
| --- | --- | --- |
| Listing create/update | `lib/services/listing-service.ts` | Invalid title, category, image URL, and price should redirect with error. |
| Listing duplicate protection | `lib/services/listing-service.ts` | Submitting the same listing twice within five seconds redirects to the existing listing. |
| Category follow notification | `lib/events/domain-event-bus.ts` | Followers receive a notification when a matching active listing is published. |
| Order placement | `lib/services/order-service.ts` | Buyer cannot order own listing or request more than available stock. |
| Seller order update | `lib/services/order-service.ts` | Buyer receives in-app and email notification on status change. |
| Payment checkout | `lib/services/payment-service.ts` | Only the buyer can start checkout for a non-cancelled order. |
| Payment callback | `lib/adapters/sslcommerz-adapter.ts` | Callback only marks paid when gateway validation succeeds. |
| Image upload | `lib/adapters/cloudinary-adapter.ts` | Non-image files are rejected before provider upload. |
| Admin role change | `lib/commands/admin-commands.ts` | Admin cannot demote themselves or remove the final admin. |
| Browse search | `lib/builders/listing-query-builder.ts` | Category, text search, and sort produce correct Prisma query input. |
