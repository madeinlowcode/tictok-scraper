export class AggregateLayerError extends Error {
  public readonly errors: Error[];

  constructor(errors: Error[]) {
    const messages = errors.map((e, i) => `Layer ${i + 1}: ${e.message}`).join('; ');
    super(`All layers failed: ${messages}`);
    this.name = 'AggregateLayerError';
    this.errors = errors;
  }
}

export async function withFallback<T>(
  layers: Array<() => Promise<T>>,
): Promise<T> {
  const errors: Error[] = [];

  for (const layer of layers) {
    try {
      return await layer();
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  throw new AggregateLayerError(errors);
}
