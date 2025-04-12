// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying RL Model Ownership contracts...");

  // Deploy the NFT contract
  const RLModelOwnership = await hre.ethers.getContractFactory("RLModelOwnership");
  const modelOwnership = await RLModelOwnership.deploy();
  await modelOwnership.deployed();
  console.log("RLModelOwnership deployed to:", modelOwnership.address);

  // Deploy the marketplace with a 2.5% fee (250 basis points)
  const RLModelMarketplace = await hre.ethers.getContractFactory("RLModelMarketplace");
  const marketplace = await RLModelMarketplace.deploy(modelOwnership.address, 250);
  await marketplace.deployed();
  console.log("RLModelMarketplace deployed to:", marketplace.address);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });