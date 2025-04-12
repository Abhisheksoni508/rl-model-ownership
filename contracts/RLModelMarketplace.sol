// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RLModelMarketplace
 * @dev Marketplace for trading RL Model NFTs
 */
contract RLModelMarketplace is ReentrancyGuard, Ownable {
    // The NFT contract
    IERC721 public nftContract;
    
    // Fee percentage (in basis points, 100 = 1%)
    uint256 public feePercent;
    
    // Listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }
    
    // Mapping from token ID to its listing
    mapping(uint256 => Listing) public listings;
    
    // Events
    event ModelListed(uint256 indexed tokenId, address seller, uint256 price);
    event ModelSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address seller);
    event FeeUpdated(uint256 newFeePercent);
    
    constructor(address _nftContract, uint256 _feePercent) {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        nftContract = IERC721(_nftContract);
        feePercent = _feePercent;
    }
    
    /**
     * @dev Lists a model NFT for sale
     * @param tokenId The ID of the model token
     * @param price The price in wei
     */
    function listModel(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be above zero");
        
        // Transfer NFT to marketplace for escrow
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });
        
        emit ModelListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Purchases a listed model NFT
     * @param tokenId The ID of the model token
     */
    function buyModel(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Mark listing as inactive
        listings[tokenId].isActive = false;
        
        // Calculate fee
        uint256 fee = (listing.price * feePercent) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Transfer funds to seller
        payable(listing.seller).transfer(sellerAmount);
        
        // Transfer NFT to buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        emit ModelSold(tokenId, listing.seller, msg.sender, listing.price);
        
        // Return excess payment if any
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }
    
    /**
     * @dev Cancels a listing
     * @param tokenId The ID of the model token
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        // Mark listing as inactive
        listings[tokenId].isActive = false;
        
        // Return NFT to seller
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Updates the marketplace fee
     * @param _feePercent New fee in basis points (100 = 1%)
     */
    function updateFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        feePercent = _feePercent;
        emit FeeUpdated(_feePercent);
    }
    
    /**
     * @dev Withdraws accumulated fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}