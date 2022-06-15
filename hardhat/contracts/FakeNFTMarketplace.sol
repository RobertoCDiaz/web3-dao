// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract FakeNFTMarketplace {
    // keeps a map between tokensIds and their owner's address
    // tokens without owner will have a 0x000... address associated
    mapping(uint256 => address) tokens;

    // sets the purchase price for an NFT
    uint256 price = 0.001 ether;

    // purchases the NFT with `tokenId` id.
    function purchase(uint256 tokenId) external payable {
        require(msg.value == price, "This token costs 0.001 ether");
        
        tokens[tokenId] = msg.sender;
    }

    // return the price of one NFT
    function getPrice() external view returns(uint256) {
        return price;
    }

    // checks whether a token has been sold or not
    function available(uint256 tokenId) external view returns(bool) {
        return tokens[tokenId] == address(0);
    }
}