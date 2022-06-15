const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
    const marketPlaceContract = await (await ethers.getContractFactory("FakeNFTMarketplace")).deploy();

    console.log("Marketplace address: ", marketPlaceContract.address);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    })