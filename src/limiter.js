const Bottleneck = require("bottleneck");
const cron = require("cron");
const {getMillisecondsToNextCronExpressionTick} = require("./utilities");
const cronParser = require("cron-parser");

class Limiter extends Bottleneck {
  constructor(minTime, reservoirAmount, reservoirRefreshCronExpression) {
    super({
      minTime,
      reservoir: reservoirAmount,
      reservoirRefreshAmount: reservoirAmount,
      reservoirRefreshInterval: getMillisecondsToNextCronExpressionTick(reservoirRefreshCronExpression),
      maxConcurrent: 1,
    });

    this.initReservoirRefreshCron(reservoirRefreshCronExpression);
  }

  initReservoirRefreshCron(expression) {
    const cronJob = new cron.CronJob(expression, () => {
      this.limiter.updateSettings({
        reservoirRefreshInterval: getMillisecondsToNextCronExpressionTick(expression)
      });
    });
    cronJob.start();
  }

  getMillisecondsToNextCronExpressionTick(cronExpression) {
    return cronParser.parseExpression(cronExpression).next().toDate() - (new Date());
  }
}

module.exports = Limiter;
