import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import { useEffect, useRef, useState } from 'react';
import { getContractInstance, getProviderOrSigner } from '../utils/web3';
import { DAO_CONTRACT_ADDRESS } from '../constants';
import { utils } from 'ethers';

export default function Home() {
  // stores the user's address
  const [userAddress, setUserAddress] = useState(null);
  // keeps track of how many NFTs the user owns
  const [userBalance, setUserBalance] = useState(0);
  // how much ether there is currently stored in the DAOs treasury
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  // how many proposals there are in the DAO
  const [proposalsCount, setProposalsCount] = useState(0);
  // tells us if the current connected address is the owner of the DAO contract
  const [isOwner, setIsOwner] = useState(false);

  const [isWalletConnected, setIsWalletConnected] = useState(false); 

  const web3Modal = useRef();

  /**
   * Withdraws all the Ether the DAO's treasury has and transfers it to the owner.
   */
  const withdraw = async () => {
    const contract = await getContractInstance(web3Modal.current, true);

    const tx = await contract.withdrawEther();
    await tx.wait();

    alert("Successfully withdrawed all the ether of the contract!")
  }

  /**
   * Tries to connect to an Ethereum wallet (e.g. MetaMask).
   */
  const connectToWallet = async () => {
    try {
      await getProviderOrSigner(web3Modal.current);
  
      setIsWalletConnected(true);
    } catch(err) {
      console.error(err);
    }
  }

  /**
   * Updates (or sets when it's not initialized) the state of the app.
   * You can also specify if it's the first time you are setting the state because
   * there are some values that are only fetched if it's the first time.
   * 
   * @param {boolean} firstSet - Whether we are setting the state of the app for the first time.
   */
  const updateAppState = async (firstSet = false) => {
    // what to always update
    const provider = await getProviderOrSigner(web3Modal.current);
    const providerContract = await getContractInstance(web3Modal.current);
    
    setTreasuryBalance(utils.formatEther(await provider.getBalance(DAO_CONTRACT_ADDRESS)));
    setProposalsCount((await providerContract.numProposals()).toString());
    
    if (!firstSet)
      return;
    
    const signer = await getProviderOrSigner(web3Modal.current, true);
    const signerContract = await getContractInstance(web3Modal.current, true);
    
    // set how many nfts the user has
    setUserBalance((await signerContract.getUserNFTBalance()).toString());

    // sets user's address
    const userAddress = await signer.getAddress();
    setUserAddress(userAddress);

    // checks if user is owner
    const owner = await providerContract.owner();
    if (userAddress.toLowerCase() == owner.toLowerCase())
      setIsOwner(true);
  }

  /**
   * Basic state variables and objects setup.
   */
  const initialProcessing = async () => {
    if (!isWalletConnected) {
      web3Modal.current = new Web3Modal({
        network: "rinkeby",
        disableInjectedProvider: false,
        providerOptions: {},
      });

      await connectToWallet();
      await updateAppState(true);
    }
  };

  useEffect(() => {
    initialProcessing();
  }, [isWalletConnected]);

  /**
   * A helper component that renders a custom button that can also show additional information
   * 
   * @param {string} buttonText - Text to display inside the button
   * @param {() => void} onClickAction - What to do when user clicks in the button
   * @param {string} info - Additional information to show above the button
   * @param {object} buttonStyles - Additional CSS styles to apply to the button
   * @returns InfoButton Component
   */
  const InfoButton = (buttonText, onClickAction, info = null, buttonStyles) => {
    return <div className={styles.infoButton}>
      { info && <div className="info">{ info }</div> }
      <div className={styles.button} style={buttonStyles}>{ buttonText }</div>
    </div>
  }

  /**
   * A panel in which the user can know their 'user' status in the app, as if it is currently connected, and if it is, 
   * which Ethereum address are they using, etc.
   * 
   * It's a component that mostly depends on the state of the application.
   * 
   * @returns UserPanel component
   */
  const UserPanel = () => {
    // by default, it is assumed that the user is not connected to a wallet
    let content = InfoButton("Connect to wallet", () => {}, "You're not connected to an Ethereum wallet");

    // if it is connected, then show basic user information
    if (isWalletConnected) {
      content = <div style={{ textAlign: 'center' }}>
        <p>Connected as <span className={styles.highlightText}>{ userAddress }</span> on the Rinkeby Testnet</p>
        {/* if the user is the owner of the contract, allow them to withdraw all the ether in the treasury */}
        { isOwner && <p>As the owner of the contract, you can <span onClick={withdraw} className={styles.clickableText}>withdraw</span> its treasury funds</p> }
      </div>
    }

    return (<div className={styles.userPanel}>
      { content }
    </div>);
  }

  return (
    <div>
      <Head>
        <title>DAO</title>
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
      </Head>
      <div className={styles.app}>

        <div className={styles.content}>
          <h1>Decentralized Autonomous Organization</h1>
          <div className={styles.info}>
            <p>You currently own <span className={styles.highlightText}>{ userBalance }</span> WNC nfts!</p>
            <p>The treasury balance is <span className={styles.highlightText}>{ treasuryBalance } Ether</span></p>
            <p>There are currently a total of <span className={styles.highlightText}>{ proposalsCount }</span> proposals</p>
          </div>
          <div className={styles.proposalsContainer}>
            <h2>Proposals</h2>
            { InfoButton("Create a new proposal", null, null, { alignSelf: "flex-start" }) }
            <div className={styles.proposalsList}>
              <div className={styles.proposal}>

              </div>
            </div>
          </div>
          <UserPanel />
        </div>
        <img className={styles.img} src="https://raw.githubusercontent.com/RobertoCDiaz/nft-collection/main/app/public/nfts/0.svg" alt="NFT logo" />


      </div>
    </div>
  );
}
