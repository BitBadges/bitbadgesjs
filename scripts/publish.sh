# cd into each package within ./packages matching some argument and run publish commands

# Usage: ./scripts/publish.sh [package-name] [package-name] [package-name] ...

# Example: ./scripts/publish.sh utils eip712

cd packages
for d in "$@" ; do
    cd $d
    echo "Installing $d"
    npm install
    echo "Building $d"
    npm run build
    echo "Incrementing version for $d"
    npm version patch
    echo "Publishing $d"
    npm publish
    cd ..
done

cd ..
