import "server-only";

export abstract class ListingWriteWorkflow<TInput, TResult> {
  async execute(input: TInput) {
    await this.validate(input);
    await this.authorize(input);
    const result = await this.persist(input);
    await this.afterPersist(input, result);
    return result;
  }

  protected abstract validate(input: TInput): Promise<void> | void;
  protected abstract authorize(input: TInput): Promise<void> | void;
  protected abstract persist(input: TInput): Promise<TResult>;

  protected afterPersist(_input: TInput, _result: TResult): Promise<void> | void {
    return undefined;
  }
}
