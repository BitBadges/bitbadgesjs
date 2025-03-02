#!/bin/bash

echo "No changes found. Proceeding..."

# set package.json type to module
sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

ts-node ./scripts/check_routes_consistency.ts ../../../bitbadges-indexer/src/indexer.ts  ./openapitypes-helpers/routes.yaml
if [ $? -ne 0 ]; then
    echo "Route consistency check failed!"
    # exit 0
fi

source ./scripts/combine_ts_files.sh
ts-node ./scripts/normalize_combined.ts ./src/combined.ts
npm run format
source ./scripts/create_yml_schemas.sh
npm run format
ts-node ./scripts/normalize_yml.ts ./openapitypes/combined.yaml
rm ./src/combined.ts
