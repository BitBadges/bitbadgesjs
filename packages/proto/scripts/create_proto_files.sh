#!/bin/bash
# NOTE: protoc is required

FOLDER=$(pwd)
I=$(PWD)/proto
DEST_TS=$(PWD)/src/proto/
mkdir -p $DEST_TS

# # This generates js protos (used for testing)
# DEST=$(PWD)/tests/proto/
# mkdir -p $DEST
# grpc_tools_node_protoc --proto_path=$I --js_out=import_style=commonjs,binary:$DEST --grpc_out=generate_package_definition:$DEST $(find $(PWD)/proto -iname "*.proto")

# This generates ts protos (used for src)
protoc \
--plugin=protoc-gen-ts=$(which protoc-gen-ts) \
--ts_out=$DEST_TS \
--proto_path=$I \
$(find $(PWD)/proto -iname "*.proto")

# TODO: make this automatic
# You can use this for individual files. Note that anything with an rpc like a Msg Service or Query Service needs to be commented out beforehand
# sudo protoc --plugin=protoc-gen-ts=$(which protoc-gen-ts) --ts_out=./src/proto --proto_path=./proto ./proto/path_to_file.proto
