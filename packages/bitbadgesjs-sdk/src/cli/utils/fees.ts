export function resolveCliFee(estimatedGas: number, requestedGas = estimatedGas, requestedAmount = '0') {
  for (const gas of [estimatedGas, requestedGas]) {
    if (!Number.isSafeInteger(gas) || gas <= 0 || gas > 100000000) throw new Error('Gas must be an integer between 1 and 100000000');
  }
  const gas = Math.max(estimatedGas, requestedGas);
  const minimum = BigInt(gas) * 10n;
  if (!/^\d+$/.test(requestedAmount)) throw new Error('Fee must be an unsigned integer in ubadge');
  const amount = requestedAmount === '0' ? minimum : BigInt(requestedAmount);
  if (amount < minimum) throw new Error(`Fee must be at least ${minimum}ubadge for ${gas} gas`);
  return { gas: String(gas), amount: String(amount), denom: 'ubadge' };
}

export function sweepAmount(denom: string, balance: bigint, badgeBalance: bigint, fee: string): bigint {
  if (badgeBalance < BigInt(fee)) throw new Error(`Insufficient ubadge for the ${fee}ubadge fee`);
  const amount = denom === 'ubadge' ? balance - BigInt(fee) : balance;
  if (amount <= 0n) throw new Error('Balance must exceed the transaction fee');
  return amount;
}
