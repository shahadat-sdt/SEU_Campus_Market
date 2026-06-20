# Risk Register

| Risk | Impact | Current control | Next recommended work |
| --- | --- | --- | --- |
| Payment callback spoofing | Orders could be marked paid without actual payment. | SSLCommerz callback now validates `val_id`, transaction id, and amount before marking paid. | Store transaction audit records in a dedicated payment table. |
| Oversized server action file | Hard to test and easy to regress. | Core use cases moved into services, repositories, and specifications. | Continue moving profile, auth, vote, and wishlist logic into services. |
| External provider downtime | Upload or payment can hang or fail. | Fetch decorators add timeout and retry. | Add visible retry guidance in the UI. |
| Weak validation consistency | Different pages may enforce different rules. | Listing/order rules moved to specifications. | Add unit tests for every specification. |
| Admin misuse | Role and moderation changes affect the whole marketplace. | Admin commands centralize moderation and role-change checks. | Add audit logs for admin commands. |
