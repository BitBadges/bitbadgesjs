cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF
bun scripts/fix-json-imports.ts

cat >dist/esm/package.json <<!EOF
{
    "type": "module",
    "sideEffects": false
}
!EOF
