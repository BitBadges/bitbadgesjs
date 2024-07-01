import { MsgAddCustomData } from '@/proto/anchor/tx_pb';
import {
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgDeleteCollection,
  MsgGlobalArchive,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUpdateCollection,
  MsgUpdateUserApprovals
} from '@/proto/badges/tx_pb';
import { MsgExecuteContract, MsgInstantiateContract, MsgStoreCode } from '@/proto/cosmwasm/wasm/v1/tx_pb';
import { MsgCreateMap, MsgDeleteMap, MsgSetValue, MsgUpdateMap } from '@/proto/maps/tx_pb';
import { MsgExecuteContractCompat, MsgInstantiateContractCompat } from '@/proto/wasmx/tx_pb';
import { AminoMsg } from '../messages/signDoc';
import { createAminoConverter } from './objectConverter';

import { MsgMultiSend, MsgSend } from '@/proto/cosmos/bank/v1beta1';
import {
  MsgFundCommunityPool,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgWithdrawValidatorCommission
} from '@/proto/cosmos/distribution/v1beta1';
import { MsgDeposit, MsgSubmitProposal, MsgVote, MsgVoteWeighted } from '@/proto/cosmos/gov/v1';
import { MsgBeginRedelegate, MsgCreateValidator, MsgDelegate, MsgEditValidator, MsgUndelegate } from '@/proto/cosmos/staking/v1beta1';

import { MsgCreateVestingAccount } from '@/proto/cosmos/vesting/v1beta1';

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
    ...createAminoConverter(MsgCreateVestingAccount, 'cosmos-sdk/MsgCreateVestingAccount')
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
    return {
      type: converter.aminoType,
      value: converter.toAmino(value)
    };
  }

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
              .sort()
              .join("', '") +
            "'. Thus fromAmino cannot be performed."
        );
    }
  }
}

export function createBadgesAminoConverters(): AminoConverters {
  return {
    ...createAminoConverter(MsgDeleteCollection, 'badges/DeleteCollection'),
    ...createAminoConverter(MsgTransferBadges, 'badges/TransferBadges'),
    ...createAminoConverter(MsgUpdateCollection, 'badges/UpdateCollection'),
    ...createAminoConverter(MsgUpdateUserApprovals, 'badges/UpdateUserApprovals'),
    ...createAminoConverter(MsgCreateAddressLists, 'badges/CreateAddressLists'),
    ...createAminoConverter(MsgCreateCollection, 'badges/CreateCollection'),
    ...createAminoConverter(MsgUniversalUpdateCollection, 'badges/UniversalUpdateCollection'),
    ...createAminoConverter(MsgGlobalArchive, 'badges/GlobalArchive')
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

export function createDefaultAminoConverters() {
  return {
    ...createDefaultCosmosAminoConverters(),
    ...createBadgesAminoConverters(),
    ...createWasmXAminoConverters(),
    ...createAnchorAminoConverters(),
    ...createMapsAminoConverters()
  };
}

export const AminoTypes = new AminoTypesClass(createDefaultAminoConverters());
