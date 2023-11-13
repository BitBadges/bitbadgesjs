import * as govTx from '../../proto/cosmos/gov/v1beta1/tx_pb'

export function createMsgVote(
  proposalId: number,
  option: number,
  sender: string,
) {
  const voteMessage = new govTx.MsgVote({
    proposalId: BigInt(proposalId),
    voter: sender,
    option,
  })

  return {
    message: voteMessage,
    path: 'cosmos.gov.v1beta1.MsgVote',
  }
}
