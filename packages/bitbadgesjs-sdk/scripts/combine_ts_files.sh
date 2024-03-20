#!/bin/bash

# Function to combine TypeScript files
combine_ts_files() {
    local directory="$1"
    local output_file="$2"

    # Find all TypeScript files in the directory excluding the proto and node-rest-api directories
    find "$directory" -type f -name "*.ts" -print0 | while IFS= read -r -d '' file; do
        # Append file content to the output file
        cat "$file" >> "$output_file"
        echo "" >> "$output_file" # Add an empty line after each file
    done
}

# Main function
main() {
    local directory="src"
    local output_file="combined.ts"
    rm -f "src/combined.ts"
    combine_ts_files "$directory" "src/$output_file"
    echo "Combined TypeScript files into '$output_file'."
}

# Execute main function
main
