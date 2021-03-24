require('dotenv').config();
require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  etherscan: {
    apiKey: `${process.env.ETHERSCAN}`
  },
  solidity: {
    compilers: [
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    xdai: {
      url: 'https://dai.poa.network/',
      accounts: [`0x${process.env.DEPLOYER}`]
    },
    hardhat: {
      forking: {
        url: "https://xdai-archive.blockscout.com/",
        blockNumber: 14913016
      }
    }
  }
};
