#!/bin/bash

# Set variables
OPENAPI_FILE="openapitypes/combined.yaml"  # Change this if your OpenAPI spec is named differently
PYTHON_OUTPUT_DIR="sdk-python"
JS_OUTPUT_DIR="sdk-js"
PACKAGE_NAME="bitbadgespy-sdk"
PACKAGE_IMPORT_NAME="bitbadgespy_sdk"  # This is the Python-friendly name
VERSION="0.1.8"
DESCRIPTION="BitBadges Python SDK"
AUTHOR="BitBadges"
AUTHOR_EMAIL="support@bitbadges.io"
URL="https://github.com/BitBadges/bitbadgesjs"

# Ensure openapi-generator-cli is installed
if ! command -v openapi-generator-cli &> /dev/null; then
    echo "openapi-generator-cli not found. Installing..."
    npm install -g @openapitools/openapi-generator-cli
fi

# Generate Python SDK
echo "Generating Python SDK..."
openapi-generator-cli generate \
    -i $OPENAPI_FILE \
    -g python \
    -o $PYTHON_OUTPUT_DIR \
    --skip-validate-spec \
    --additional-properties=packageName=$PACKAGE_IMPORT_NAME \
    --additional-properties=projectName=$PACKAGE_NAME \
    --additional-properties=packageVersion=$VERSION \
    --global-property apis,models,supportingFiles

# Fix imports in __init__.py and other files
echo "Fixing imports..."
cd $PYTHON_OUTPUT_DIR

# Replace any remaining hyphenated imports
find . -type f -name "*.py" -exec sed -i "s/from bitbadgespy-sdk/from bitbadgespy_sdk/g" {} +
find . -type f -name "*.py" -exec sed -i "s/import bitbadgespy-sdk/import bitbadgespy_sdk/g" {} +

# Create pyproject.toml
cat > pyproject.toml << EOF
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "$PACKAGE_NAME"
version = "$VERSION"
authors = [
    { name="$AUTHOR", email="$AUTHOR_EMAIL" }
]
description = "$DESCRIPTION"
readme = "README.md"
requires-python = ">=3.7"
classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
]

[project.urls]
"Homepage" = "$URL"
"Bug Tracker" = "$URL/issues"
EOF

# Create setup.py
cat > setup.py << EOF
from setuptools import setup, find_packages

setup(
    name="$PACKAGE_NAME",
    version="$VERSION",
    packages=find_packages(),
    install_requires=[
        "urllib3>=1.25.3",
        "python-dateutil",
        "requests>=2.0.0",
        "pydantic>=2.0.0"
    ],
)
EOF

# Create README.md if it doesn't exist
if [ ! -f "$PYTHON_OUTPUT_DIR/README.md" ]; then
    cat > $PYTHON_OUTPUT_DIR/README.md << EOF
# BitBadgesPy SDK

$DESCRIPTION

## Installation

\`\`\`bash
pip install $PACKAGE_NAME
\`\`\`

## Usage

\`\`\`python
from $PACKAGE_NAME import ApiClient
# Add usage examples here
\`\`\`
EOF
fi

echo "SDK generation complete. You can now publish the package using:"
echo "cd $PYTHON_OUTPUT_DIR && python -m build && python -m twine upload dist/*"
