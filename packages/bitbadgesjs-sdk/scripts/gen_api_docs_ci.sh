#!/bin/bash

echo "No changes found. Proceeding..."

# set package.json type to module
sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

source ./scripts/combine_ts_files.sh
tsx ./scripts/normalize_combined.ts ./src/combined.ts
npm run format-ci || echo "Format failed, continuing anyway..."
source ./scripts/create_yml_schemas.sh
npm run format-ci || echo "Format failed, continuing anyway..."

tsx ./scripts/normalize_yml.ts ./openapitypes/combined.yaml
tsx ./scripts/spread_explodes.ts ./openapitypes/combined.yaml

cd ../../
rm ./openapitypes/combined.yaml
rm ./src/combined.ts
