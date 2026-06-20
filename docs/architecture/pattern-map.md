# Design Pattern Map

| Pattern | Files | Why it exists |
| --- | --- | --- |
| Repository | `lib/repositories/*` | Keeps Prisma access out of controllers and services. |
| Service Layer | `lib/services/*` | Gives each use case one place for orchestration. |
| Specification | `lib/specifications/*` | Makes business rules reusable and testable. |
| Factory | `lib/factories/*` | Creates consistent listing codes, reports, and notifications. |
| Strategy | `lib/strategies/payment-strategy.ts`, `lib/strategies/notification-strategy.ts` | Allows payment and notification behavior to change without rewriting use cases. |
| Adapter | `lib/adapters/cloudinary-adapter.ts`, `lib/adapters/sslcommerz-adapter.ts` | Isolates external provider request formats and errors. |
| Observer | `lib/events/domain-event-bus.ts` | Lets listing, order, payment, and comment events trigger notifications without hard-coding every side effect in actions. |
| Command | `lib/commands/admin-commands.ts` | Encapsulates admin moderation and role-change operations. |
| Builder | `lib/builders/listing-query-builder.ts` | Builds listing search filters without cluttering the buy page. |
| Decorator | `lib/decorators/fetch-decorators.ts` | Adds timeout and retry behavior around external fetch calls. |
| Template Method | `lib/templates/listing-write-workflow.ts` | Standardizes listing write steps: validate, authorize, persist, run side effects. |

## Demo Paths

Use these paths when explaining the architecture:

1. Create listing: `lib/actions.ts` -> `lib/services/listing-service.ts` -> `lib/templates/listing-write-workflow.ts` -> `lib/repositories/listing-repository.ts` -> `lib/events/domain-event-bus.ts`.
2. Place order: `lib/actions.ts` -> `lib/services/order-service.ts` -> `lib/specifications/order-specification.ts` -> `lib/repositories/order-repository.ts` -> `lib/events/domain-event-bus.ts`.
3. Start payment: `app/api/payments/sslcommerz/route.ts` -> `lib/services/payment-service.ts` -> `lib/strategies/payment-strategy.ts` -> `lib/adapters/sslcommerz-adapter.ts`.
4. Upload image: `app/api/uploads/cloudinary/route.ts` -> `lib/adapters/cloudinary-adapter.ts` -> `lib/decorators/fetch-decorators.ts`.
