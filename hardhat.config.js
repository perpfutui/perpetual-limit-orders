require("@nomiclabs/hardhat-waffle");

const PRIVATE_KEY = "3e730129b3867804afd27b530749d49113164a349b05879f536b6d4fe9018a9f";

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
    xdai: {
      url: 'https://rpc.xdaichain.com/',
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
};


//Account #0: 0xcad18e65f91471c533ee86b76bce463978f593aa
//Private Key: 3e730129b3867804afd27b530749d49113164a349b05879f536b6d4fe9018a9f
