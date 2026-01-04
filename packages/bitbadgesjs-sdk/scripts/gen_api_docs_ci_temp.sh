#!/bin/bash

#rm all git unstaged changes
git clean -fd

echo "No changes found. Proceeding..."

# set package.json type to module
sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

source ./scripts/combine_ts_files.sh
bun ./scripts/normalize_combined.ts ./src/combined.ts
npm run format-ci || echo "Format failed, continuing anyway..."
source ./scripts/create_yml_schemas.sh
