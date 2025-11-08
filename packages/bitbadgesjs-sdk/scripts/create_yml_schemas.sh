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
    replace_text_in_directory "$directory" ": Q;" ": string;"
    replace_text_in_directory "$directory" ": T\[" ": (string | number)\["
    replace_text_in_directory "$directory" "<JSPrimitiveNumberType>" ""
    replace_text_in_directory "$directory" "<bigint>" ""
    replace_text_in_directory "$directory" "UNIXMilliTimestamp = T" "UNIXMilliTimestamp = string | number"
    replace_text_in_directory "$directory" "ClaimIntegrationPublicParamsType;" "ClaimIntegrationPublicParamsType<T>;"
    replace_text_in_directory "$directory" "ClaimIntegrationPrivateParamsType;" "ClaimIntegrationPrivateParamsType<T>;"
    replace_text_in_directory "$directory" "extends IntegrationPluginParams {" "extends IntegrationPluginParams<T> {"
    replace_text_in_directory "$directory" "ClaimIntegrationPublicStateType;" "ClaimIntegrationPublicStateType<T>;"
    replace_text_in_directory "$directory" "ClaimIntegrationPrivateStateType;" "ClaimIntegrationPrivateStateType<T>;"
    replace_text_in_directory "$directory" " iTokenMetadata<T>\[\];" " iTokenMetadataDetails<T>\[\];"
    replace_text_in_directory "$directory" " iCollectionMetadata<T>\[\];" " iCollectionMetadataDetails<T>\[\];"
    replace_text_in_directory "$directory" "<Q extends DynamicDataHandlerType, T extends NumberType>" ""
    replace_text_in_directory "$directory" "<Q extends DynamicDataHandlerType>" ""
    replace_text_in_directory "$directory" "<Q, T>" ""
    replace_text_in_directory "$directory" "<T extends ClaimIntegrationPluginType>" ""
    replace_text_in_directory "$directory" "<T>" ""
    replace_text_in_directory "$directory" "<Q extends DynamicDataHandlerType>" ""
    replace_text_in_directory "$directory" "<Q>" ""
    replace_text_in_directory "$directory" "ClaimIntegrationPublicStateType" "any"
    replace_text_in_directory "$directory" "ClaimIntegrationPrivateStateType" "any"
    replace_text_in_directory "$directory" "ClaimIntegrationPublicParamsType" "any"
    replace_text_in_directory "$directory" "ClaimIntegrationPrivateParamsType" "any"
    replace_text_in_directory "$directory" "ClaimIntegrationPluginCustomBodyType" "any"
    replace_text_in_directory "$directory" "DynamicDataHandlerData" "any"
    replace_text_in_directory "$directory" "DynamicDataHandlerActionPayload" "any"
    replace_text_in_directory "$directory" "<ClaimIntegrationPluginType>" ""


    npx typeconv -f ts -t oapi -o openapitypes "src/combined.ts"
    echo "Type conversion completed recursively on all folders within '$directory'."
}

# Execute main function
main
