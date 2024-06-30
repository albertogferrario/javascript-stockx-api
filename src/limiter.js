const Bottleneck = require("bottleneck");
const cron = require("cron");
const {getMillisecondsToNextCronExpressionTick} = require("./utilities");

BOTTLENECK_RESERVOIR_REFRESH_INTERVAL_PRECISION = 250;

class Limiter extends Bottleneck {
  constructor(minTime, reservoirAmount, reservoirRefreshCronExpression) {
    super({
      minTime,
      reservoir: reservoirAmount,
      reservoirRefreshAmount: reservoirAmount,
      reservoirRefreshInterval: getMillisecondsToNextCronExpressionTick(
        reservoirRefreshCronExpression,
        BOTTLENECK_RESERVOIR_REFRESH_INTERVAL_PRECISION,
      ),
      maxConcurrent: 1,
    });

    this.initReservoirRefreshCron(reservoirAmount, reservoirRefreshCronExpression);
  }

  initReservoirRefreshCron(amount, expression) {
    const cronJob = new cron.CronJob(expression, () => {
      this.updateSettings({
        reservoir: amount,
        reservoirRefreshInterval: getMillisecondsToNextCronExpressionTick(
          expression,
          BOTTLENECK_RESERVOIR_REFRESH_INTERVAL_PRECISION,
        ),
      });
    });
    cronJob.start();
  }
}

module.exports = Limiter;
