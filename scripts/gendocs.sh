#!/bin/bash
# cd into each package within ./packages and run typedoc ./src --out docs

# Add bun global bin to PATH
export PATH="/home/trevormil/.bun/bin:$PATH"

cd packages
for d in */ ; do
    cd $d
    echo "Generating docs for $d"
    typedoc ./src --out docs
    cd ..
done
