import { MsgAddCustomData } from '@/proto/anchor/index.js';
import { MsgExec, MsgGrant, MsgRevoke, GenericAuthorization } from '@/proto/cosmos/authz/v1beta1/index.js';
import { MsgSend, MsgMultiSend, SendAuthorization } from '@/proto/cosmos/bank/v1beta1/index.js';
import { MsgFundCommunityPool, MsgSetWithdrawAddress, MsgWithdrawDelegatorReward, MsgWithdrawValidatorCommission } from '@/proto/cosmos/distribution/v1beta1/index.js';
import { MsgDeposit, MsgVote, MsgVoteWeighted, MsgSubmitProposal } from '@/proto/cosmos/gov/v1/index.js';
import { MsgBeginRedelegate, MsgCreateValidator, MsgDelegate, MsgEditValidator, MsgUndelegate, StakeAuthorization } from '@/proto/cosmos/staking/v1beta1/index.js';
import { MsgCreateVestingAccount } from '@/proto/cosmos/vesting/v1beta1/index.js';
import { MsgCreateGroup, MsgCreateGroupResponse, MsgUpdateGroupMembers, MsgUpdateGroupMembersResponse, MsgUpdateGroupAdmin, MsgUpdateGroupAdminResponse, MsgUpdateGroupMetadata, MsgUpdateGroupMetadataResponse, MsgCreateGroupPolicy, MsgCreateGroupPolicyResponse, MsgUpdateGroupPolicyAdmin, MsgUpdateGroupPolicyAdminResponse, MsgCreateGroupWithPolicy, MsgCreateGroupWithPolicyResponse, MsgUpdateGroupPolicyDecisionPolicy, MsgUpdateGroupPolicyDecisionPolicyResponse, MsgUpdateGroupPolicyMetadata, MsgUpdateGroupPolicyMetadataResponse, MsgSubmitProposal as MsgGroupSubmitProposal, MsgSubmitProposalResponse, MsgWithdrawProposal, MsgWithdrawProposalResponse, MsgVote as MsgGroupVote, MsgVoteResponse, MsgExec as MsgGroupExec, MsgExecResponse, MsgLeaveGroup, MsgLeaveGroupResponse, ThresholdDecisionPolicy, PercentageDecisionPolicy } from '@/proto/cosmos/group/v1/index.js';
import { type AnyMessage, type JsonWriteOptions, type Message, type JsonReadOptions, createRegistry } from '@bufbuild/protobuf';
import { MsgCastVote, MsgCreateAddressLists, MsgCreateCollection, MsgCreateDynamicStore, MsgDeleteCollection, MsgDeleteDynamicStore, MsgDeleteIncomingApproval, MsgDeleteOutgoingApproval, MsgPurgeApprovals, MsgSetTokenMetadata, MsgSetCollectionApprovals, MsgSetCollectionMetadata, MsgSetCustomData, MsgSetDynamicStoreValue, MsgSetIncomingApproval, MsgSetIsArchived, MsgSetManager, MsgSetOutgoingApproval, MsgSetStandards, MsgSetValidTokenIds, MsgTransferTokens, MsgUniversalUpdateCollection, MsgUpdateCollection, MsgUpdateDynamicStore, MsgUpdateUserApprovals } from '@/proto/badges/tx_pb.js';

import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '@/proto/cosmwasm/wasm/v1/index.js';
import { MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap } from '@/proto/maps/index.js';
import { MsgCreateManagerSplitter, MsgDeleteManagerSplitter, MsgExecuteUniversalUpdateCollection, MsgUpdateManagerSplitter } from '@/proto/managersplitter/tx_pb.js';
import { MsgExecuteContractCompat, MsgInstantiateContractCompat } from '@/proto/wasmx/index.js';
import { MsgTransfer } from '@/proto/ibc/index.js';
import { MsgJoinPool, MsgJoinPoolResponse, MsgExitPool, MsgExitPoolResponse, MsgSwapExactAmountIn, MsgSwapExactAmountInResponse, MsgSwapExactAmountInWithIBCTransfer, MsgSwapExactAmountInWithIBCTransferResponse, MsgSwapExactAmountOut, MsgSwapExactAmountOutResponse, MsgJoinSwapExternAmountIn, MsgJoinSwapExternAmountInResponse, MsgJoinSwapShareAmountOut, MsgJoinSwapShareAmountOutResponse, MsgExitSwapShareAmountIn, MsgExitSwapShareAmountInResponse, MsgExitSwapExternAmountOut, MsgExitSwapExternAmountOutResponse } from '@/proto/gamm/v1beta1/tx_pb.js';
import { MsgCreateBalancerPool, MsgCreateBalancerPoolResponse } from '@/proto/gamm/poolmodels/balancer/tx_pb.js';

export const ProtoTypeRegistry: ReturnType<typeof createRegistry> = createRegistry(MsgSend, MsgMultiSend, MsgFundCommunityPool, MsgSetWithdrawAddress, MsgWithdrawDelegatorReward, MsgWithdrawValidatorCommission, MsgDeposit, MsgVote, MsgVoteWeighted, MsgSubmitProposal, MsgBeginRedelegate, MsgCreateValidator, MsgDelegate, MsgEditValidator, MsgUndelegate, MsgCreateVestingAccount, MsgExec, MsgDeleteCollection, MsgTransferTokens, MsgUpdateCollection, MsgUpdateUserApprovals, MsgCastVote, MsgCreateAddressLists, MsgCreateCollection, MsgCreateDynamicStore, MsgDeleteDynamicStore, MsgDeleteIncomingApproval, MsgDeleteOutgoingApproval, MsgPurgeApprovals, MsgSetTokenMetadata, MsgSetCollectionApprovals, MsgSetCollectionMetadata, MsgSetCustomData, MsgSetDynamicStoreValue, MsgSetIncomingApproval, MsgSetIsArchived, MsgSetManager, MsgSetOutgoingApproval, MsgSetStandards, MsgSetValidTokenIds, MsgUniversalUpdateCollection, MsgUpdateDynamicStore, MsgExecuteContractCompat, MsgInstantiateContractCompat, MsgExecuteContract, MsgStoreCode, MsgInstantiateContract, MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap, MsgCreateManagerSplitter, MsgUpdateManagerSplitter, MsgDeleteManagerSplitter, MsgExecuteUniversalUpdateCollection, MsgAddCustomData, MsgGrant, MsgRevoke, GenericAuthorization, SendAuthorization, StakeAuthorization, MsgTransfer, MsgJoinPool, MsgJoinPoolResponse, MsgExitPool, MsgExitPoolResponse, MsgSwapExactAmountIn, MsgSwapExactAmountInResponse, MsgSwapExactAmountInWithIBCTransfer, MsgSwapExactAmountInWithIBCTransferResponse, MsgSwapExactAmountOut, MsgSwapExactAmountOutResponse, MsgJoinSwapExternAmountIn, MsgJoinSwapExternAmountInResponse, MsgJoinSwapShareAmountOut, MsgJoinSwapShareAmountOutResponse, MsgExitSwapShareAmountIn, MsgExitSwapShareAmountInResponse, MsgExitSwapExternAmountOut, MsgExitSwapExternAmountOutResponse, MsgCreateBalancerPool, MsgCreateBalancerPoolResponse, MsgCreateGroup, MsgCreateGroupResponse, MsgUpdateGroupMembers, MsgUpdateGroupMembersResponse, MsgUpdateGroupAdmin, MsgUpdateGroupAdminResponse, MsgUpdateGroupMetadata, MsgUpdateGroupMetadataResponse, MsgCreateGroupPolicy, MsgCreateGroupPolicyResponse, MsgUpdateGroupPolicyAdmin, MsgUpdateGroupPolicyAdminResponse, MsgCreateGroupWithPolicy, MsgCreateGroupWithPolicyResponse, MsgUpdateGroupPolicyDecisionPolicy, MsgUpdateGroupPolicyDecisionPolicyResponse, MsgUpdateGroupPolicyMetadata, MsgUpdateGroupPolicyMetadataResponse, MsgGroupSubmitProposal, MsgSubmitProposalResponse, MsgWithdrawProposal, MsgWithdrawProposalResponse, MsgGroupVote, MsgVoteResponse, MsgGroupExec, MsgExecResponse, MsgLeaveGroup, MsgLeaveGroupResponse, ThresholdDecisionPolicy, PercentageDecisionPolicy);

/**
 * Set of utilities to convert between wrapped Protobuf Messages, Protobuf-
 * formatted JSON objects, and Amino-formatted JSON objects.
 */

type AnyJSON = any;

interface ProtobufObject {
  typeUrl: string;
  value: AnyJSON;
}

const ProtoJSONOption: JsonWriteOptions = {
  emitDefaultValues: true,
  enumAsInteger: true,
  useProtoFieldName: true,
  typeRegistry: ProtoTypeRegistry
};

const ProtoJSONReadOption: JsonReadOptions = {
  ignoreUnknownFields: true,
  typeRegistry: ProtoTypeRegistry
};

export function convertProtoMessageToObject<T extends Message = AnyMessage>(msg: Message): ProtobufObject {
  return {
    typeUrl: `/${msg.getType().typeName}`,
    value: msg.toJson({ emitDefaultValues: true, typeRegistry: ProtoJSONOption.typeRegistry })
  };
}

export function convertProtoValueToMessage<T extends Message = AnyMessage>(protoValue: any, ProtoMessage: typeof Message): Message {
  return new ProtoMessage().fromJson(protoValue, ProtoJSONReadOption);
}

// Converts a Protobuf message into a default Amino-formatted JSON
// value. While this may exactly match the Amino value for some
// messages, others will require custom logic.
export function convertProtoValueToDefaultAmino<T extends Message = AnyMessage>(protoValue: any, ProtoMessage: typeof Message): AnyJSON {
  const protoMessage = convertProtoValueToMessage(protoValue, ProtoMessage);
  return protoMessage.toJson(ProtoJSONOption);
}

export const snakeToCamelCase = (str: string) => str.replace(/_[a-zA-Z]/g, (substr) => substr[1].toUpperCase());

// Converts snake_case keys in an Amino JSON object to
// an object with camelCase keys that can be passed to
// a Protobuf message initializer.
export function convertSnakeKeysToCamel(item: any) {
  if (typeof item !== 'object') {
    return item;
  }

  if (Array.isArray(item)) {
    const arrayWithCamel: any[] = [];
    item.forEach((el) => {
      arrayWithCamel.push(convertSnakeKeysToCamel(el));
    });
    return arrayWithCamel;
  }

  const objectWithCamel: any = {};
  Object.keys(item).forEach((key) => {
    objectWithCamel[snakeToCamelCase(key)] = convertSnakeKeysToCamel(item[key]);
  });

  return objectWithCamel;
}

export function convertAminoToProtoValue<T extends Message = AnyMessage>(aminoValue: any, ProtoMessage: typeof Message): AnyJSON {
  const protoValue = convertSnakeKeysToCamel(aminoValue);
  // Pass-through message representation to apply null-field parsing.
  const protoMessage = convertProtoValueToMessage(protoValue, ProtoMessage);
  return protoMessage.toJson();
}

export function createAminoConverter<T extends Message = AnyMessage>(ProtoMessage: typeof Message, aminoType: string, toAmino: typeof convertProtoValueToDefaultAmino = convertProtoValueToDefaultAmino, fromAmino: typeof convertAminoToProtoValue = convertAminoToProtoValue) {
  const protoTypeUrl = `/${new ProtoMessage().getType().typeName}`;

  function convertToAmino(protoValue: any) {
    return toAmino(protoValue, ProtoMessage);
  }

  function convertFromAmino(aminoValue: any) {
    return fromAmino(aminoValue, ProtoMessage);
  }

  return {
    [protoTypeUrl]: {
      aminoType,
      toAmino: convertToAmino,
      fromAmino: convertFromAmino
    }
  };
}
