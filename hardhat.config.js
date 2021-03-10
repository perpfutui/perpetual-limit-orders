require("@nomiclabs/hardhat-waffle");

const PRIVATE_KEY = "";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000
          }
        }
      }
    ]
  },
  networks: {
    // xdai: {
    //   url: 'https://dai.poa.network/',
    //   accounts: [`0x${PRIVATE_KEY}`]
    // },
    hardhat: {
      forking: {
        url: "https://xdai-archive.blockscout.com/",
        blockNumber: 14913016
      }
    }
  }
};
