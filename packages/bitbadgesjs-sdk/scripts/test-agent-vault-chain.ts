import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { buildAgentVault } from '../src/core/builders/agent-vault.js';
import { buildAgentVaultTransaction } from '../src/core/agent-vaults.js';

const chain = process.argv[2];
if (!chain) throw new Error('Usage: bun scripts/test-agent-vault-chain.ts /path/to/chain');
const agent = 'bb1e0w5t53nrq7p66fye6c8p0ynyhf6y24lke5430';
const manager = 'bb1jmjfq0tplp9tmx4v9uemw72y4d2wa5nrjmmk3q';
const recovery = 'bb1xyxs3skf3f4jfqeuv89yyaqvjc6lffav9altme';
const creation = buildAgentVault({
  agent,
  manager,
  recovery,
  backingCoin: 'BADGE',
  uri: 'ipfs://agent-vault-test',
  cap: { amount: '100', startTime: '1000', intervalLength: '86400000' },
  window: { start: '1000', end: '3000' },
  activation: { voters: [{ address: manager, weight: 1 }], threshold: 1 }
});
const collection = { ...creation.value, collectionId: '1' };
const tx = (action: 'deposit' | 'withdraw' | 'pay' | 'vote' | 'recover', amount?: string) =>
  buildAgentVaultTransaction({
    action,
    collection,
    creator: action === 'deposit' || action === 'vote' ? manager : action === 'recover' ? recovery : agent,
    amount,
    to: manager
  }).messages;
const failingPayment = tx('pay', '10');
failingPayment[1].value.amount[0].amount = '100000000000000000000';
const fixtures = {
  creation: creation.value,
  deposit: tx('deposit', '200'),
  withdraw: tx('withdraw', '50'),
  overCap: tx('withdraw', '60'),
  vote: tx('vote'),
  pay: tx('pay', '20'),
  failingPayment,
  recover: tx('recover', '130')
};
const directory = await mkdtemp(join(tmpdir(), 'agent-vault-chain-'));
const source = `package keeper_test
import (
  "encoding/json"
  "fmt"
  "time"
  sdkmath "cosmossdk.io/math"
  sdk "github.com/cosmos/cosmos-sdk/types"
  banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
  "github.com/bitbadges/bitbadgeschain/x/tokenization/types"
)
func (suite *TestSuite) TestAgentVaultSDKLifecycle() {
  suite.ctx = suite.ctx.WithBlockTime(time.UnixMilli(2000))
  var fixture map[string]json.RawMessage
  suite.Require().NoError(json.Unmarshal([]byte(${JSON.stringify(JSON.stringify(fixtures))}), &fixture))
  var create types.MsgUniversalUpdateCollection
  suite.Require().NoError(suite.app.AppCodec().UnmarshalJSON(fixture["creation"], &create))
  _, err := suite.msgServer.UniversalUpdateCollection(sdk.WrapSDKContext(suite.ctx), &create)
  suite.Require().NoError(err, "SDK collection must be accepted by the pinned chain")
  execute := func(name string) error {
    var messages []struct { TypeURL string; Value json.RawMessage }
    if err := json.Unmarshal(fixture[name], &messages); err != nil { return err }
    cached, commit := suite.ctx.CacheContext()
    for _, message := range messages {
      switch message.TypeURL {
      case "/tokenization.MsgTransferTokens":
        var msg types.MsgTransferTokens
        if err := suite.app.AppCodec().UnmarshalJSON(message.Value, &msg); err != nil { return err }
        if _, err := suite.msgServer.TransferTokens(sdk.WrapSDKContext(cached), &msg); err != nil { return err }
      case "/tokenization.MsgCastVote":
        var msg types.MsgCastVote
        if err := suite.app.AppCodec().UnmarshalJSON(message.Value, &msg); err != nil { return err }
        if _, err := suite.msgServer.CastVote(sdk.WrapSDKContext(cached), &msg); err != nil { return err }
      case "/cosmos.bank.v1beta1.MsgSend":
        var msg banktypes.MsgSend
        if err := suite.app.AppCodec().UnmarshalJSON(message.Value, &msg); err != nil { return err }
        if err := suite.app.BankKeeper.SendCoins(cached, sdk.MustAccAddressFromBech32(msg.FromAddress), sdk.MustAccAddressFromBech32(msg.ToAddress), msg.Amount); err != nil { return err }
      default: return fmt.Errorf("unsupported fixture message: %s", message.TypeURL)
      }
    }
    commit()
    return nil
  }
  receipts := func(address string) string {
    balance, err := GetUserBalance(suite, sdk.WrapSDKContext(suite.ctx), sdkmath.NewUint(1), address)
    suite.Require().NoError(err)
    total := sdkmath.NewUint(0)
    for _, b := range balance.Balances { total = total.Add(b.Amount) }
    return total.String()
  }
  suite.Require().NoError(execute("deposit"), "human funds agent directly")
  suite.Require().Equal("200", receipts(alice))
  suite.Require().Error(execute("withdraw"), "activation required")
  suite.Require().NoError(execute("vote"))
  suite.Require().NoError(execute("withdraw"))
  suite.Require().Error(execute("overCap"), "shared period budget")
  suite.Require().NoError(execute("pay"), "atomic payment")
  suite.Require().Equal("130", receipts(alice))
  suite.Require().Error(execute("failingPayment"))
  suite.Require().Equal("130", receipts(alice), "failed bank leg rolls back withdrawal")
  suite.ctx = suite.ctx.WithBlockTime(time.UnixMilli(4000))
  suite.Require().Error(execute("withdraw"), "expired withdrawal window")
  suite.Require().NoError(execute("recover"), "recovery bypasses ordinary gates")
  suite.Require().Equal("0", receipts(alice))
  suite.Require().Equal("0", receipts(charlie))
}
`;
const testFile = join(directory, 'agent_vault_sdk_test.go');
const overlayFile = join(directory, 'overlay.json');
await writeFile(testFile, source);
await writeFile(overlayFile, JSON.stringify({ Replace: { [resolve(chain, 'x/tokenization/keeper/agent_vault_sdk_test.go')]: testFile } }));
console.log(`Generated SDK-to-chain fixture and Go overlay: ${directory}`);
const child = Bun.spawn(
  [
    'go',
    'test',
    '-p',
    '2',
    '-tags=test',
    '-count=1',
    '-timeout',
    '15m',
    '-overlay',
    overlayFile,
    '-run',
    'TestTokenizationKeeperTestSuite/TestAgentVaultSDKLifecycle$',
    './x/tokenization/keeper'
  ],
  {
    cwd: resolve(chain),
    stdout: 'inherit',
    stderr: 'inherit'
  }
);
process.exit(await child.exited);
