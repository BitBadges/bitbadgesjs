#!/bin/bash

# throw if we have git changes ( they can be staged though)
if [ -n "$(git diff --exit-code)" ]; then
    echo "Please commit your changes before running this script."
else
    echo "No changes found. Proceeding..."

    # set package.json type to module
    sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

    source ./scripts/combine_ts_files.sh
    ts-node ./scripts/normalize_combined.ts ./src/combined.ts
    npm run format
    source ./scripts/create_yml_schemas.sh
    npm run format
    ts-node ./scripts/normalize_yml.ts ./openapitypes/combined.yaml
    rm ./src/combined.ts
    git add ./openapitypes/combined.yaml
    #discard all other changes
    git checkout -- .


fi
