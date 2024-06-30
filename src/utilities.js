const cronParser = require('cron-parser');

function getMillisecondsToNextCronExpressionTick(cronExpression) {
  return cronParser.parseExpression(cronExpression).next().toDate() - (new Date());
}

module.exports = {
  getMillisecondsToNextCronExpressionTick,
};
