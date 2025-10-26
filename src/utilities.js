const cronParser = require('cron-parser');

function getMillisecondsToNextCronExpressionTick(cronExpression) {
  return cronParser.parseExpression(cronExpression).next().toDate() - (new Date());
}

async function timeoutPromise(promise, timeout) {
  let timeoutHandle;
  const timeoutPromiseInstance = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Request timed out')), timeout);
  });

  const result = await Promise.race([promise, timeoutPromiseInstance]);
  clearTimeout(timeoutHandle);
  return result;
}

module.exports = {
  getMillisecondsToNextCronExpressionTick,
  timeoutPromise,
};
