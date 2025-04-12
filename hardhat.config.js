/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",  // Changed to match your contract's version
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};