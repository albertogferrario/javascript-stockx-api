const Bottleneck = require("bottleneck");

class Limiter extends Bottleneck {
  constructor(minTime, reservoirAmount, reservoirRefreshInterval) {
    super(minTime, reservoirAmount, reservoirAmount, reservoirRefreshInterval);
  }
}

module.exports = Limiter;
