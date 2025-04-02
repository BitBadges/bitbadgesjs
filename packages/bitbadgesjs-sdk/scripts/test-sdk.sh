#!/bin/bash

# Create a temporary virtual environment
echo "Creating virtual environment..."
python -m venv test_env
source test_env/bin/activate

# Install required dependencies
echo "Installing dependencies..."
pip install pydantic urllib3 python-dateutil requests

# Install the package in development mode
echo "Installing package..."
cd sdk-python
pip install -e .

# Create and run test script
echo "Creating test script..."
cat > test_script.py << EOF
from bitbadgespy_sdk import Configuration, ApiClient
from bitbadgespy_sdk.api import badges_api

def test_sdk():
    # Initialize the client
    configuration = Configuration(host="https://api.bitbadges.io")
    client = ApiClient(configuration)

    try:
        # Test badges API
        badges = badges_api.BadgesApi(client)

        print("\Import + Initialization Successful! ✅")

    except Exception as e:
        print(f"\nError during testing: {str(e)} ❌")
        raise e

if __name__ == "__main__":
    print("Starting BitBadgesPy SDK tests...")
    test_sdk()
EOF

# Run the test script
echo "Running tests..."
python test_script.py

# Cleanup
echo "Cleaning up..."
deactivate
rm -rf test_env

echo "Test script complete."
