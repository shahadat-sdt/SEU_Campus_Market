# Maintenance Plan

## Weekly

- Review unresolved reports.
- Check payment callback failures.
- Check Cloudinary upload failures.
- Confirm at least one admin account remains active.

## Before Each Feature Change

- Identify the affected BR/FR/NFR.
- Update or add a specification function.
- Add or update a service use case.
- Keep database access inside a repository.
- Add a verification entry to `docs/architecture/verification-matrix.md`.

## Refactoring Backlog

- Move authentication registration and password changes into an account service.
- Move vote and wishlist behavior into an interaction service.
- Add audit logging for admin commands.
- Add automated tests for specifications and services.
