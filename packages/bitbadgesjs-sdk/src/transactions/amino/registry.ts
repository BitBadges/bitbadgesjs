import { MsgAddCustomData } from '@/proto/anchor/tx_pb.js';
import {
  MsgCastVote,
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgCreateDynamicStore,
  MsgDeleteCollection,
  MsgDeleteDynamicStore,
  MsgDeleteIncomingApproval,
  MsgDeleteOutgoingApproval,
  MsgPurgeApprovals,
  MsgSetTokenMetadata,
  MsgSetCollectionApprovals,
  MsgSetCollectionMetadata,
  MsgSetCustomData,
  MsgSetDynamicStoreValue,
  MsgSetIncomingApproval,
  MsgSetIsArchived,
  MsgSetManager,
  MsgSetOutgoingApproval,
  MsgSetStandards,
  MsgSetValidTokenIds,
  MsgTransferTokens,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateDynamicStore,
  MsgUpdateUserApprovals
} from '@/proto/tokenization/tx_pb.js';
import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '@/proto/cosmwasm/wasm/v1/tx_pb.js';
import { MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap } from '@/proto/maps/tx_pb.js';
import {
  MsgCreateManagerSplitter,
  MsgDeleteManagerSplitter,
  MsgExecuteUniversalUpdateCollection,
  MsgUpdateManagerSplitter
} from '@/proto/managersplitter/tx_pb.js';
import { MsgExecuteContractCompat, MsgInstantiateContractCompat } from '@/proto/wasmx/tx_pb.js';
import { AminoMsg } from '../messages/signDoc.js';
import { createAminoConverter } from './objectConverter.js';

import { MsgMultiSend, MsgSend, SendAuthorization } from '@/proto/cosmos/bank/v1beta1/index.js';
import {
  MsgFundCommunityPool,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission
} from '@/proto/cosmos/distribution/v1beta1/index.js';
import { MsgDeposit, MsgSubmitProposal, MsgVote, MsgVoteWeighted } from '@/proto/cosmos/gov/v1/index.js';
import {
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDelegate,
  MsgEditValidator,
  MsgUndelegate,
  StakeAuthorization
} from '@/proto/cosmos/staking/v1beta1/index.js';

import { GenericAuthorization } from '@/proto/cosmos/authz/v1beta1/authz_pb.js';
import { MsgExec, MsgGrant, MsgRevoke } from '@/proto/cosmos/authz/v1beta1/tx_pb.js';
import { MsgCreateVestingAccount } from '@/proto/cosmos/vesting/v1beta1/index.js';
import {
  MsgCreateGroup,
  MsgUpdateGroupMembers,
  MsgUpdateGroupAdmin,
  MsgUpdateGroupMetadata,
  MsgCreateGroupPolicy,
  MsgUpdateGroupPolicyAdmin,
  MsgCreateGroupWithPolicy,
  MsgUpdateGroupPolicyDecisionPolicy,
  MsgUpdateGroupPolicyMetadata,
  MsgSubmitProposal as MsgGroupSubmitProposal,
  MsgWithdrawProposal,
  MsgVote as MsgGroupVote,
  MsgExec as MsgGroupExec,
  MsgLeaveGroup,
  ThresholdDecisionPolicy,
  PercentageDecisionPolicy
} from '@/proto/cosmos/group/v1/index.js';

import { MsgTransfer } from '@/proto/ibc/index.js';
import {
  MsgJoinPool,
  MsgJoinPoolResponse,
  MsgExitPool,
  MsgExitPoolResponse,
  MsgSwapExactAmountIn,
  MsgSwapExactAmountInResponse,
  MsgSwapExactAmountInWithIBCTransfer,
  MsgSwapExactAmountInWithIBCTransferResponse,
  MsgSwapExactAmountOut,
  MsgSwapExactAmountOutResponse,
  MsgJoinSwapExternAmountIn,
  MsgJoinSwapExternAmountInResponse,
  MsgJoinSwapShareAmountOut,
  MsgJoinSwapShareAmountOutResponse,
  MsgExitSwapShareAmountIn,
  MsgExitSwapShareAmountInResponse,
  MsgExitSwapExternAmountOut,
  MsgExitSwapExternAmountOutResponse
} from '@/proto/gamm/v1beta1/tx_pb.js';
import { MsgCreateBalancerPool, MsgCreateBalancerPoolResponse } from '@/proto/gamm/poolmodels/balancer/tx_pb.js';

export interface EncodeObject {
  readonly typeUrl: string;
  readonly value: any;
}

export function createDefaultCosmosAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgSend, 'cosmos-sdk/MsgSend'),
    ...createAminoConverter(MsgMultiSend, 'cosmos-sdk/MsgMultiSend'),
    ...createAminoConverter(MsgFundCommunityPool, 'cosmos-sdk/MsgFundCommunityPool'),
    ...createAminoConverter(MsgSetWithdrawAddress, 'cosmos-sdk/MsgSetWithdrawAddress'),
    ...createAminoConverter(MsgWithdrawDelegatorReward, 'cosmos-sdk/MsgWithdrawDelegatorReward'),
    ...createAminoConverter(MsgWithdrawValidatorCommission, 'cosmos-sdk/MsgWithdrawValidatorCommission'),
    ...createAminoConverter(MsgDeposit, 'cosmos-sdk/MsgDeposit'),
    ...createAminoConverter(MsgVote, 'cosmos-sdk/MsgVote'),
    ...createAminoConverter(MsgVoteWeighted, 'cosmos-sdk/MsgVoteWeighted'),
    ...createAminoConverter(MsgSubmitProposal, 'cosmos-sdk/MsgSubmitProposal'),
    ...createAminoConverter(MsgBeginRedelegate, 'cosmos-sdk/MsgBeginRedelegate'),
    ...createAminoConverter(MsgCreateValidator, 'cosmos-sdk/MsgCreateValidator'),
    ...createAminoConverter(MsgDelegate, 'cosmos-sdk/MsgDelegate'),
    ...createAminoConverter(MsgEditValidator, 'cosmos-sdk/MsgEditValidator'),
    ...createAminoConverter(MsgUndelegate, 'cosmos-sdk/MsgUndelegate'),
    ...createAminoConverter(MsgCreateVestingAccount, 'cosmos-sdk/MsgCreateVestingAccount'),
    ...createAminoConverter(MsgExec, 'cosmos-sdk/MsgExec'),
    ...createAminoConverter(MsgGrant, 'cosmos-sdk/MsgGrant'),
    ...createAminoConverter(MsgRevoke, 'cosmos-sdk/MsgRevoke'),

    ...createAminoConverter(GenericAuthorization, 'cosmos-sdk/GenericAuthorization'),
    ...createAminoConverter(SendAuthorization, 'cosmos-sdk/SendAuthorization'),
    ...createAminoConverter(StakeAuthorization, 'cosmos-sdk/StakeAuthorization'),
    ...createAminoConverter(MsgTransfer, 'ibc/MsgTransfer'),
    ...createAminoConverter(MsgCreateGroup, 'cosmos-sdk/MsgCreateGroup'),
    ...createAminoConverter(MsgUpdateGroupMembers, 'cosmos-sdk/MsgUpdateGroupMembers'),
    ...createAminoConverter(MsgUpdateGroupAdmin, 'cosmos-sdk/MsgUpdateGroupAdmin'),
    ...createAminoConverter(MsgUpdateGroupMetadata, 'cosmos-sdk/MsgUpdateGroupMetadata'),
    ...createAminoConverter(MsgCreateGroupPolicy, 'cosmos-sdk/MsgCreateGroupPolicy'),
    ...createAminoConverter(MsgUpdateGroupPolicyAdmin, 'cosmos-sdk/MsgUpdateGroupPolicyAdmin'),
    ...createAminoConverter(MsgCreateGroupWithPolicy, 'cosmos-sdk/MsgCreateGroupWithPolicy'),
    ...createAminoConverter(MsgUpdateGroupPolicyDecisionPolicy, 'cosmos-sdk/MsgUpdateGroupDecisionPolicy'),
    ...createAminoConverter(MsgUpdateGroupPolicyMetadata, 'cosmos-sdk/MsgUpdateGroupPolicyMetadata'),
    ...createAminoConverter(MsgGroupSubmitProposal, 'cosmos-sdk/group/MsgSubmitProposal'),
    ...createAminoConverter(MsgWithdrawProposal, 'cosmos-sdk/group/MsgWithdrawProposal'),
    ...createAminoConverter(MsgGroupVote, 'cosmos-sdk/group/MsgVote'),
    ...createAminoConverter(MsgGroupExec, 'cosmos-sdk/group/MsgExec'),
    ...createAminoConverter(MsgLeaveGroup, 'cosmos-sdk/group/MsgLeaveGroup'),
    ...createAminoConverter(ThresholdDecisionPolicy, 'cosmos-sdk/ThresholdDecisionPolicy'),
    ...createAminoConverter(PercentageDecisionPolicy, 'cosmos-sdk/PercentageDecisionPolicy')
  };
}

export interface AminoConverter {
  readonly aminoType: string;
  readonly toAmino: (value: any) => any;
  readonly fromAmino: (value: any) => any;
}

/** A map from protobuf type URL to the AminoConverter implementation if supported on chain */
export type AminoConverters = Record<string, AminoConverter>;

/**
 * A map from Stargate message types as used in the messages's `Any` type
 * to Amino types.
 */
export class AminoTypesClass {
  // The map type here ensures uniqueness of the protobuf type URL in the key.
  // There is no uniqueness guarantee of the Amino type identifier in the type
  // system or constructor. Instead it's the user's responsibility to ensure
  // there is no overlap when fromAmino is called.
  private readonly register: Record<string, AminoConverter>;

  public constructor(types: AminoConverters) {
    this.register = types;
  }

  public toAmino({ typeUrl, value }: EncodeObject): AminoMsg {
    const converter = this.register[typeUrl];
    if (!converter) {
      throw new Error(
        `Type URL '${typeUrl}' does not exist in the Amino message type register. ` +
          'If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. ' +
          'If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues.'
      );
    }

    const initialJson = converter.toAmino(value);
    const finalJson = this.recursivelyHandleTypeUrl(initialJson, converter.toAmino);

    return {
      type: converter.aminoType,
      value: finalJson
    };
  }

  //This is a helper function to handle google.protobuf.Any type
  //When we stringify the proto object, the Any type is converted with the format:
  //{ "@type": "type.googleapis.com/cosmos.bank.v1beta1.MsgSend", ...value }
  //
  //To handle this, we need to catch this and format it back into the correct amino format
  private recursivelyHandleTypeUrl = (json: any, converter: (json: any) => any): any => {
    if (Array.isArray(json)) {
      return json.map((item) => this.recursivelyHandleTypeUrl(item, converter));
    } else if (typeof json === 'object') {
      if (json[`@type`]) {
        let newJsonValue = json;
        const typeUrl = '/' + json[`@type`].split('/')[1];
        delete newJsonValue[`@type`];

        return this.toAmino({ typeUrl, value: newJsonValue });
      } else {
        const result: any = {};
        for (const key in json) {
          result[key] = this.recursivelyHandleTypeUrl(json[key], converter);
        }
        return result;
      }
    } else {
      return json;
    }
  };

  public fromAmino({ type, value }: AminoMsg): EncodeObject {
    const matches = Object.entries(this.register).filter(([_typeUrl, { aminoType }]) => aminoType === type);

    switch (matches.length) {
      case 0: {
        throw new Error(
          `Amino type identifier '${type}' does not exist in the Amino message type register. ` +
            'If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. ' +
            'If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues.'
        );
      }
      case 1: {
        const [typeUrl, converter] = matches[0];
        return {
          typeUrl: typeUrl,
          value: converter.fromAmino(value)
        };
      }
      default:
        throw new Error(
          `Multiple types are registered with Amino type identifier '${type}': '` +
            matches
              .map(([key, _value]) => key)
              .sort((a, b) => a.localeCompare(b))
              .join("', '") +
            "'. Thus fromAmino cannot be performed."
        );
    }
  }
}

export function createTokenizationAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgDeleteCollection, 'tokenization/DeleteCollection'),
    ...createAminoConverter(MsgTransferTokens, 'tokenization/TransferTokens'),
    ...createAminoConverter(MsgUpdateCollection, 'tokenization/UpdateCollection'),
    ...createAminoConverter(MsgUpdateUserApprovals, 'tokenization/UpdateUserApprovals'),
    ...createAminoConverter(MsgCreateAddressLists, 'tokenization/CreateAddressLists'),
    ...createAminoConverter(MsgCreateCollection, 'tokenization/CreateCollection'),
    ...createAminoConverter(MsgCreateDynamicStore, 'tokenization/CreateDynamicStore'),
    ...createAminoConverter(MsgCastVote, 'tokenization/CastVote'),
    ...createAminoConverter(MsgDeleteDynamicStore, 'tokenization/DeleteDynamicStore'),
    ...createAminoConverter(MsgDeleteIncomingApproval, 'tokenization/DeleteIncomingApproval'),
    ...createAminoConverter(MsgDeleteOutgoingApproval, 'tokenization/DeleteOutgoingApproval'),
    ...createAminoConverter(MsgPurgeApprovals, 'tokenization/PurgeApprovals'),
    ...createAminoConverter(MsgSetTokenMetadata, 'tokenization/SetTokenMetadata'),
    ...createAminoConverter(MsgSetCollectionApprovals, 'tokenization/SetCollectionApprovals'),
    ...createAminoConverter(MsgSetCollectionMetadata, 'tokenization/SetCollectionMetadata'),
    ...createAminoConverter(MsgSetCustomData, 'tokenization/SetCustomData'),
    ...createAminoConverter(MsgSetDynamicStoreValue, 'tokenization/SetDynamicStoreValue'),
    ...createAminoConverter(MsgSetIncomingApproval, 'tokenization/SetIncomingApproval'),
    ...createAminoConverter(MsgSetIsArchived, 'tokenization/SetIsArchived'),
    ...createAminoConverter(MsgSetManager, 'tokenization/SetManager'),
    ...createAminoConverter(MsgSetOutgoingApproval, 'tokenization/SetOutgoingApproval'),
    ...createAminoConverter(MsgSetStandards, 'tokenization/SetStandards'),
    ...createAminoConverter(MsgSetValidTokenIds, 'tokenization/SetValidTokenIds'),
    ...createAminoConverter(MsgUniversalUpdateCollection, 'tokenization/UniversalUpdateCollection'),
    ...createAminoConverter(MsgUpdateDynamicStore, 'tokenization/UpdateDynamicStore')
  };
}

export function createManagerSplitterAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateManagerSplitter, 'managersplitter/CreateManagerSplitter'),
    ...createAminoConverter(MsgUpdateManagerSplitter, 'managersplitter/UpdateManagerSplitter'),
    ...createAminoConverter(MsgDeleteManagerSplitter, 'managersplitter/DeleteManagerSplitter'),
    ...createAminoConverter(MsgExecuteUniversalUpdateCollection, 'managersplitter/ExecuteUniversalUpdateCollection')
  };
}

export function createWasmXAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgExecuteContractCompat, 'wasmx/MsgExecuteContractCompat'),
    ...createAminoConverter(MsgInstantiateContractCompat, 'wasmx/MsgInstantiateContractCompat'),
    ...createAminoConverter(MsgExecuteContract, 'wasm/MsgExecuteContract'),
    ...createAminoConverter(MsgStoreCode, 'wasm/MsgStoreCode'),
    ...createAminoConverter(MsgInstantiateContract, 'wasm/MsgInstantiateContract')
  };
}

export function createMapsAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgCreateMap, 'maps/CreateMap'),
    ...createAminoConverter(MsgDeleteMap, 'maps/DeleteMap'),
    ...createAminoConverter(MsgSetValue, 'maps/SetValue'),
    ...createAminoConverter(MsgUpdateMap, 'maps/UpdateMap')
  };
}

export function createAnchorAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgAddCustomData, 'anchor/AddCustomData')
  };
}

export function createIBCAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgTransfer, 'ibc/MsgTransfer')
  };
}

export function createGAMMAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgJoinPool, 'gamm/JoinPool'),
    ...createAminoConverter(MsgJoinPoolResponse, 'gamm/JoinPoolResponse'),
    ...createAminoConverter(MsgExitPool, 'gamm/ExitPool'),
    ...createAminoConverter(MsgExitPoolResponse, 'gamm/ExitPoolResponse'),
    ...createAminoConverter(MsgSwapExactAmountIn, 'gamm/SwapExactAmountIn'),
    ...createAminoConverter(MsgSwapExactAmountInResponse, 'gamm/SwapExactAmountInResponse'),
    ...createAminoConverter(MsgSwapExactAmountInWithIBCTransfer, 'gamm/SwapExactAmountInWithIBCTransfer'),
    ...createAminoConverter(MsgSwapExactAmountInWithIBCTransferResponse, 'gamm/SwapExactAmountInWithIBCTransferResponse'),
    ...createAminoConverter(MsgSwapExactAmountOut, 'gamm/SwapExactAmountOut'),
    ...createAminoConverter(MsgSwapExactAmountOutResponse, 'gamm/SwapExactAmountOutResponse'),
    ...createAminoConverter(MsgJoinSwapExternAmountIn, 'gamm/JoinSwapExternAmountIn'),
    ...createAminoConverter(MsgJoinSwapExternAmountInResponse, 'gamm/JoinSwapExternAmountInResponse'),
    ...createAminoConverter(MsgJoinSwapShareAmountOut, 'gamm/JoinSwapShareAmountOut'),
    ...createAminoConverter(MsgJoinSwapShareAmountOutResponse, 'gamm/JoinSwapShareAmountOutResponse'),
    ...createAminoConverter(MsgExitSwapShareAmountIn, 'gamm/ExitSwapShareAmountIn'),
    ...createAminoConverter(MsgExitSwapShareAmountInResponse, 'gamm/ExitSwapShareAmountInResponse'),
    ...createAminoConverter(MsgExitSwapExternAmountOut, 'gamm/ExitSwapExternAmountOut'),
    ...createAminoConverter(MsgExitSwapExternAmountOutResponse, 'gamm/ExitSwapExternAmountOutResponse'),
    ...createAminoConverter(MsgCreateBalancerPool, 'gamm/CreateBalancerPool'),
    ...createAminoConverter(MsgCreateBalancerPoolResponse, 'gamm/CreateBalancerPoolResponse')
  };
}

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createTokenizationAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createAnchorAminoConverters(),
    ...createMapsAminoConverters(),
    ...createManagerSplitterAminoConverters(),
    ...createIBCAminoConverters(),
    ...createGAMMAminoConverters()
  };
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters());
