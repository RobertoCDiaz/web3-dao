import { Contract, providers, utils } from "ethers";
import { DAO_CONTRACT_ABI, DAO_CONTRACT_ADDRESS } from "../constants";

/**
 * Returns either a Provider or a Signer instance to operate on the Ethereum Rinkeby network.
 * 
 * @param {Web3Modal} web3Modal - Instance of a Web3Modal form.
 * @param {boolean} shouldBeSigner - Whether the return value should be a signer instance or not.
 * @returns A provider or a signer, as specified through the `shouldBeSigner` argument.
 */
export const getProviderOrSigner = async (web3Modal, shouldBeSigner = false) => {
    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    if ((await web3Provider.getNetwork()).chainId !== 4) {
        throw new Error("This application only work on the Rinkeby network");
    }

    return shouldBeSigner ? web3Provider.getSigner() : web3Provider;
}

/**
 * Create a new instance of a DAO smart contract.
 * 
 * @param {Web3Modal} web3Modal - An instance of a Web3Modal form.
 * @param {boolean} withSigner - Whether a signer should be instantiated to use with the contract. I.e., the contract will need to write to the blockchain state.
 * @returns A new Contract instance.
 */
export const getContractInstance = async (web3Modal, withSigner = false) => {
    return new Contract(DAO_CONTRACT_ADDRESS, DAO_CONTRACT_ABI, await getProviderOrSigner(web3Modal, withSigner));
}