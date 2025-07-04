#!/bin/bash
MYFOLDER=$(pwd)

# rm -rf ./proto
# mkdir ./proto

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
# git clone --branch v0.47.5 https://github.com/cosmos/cosmos-sdk.git
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

cd $MYFOLDER

npx buf generate proto
