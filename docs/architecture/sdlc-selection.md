# SDLC Model Selection

CampusMarket uses a hybrid SDLC because the project has fixed academic requirements and fast-changing implementation details.

## Selected Process

| SDLC idea | Project use | Implementation evidence |
| --- | --- | --- |
| Waterfall | Requirements, BR/FR/NFR, schema, and acceptance criteria are documented before implementation. | `README.md`, `prisma/schema.prisma`, this `docs/architecture` folder. |
| Agile/Scrum | Features are delivered as small vertical slices: listing, order, payment, report, admin. | Server actions remain stable while services evolve behind them. |
| Spiral | High-risk areas are isolated and validated first. | Payment validation moved to `lib/services/payment-service.ts` and `lib/adapters/sslcommerz-adapter.ts`. |
| V-Model | Each business rule has a matching verification point. | Specifications in `lib/specifications` are designed to be unit-tested directly. |
| RAD/Prototyping | UI pages can continue to iterate while backend boundaries stabilize. | Page components still call the same exported actions from `lib/actions.ts`. |

## Process Rule for Future Developers

1. Update BR/FR/NFR documentation before changing behavior.
2. Put business rules in `lib/specifications`.
3. Put database access in `lib/repositories`.
4. Put use-case orchestration in `lib/services`.
5. Keep `lib/actions.ts` as the controller layer for form parsing, redirects, and revalidation.
6. Verify the use case with TypeScript and at least one manual UI path.
