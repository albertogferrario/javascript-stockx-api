const cronParser = require('cron-parser');

function getMillisecondsToNextCronExpressionTick(cronExpression) {
  return cronParser.parseExpression(cronExpression).next().toDate() - (new Date());
}

async function timeoutPromise(promise, timeout) {
  const timeoutPromise_ = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );

  console.info('Executing promise...');  // fixme: debugging... remind to remove

  return Promise.race([promise, timeoutPromise_]);
}

module.exports = {
  getMillisecondsToNextCronExpressionTick,
  timeoutPromise,
};
