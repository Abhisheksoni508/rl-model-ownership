// test/rlmodel-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RL Model Ownership and Marketplace", function () {
  let RLModelOwnership;
  let RLModelMarketplace;
  let modelOwnership;
  let marketplace;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let tokenId;

  beforeEach(async function () {
    // Get contract factories
    RLModelOwnership = await ethers.getContractFactory("RLModelOwnership");
    RLModelMarketplace = await ethers.getContractFactory("RLModelMarketplace");
    
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    // Deploy contracts
    modelOwnership = await RLModelOwnership.deploy();
    await modelOwnership.deployed();
    
    marketplace = await RLModelMarketplace.deploy(modelOwnership.address, 250); // 2.5% fee
    await marketplace.deployed();
    
    // Mint a test model
    const tx = await modelOwnership.mintModel(addr1.address, "ipfs://testURI");
    const receipt = await tx.wait();
    
    // Get token ID from event
    const event = receipt.events.find(e => e.event === "ModelMinted");
    tokenId = event.args.tokenId;
  });

  describe("RLModelOwnership", function () {
    it("Should mint a model and assign to the correct owner", async function () {
      expect(await modelOwnership.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await modelOwnership.tokenURI(tokenId)).to.equal("ipfs://testURI");
    });

    it("Should update model metrics correctly", async function () {
      // Connect as addr1 (owner of the model)
      const modelOwnershipAsAddr1 = modelOwnership.connect(addr1);
      
      await modelOwnershipAsAddr1.updateMetrics(
        tokenId,
        ethers.utils.parseUnits("0.8", 18),  // reward rate
        90,  // completion rate (90%)
        ethers.utils.parseUnits("0.6", 18)  // contribution score
      );
      
      const metrics = await modelOwnership.getModelMetrics(tokenId);
      expect(metrics.rewardRate).to.equal(ethers.utils.parseUnits("0.8", 18));
      expect(metrics.completionRate).to.equal(90);
      expect(metrics.contributionScore).to.equal(ethers.utils.parseUnits("0.6", 18));
    });

    it("Should set profit configuration correctly", async function () {
      // Connect as addr1 (owner of the model)
      const modelOwnershipAsAddr1 = modelOwnership.connect(addr1);
      
      // Set profit configuration with 60% to addr1 and 40% to addr2
      await modelOwnershipAsAddr1.setProfitConfig(
        tokenId,
        [addr1.address, addr2.address],
        [60, 40]
      );
      
      // Check profit configuration
      const profitConfig = await modelOwnership.profitConfigs(tokenId);
      expect(profitConfig.beneficiaries[0]).to.equal(addr1.address);
      expect(profitConfig.beneficiaries[1]).to.equal(addr2.address);
      expect(profitConfig.shares[0]).to.equal(60);
      expect(profitConfig.shares[1]).to.equal(40);
    });

    it("Should distribute profits correctly", async function () {
      // Connect as addr1 (owner of the model)
      const modelOwnershipAsAddr1 = modelOwnership.connect(addr1);
      
      // Set profit configuration with 60% to addr1 and 40% to addr2
      await modelOwnershipAsAddr1.setProfitConfig(
        tokenId,
        [addr1.address, addr2.address],
        [60, 40]
      );
      
      // Initial balances
      const initialAddr1Balance = await addr1.getBalance();
      const initialAddr2Balance = await addr2.getBalance();
      
      // Distribute 1 ETH as profits
      await modelOwnership.distributeProfits(tokenId, { value: ethers.utils.parseEther("1.0") });
      
      // Check new balances
      const newAddr1Balance = await addr1.getBalance();
      const newAddr2Balance = await addr2.getBalance();
      
      // Check that addr1 received 0.6 ETH (60% of 1 ETH)
      expect(newAddr1Balance.sub(initialAddr1Balance)).to.equal(ethers.utils.parseEther("0.6"));
      
      // Check that addr2 received 0.4 ETH (40% of 1 ETH)
      expect(newAddr2Balance.sub(initialAddr2Balance)).to.equal(ethers.utils.parseEther("0.4"));
    });
  });

  describe("RLModelMarketplace", function () {
    beforeEach(async function () {
      // Connect as addr1 (owner of the model)
      const modelOwnershipAsAddr1 = modelOwnership.connect(addr1);
      
      // Approve marketplace to transfer the token
      await modelOwnershipAsAddr1.approve(marketplace.address, tokenId);
    });

    it("Should list a model for sale", async function () {
      // Connect as addr1 (owner of the model)
      const marketplaceAsAddr1 = marketplace.connect(addr1);
      
      // List model for 1 ETH
      await marketplaceAsAddr1.listModel(tokenId, ethers.utils.parseEther("1.0"));
      
      // Check if listing is active
      const listing = await marketplace.listings(tokenId);
      expect(listing.isActive).to.equal(true);
      expect(listing.price).to.equal(ethers.utils.parseEther("1.0"));
      expect(listing.seller).to.equal(addr1.address);
      
      // Check if marketplace is the new owner
      expect(await modelOwnership.ownerOf(tokenId)).to.equal(marketplace.address);
    });

    it("Should allow buying a listed model", async function () {
      // Connect as addr1 (owner of the model)
      const marketplaceAsAddr1 = marketplace.connect(addr1);
      
      // List model for 1 ETH
      await marketplaceAsAddr1.listModel(tokenId, ethers.utils.parseEther("1.0"));
      
      // Connect as addr2 (buyer)
      const marketplaceAsAddr2 = marketplace.connect(addr2);
      
      // Record initial balances
      const initialAddr1Balance = await addr1.getBalance();
      
      // Buy the model
      await marketplaceAsAddr2.buyModel(tokenId, { value: ethers.utils.parseEther("1.0") });
      
      // Check if addr2 is the new owner
      expect(await modelOwnership.ownerOf(tokenId)).to.equal(addr2.address);
      
      // Check if listing is no longer active
      const listing = await marketplace.listings(tokenId);
      expect(listing.isActive).to.equal(false);
      
      // Check if seller received payment (minus fee)
      const newAddr1Balance = await addr1.getBalance();
      
      // 1 ETH - 2.5% fee = 0.975 ETH
      const expectedPayment = ethers.utils.parseEther("0.975");
      
      // Use a reasonable delta for gas costs
      const delta = ethers.utils.parseEther("0.001");
      
      expect(newAddr1Balance.sub(initialAddr1Balance)).to.be.closeTo(expectedPayment, delta);
    });
  });
});