export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code = "DOMAIN_ERROR"
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
