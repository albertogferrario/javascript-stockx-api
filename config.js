const baseUrl = 'https://api.stockx.com/v2';
const requestTimeout = 1000 * 60;
const requestRateLimitMinTime = 1000;
const requestRateLimitReservoirAmount = 25000;
const requestRateLimitReservoirRefreshCronExpression = '0 0 * * *';

module.exports = {
  baseUrl,
  requestTimeout,
  requestRateLimitMinTime,
  requestRateLimitReservoirAmount,
  requestRateLimitReservoirRefreshCronExpression,
};
