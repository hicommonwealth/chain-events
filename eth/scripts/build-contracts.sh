truffle compile &&
../node_modules/typechain/dist/cli/cli.js --target=ethers-v5 --out-dir '../src/contractTypes' './build/contracts/*.json'