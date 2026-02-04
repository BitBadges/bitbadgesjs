#!/bin/bash
MYFOLDER=$(pwd)

# rm -rf ./proto
# mkdir ./proto

# Fetch from bitbadgeschain
cd ../../../bitbadgeschain
cp -r ./proto/wasmx/* $MYFOLDER/proto/wasmx/
cp -r ./proto/anchor/* $MYFOLDER/proto/anchor/
cp -r ./proto/maps/* $MYFOLDER/proto/maps/
cp -r ./proto/gamm/* $MYFOLDER/proto/gamm/
cp -r ./proto/poolmanager/* $MYFOLDER/proto/poolmanager/
cp -r ./proto/managersplitter/* $MYFOLDER/proto/managersplitter/
cp -r ./proto/tokenization/* $MYFOLDER/proto/tokenization/

cd ../bitbadgesjs/packages/bitbadgesjs-sdk

# We have a v6 or v* folder for migration, lets delete that
rm -rf ./proto/tokenization/v*


# # BitBadges
# cd /tmp
# git clone https://github.com/bitbadges/bitbadgeschain/
# cd bitbadgeschain/
# cp -r ./proto/* $MYFOLDER/proto
# # cp -r ./third_party/proto/* $MYFOLDER/proto
# cd /tmp
# rm -rf bitbadgeschain

# #Cosmos SDK
# cd /tmp
# git clone --branch v0.53.4 https://github.com/cosmos/cosmos-sdk.git
# cd cosmos-sdk/
# cp -r ./proto/* $MYFOLDER/proto
# # cp -r ./third_party/proto/* $MYFOLDER/proto
# cd /tmp
# rm -rf cosmos-sdk

# # # Wasm
# cd /tmp
# git clone --branch v0.44.0 https://github.com/CosmWasm/wasmd.git
# cd wasmd/
# cp -r ./proto/* $MYFOLDER/proto
# # cp -r ./third_party/proto/* $MYFOLDER/proto
# cd /tmp
# rm -rf wasmd

#IBC v8
cd /tmp
git clone --branch v8.0.0 https://github.com/cosmos/ibc-go.git
cd ibc-go/
cp -r ./proto/* $MYFOLDER/proto
# cp -r ./third_party/proto/* $MYFOLDER/proto
cd /tmp
rm -rf ibc-go

#cosmos/ics23
cd /tmp
git clone https://github.com/cosmos/ics23.git
cd ics23/
cp -r ./proto/* $MYFOLDER/proto
# cp -r ./third_party/proto/* $MYFOLDER/proto
cd /tmp
rm -rf ics23

cd $MYFOLDER
rm -f ./proto/*.yaml
rm -f ./proto/*.md
rm -f ./proto/*.yml
rm -f ./proto/*.lock
rm -rf *.pb.go


cd $MYFOLDER

npx buf generate proto
