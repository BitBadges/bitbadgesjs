import * as fs from 'fs';

function removeImports(data: string): string {
  // Split the content into lines
  const lines = data.split('\n');
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (
      (lines[i].trim().startsWith('import') ||
        lines[i].trim().startsWith('export *') ||
        lines[i].trim().startsWith('export default') ||
        lines[i].trim().startsWith('export {')) &&
      !lines[i].trim().startsWith('export default class')
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
  'iCollectionApprovalPermission',
  'iCosmosCoinWrapperPath',
  'iAliasPath',
  'iDenomUnit',
  'iPathMetadata'
];

function removeClasses(data: string): string {
  // Split the content into lines
  const lines = data.split('\n');
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Minimal problem interfaces - tested and most can be removed
    // Keeping only essential ones that are actually needed
    const problemInterfaces = [
      'MessageGenerated',
      'CustomType',
      'BaseNumberTypeClass',
      ...withDetailsInterfaces.map((interfaceName) => `${interfaceName}WithDetails`)
    ];
    const startsWithProblemInterface = problemInterfaces.some(
      (problemInterface) =>
        lines[i].trim().startsWith(`export interface ${problemInterface}`) ||
        lines[i].trim().startsWith(`interface ${problemInterface}`) ||
        lines[i].trim().startsWith(`export type ${problemInterface}`) ||
        lines[i].trim().startsWith(`type ${problemInterface}`)
    );

    // Removed enum removal logic - tested and confirmed not needed
    const startsWithUnsafeEnum = false;

    // Simplified: Only remove problem interfaces and proto utils - tested and confirmed classes/functions/consts don't need removal
    if (lines[i].trim().startsWith('proto3.util') || lines[i].trim().startsWith('proto2.util') || startsWithProblemInterface) {
      if (lines[i].trim().endsWith('{}') || lines[i].trim().endsWith(';')) {
        //skip (one-liner)
      } else {
        //go until the end of the class
        while (!(lines[i].replace('};', '}').startsWith('}') && lines[i].replace('};', '}').endsWith('}'))) {
          // console.log('removing class:', lines[i]);
          i++;
        }

        // console.log(lines[i]);
      }
    } else {
      newLines.push(lines[i]);
    }
  }

  // Join the filtered lines back into a single string
  const modifiedContent = newLines.join('\n');

  return modifiedContent;
}

// Removed removeEmptyCommentBlocks function - tested and confirmed not needed

/**
 * Extracts enum definition from source content
 */
function extractEnumDefinition(content: string, enumName: string): string | null {
  const lines = content.split('\n');
  const enumStartIdx = lines.findIndex((line) => line.includes(`export enum ${enumName}`) || line.includes(`enum ${enumName}`));

  if (enumStartIdx === -1) {
    return null;
  }

  // Find the end of the enum by finding the closing brace
  let enumEndIdx = enumStartIdx + 1;
  let braceCount = 0;
  let foundStart = false;

  for (let i = enumStartIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{') && !foundStart) {
      foundStart = true;
      braceCount = 1;
    } else if (foundStart) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      if (braceCount === 0) {
        enumEndIdx = i;
        break;
      }
    }
  }

  // Extract the enum lines
  const enumLines = lines.slice(enumStartIdx, enumEndIdx + 1);
  return enumLines.join('\n');
}

/**
 * Converts SupportedChain enum to type alias format
 */
function convertSupportedChainEnumToType(enumDef: string): string {
  // Extract enum values
  const valueMatches = enumDef.match(/\w+\s*=\s*'([^']+)'/g);
  if (!valueMatches) {
    return "export type SupportedChain = 'Bitcoin' | 'Ethereum' | 'Cosmos' | 'Solana' | 'Unknown';";
  }

  const values = valueMatches
    .map((match) => {
      const valueMatch = match.match(/'([^']+)'/);
      return valueMatch ? valueMatch[1] : null;
    })
    .filter(Boolean) as string[];

  return `export type SupportedChain = ${values.map((v) => `'${v}'`).join(' | ')};`;
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
    // Removed empty comment block removal - tested and confirmed not needed

    // Removed unnecessary field replacements - tested and confirmed not needed

    // Extract enums from source before WithDetails replacement
    const supportedChainEnum = extractEnumDefinition(modifiedContent, 'SupportedChain');
    const pluginPresetTypeEnum = extractEnumDefinition(modifiedContent, 'PluginPresetType');

    // Convert SupportedChain enum to type alias (typeconv works better with type aliases for this)
    const supportedChainType = supportedChainEnum
      ? convertSupportedChainEnumToType(supportedChainEnum)
      : "export type SupportedChain = 'Bitcoin' | 'Ethereum' | 'Cosmos' | 'Solana' | 'Unknown';";

    // Use extracted PluginPresetType enum, or fallback to hardcoded version
    // Note: StateTransitions is not in source, so we add it if needed
    let pluginPresetTypeDef =
      pluginPresetTypeEnum ||
      `export enum PluginPresetType {
  Stateless = 'Stateless',
  Usernames = 'Usernames',
  ClaimToken = 'ClaimToken',
  CustomResponseHandler = 'CustomResponseHandler',
  ClaimNumbers = 'ClaimNumbers'
}`;

    // Add StateTransitions if it's not already there (check if it exists in the enum)
    if (!pluginPresetTypeDef.includes('StateTransitions')) {
      // Insert before the closing brace
      pluginPresetTypeDef = pluginPresetTypeDef.replace(/\n}/, "\n  StateTransitions = 'StateTransitions'\n}");
    }

    // WithDetails replacement logic - needed to handle WithDetails interfaces
    for (const interfaceName of withDetailsInterfaces) {
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName} `, 'g'), `${interfaceName}WithDetails `);
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName};`, 'g'), `${interfaceName}WithDetails;`);
      modifiedContent = modifiedContent.replace(new RegExp(`${interfaceName}\\[\\]`, 'g'), `${interfaceName}WithDetails[]`);
    }
    modifiedContent = modifiedContent.replace(new RegExp('WithDetails', 'g'), '');

    // Remove duplicate enum definitions from source after extraction
    // Remove SupportedChain enum (we'll use the extracted type alias instead)
    if (supportedChainEnum) {
      let lines = modifiedContent.split('\n');
      const enumStartIdx = lines.findIndex((line) => line.includes('export enum SupportedChain') || line.includes('enum SupportedChain'));
      if (enumStartIdx !== -1) {
        let enumEndIdx = enumStartIdx + 1;
        let braceCount = 0;
        let foundStart = false;
        for (let i = enumStartIdx; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('{') && !foundStart) {
            foundStart = true;
            braceCount = 1;
          } else if (foundStart) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            if (braceCount === 0) {
              enumEndIdx = i;
              break;
            }
          }
        }
        // Remove the enum and any comments/JSDoc above it
        let commentStart = enumStartIdx;
        while (commentStart > 0) {
          const prevLine = lines[commentStart - 1].trim();
          if (prevLine.startsWith('/**') || prevLine.startsWith('*') || prevLine.startsWith('//') || prevLine === '') {
            commentStart--;
          } else {
            break;
          }
        }
        modifiedContent = lines.filter((_, idx) => idx < commentStart || idx > enumEndIdx).join('\n');
      }
    }

    // Remove PluginPresetType enum (we'll use the extracted one instead)
    if (pluginPresetTypeEnum) {
      let lines = modifiedContent.split('\n');
      const enumStartIdx = lines.findIndex((line) => line.includes('export enum PluginPresetType') || line.includes('enum PluginPresetType'));
      if (enumStartIdx !== -1) {
        let enumEndIdx = enumStartIdx + 1;
        let braceCount = 0;
        let foundStart = false;
        for (let i = enumStartIdx; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('{') && !foundStart) {
            foundStart = true;
            braceCount = 1;
          } else if (foundStart) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            if (braceCount === 0) {
              enumEndIdx = i;
              break;
            }
          }
        }
        // Remove the enum and any comments/JSDoc above it
        let commentStart = enumStartIdx;
        while (commentStart > 0) {
          const prevLine = lines[commentStart - 1].trim();
          if (prevLine.startsWith('/**') || prevLine.startsWith('*') || prevLine.startsWith('//') || prevLine === '') {
            commentStart--;
          } else {
            break;
          }
        }
        modifiedContent = lines.filter((_, idx) => idx < commentStart || idx > enumEndIdx).join('\n');
      }
    }

    // Only hardcode external types from blockin package (these are not in our source)
    // Extract SupportedChain and PluginPresetType from source instead
    modifiedContent =
      `
    import MerkleTree from 'merkletreejs';
    import { SiwbbAndGroup, SiwbbOrGroup } from './api-indexer';
    import { Options as MerkleTreeJsOptions } from 'merkletreejs/dist/MerkleTree';

    ${supportedChainType}

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

    ${pluginPresetTypeDef}

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

    // remove the two lines BELOW export interface iAddressListDoc
    const lineIdx = modifiedContent.split('\n').findIndex((line) => line.includes('export interface iAddressListDoc'));
    modifiedContent = modifiedContent
      .split('\n')
      .filter((_, idx) => idx !== lineIdx + 1 && idx !== lineIdx + 2)
      .join('\n');

    // Remove duplicate fields from iBitBadgesCollection that are already defined in iCollectionDoc
    // These fields cause typeconv to fail with "Cyclic dependency detected" because the same field
    // is defined in both the base interface and the extending interface
    const lines = modifiedContent.split('\n');
    const bitBadgesCollectionStartIdx = lines.findIndex(
      (line) => line.includes('export interface iBitBadgesCollection') || line.includes('interface iBitBadgesCollection')
    );

    if (bitBadgesCollectionStartIdx !== -1) {
      // Find the end of the interface by finding the closing brace
      let bitBadgesCollectionEndIdx = bitBadgesCollectionStartIdx + 1;
      let braceCount = 0;
      let foundStart = false;
      for (let i = bitBadgesCollectionStartIdx; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('{') && !foundStart) {
          foundStart = true;
          braceCount = 1;
        } else if (foundStart) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          if (braceCount === 0) {
            bitBadgesCollectionEndIdx = i;
            break;
          }
        }
      }

      // Fields that are duplicates from iCollectionDoc (already defined in parent)
      const duplicateFields = [
        'defaultBalances: iUserBalanceStore',
        'collectionPermissions: iCollectionPermissions',
        'collectionMetadata: iCollectionMetadata',
        'tokenMetadata: iTokenMetadata'
      ];

      // Find and mark lines to remove within the iBitBadgesCollection interface
      const linesToRemove: number[] = [];
      for (let i = bitBadgesCollectionStartIdx + 1; i < bitBadgesCollectionEndIdx; i++) {
        const line = lines[i];
        if (duplicateFields.some((field) => line.includes(field))) {
          linesToRemove.push(i);
          // Also check if there's a comment above this line
          if (i > 0 && (lines[i - 1].trim().startsWith('/**') || lines[i - 1].trim().startsWith('*') || lines[i - 1].trim().startsWith('//'))) {
            // Find the start of the comment block
            let commentStart = i - 1;
            while (commentStart > bitBadgesCollectionStartIdx) {
              const prevLine = lines[commentStart].trim();
              if (prevLine.startsWith('/**')) {
                break;
              }
              if (prevLine.startsWith('*') || prevLine.startsWith('//')) {
                commentStart--;
              } else {
                commentStart++;
                break;
              }
            }
            // Mark all comment lines for removal
            for (let j = commentStart; j < i; j++) {
              if (!linesToRemove.includes(j)) {
                linesToRemove.push(j);
              }
            }
          }
        }
      }

      // Remove the marked lines
      modifiedContent = lines.filter((_, idx) => !linesToRemove.includes(idx)).join('\n');
    } else {
      // Fallback to old method if interface not found (shouldn't happen, but safe)
      const defaultBalancesLine = lines.findIndex((line) => line.includes('defaultBalances: iUserBalanceStore'));
      const permLine = lines.findIndex((line) => line.includes('collectionPermissions: iCollectionPermissions'));
      const collectionMetadataLine = lines.findIndex(
        (line) => line.includes('collectionMetadata: iCollectionMetadata') && !line.includes('iCollectionMetadataWithDetails')
      );
      const tokenMetadataLine = lines.findIndex(
        (line) => line.includes('tokenMetadata: iTokenMetadata') && !line.includes('iTokenMetadataWithDetails')
      );

      const linesToRemove = [defaultBalancesLine, permLine, collectionMetadataLine, tokenMetadataLine].filter((idx) => idx !== -1);
      modifiedContent = lines
        .filter((_, idx) => {
          if (linesToRemove.includes(idx)) {
            return false;
          }
          if (linesToRemove.some((removeIdx) => idx === removeIdx - 1)) {
            const line = lines[idx];
            if (line && (line.trim().startsWith('/**') || line.trim().startsWith('*') || line.trim().startsWith('//'))) {
              return false;
            }
          }
          return true;
        })
        .join('\n');
    }

    const accountDocLines = getInBetweenBraces('export interface iAccountDoc', modifiedContent.split('\n')).filter(
      (x) => !(x.includes('solAddress') || x.includes('Solana address'))
    );
    const profileDocLines = getInBetweenBraces('export interface iProfileDoc', modifiedContent.split('\n')).filter(
      (x) => !(x.includes('solAddress') || x.includes('Solana address'))
    );

    const bitbadgesuserInfoIdx = modifiedContent.split('\n').findIndex((line) => line.includes('export interface iBitBadgesUserInfo'));
    modifiedContent = modifiedContent
      .split('\n')
      .map((x, idx) => {
        if (idx === bitbadgesuserInfoIdx) {
          return `export interface iBitBadgesUserInfo extends Doc {\n` + accountDocLines.join('\n') + '\n' + profileDocLines.join('\n') + `\n`;
        }
        return x;
      })
      .join('\n');

    // Removed ManagePluginRequest workaround - tested and confirmed not needed

    // Write the modified content back to the file
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
  });
}

const getInBetweenBraces = (startLineSubstring: string, lines: string[]) => {
  let i = lines.findIndex((line) => line.includes(startLineSubstring));
  let innerLines: string[] = [];

  if (lines[i].trim().endsWith('{}') || lines[i].trim().endsWith(';')) {
    return [];
  } else {
    i++;
    //go until the end of the class
    while (!(lines[i].replace('};', '}').startsWith('}') && lines[i].replace('};', '}').endsWith('}'))) {
      // console.log('removing class:', lines[i]);
      innerLines.push(lines[i]);
      i++;
    }

    // console.log(lines[i]);
  }

  return innerLines;
};

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide the file path as an argument.');
} else {
  removeImportLinesFromFile(filePath);
}
