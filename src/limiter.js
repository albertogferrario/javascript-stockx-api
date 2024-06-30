const Bottleneck = require("bottleneck");

class Limiter extends Bottleneck {
  constructor(minTime, reservoirAmount, reservoirRefreshInterval) {
    super({
      minTime,
      reservoir: reservoirAmount,
      reservoirRefreshAmount: reservoirAmount,
      reservoirRefreshInterval,
      maxConcurrent: 1
    });
  }
}

module.exports = Limiter;
