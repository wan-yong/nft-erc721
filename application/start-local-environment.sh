#!/usr/bin/env bash

# if there's no local ipfs repo, initialize one
if [ ! -d "$HOME/.ipfs" ]; then
  npx go-ipfs init
fi

echo "Running IPFS"
npx go-ipfs daemon
