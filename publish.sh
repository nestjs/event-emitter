#!/bin/bash
npm run prepublish
rm -r dist
npm run build
cp package.json ./dist
cp README.md ./dist
cp .npmrc ./dist
cd ./dist
npm publish
