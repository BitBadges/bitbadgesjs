#!/bin/bash

# Check for unstaged changes (ignoring staged ones)
if [[ $(git diff --name-only) ]]; then
    echo "Error: There are unstaged changes. Please commit or stash them first."
    exit 1
fi

# Generate API docs
./scripts/gen_api_docs.sh

# Build and publish
npm run build && npm version patch && npm publish
