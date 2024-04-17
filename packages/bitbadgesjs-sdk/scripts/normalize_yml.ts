import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Read the YAML file
const filePath = process.argv[2];
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse YAML content
  try {
    const yamlData = yaml.load(data);

    // Remove all 'title' properties from the YAML data
    removeTitleProperties(yamlData, '');
    addExamples(yamlData);
    orderDescriptionsAndRefs(yamlData);
    removeTimestampLinks(yamlData);
    removeOrphanedRefs(yamlData);

    // Convert the modified YAML data back to string
    let modifiedYamlContent = yaml.dump(yamlData);

    //Remove all lines with @category
    modifiedYamlContent = modifiedYamlContent
      .split('\n')
      .filter((line) => !line.includes('@category'))
      .filter((line) => !line.includes('@inherit'))
      .join('\n');

    const lines = modifiedYamlContent.split('\n');
    const newLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (i + 3 < lines.length) {
        if (
          lines[i].trim() === 'anyOf:' &&
          lines[i + 1].trim() === '- type: string' &&
          lines[i + 2].trim() === '- type: number' &&
          lines[i + 3].trim() !== '- type: boolean'
        ) {
          newLines.push(lines[i].replace('anyOf:', `$ref: '#/components/schemas/NumberType'`));
          i += 2;
          continue;
        }
      }

      newLines.push(lines[i]);
    }

    modifiedYamlContent = newLines.join('\n');

    // Write the modified content back to the file
    fs.writeFileSync(filePath, modifiedYamlContent, 'utf8');
  } catch (e) {
    console.error('Error parsing or modifying YAML:', e);
  }
});

// Function to remove all 'title' properties recursively
function removeTitleProperties(obj: any, parentKey: string) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeTitleProperties(obj[key], key); // Recursive call
    }
    if (key === 'title' && parentKey !== 'properties') {
      delete obj[key];
    }
  }
}

function addExamples(obj: any) {
  //add examples to certain property naems recursively
  function addExamples(obj: any, expectedKey: string, examples: any[]) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (key === expectedKey) {
          obj[key].examples = examples;
        }
        addExamples(obj[key], expectedKey, examples); // Recursive call
      }
    }
  }

  addExamples(obj, 'uri', ['https://example.com', 'ipfs://Qm...']);
  addExamples(obj, 'approvalLevel', ['collection', 'incoming', 'outgoing']);
  addExamples(obj, 'profilePicUrl', ['https://example.com', 'ipfs://Qm...']);
  addExamples(obj, 'domain', ['https://example.com', 'ipfs://Qm...']);
  addExamples(obj, 'badgeIds', [[{ start: '1', end: '10' }]]);
  addExamples(obj, 'metadataIds', [[{ start: '1', end: '10' }]]);
  addExamples(obj, 'ownershipTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'timelineTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'transferTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'permanentlyPermittedTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'permanentlyForbiddenTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'fromListId', ['customOrReservedListId', 'Mint', 'All', 'cosmos1...']);
  addExamples(obj, 'toListId', ['customOrReservedListId', 'Mint', 'All', 'cosmos1...']);
  addExamples(obj, 'initiatedByListId', ['customOrReservedListId', 'Mint', 'All', 'cosmos1...']);
  addExamples(obj, 'listId', ['customOrReservedListId', 'Mint', 'All', 'cosmos1...']);
  addExamples(obj, 'txHash', ['CE22D7...']);
  addExamples(obj, 'ethAddress', ['0x...']);
  addExamples(obj, 'cosmosAddress', ['cosmos1...']);
  addExamples(obj, 'btcAddress', ['bc1...']);
  addExamples(obj, 'solAddress', ['6H2af6...']);
  //iso8601
  addExamples(obj, 'expirationDate', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'notBefore', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'issuedAt', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'earliestIssuedAt', ['2022-01-01T00:00:00Z']);

  addExamples(obj, 'resources', [['Full Access: Full access to all features.']]);
  addExamples(obj, 'secretMessages', [['secret message 1', 'secret message 2']]);

  addExamples(obj, 'viewId', ['viewKey']);
  addExamples(obj, 'viewType', ['viewKey']);
  addExamples(obj, 'signature', ['0x...', '8d42172...']);
  addExamples(obj, 'signer', ['0x...', '8d42172...']);

  addExamples(obj, 'name', ['Name']);
  addExamples(obj, 'description', ['Brief description.']);
  addExamples(obj, 'image', ['https://example.com/image.png', 'ipfs://Qm...']);
  addExamples(obj, 'video', ['https://www.youtube.com/embed/VIDEO_ID', 'https://example.com/video.mp4']);
  addExamples(obj, 'publicKey', ['AksB.... (base64)']);
  addExamples(obj, 'assetOwnershipRequirements', [
    {
      assets: [
        {
          chain: 'BitBadges',
          collectionId: '1',
          assetIds: [{ start: '1', end: '1' }],
          mustOwnAmounts: { start: '1', end: '1' },
          ownershipTimes: []
        }
      ]
    }
  ]);

  addExamples(obj, 'AssetConditionGroup', [
    {
      $and: [
        {
          assets: [
            {
              chain: 'BitBadges',
              collectionId: '1',
              assetIds: [{ start: '1', end: '1' }],
              mustOwnAmounts: { start: '1', end: '1' },
              ownershipTimes: []
            }
          ]
        }
      ]
    }
  ]);

  const examples: {
    key?: string;
    keys?: string[];
    example?: any;
    examples?: any[];
  }[] = [
    {
      key: 'UNIXMilliTimestamp',
      example: '1713301889'
    },
    {
      key: 'CosmosAddress',
      example: 'cosmos1...'
    },
    {
      key: 'NativeAddress',
      examples: ['0x...', 'bc1...', 'cosmos1...']
    },
    {
      key: 'BlockinMessage',
      example: 'https://bitbadges.io wants you to sign in with your Cosmos address....'
    }
  ];

  for (const example of examples) {
    if (example.keys) {
      let temp = obj.components.schemas;
      for (const key of example.keys) {
        temp = temp[key];
      }
      temp.examples = example.example ? [example.example] : example.examples;
    } else {
      obj.components.schemas[`${example.key}`].examples = example.example ? [example.example] : example.examples;
    }
  }
}

function orderDescriptionsAndRefs(obj: any) {
  //We always want the ref to be last so we use the children description
  for (const key in obj.components.schemas) {
    const schema = obj.components.schemas[key];
    if (schema && schema.properties) {
      for (const prop in schema.properties) {
        const property = schema.properties[prop];
        if (property.$ref) {
          const temp = property.$ref;
          delete property.$ref;
          property.$ref = temp;
        }
      }
    }
  }
}

function removeTimestampLinks(obj: any) {
  obj.components.schemas.UNIXMilliTimestamp.$ref = undefined;
}
