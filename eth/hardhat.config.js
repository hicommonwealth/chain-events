// eslint-disable-next-line import/no-extraneous-dependencies
require('hardhat-typechain');
require("@nomiclabs/hardhat-waffle");

const ALCHEMY_API_KEY = 'Zf2oCtq6es072txPPhJ1vMm8fT66XpNW';
const ROPSTEN_PRIVATE_KEY = "8299feeb80b1fab8af2c548852911d53bb46f1e3e479a121c6be15c548514c0b";


module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.7.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.8',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.7.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.5.5',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'petersburg',
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'istanbul',
        },
      },
    ],
  },
  typechain: {
    outDir: '../src/contractTypes',
    target: 'ethers-v5',
  },
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
    }
  }
};
