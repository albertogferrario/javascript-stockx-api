const { getMillisecondsToNextCronExpressionTick, timeoutPromise } = require('../src/utilities');

describe('utilities', () => {
  describe('getMillisecondsToNextCronExpressionTick', () => {
    it('should calculate milliseconds to next cron tick', () => {
      // Every minute cron
      const result = getMillisecondsToNextCronExpressionTick('* * * * *');
      
      // Should be less than or equal to 60000ms (1 minute)
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(60000);
    });

    it('should handle daily cron expression', () => {
      const result = getMillisecondsToNextCronExpressionTick('0 0 * * *');
      
      // Should be positive and less than 24 hours in milliseconds
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });

  describe('timeoutPromise', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await timeoutPromise(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject if timeout occurs first', async () => {
      const promise = new Promise(() => {}); // Never resolves
      const timeoutPromiseResult = timeoutPromise(promise, 100);

      jest.advanceTimersByTime(101);

      await expect(timeoutPromiseResult).rejects.toThrow('Request timed out');
    });

    it('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('Original error'));
      await expect(timeoutPromise(promise, 1000)).rejects.toThrow('Original error');
    });

    it('should handle promises that resolve after timeout', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const timeoutPromiseResult = timeoutPromise(promise, 100);

      // Advance timer to trigger timeout
      jest.advanceTimersByTime(101);

      // Try to resolve the original promise after timeout
      resolvePromise('too late');

      await expect(timeoutPromiseResult).rejects.toThrow('Request timed out');
    });
  });
});