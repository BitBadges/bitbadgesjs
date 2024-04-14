import * as fs from 'fs';

function removeImports(data: string): string {
  // Split the content into lines
  const lines = data.split('\n');
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].trim().startsWith('import') ||
      lines[i].trim().startsWith('export *') ||
      lines[i].trim().startsWith('export default') ||
      lines[i].trim().startsWith('export {')
    ) {
      while (lines[i] && lines[i].trim() !== '') {
        i++;
      }
    } else {
      newLines.push(lines[i]);
    }
  }

  // Join the filtered lines back into a single string
  const modifiedContent = newLines.join('\n');

  return modifiedContent;
}
const withDetailsInterfaces = [
  'iUserPermissions',
  'iBalanceDoc',
  'iUserOutgoingApproval',
  'iUserIncomingApproval',
  'iCollectionApproval',
  'iCollectionPermissions',
  'iUserBalanceStore',

  'iOutgoingApprovalCriteria',
  'iIncomingApprovalCriteria',
  'iApprovalCriteria',
  'iMerkleChallenge',
  'iUserOutgoingApprovalPermission',
  'iUserIncomingApprovalPermission',
  'iCollectionApprovalPermission'
];

function removeClasses(data: string): string {
  // Split the content into lines
  const lines = data.split('\n');
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const problemInterfaces = [
      'MessageGenerated',
      'CustomType',
      'BaseNumberTypeClass',
      'UniversalPermission',
      'UniversalPermissionDetails',
      'MergedUniversalPermissionDetails',
      'Overlap',
      'CollectionMap',
      'UsedFlags',
      'CompareAndGetUpdateCombosToCheckFn',
      'ApprovalCriteriaWithIsApproved',
      'ParseFieldParams',
      'BalanceFunctions',
      'TxToSend',
      'AccountMap',
      'GetDelegationsResponse',
      'ParseJSONParams',
      'FlattenPayloadResponse',
      'EIP712Type',
      'Proposal',
      'DelegationResponse',
      'DistributionRewardsResponse',
      'Reward',
      'BalancesResponse',
      'OffChainBalancesMap',
      'TransactionPayload',
      'iBitBadgesApi',
      ...withDetailsInterfaces.map((interfaceName) => `${interfaceName}WithDetails`)
    ];
    const startsWithProblemInterface = problemInterfaces.some(
      (problemInterface) =>
        lines[i].trim().startsWith(`export interface ${problemInterface}`) ||
        lines[i].trim().startsWith(`interface ${problemInterface}`) ||
        lines[i].trim().startsWith(`export type ${problemInterface}`) ||
        lines[i].trim().startsWith(`type ${problemInterface}`)
    );

    const safeEnums = ['BroadcastMode', 'SupportedChain'];
    const startsWithUnsafeEnum =
      (lines[i].trim().startsWith('enum ') && !safeEnums.some((safeEnum) => lines[i].includes(safeEnum))) ||
      (lines[i].trim().startsWith('export enum ') && !safeEnums.some((safeEnum) => lines[i].includes(safeEnum)));

    if (
      lines[i].trim().startsWith('export class ') ||
      lines[i].trim().startsWith('class ') ||
      lines[i].trim().startsWith('export function ') ||
      lines[i].trim().startsWith('abstract class ') ||
      lines[i].trim().startsWith('export abstract class ') ||
      lines[i].trim().startsWith('function ') ||
      lines[i].trim().startsWith('proto3.util') ||
      lines[i].trim().startsWith('proto2.util') ||
      lines[i].trim().startsWith('declare ') ||
      startsWithProblemInterface ||
      startsWithUnsafeEnum ||
      lines[i].trim().startsWith('export const ') ||
      lines[i].trim().startsWith('const ')
    ) {
      if (lines[i].trim().endsWith('{}') || lines[i].trim().endsWith(';')) {
        //skip (one-liner)
      } else {
        //go until the end of the class
        while (!(lines[i].replace('};', '}').startsWith('}') && lines[i].replace('};', '}').endsWith('}'))) {
          // console.log('removing class:', lines[i]);
          i++;
        }

        console.log(lines[i]);
      }
    } else {
      newLines.push(lines[i]);
    }
  }

  // Join the filtered lines back into a single string
  const modifiedContent = newLines.join('\n');

  return modifiedContent;
}

function removeEmptyCommentBlocks(data: string): string {
  // Split the content into lines
  const lines = data.split('\n');

  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let origIdx = i;
    if (lines[i].startsWith('/**')) {
      //go until the end of the comment block
      while (lines[i] && lines[i].trim() !== '*/') {
        i++;
      }

      if (i + 1 < lines.length && lines[i + 1].trim() === '') {
        i++;
      } else {
        for (let j = origIdx; j <= i; j++) {
          newLines.push(lines[j]);
        }
      }
    } else if (lines[i].startsWith('//') || lines[i].trim().startsWith('/* eslint-disable */')) {
    } else {
      newLines.push(lines[i]);
    }
  }

  for (const newLine of newLines) {
    if (newLine.includes('interface ') && !newLine.includes('export interface ')) {
      console.log('interface without i:', newLine);
    }
  }

  // Join the filtered lines back into a single string
  const modifiedContent = newLines.join('\n');

  return modifiedContent;
}

function removeImportLinesFromFile(filePath: string): void {
  // Read the content of the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    let modifiedContent = removeImports(data);
    modifiedContent = removeClasses(modifiedContent);
    modifiedContent = removeEmptyCommentBlocks(modifiedContent);

    modifiedContent = modifiedContent.replace(new RegExp('createdBy?: string;', 'g'), 'createdBy: string;');
    modifiedContent = modifiedContent.replace(new RegExp('solAddress?: string;', 'g'), 'solAddress: string;');
    modifiedContent = modifiedContent.replace(new RegExp('toListId: string;', 'g'), 'toListId: string;\ntoList: iAddressList;');
    modifiedContent = modifiedContent.replace(new RegExp('fromListId: string;', 'g'), 'fromListId: string;\nfromList: iAddressList;');
    modifiedContent = modifiedContent.replace(
      new RegExp('initiatedByListId: string;', 'g'),
      'initiatedByListId: string;\ninitiatedByList: iAddressList;'
    );

    for (const interfaceName of withDetailsInterfaces) {
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName} `, 'g'), `${interfaceName}WithDetails `);
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName};`, 'g'), `${interfaceName}WithDetails;`);
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName}\\[\\]`, 'g'), `${interfaceName}WithDetails[]`);
    }

    modifiedContent = modifiedContent.replace(new RegExp('WithDetails', 'g'), '');

    modifiedContent =
      `import { DeliverTxResponse } from '@cosmjs/stargate';
    import MerkleTree from 'merkletreejs';
    import { BlockinAndGroup, BlockinOrGroup } from './api-indexer';
    import { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';

    export type SupportedChain = 'Bitcoin' | 'Ethereum' | 'Cosmos' | 'Solana' | 'Unknown';
    
    export interface AssetDetails {
      chain: string;
      collectionId: string | number;
      assetIds: (string | iUintRange)[];
      ownershipTimes: iUintRange[];
      mustOwnAmounts: iUintRange;
      additionalCriteria?: string;
    }
    export interface AndGroup {
      $and: AssetConditionGroup[];
    }
    export interface OrGroup {
      $or: AssetConditionGroup[];
    }
    export type AssetConditionGroup = AndGroup | OrGroup | OwnershipRequirements;
    export interface OwnershipRequirements {
      assets: AssetDetails[];
      options?: {
        numMatchesForVerification?: string | number;
      };
    }
    export interface ChallengeParams {
      domain: string;
      statement: string;
      address: string;
      uri: string;
      nonce: string;
      version?: string;
      chainId?: string;
      issuedAt?: string;
      expirationDate?: string;
      notBefore?: string;
      resources?: string[];
      assetOwnershipRequirements?: AssetConditionGroup;
    }
    export interface VerifyChallengeOptions {
      /**
       * Optionally define the expected details to check. If the challenge was edited and the details
       * do not match, the challenge will fail verification.
       */
      expectedChallengeParams?: Partial<ChallengeParams>;
      /**
       * For verification of assets, instead of dynamically fetching the assets, you can specify a snapshot of the assets.
       *
       * This is useful if you have a snapshot, balances will not change, or you are verifying in an offline manner.
       */
      balancesSnapshot?: object;
      /**
       * If true, we do not check timestamps (expirationDate / notBefore). This is useful if you are verifying a challenge that is expected to be verified at a future time.
       */
      skipTimestampVerification?: boolean;
      /**
       * If true, we do not check asset ownership. This is useful if you are verifying a challenge that is expected to be verified at a future time.
       */
      skipAssetVerification?: boolean;
      /**
       * The earliest issued At ISO date string that is valid. For example, if you want to verify a challenge that was issued within the last minute, you can specify this to be 1 minute ago.
       */
      earliestIssuedAt?: string;
      /**
       * If set, we will verify the issuedAt is within this amount of ms ago (i.e. issuedAt >= Date.now() - issuedAtTimeWindowMs)
       */
      issuedAtTimeWindowMs?: number;
      /**
       * If true, we do not check the signature. You can pass in an undefined ChainDriver
       */
      skipSignatureVerification?: boolean;
    }\n\n` + modifiedContent;

    // Write the modified content back to the file
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
  });
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide the file path as an argument.');
} else {
  removeImportLinesFromFile(filePath);
}
