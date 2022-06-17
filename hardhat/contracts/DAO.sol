// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DAO is Ownable {
    // Struct defining all relevant information for a proposal made inside the DAO.
    struct Proposal {
        // Id of the token to purchase from the NFT Marketplace.
        uint256 nftTokenId;
        // Unix timestamp until which the proposal is 'active'. 
        uint256 deadline;
        // Count of "yes" votes.
        uint256 yays;
        // Count of "no" votes.
        uint256 nays;
        // Whether the purchase has been executed or not.
        // Proposal cannot be executed before its deadline.
        bool executed;
        // Keeps track of what NFTs have been used to vote.
        mapping(uint256 => bool) voters;
    }

    // List of proposals. proposalId => proposal.
    mapping(uint256 => Proposal) public proposals;
    // Count of proposals made.
    uint256 public numProposals;

    // Interfaces to other required contracts.
    INFTContract nftContract;
    IFakeNFTMarketplace nftMarketPlace;

    // Possible options for a vote.
    enum Vote {
        YAY,
        NAY
    }

    // At deploy, instantiate the required contracts through the contract's arguments.
    constructor(address nftContractAddress, address marketplaceAddress) payable {
        nftContract = INFTContract(nftContractAddress);
        nftMarketPlace = IFakeNFTMarketplace(marketplaceAddress);
    }

    // Checks whether the caller of a function is a member of the DAO.
    modifier nftHolderOnly() {
        require(nftContract.balanceOf(msg.sender) > 0, "Not a DAO member");
        _;
    }

    /**
        @dev Only move forward if a proposal is still active.

        @param proposalIdx - Index of the proposal to check on.
     */
    modifier activeProposalOnly(uint256 proposalIdx) {
        require(block.timestamp < proposals[proposalIdx].deadline, "The deadline of this proposal has been exceeded");
        _;
    }

    /**
        @dev Allow a function to only be executed if a given proposal has already expired.

        @param proposalIdx - Index of the proposal to be checked.
     */
    modifier inactiveProposalOnly(uint256 proposalIdx) {
        require(block.timestamp >= proposals[proposalIdx].deadline, "This proposal is still active");
        require(!proposals[proposalIdx].executed, "This proposal has already been executed");

        _;
    } 

    /**
        @dev Allows a member of the DAO to create a proposal.

        @param nftTokenId - Token ID of the NFT to purchase from the NFT Marketplace.

        @return Index of the new proposal;
     */
    function createProposal(uint nftTokenId) external nftHolderOnly returns(uint256) {
        require(nftMarketPlace.available(nftTokenId), "NFT not for sale");

        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = nftTokenId;

        proposal.deadline = block.timestamp + 10 minutes;

        ++numProposals;

        return numProposals - 1;
    }

    /**
        @dev Logs a vote from a member of the DAO.

        @param proposalIdx - Index of the proposal to be voted on.
        @param vote - Decision of the DAO member.
     */
    function voteOnProposal(uint256 proposalIdx, Vote vote) external nftHolderOnly activeProposalOnly(proposalIdx) {
        // selected proposal
        Proposal storage proposal = proposals[proposalIdx];

        // amount of nfts owned by user
        uint256 voterBalance = nftContract.balanceOf(msg.sender);
        // amount of the user's remaining efective vote
        uint256 numOfVotes;

        // checks for unused NFT votes of this user on this proposal
        for (uint256 i = 0; i < voterBalance; ++i) {
            // current nft index
            uint nftId = nftContract.tokenOfOwnerByIndex(msg.sender, i);

            // pass this nft if it was already use to vote in a proposal
            if (proposal.voters[nftId])
                continue;

            // if current nft has not been used to vote, mark it as now as 'has voted'
            // and increment by one the number of available votes for this user
            proposal.voters[nftId] = true;
            ++numOfVotes;
        }

        // add the corresponding votes to the decision of user (yay or nay).
        if (vote == Vote.YAY) {
            proposal.yays += numOfVotes;
        } else {
            proposal.nays += numOfVotes;
        }
    }

    /**
        @dev Allows any member of the DAO to execute a proposal, if and only if its deadline has been exceeded.

        @param proposalIdx - Index of the proposal to execute.
     */
    function executeProposal(uint256 proposalIdx) external nftHolderOnly inactiveProposalOnly(proposalIdx) {
        Proposal storage p = proposals[proposalIdx];

        // No matter the outcome of the proposal, mark it as executed.
        proposals[proposalIdx].executed = true;

        // If nays are equal or surpass the yays, there's nothing more to do here. Proposal is declined.
        if (p.nays >= p.yays) {
            return;
        }

        // If we reach this point, then the proposal is accepted and we have to try to purchase the requested NFT.
        uint256 nftPrice = nftMarketPlace.getPrice();

        // If we do not have enough funds, revert the transaction.
        require(address(this).balance >= nftPrice, "Not enough funds in Treasury");

        // At this point, we have everything we neet. So, purchase the NFT through the NFT Marketplace.
        nftMarketPlace.purchase{value: nftPrice}(proposals[proposalIdx].nftTokenId);
    }

    /**
        @dev Allows the owner of the DAO Contract to withdraw the Ether in the contract.
     */
    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
        nftMarketPlace.withdrawEther(owner());
    }

    /**
        @dev Returns the total number of NFTs the sender owns.
     */
    function getUserNFTBalance() external view nftHolderOnly returns (uint256) {
        return nftContract.balanceOf(msg.sender);
    }

    // Normally, contract addresses cannot accept ETH sent to them, unless it was through a payable function. But we don't want users to call functions just to deposit money, they should be able to tranfer ETH directly from their wallet. For that, let's add these two functions:
    receive() external payable {}

    fallback() external payable {}
}

// Fake NFT Marketplace Contract interface.
interface IFakeNFTMarketplace {
    function purchase(uint256 tokenId) external payable;

    function getPrice() external view returns(uint256);

    function available(uint256 tokenId) external view returns(bool);

    function withdrawEther(address user) external;
}

// NFT Contract interface.
interface INFTContract {
    function balanceOf(address user) external view returns(uint256);

    function tokenOfOwnerByIndex(address owner, uint256 tokenId) external view returns(uint256);
}