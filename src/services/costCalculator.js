exports.calculateCost = function(channel, requestParams, responseParams) {
  if (!channel || !channel.costRule) {
    return 0;
  }

  const { rule_type, rule_config } = channel.costRule;

  switch (rule_type) {
    case 'per_call':
      return rule_config.price || 0;

    case 'per_key':
      return calculatePerKeyCost(requestParams, responseParams, rule_config);

    case 'tiered':
      return calculateTieredCost(requestParams, rule_config);

    case 'subscription':
      return rule_config.price || 0;

    default:
      return 0;
  }
};

function calculatePerKeyCost(requestParams, responseParams, rule_config) {
  const key = rule_config.key || '';
  const perTime = rule_config.per_time || 0;
  const dailyCap = rule_config.daily_cap || 0;
  const monthlyCap = rule_config.monthly_cap || 0;

  let count = 0;

  const requestStr = JSON.stringify(requestParams || {}).toLowerCase();
  const responseStr = JSON.stringify(responseParams || {}).toLowerCase();
  const keyLower = key.toLowerCase();

  const requestMatches = (requestStr.match(new RegExp(keyLower, 'g')) || []).length;
  const responseMatches = (responseStr.match(new RegExp(keyLower, 'g')) || []).length;
  count = requestMatches + responseMatches;

  let cost = count * perTime;

  if (monthlyCap > 0 && cost > monthlyCap) {
    cost = monthlyCap;
  }

  return cost;
}

function calculateTieredCost(requestParams, rule_config) {
  const tiers = rule_config.tiers || [];
  const cycle = rule_config.cycle || 'month';

  const callCount = requestParams?.callCount || 1;

  let totalCost = 0;
  let remaining = callCount;

  tiers.sort((a, b) => {
    const rangeA = a.range.split('-').map(n => parseInt(n));
    const rangeB = b.range.split('-').map(n => parseInt(n));
    return rangeA[0] - rangeB[0];
  });

  for (const tier of tiers) {
    const range = tier.range.split('-').map(n => parseInt(n));
    const min = range[0];
    const max = range[1] || Infinity;
    const price = tier.price;

    if (callCount >= min) {
      const tierCalls = Math.min(remaining, max - min + 1);
      totalCost += tierCalls * price;
      remaining -= tierCalls;
    }

    if (remaining <= 0) break;
  }

  return totalCost;
}

exports.calculateTieredCost = calculateTieredCost;
exports.calculatePerKeyCost = calculatePerKeyCost;