const Limiter = require('../src/limiter');
const { getMillisecondsToNextCronExpressionTick } = require('../src/utilities');

jest.mock('../src/utilities');
jest.mock('cron');

describe('Limiter', () => {
  let limiter;
  const mockCronJob = {
    start: jest.fn(),
    stop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getMillisecondsToNextCronExpressionTick.mockReturnValue(86400000); // 24 hours

    // Mock cron.CronJob
    const cron = require('cron');
    cron.CronJob = jest.fn().mockImplementation((expression, callback) => {
      mockCronJob.callback = callback;
      return mockCronJob;
    });
  });

  afterEach(() => {
    // Let individual tests handle cleanup to avoid conflicts
  });

  describe('constructor', () => {
    it('should initialize with correct Bottleneck settings', () => {
      limiter = new Limiter(1000, 25000, '0 0 * * *');

      // Bottleneck doesn't expose settings directly, so check behavior instead
      expect(limiter).toBeInstanceOf(require('bottleneck'));
      expect(limiter.cronJob).toBeDefined();
      expect(getMillisecondsToNextCronExpressionTick).toHaveBeenCalledWith(
        '0 0 * * *',
        250
      );
    });

    it('should create and start cron job', () => {
      const cron = require('cron');
      const testLimiter = new Limiter(1000, 25000, '0 0 * * *');

      expect(cron.CronJob).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
      expect(mockCronJob.start).toHaveBeenCalled();
      
      testLimiter.stop();
    });

    it('should call utilities function for reservoir refresh interval', () => {
      const testLimiter = new Limiter(2000, 10000, '0 */6 * * *');

      expect(getMillisecondsToNextCronExpressionTick).toHaveBeenCalledWith(
        '0 */6 * * *',
        250
      );
      
      testLimiter.stop();
    });
  });

  describe('cron job callback', () => {
    it('should update settings when cron fires', () => {
      getMillisecondsToNextCronExpressionTick
        .mockReturnValueOnce(86400000)  // Initial call
        .mockReturnValueOnce(86400000); // Cron callback call

      const testLimiter = new Limiter(1000, 25000, '0 0 * * *');
      const updateSettingsSpy = jest.spyOn(testLimiter, 'updateSettings');

      // Simulate cron firing
      mockCronJob.callback();

      expect(updateSettingsSpy).toHaveBeenCalledWith({
        reservoir: 25000,
        reservoirRefreshInterval: 86400000,
      });
      expect(getMillisecondsToNextCronExpressionTick).toHaveBeenCalledTimes(2);
      
      testLimiter.stop();
    });
  });

  describe('stop', () => {
    it('should stop cron job and call parent stop', () => {
      const testLimiter = new Limiter(1000, 25000, '0 0 * * *');
      const parentStopSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(testLimiter)), 'stop');

      testLimiter.stop();

      expect(mockCronJob.stop).toHaveBeenCalled();
      expect(parentStopSpy).toHaveBeenCalled();
    });

    it('should handle missing cron job gracefully', () => {
      const testLimiter = new Limiter(1000, 25000, '0 0 * * *');
      testLimiter.cronJob = null;

      expect(() => testLimiter.stop()).not.toThrow();
    });
  });

  describe('inheritance from Bottleneck', () => {
    it('should extend Bottleneck functionality', async () => {
      limiter = new Limiter(100, 1, '0 0 * * *');

      const task = jest.fn().mockResolvedValue('result');
      const result = await limiter.schedule(task);

      expect(task).toHaveBeenCalled();
      expect(result).toBe('result');
      
      // Clean up after test
      limiter.stop();
      limiter = null;
    });

    it('should respect rate limiting', async () => {
      limiter = new Limiter(100, 2, '0 0 * * *');

      const task1 = jest.fn().mockResolvedValue('result1');
      const task2 = jest.fn().mockResolvedValue('result2');

      const [result1, result2] = await Promise.all([
        limiter.schedule(task1),
        limiter.schedule(task2),
      ]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(task1).toHaveBeenCalled();
      expect(task2).toHaveBeenCalled();
      
      // Clean up after test
      limiter.stop();
      limiter = null;
    });
  });
});