#!/bin/bash


# Clean up old build artifacts with proper permissions
sudo rm -rf ./sdk-python dist/ build/ *.egg-info/

# Read the VERSION= line from ./scripts/generate-sdk and bump it
CURRENT_VERSION=$(grep "^VERSION=" ./scripts/generate-sdk.sh | cut -d'"' -f2)
echo "Current version: $CURRENT_VERSION"

# Split version into major, minor, patch
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"

# Increment patch version
new_patch=$((patch + 1))
NEW_VERSION="$major.$minor.$new_patch"
echo "New version: $NEW_VERSION"

# Update the version in generate-sdk.sh
sed -i "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" ./scripts/generate-sdk.sh

# Generate SDK using the existing script
echo "Generating SDK..."
source ./scripts/generate-sdk.sh  # Removed sudo

# Create build directories with proper permissions
mkdir -p dist build

# Build it
python -m pip install --upgrade build twine
pip install -e .
python -m build


pytest

echo $PYPI_TOKEN


# Create .pypirc file with token authentication
cat > "$HOME/.pypirc" << EOF
[pypi]
  username = __token__
  password = ${PYPI_TOKEN}
EOF

# Upload to PyPI (now using .pypirc config)
python -m twine upload dist/*

# Clean up the credentials file
rm "$HOME/.pypirc"


cd ../
source ./scripts/test-sdk.sh

echo "Process completed!"
