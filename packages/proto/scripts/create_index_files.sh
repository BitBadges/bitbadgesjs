#!/bin/bash

generate_index() {
    local directory="$1"
    local files
    local subdirectories=()
    local exports=()

    files=("$directory"/*)

    for file in "${files[@]}"; do
        if [ -d "$file" ]; then
            directory_name=$(basename "$file")
            exports+=("export * as $directory_name from './$directory_name/index'")
            subdirectories+=("$file")
        elif [ "$(basename "$file")" = "index.ts" ]; then
            exports+=("$(basename "$file")")
        elif [[ "$(basename "$file")" == *.ts ]]; then
            module_name=$(basename "$file" .ts)
            exports+=("export * from './$module_name'")
        fi
    done

    local index_content="$(printf "%s\n" "${exports[@]}")"
    echo -e "$index_content" > "$directory/index.ts"
    echo "Generated index.ts in $directory"

    for subdir in "${subdirectories[@]}"; do
        generate_index "$subdir"
    done
}

generate_index "$PWD"
