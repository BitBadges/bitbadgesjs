export const MSG_VOTE_TYPES = {
  MsgVote: [
    { name: 'proposal_id', type: 'uint64' },
    { name: 'voter', type: 'string' },
    { name: 'option', type: 'int32' },
  ],
}
export function createEIP712MsgVote(
  proposalId: number,
  option: number,
  sender: string,
) {
  return {
    type: 'cosmos-sdk/MsgVote',
    value: {
      proposal_id: proposalId,
      voter: sender,
      option,
    },
  }
}
