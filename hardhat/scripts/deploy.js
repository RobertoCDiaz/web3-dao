const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const FAKE_MARKETPLACE_ADDRESS = process.env.FAKE_MARKETPLACE_ADDRESS;

async function main() {
    let marketPlaceAddress = FAKE_MARKETPLACE_ADDRESS;
    if (FAKE_MARKETPLACE_ADDRESS == "") {
        const marketPlaceContract = await (await ethers.getContractFactory("FakeNFTMarketplace")).deploy();
        await marketPlaceContract.deployed()

        marketPlaceAddress = marketPlaceContract.address;
    }
    
    const daoContract = await (await ethers.getContractFactory("DAO")).deploy(
        NFT_CONTRACT_ADDRESS,
        marketPlaceAddress,
        {
            // ether to transfer to the DAO treasury
            value: ethers.utils.parseEther("0.1"),
        }
    );
        
    console.log("DAO Contract Address: ", daoContract.address);
    console.log("Currently using the Marketplace with address: ", marketPlaceAddress);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    })