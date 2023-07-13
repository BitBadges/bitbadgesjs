for package in $(find . -name "package.json" -type f -not -path "./node_modules/*" -exec dirname {} \;); do
  cd "$package" && npm unlink
done
