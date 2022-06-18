# Web3 DAO

![App screenshot](/app/public/screenshot.png)

A **Decentralized Autonomous Organization (DAO)** composed of owners of an item from a specific NFT collection.

In a DAO, all members are able to create and vote on decisions that have a deadline. After the deadline, the decision is then made in favour of the voting outcome ("yes" or "no").

### DAO Requirements

* Anyone with a WNC NFT can create a proposal to purchase a different NFT from a NFT marketplace.

* Everyone with a WNC NFT can vote for/against the active proposals.

* Each NFT count as one vote.

* Voters cannot vote multiple times on the same proposal with the same NFT.

* If before a specified deadline, the majority of voters vote for a proposal, it will be "approved" and the NFT purchase will be automatically executed.

Check it out [in production](https://web3-dao-pi.vercel.app/).

You can acquire WNC NFTs to join the DAO [here](https://nft-collection-gules-ten.vercel.app/).

If you want to run you're own DAO using this project's source code, you can do it following the next steps:

## Installation



1. Clone this repository and cd into it:

```bash
git clone https://github.com/RobertoCDiaz/web3-dao
cd web3-dao
```

2. Get into both the `app` and `hardhat` repositories and install their npm dependencies:
```bash
cd app && npm i && cd ../hardhat && npm i
```

## Smart contract configuration and deployment

1. Create an Alchemy node in the Rinkeby network
    * Sign up to the [Alchemy](https://www.alchemyapi.io) service and create a new app using the Rinkeby network

2. Configure environment variables
    * Create a `.env` as a copy of the `.env-template` file and replace the values of the following variables.
    * **ALCHEMY_URL** is the URL with the API Key that Alchemy provides on the dashboard for your new app (the one created on the previous step).
    * **PRIVATE_KEY** is the private key for your account on the Rinkeby Network. You can use Metamask for this.
    * **NFT_CONTRACT_ADDRESS** is the address of the NFT Contract created using [this repo's](https://github.com/RobertoCDiaz/nft-collection) source code.
    * **FAKE_MARKETPLACE_ADDRESS** it's an optional enviroment variable. The main Hardhat deployment script will deploy a Fake NFT Marketplace to use with this application. But, if you already have a working Fake NFT Marketplace (using the [FakeNFTMarketplace.sol](hardhat/contracts/FakeNFTMarketplace.sol) file), you can provide it's address here.

3. Run the `deploy` npm command to compile and deploy the smart contract

```bash
cd hardhat
npm run deploy
```

## Web dApp server start

To start a development server to preview the application on your localhost, go to the `app` directory and run the following command:

```bash
npm run dev
```

This will run a development server for the Next.js app.