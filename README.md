# RL Swarm Model Ownership

This project implements tradeable ownership for individual models in Gensyn's RL Swarm network. 

## Overview

The solution enables:
- Tokenizing RL models as NFTs
- Tracking performance metrics of each model
- Configuring profit sharing between contributors
- Trading model ownership in a marketplace

## Smart Contracts

### RLModelOwnership

This contract represents ownership of individual RL models as NFTs:
- Models are minted with metadata containing their architecture and parameters
- Performance metrics are tracked and updated as models learn
- Profit sharing can be configured to distribute rewards among contributors

### RLModelMarketplace

This contract provides a marketplace for trading model ownership:
- Model owners can list their models for sale
- Buyers can purchase models and receive future profits
- A small fee is charged on each transaction

## Usage Guide

### For Model Creators

1. **Mint a Model**

```javascript
// Create model metadata
const metadata = generateModelMetadata({
  modelName: "CartPole DQN",
  description: "DQN model for solving CartPole environment",
  algorithm: "DQN",
  creator: "Your Name",
  // ... other model details
});

// Upload metadata to IPFS (or other storage)
const metadataURI = await uploadToIPFS(metadata);

// Mint the model
const tx = await modelOwnership.mintModel(creatorAddress, metadataURI);
const receipt = await tx.wait();
const event = receipt.events.find(e => e.event === "ModelMinted");
const tokenId = event.args.tokenId;
```
Created by Abhishek Soni For RL swarm on-chain Bounty @encodeclub.
