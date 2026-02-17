/**
 * Precompile ABI data exported as TypeScript constant
 * This file contains the ABI JSON data to avoid import assertion issues
 */

export const precompileAbiData = {
  _format: 'hh-sol-artifact-1',
  contractName: 'ITokenizationPrecompile',
  sourceName: 'solidity/precompiles/tokenization/ITokenizationPrecompile.sol',
  abi: [
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'transferTokens',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setIncomingApproval',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setOutgoingApproval',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getCollection',
      outputs: [
        {
          internalType: 'bytes',
          name: 'collection',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getBalance',
      outputs: [
        {
          internalType: 'bytes',
          name: 'balance',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getAddressList',
      outputs: [
        {
          internalType: 'bytes',
          name: 'list',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getApprovalTracker',
      outputs: [
        {
          internalType: 'bytes',
          name: 'tracker',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getChallengeTracker',
      outputs: [
        {
          internalType: 'uint256',
          name: 'numUsed',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getETHSignatureTracker',
      outputs: [
        {
          internalType: 'uint256',
          name: 'numUsed',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getDynamicStore',
      outputs: [
        {
          internalType: 'bytes',
          name: 'store',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getDynamicStoreValue',
      outputs: [
        {
          internalType: 'bytes',
          name: 'value',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getWrappableBalances',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'isAddressReservedProtocol',
      outputs: [
        {
          internalType: 'bool',
          name: 'isReserved',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getAllReservedProtocolAddresses',
      outputs: [
        {
          internalType: 'address[]',
          name: 'addresses',
          type: 'address[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getVote',
      outputs: [
        {
          internalType: 'bytes',
          name: 'vote',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getVotes',
      outputs: [
        {
          internalType: 'bytes',
          name: 'votes',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'params',
      outputs: [
        {
          internalType: 'bytes',
          name: 'params',
          type: 'bytes'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getBalanceAmount',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'getTotalSupply',
      outputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'deleteCollection',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'deleteIncomingApproval',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'deleteOutgoingApproval',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'createDynamicStore',
      outputs: [
        {
          internalType: 'uint256',
          name: 'storeId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'updateDynamicStore',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'deleteDynamicStore',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setDynamicStoreValue',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setCustomData',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setIsArchived',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setManager',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setCollectionMetadata',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setStandards',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'castVote',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'createCollection',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'updateCollection',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'updateUserApprovals',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'createAddressLists',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'purgeApprovals',
      outputs: [
        {
          internalType: 'uint256',
          name: 'numPurged',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setValidTokenIds',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setTokenMetadata',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'setCollectionApprovals',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'string',
          name: 'msgJson',
          type: 'string'
        }
      ],
      name: 'universalUpdateCollection',
      outputs: [
        {
          internalType: 'uint256',
          name: 'collectionId',
          type: 'uint256'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: '(string,string)[]',
          name: 'messages',
          type: 'tuple[]',
          components: [
            {
              internalType: 'string',
              name: 'messageType',
              type: 'string'
            },
            {
              internalType: 'string',
              name: 'msgJson',
              type: 'string'
            }
          ]
        }
      ],
      name: 'executeMultiple',
      outputs: [
        {
          internalType: 'bool',
          name: 'success',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const;

/**
 * Staking precompile ABI data (Cosmos EVM default at 0x800)
 * These functions use typed ABI parameters (not JSON string encoding)
 *
 * Note: delegatorAddress must equal msg.sender (enforced by precompile)
 * Note: validatorAddress can be either Ethereum hex or Cosmos bech32 format
 * Note: Amounts are in abadge (18 decimals via precisebank)
 */
export const stakingPrecompileAbiData = {
  _format: 'hh-sol-artifact-1',
  contractName: 'IStakingPrecompile',
  sourceName: 'cosmos/evm/precompiles/staking/StakingI.sol',
  abi: [
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'delegate',
      outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'undelegate',
      outputs: [{ internalType: 'int64', name: 'completionTime', type: 'int64' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorSrcAddress', type: 'string' },
        { internalType: 'string', name: 'validatorDstAddress', type: 'string' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'redelegate',
      outputs: [{ internalType: 'int64', name: 'completionTime', type: 'int64' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'int64', name: 'creationHeight', type: 'int64' }
      ],
      name: 'cancelUnbondingDelegation',
      outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    // Query functions (view)
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' }
      ],
      name: 'delegation',
      outputs: [
        { internalType: 'uint256', name: 'shares', type: 'uint256' },
        {
          internalType: 'tuple',
          name: 'balance',
          type: 'tuple',
          components: [
            { internalType: 'string', name: 'denom', type: 'string' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'string', name: 'validatorAddress', type: 'string' }],
      name: 'validator',
      outputs: [
        {
          internalType: 'tuple',
          name: 'validator',
          type: 'tuple',
          components: [
            { internalType: 'string', name: 'operatorAddress', type: 'string' },
            { internalType: 'string', name: 'consensusPubkey', type: 'string' },
            { internalType: 'bool', name: 'jailed', type: 'bool' },
            { internalType: 'uint8', name: 'status', type: 'uint8' },
            { internalType: 'uint256', name: 'tokens', type: 'uint256' },
            { internalType: 'uint256', name: 'delegatorShares', type: 'uint256' },
            { internalType: 'string', name: 'description', type: 'string' },
            { internalType: 'int64', name: 'unbondingHeight', type: 'int64' },
            { internalType: 'int64', name: 'unbondingTime', type: 'int64' },
            { internalType: 'uint256', name: 'commission', type: 'uint256' },
            { internalType: 'uint256', name: 'minSelfDelegation', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ]
} as const;

/**
 * Distribution precompile ABI data (Cosmos EVM default at 0x801)
 * These functions use typed ABI parameters (not JSON string encoding)
 *
 * Note: delegatorAddress must equal msg.sender (enforced by precompile)
 */
export const distributionPrecompileAbiData = {
  _format: 'hh-sol-artifact-1',
  contractName: 'IDistributionPrecompile',
  sourceName: 'cosmos/evm/precompiles/distribution/DistributionI.sol',
  abi: [
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'uint32', name: 'maxRetrieve', type: 'uint32' }
      ],
      name: 'claimRewards',
      outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' }
      ],
      name: 'withdrawDelegatorRewards',
      outputs: [
        {
          internalType: 'tuple[]',
          name: 'amount',
          type: 'tuple[]',
          components: [
            { internalType: 'string', name: 'denom', type: 'string' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'withdrawerAddress', type: 'string' }
      ],
      name: 'setWithdrawAddress',
      outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    // Query functions (view)
    {
      inputs: [
        { internalType: 'address', name: 'delegatorAddress', type: 'address' },
        { internalType: 'string', name: 'validatorAddress', type: 'string' }
      ],
      name: 'delegationRewards',
      outputs: [
        {
          internalType: 'tuple[]',
          name: 'rewards',
          type: 'tuple[]',
          components: [
            { internalType: 'string', name: 'denom', type: 'string' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'delegatorAddress', type: 'address' }],
      name: 'delegationTotalRewards',
      outputs: [
        {
          internalType: 'tuple[]',
          name: 'rewards',
          type: 'tuple[]',
          components: [
            { internalType: 'string', name: 'validatorAddress', type: 'string' },
            {
              internalType: 'tuple[]',
              name: 'reward',
              type: 'tuple[]',
              components: [
                { internalType: 'string', name: 'denom', type: 'string' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' }
              ]
            }
          ]
        },
        {
          internalType: 'tuple[]',
          name: 'total',
          type: 'tuple[]',
          components: [
            { internalType: 'string', name: 'denom', type: 'string' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ]
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ]
} as const;

