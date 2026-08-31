#!/bin/bash
# fail-fast: any assembly step erroring must abort (never publish a
# partial/raw spec). -u omitted on purpose — the sourced legacy
# scripts use unset vars in find/while loops. #0408
set -eo pipefail

echo "No changes found. Proceeding..."

# set package.json type to module
sed -i 's/"sideEffects": false,/"sideEffects": false,\n  "type": "module",/' package.json

source ./scripts/combine_ts_files.sh
bun ./scripts/normalize_combined.ts ./src/combined.ts
npm run format-ci || echo "Format failed, continuing anyway..."
source ./scripts/create_yml_schemas.sh
npm run format-ci || echo "Format failed, continuing anyway..."

bun ./scripts/normalize_yml.ts ./openapitypes/combined.yaml

# Drop every x-internal operation BEFORE anything is published. Both the
# Stoplight push (./openapitypes) and the LLM-hosted artifacts derive from
# this file, so filtering here is the single choke point.
bun ./scripts/strip_internal_routes.ts ./openapitypes/combined.yaml

bun ./scripts/spread_explodes.ts ./openapitypes/combined.yaml

# Convert final OpenAPI spec to JSON for LLM hosting
bun ./scripts/convert_openapi_to_json.ts

# Belt-and-braces: refuse to continue if anything internal survived.
bun ./scripts/assert_no_internal_routes.ts ./openapitypes/combined_processed.yaml
bun ./scripts/assert_no_internal_routes.ts ./openapi-hosted/openapi.json

rm ./openapitypes/combined.yaml
rm ./src/combined.ts
