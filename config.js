const BASE_URL = 'https://api.stockx.com/v2';
const REQUEST_RATE_LIMIT_MIN_TIME = 1000;
const REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT = 25000;
const REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION = '0 0 0 * * *';

module.exports = {
  BASE_URL,
  REQUEST_RATE_LIMIT_MIN_TIME,
  REQUEST_RATE_LIMIT_RESERVOIR_AMOUNT,
  REQUEST_RATE_LIMIT_RESERVOIR_REFRESH_CRON_EXPRESSION,
};
