import { describe, it, expect, vi } from 'vitest';
import { withFallback, AggregateLayerError } from '../../../src/utils/with-fallback.js';

describe('withFallback', () => {
  it('should return result from first layer when it succeeds', async () => {
    const layer1 = vi.fn().mockResolvedValue('layer1-result');
    const layer2 = vi.fn().mockResolvedValue('layer2-result');

    const result = await withFallback([layer1, layer2]);

    expect(result).toBe('layer1-result');
    expect(layer2).not.toHaveBeenCalled();
  });

  it('should fall back to second layer when first fails', async () => {
    const layer1 = vi.fn().mockRejectedValue(new Error('layer1 failed'));
    const layer2 = vi.fn().mockResolvedValue('layer2-result');

    const result = await withFallback([layer1, layer2]);

    expect(result).toBe('layer2-result');
    expect(layer1).toHaveBeenCalled();
    expect(layer2).toHaveBeenCalled();
  });

  it('should throw AggregateLayerError when all layers fail', async () => {
    const layer1 = vi.fn().mockRejectedValue(new Error('fail1'));
    const layer2 = vi.fn().mockRejectedValue(new Error('fail2'));
    const layer3 = vi.fn().mockRejectedValue(new Error('fail3'));

    await expect(withFallback([layer1, layer2, layer3])).rejects.toThrow(AggregateLayerError);

    try {
      await withFallback([layer1, layer2, layer3]);
    } catch (error) {
      const aggError = error as AggregateLayerError;
      expect(aggError.errors).toHaveLength(3);
      expect(aggError.errors[0]!.message).toBe('fail1');
      expect(aggError.errors[1]!.message).toBe('fail2');
      expect(aggError.errors[2]!.message).toBe('fail3');
    }
  });

  it('should handle single layer success', async () => {
    const result = await withFallback([() => Promise.resolve('only')]);
    expect(result).toBe('only');
  });

  it('should handle single layer failure', async () => {
    await expect(
      withFallback([() => Promise.reject(new Error('only-fail'))]),
    ).rejects.toThrow('All layers failed');
  });
});
