#!/bin/bash


# Clean up old build artifacts with proper permissions
sudo rm -rf ./sdk-python dist/ build/ *.egg-info/

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
