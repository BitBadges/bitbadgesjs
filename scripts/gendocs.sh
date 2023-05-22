# cd into each package within ./packages and run npx typedoc ./src --out docs

cd packages
for d in */ ; do
    cd $d
    echo "Generating docs for $d"
    npx typedoc ./src --out docs
    cd ..
done
