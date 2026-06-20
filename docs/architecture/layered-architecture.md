# Layered Architecture

CampusMarket is a modular monolith. It stays deployable as one Next.js app, but the code is split into clear internal layers.

## Layers

| Layer | Folder | Responsibility |
| --- | --- | --- |
| View | `app`, `components` | Render pages, forms, and client interactions. |
| Controller | `lib/actions.ts`, `app/api/**/route.ts` | Parse inputs, call services, redirect, return API responses. |
| Service | `lib/services` | Coordinate complete use cases such as creating a listing or placing an order. |
| Specification | `lib/specifications` | Hold testable business rules and validation decisions. |
| Repository | `lib/repositories` | Own Prisma queries and persistence details. |
| Adapter | `lib/adapters` | Hide external provider APIs such as Cloudinary and SSLCommerz. |
| Strategy | `lib/strategies` | Swap behavior for payments and notifications. |
| Event | `lib/events` | Dispatch domain events to observers such as notifications and emails. |
| Factory | `lib/factories` | Build consistent codes, reports, and notification payloads. |
| Command | `lib/commands` | Encapsulate admin operations that must be auditable and repeatable. |

## Dependency Rule

Higher layers may call lower layers. Lower layers must not import page components or server actions.

Good:

```ts
server action -> service -> specification -> repository
```

Avoid:

```ts
repository -> service
repository -> app page
adapter -> server action
```
