#!/bin/bash

# Set the directory containing the .proto files
proto_dir="./proto/badges/"

# Set the output directory
output_dir="./src/proto/"

# Find all .proto files in the directory
for file in "$proto_dir"*.proto; do
  # Extract the filename without the directory path and extension
  filename=$(basename "$file" .proto)

  # Run the protoc command for each .proto file
  sudo protoc --plugin=protoc-gen-ts=$(which protoc-gen-ts) --ts_out="$output_dir" --proto_path="./proto" "$file"

  echo "Processed: $filename.proto"
done

echo "All .proto files processed."


# Directory containing the files to modify
proto_dir="./src/proto/badges/"

# Lines to append to each file
lines_to_append="// @ts-nocheck"
lines_to_append+="\n/* eslint-disable */"

# Iterate through the files in the directory
for file in "$proto_dir"*.ts; do
  # Use temporary file for modifications
  tmp_file="${file}.tmp"

  # Append lines to the temporary file
  echo -e "$lines_to_append\n$(cat "$file")" > "$tmp_file"

  # Replace the original file with the modified temporary file
  mv "$tmp_file" "$file"

  echo "Updated: $file"
done

echo "Script completed."
