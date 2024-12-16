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

    const postToGetRoutes = [
      { route: '/users', schema: 'GetAccountsPayload' },
      { route: '/status', schema: '' },
      { route: '/search/{searchValue}', schema: 'GetSearchPayload' },
      { route: '/collections', schema: 'GetCollectionsPayload' },
      { route: '/collection/{collectionId}/balance/{address}', schema: 'GetBadgeBalanceByAddressPayload' },
      { route: '/collection/{collectionId}/{badgeId}/activity', schema: 'GetBadgeActivityPayload' },
      { route: '/collection/{collectionId}/{badgeId}/owners', schema: 'GetOwnersForBadgePayload' },
      { route: '/claims/reserved/{claimId}/{address}', schema: 'GetReservedCodesPayload' },
      { route: '/claims/status/{claimAttemptId}', schema: '' },
      { route: '/browse', schema: 'GetBrowsePayload' },
      { route: '/addressLists/fetch', schema: 'GetAddressListsPayload' },
      { route: '/siwbb/token', schema: 'ExchangeSIWBBAuthorizationCodePayload' },
      { route: '/developerApp/siwbbRequests', schema: 'GetSIWBBRequestsForDeveloperAppPayload' },
      { route: '/siwbbRequest/verify', schema: 'GenericBlockinVerifyPayload' },
      { route: '/verifyOwnershipRequirements', schema: 'GenericVerifyAssetsPayload' },
      { route: '/claimAlerts', schema: 'GetClaimAlertsForCollectionPayload' },
      { route: '/collection/{collectionId}/refreshStatus', schema: '' },
      { route: '/maps', schema: 'GetMapsPayload' },
      { route: '/attestation/fetch', schema: 'GetAttestationPayload' },
      { route: '/collection/{collectionId}/filter', schema: 'FilterBadgesInCollectionPayload' },
      { route: '/siwbbRequest/appleWalletPass', schema: 'GenerateAppleWalletPassPayload' },
      { route: '/claims/fetch', schema: 'GetClaimsPayload' },
      { route: '/siwbb/token', schema: 'OauthTokenPayload' }
    ];
    for (const obj of postToGetRoutes) {
      if ((yamlData as any).paths[obj.route]) {
        convertToGetRequestParams((yamlData as any).paths[obj.route], obj.schema, yamlData);
      }
    }

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

    // We now have all schemas
    const schemaYamlContent = yaml.load(modifiedYamlContent) as any;

    const routesYamlFile = './openapitypes/routes.yaml';
    const routesYamlContent = fs.readFileSync(routesYamlFile, 'utf8');
    const routesYamlData = yaml.load(routesYamlContent) as any;

    // Add the new schemas to the routes.yaml file
    routesYamlData.components.schemas = schemaYamlContent.components.schemas;

    // Convert the modified YAML data back to string
    modifiedYamlContent = yaml.dump(routesYamlData);

    // Write the modified content back to the file
    fs.writeFileSync(filePath, modifiedYamlContent, 'utf8');
  } catch (e) {
    console.error('Error parsing or modifying YAML:', e);
  }
});

// Function to remove all 'title' properties recursively
function removeTitleProperties(obj: any, parentKey: string) {
  for (const key in obj) {
    if (key === 'info') {
      continue;
    }

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeTitleProperties(obj[key], key); // Recursive call
    }
    if (key === 'title' && parentKey !== 'properties') {
      delete obj[key];
    }
  }
}

function convertToGetRequestParams(obj: any, schemaName: string, originalObj: any) {
  const postObj = obj.post;
  console.log(schemaName, obj);

  // requestBody:
  // required: true
  // content:
  //   application/json:
  //     schema:
  //       $ref: '#/components/schemas/CreateClaimPayload'

  if (postObj.requestBody) delete postObj.requestBody;
  postObj.parameters = postObj.parameters || [];
  postObj.parameters = postObj.parameters.filter((param: any) => param.in !== 'query');

  if (schemaName === '') {
    return;
  }

  postObj.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${schemaName}`
        }
      }
    }
  };

  // const schemaRef = schemaName ? originalObj.components.schemas[schemaName] : undefined;
  // const referencedObj = schemaRef ? originalObj.components.schemas[schemaName] : undefined;
  // if (referencedObj) {
  //   const properties = referencedObj.properties;
  //   const required = referencedObj.required;

  //   for (const key in properties) {
  //     const queryParamObj = {
  //       name: key,
  //       in: 'query',
  //       schema: properties[key],
  //       required: required?.includes(key)
  //     };

  //     postObj.parameters.push(queryParamObj);
  //   }
  // }
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
  addExamples(obj, 'bannerImage', ['https://example.com', 'ipfs://Qm...']);
  addExamples(obj, 'domain', ['https://example.com', 'ipfs://Qm...']);
  addExamples(obj, 'badgeIds', [[{ start: '1', end: '10' }]]);
  addExamples(obj, 'metadataIds', [[{ start: '1', end: '10' }]]);
  addExamples(obj, 'ownershipTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'timelineTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'transferTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'permanentlyPermittedTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'permanentlyForbiddenTimes', [[{ start: '1713301889', end: '2000000000' }], [{ start: '1', end: '18446744073709551615' }]]);
  addExamples(obj, 'fromListId', ['customOrReservedListId', 'Mint', 'All', 'bb1...']);
  addExamples(obj, 'toListId', ['customOrReservedListId', 'Mint', 'All', 'bb1...']);
  addExamples(obj, 'initiatedByListId', ['customOrReservedListId', 'Mint', 'All', 'bb1...']);
  addExamples(obj, 'listId', ['customOrReservedListId', 'Mint', 'All', 'bb1...']);
  addExamples(obj, 'txHash', ['CE22D7...']);
  addExamples(obj, 'ethAddress', ['0x...']);
  addExamples(obj, 'bitbadgesAddress', ['bb1...']);
  addExamples(obj, 'btcAddress', ['bc1...']);
  addExamples(obj, 'solAddress', ['6H2af6...']);
  //iso8601
  addExamples(obj, 'expirationDate', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'notBefore', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'issuedAt', ['2022-01-01T00:00:00Z']);
  addExamples(obj, 'earliestIssuedAt', ['2022-01-01T00:00:00Z']);

  addExamples(obj, 'resources', [['Full Access: Full access to all features.']]);
  addExamples(obj, 'messages', [['attestation message 1', 'attestation message 2']]);

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
      key: 'BitBadgesAddress',
      example: 'bb1...'
    },
    {
      key: 'NativeAddress',
      examples: ['0x...', 'bc1...', 'bb1...']
    },
    {
      key: 'SiwbbMessage',
      example: 'https://bitbadges.io wants you to sign in with your Ethereum address....'
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
