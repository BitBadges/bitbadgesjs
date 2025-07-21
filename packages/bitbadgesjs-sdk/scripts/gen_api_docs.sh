#!/bin/bash

# throw if we have git changes ( they can be staged though)
if [ -n "$(git diff --exit-code)" ]; then
    echo "Please commit your changes before running this script."
else
    echo "No changes found. Proceeding..."

    # set package.json type to module
    sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

    nvm use 18

    bun ./scripts/check_routes_consistency.ts ../../../bitbadges-indexer/src/indexer.ts  ./openapitypes-helpers/routes.yaml
    if [ $? -ne 0 ]; then
        echo "Route consistency check failed!"
        # exit 0
    fi

    source ./scripts/combine_ts_files.sh
    bun ./scripts/normalize_combined.ts ./src/combined.ts
    npm run format-ci
    source ./scripts/create_yml_schemas.sh
    npm run format-ci
    bun ./scripts/normalize_yml.ts ./openapitypes/combined.yaml
    rm ./src/combined.ts
    git add ./openapitypes/combined.yaml
    #discard all other changes
    git checkout -- .

    cd ../../
    source ./scripts/gendocs.sh
    cd ./packages/bitbadgesjs-sdk

    git add .

    nvm use 20
fi
