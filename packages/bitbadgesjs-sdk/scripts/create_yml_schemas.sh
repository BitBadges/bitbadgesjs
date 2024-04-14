#!/bin/bash

# Function to remove text from a file
remove_text_from_file() {
    local file_path="$1"
    local text="$2"
    sed -i "s/$text//g" "$file_path"
}

# Function to recursively remove text from files in a directory
remove_text_from_directory() {
    local directory="$1"
    local text="$2"
    find "$directory" -type f -name "*.ts" -print0 | while IFS= read -r -d '' file; do
        remove_text_from_file "$file" "$text"
    done
}

# Function to replace text in a file
replace_text_in_file() {
    local file_path="$1"
    local old_text="$2"
    local new_text="$3"
    sed -i "s/$old_text/$new_text/g" "$file_path"
}

# Function to recursively replace text in files in a directory
replace_text_in_directory() {
    local directory="$1"
    local old_text="$2"
    local new_text="$3"
    find "$directory" -type f -name "*.ts" -print0 | while IFS= read -r -d '' file; do
        replace_text_in_file "$file" "$old_text" "$new_text"
    done

    echo "All instances of '$old_text' have been replaced with '$new_text' in files in '$directory'."
}

# Function to run typeconv recursively on all folders
run_typeconv_recursively() {
    local directory="$1"
    find "$directory" -type f -name "*.ts" -print0 | while IFS= read -r -d '' file; do
        npx typeconv -f ts -t oapi -o openapitypes "$file"
    done
}


# Main function
main() {
    local directory="src"
    local text_to_remove="<T extends NumberType>"
    local old_text_array=(
        "<T extends NumberType>"
        "<U extends NumberType>"

        "<T>"
        "<U>"
        "<NumberType>"
    )
    local new_text=": string | number"

    for old_text in "${old_text_array[@]}"; do
        remove_text_from_directory "$directory" "$old_text"
        echo "All instances of '$old_text' have been removed from files in '$directory'."
    done

    replace_text_in_directory "$directory" ": NumberType" "$new_text"
    replace_text_in_directory "$directory" ": T;" ": string | number;"
    # replace_text_in_directory "$directory" "params: ChallengeParams;" "params: ChallengeParams<string | number>;"
    replace_text_in_directory "$directory" ": T\[" ": (string | number)\["

    # # Run typeconv recursively on all folders
    # find "$directory" -type f -name "*.ts" -not -path "src/proto/*" -int0 | while IFS= read -r -d '' file; do
    #     npx typeconv -f ts -t oapi -o openapitypes "$file"
    #     echo "Type conversion completed on '$file'."
    # done
    # npx typeconv -f ts -t oapi -o openapitypes "$file"pr



    npx typeconv -f ts -t oapi -o openapitypes "src/combined.ts"
    echo "Type conversion completed recursively on all folders within '$directory'."

    local temp_file="$(mktemp)"
    local output_file="universal.yml"

    # Combine schemas into one file
    find "openapitypes" -type f -name "*.yaml" -print0 | while IFS= read -r -d '' schema_file; do
        awk '/schemas:/ {p=1} p' "$schema_file" >> "$temp_file"
    done

    # Add schemas to the output file
    mv "$temp_file" "$output_file"
}

# Execute main function
main
