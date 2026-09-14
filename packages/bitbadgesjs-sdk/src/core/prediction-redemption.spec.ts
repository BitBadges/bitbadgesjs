import { buildPredictionMarket } from './builders/prediction-market.js';
import { quotePredictionMarketRedemption, buildPredictionMarketRedeemTx } from './prediction-markets.js';
import { PREDICTION_MARKET_PRESETS } from '../builder/presets/prediction-market.js';
import { validatePredictionMarketCollection } from './prediction-markets.js';
const market = () => buildPredictionMarket({ verifier: 'bb1verifier', denom: 'BADGE', uri: 'ipfs://market' }).value;

describe('position-consuming prediction redemptions', () => {
  test('MCP presets compose the same conserving, scalable recipe', () => {
    const c = market();
    c.collectionApprovals = PREDICTION_MARKET_PRESETS.map((p) =>
      p.render(p.paramsSchema.parse({ usdcDenom: 'ubadge', verifierAddress: 'bb1verifier' }))
    );
    expect(validatePredictionMarketCollection(c).errors).toEqual([]);
    expect(quotePredictionMarketRedemption(c, { state: 'push', yesAmount: 4n }).payout.baseAmount).toBe('2');
  });
  test('new recipes permit repeated claims without a per-holder one-shot cap', () => {
    for (const a of market().collectionApprovals.filter((a: any) => a.approvalCriteria.votingChallenges?.length)) {
      expect(a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers).toBe('18446744073709551615');
      expect(a.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers).toBe('0');
    }
  });
  test('partial winner redemption quotes exact payout and leaves losing positions untouched', () => {
    const q = quotePredictionMarketRedemption(market(), { state: 'yes-wins', yesAmount: 4n, yesBalance: 9n, noBalance: 7n });
    expect(q.payout.baseAmount).toBe('4');
    expect(q.remaining).toEqual({ yes: '5', no: '7' });
    expect(q.legs).toHaveLength(1);
    const tx = buildPredictionMarketRedeemTx({
      creator: 'bb1holder',
      collectionId: '1',
      state: 'yes-wins',
      yesBalance: 4n,
      noBalance: 7n,
      yesWinsApprovalId: 'yes'
    });
    expect(tx.messages).toHaveLength(1);
  });
  test('push maximum retains odd dust; explicit odd requests fail without clipping', () => {
    const q = quotePredictionMarketRedemption(market(), { state: 'push', yesBalance: 5n, noBalance: 3n });
    expect(q.payout.baseAmount).toBe('3');
    expect(q.remaining).toEqual({ yes: '1', no: '1' });
    expect(() => quotePredictionMarketRedemption(market(), { state: 'push', yesAmount: 5n })).toThrow(/multiple/);
  });
  test('legacy one-shot is unknown without tracker, exhausted after use', () => {
    const c = market();
    const a = c.collectionApprovals.find((a: any) => a.approvalCriteria.votingChallenges?.length);
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = '0';
    a.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers = '1';
    const args = { state: 'yes-wins' as const, yesAmount: 1n };
    expect(quotePredictionMarketRedemption(c, args).legs[0]).toMatchObject({ policy: 'one-shot', eligibility: 'unknown' });
    expect(quotePredictionMarketRedemption(c, { ...args, trackerUses: { [a.approvalId]: 1n } }).legs[0].eligibility).toBe('exhausted');
  });
  test('invalid inputs and absent payout approvals fail closed', () => {
    for (const yesAmount of [-1n]) expect(() => quotePredictionMarketRedemption(market(), { state: 'yes-wins', yesAmount })).toThrow();
    expect(() => quotePredictionMarketRedemption(market(), { state: 'yes-wins', yesAmount: 3n, yesBalance: 2n })).toThrow(/balance/);
    expect(() => buildPredictionMarketRedeemTx({ creator: 'a', collectionId: '1', state: 'yes-wins', yesBalance: 1n })).toThrow(/approval/i);
  });
  test('uses observed versions and cannot propose an exhausted legacy claim', () => {
    const c = market();
    const a = c.collectionApprovals.find((a: any) => a.approvalCriteria.votingChallenges?.length);
    a.version = '8';
    const args = { collection: c, creator: 'a', collectionId: '1', state: 'yes-wins' as const, yesAmount: 2n };
    const tx = buildPredictionMarketRedeemTx(args);
    expect((tx.messages[0].value.transfers as any[])[0].prioritizedApprovals[0].version).toBe('8');
    a.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers = '1';
    expect(() => buildPredictionMarketRedeemTx({ ...args, trackerUses: { [a.approvalId]: 1n } })).toThrow(/exhausted/);
  });
  test('rejects dynamic payouts, ambiguous routes and irrelevant explicit amount flags', () => {
    const c = market();
    const a = c.collectionApprovals.find((a: any) => a.approvalCriteria.votingChallenges?.length);
    const args = { state: 'yes-wins' as const, yesAmount: 1n };
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = '1';
    expect(() => quotePredictionMarketRedemption(c, args)).toThrow(/Unsupported/);
    c.collectionApprovals = market().collectionApprovals;
    c.collectionApprovals.push(c.collectionApprovals.find((a: any) => a.approvalCriteria.votingChallenges?.length));
    expect(() => quotePredictionMarketRedemption(c, args)).toThrow(/[Aa]mbiguous/);
    expect(() => quotePredictionMarketRedemption(market(), { ...args, noAmount: 1n })).toThrow(/state/);
  });
  test('preserves precision above the safe Number range and enforces scaling cap', () => {
    const amount = 9007199254740993n;
    expect(quotePredictionMarketRedemption(market(), { state: 'yes-wins', yesAmount: amount }).payout.baseAmount).toBe(String(amount));
    const c = market();
    const a = c.collectionApprovals.find((a: any) => a.approvalCriteria.votingChallenges?.length);
    a.approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier = '2';
    expect(() => quotePredictionMarketRedemption(c, { state: 'yes-wins', yesAmount: 3n })).toThrow(/limit/);
  });
  test('quotes reject unmodeled ordering, amount bounds, duplicate identities and fractional push ratios', () => {
    const mutate = (fn:(c:any,a:any)=>void,state:'yes-wins'|'push'='yes-wins') => {
      const c=market();const a=c.collectionApprovals.find((a:any)=>a.approvalCriteria.votingChallenges?.length && (state==='push' ? a.approvalId.includes('push-yes') : a.approvalId.includes('settle-yes')));
      fn(c,a);
      expect(()=>quotePredictionMarketRedemption(c,{state,yesAmount:6n})).toThrow();
    };
    mutate((c,a)=>{a.approvalCriteria.predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers=true;});
    mutate((c,a)=>{a.approvalCriteria.approvalAmounts={overallApprovalAmount:'1'};});
    mutate((c,a)=>{c.collectionApprovals[0].approvalId=a.approvalId;});
    mutate((c,a)=>{a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount='3';},'push');
  });
  test('resettable tracker observations remain unknown without an epoch', () => {
    const c=market();const a=c.collectionApprovals.find((a:any)=>a.approvalCriteria.votingChallenges?.length);
    a.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers='1';
    a.approvalCriteria.maxNumTransfers.resetTimeIntervals={startTime:'1',intervalLength:'1000'};
    expect(quotePredictionMarketRedemption(c,{state:'yes-wins',yesAmount:1n,trackerUses:{[a.approvalId]:1n}}).legs[0]).toMatchObject({policy:'limited',eligibility:'unknown'});
  });

  test('explicit zero skips a push side while keeping observed balances intact', () => {
    const q=quotePredictionMarketRedemption(market(),{state:'push',yesAmount:2n,noAmount:0n,yesBalance:5n,noBalance:7n});
    expect(q.legs).toHaveLength(1);expect(q.payout.baseAmount).toBe('1');
    expect(q.remaining).toEqual({yes:'3',no:'7'});
    expect(quotePredictionMarketRedemption(market(),{state:'push',yesAmount:0n,noAmount:0n}).legs).toEqual([]);
    expect(()=>quotePredictionMarketRedemption(market(),{state:'active',pairAmount:0n})).toThrow(/positive/);
  });

});
