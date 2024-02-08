#!/bin/bash

# Function to recursively remove files with specified extensions
remove_files() {
    find "$1" -type f \( -name '*.d.ts' -o -name '*.d.ts.map' -o -name '*.js' -o -name '*.js.map' \) -exec rm -f {} +
}

# Main script
echo "Removing .d.ts, .d.ts.map, .js, and .js.map files recursively..."

# Pass the directory path as an argument or use the current directory if not provided
if [ $# -eq 0 ]; then
    remove_files .
else
    for dir in "$@"; do
        remove_files "$dir"
    done
fi

echo "Removal complete."
