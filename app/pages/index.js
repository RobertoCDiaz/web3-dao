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
  // whether a transaction is currently being mined or not
  const [isLoading, setIsLoading] = useState(false);
  // flag state variable that tells us if we should show the `Create Proposal` form.
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  // list of the DAO's proposals 
  const [proposals, setProposals] = useState([]);
  // number input containing the new proposed NFT token id for purchase
  const tokenIdInput = useRef();

  const [isWalletConnected, setIsWalletConnected] = useState(false); 

  const web3Modal = useRef();

  /**
   * Calls a contract instance to create a new proposal in the DAO using
   * the value set in the `tokenIdInput` ref.
   */
  const createProposal = async () => {
    try {
      const tokenId = parseInt(tokenIdInput.current.value);

      const contract = await getContractInstance(web3Modal.current, true);
      
      const tx = await contract.createProposal(tokenId);

      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);
      setIsCreatingProposal(false);

      await updateAppState();
      
      alert("Proposal successfully created!")
    } catch(err) {
      alert("An error ocurred, consult the console of your browser for more information");
      console.error(err);
    }
  }

  /**
   * Calls an instance of the DAO contract to execute a given proposal.
   * 
   * @param {int} proposalId - Id of the proposal to execute.
   */
  const executeProposal = async (proposalId) => {
    try {
      const contract = await getContractInstance(web3Modal.current, true);

      const tx = await contract.executeProposal(proposalId);

      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);

      alert("Proposal was correctly executed!");

      updateAppState();
    } catch(err) {
      alert("An error ocurred, consult the console of your browser for more information");
      console.error(err);
    }
  }

  /**
   * Votes on a proposal.
   * 
   * @param {number} proposalId - Id of the proposal to vote on.
   * @param {number} vote - Value of the vote to submit.
   */
  const voteOnProposal = async (proposalId, vote) => {
    try {
      const contract = await getContractInstance(web3Modal.current, true);

      const parsedVote = vote === "YAY" ? 0 : 1;

      const tx = await contract.voteOnProposal(proposalId, parsedVote);

      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);

      await updateAppState();

      alert(`Successfully submitted your '${vote}' vote(s)!`);
    } catch (err) {
      alert("An error ocurred, consult the console of your browser for more information");
      console.error(err);
    }
  }

  /**
   * Withdraws all the Ether the DAO's treasury has and transfers it to the owner.
   */
  const withdraw = async () => {
    try {
      const contract = await getContractInstance(web3Modal.current, true);

      const tx = await contract.withdrawEther();
      await tx.wait();

      await updateAppState();

      alert("Successfully withdrawed all the ether of the contract!")
    } catch(err) {
      alert("An error ocurred, consult the console of your browser for more information");
      console.error(err);
    }
  }

  /**
   * Tries to connect to an Ethereum wallet (e.g. MetaMask).
   */
  const connectToWallet = async () => {
    try {
      await getProviderOrSigner(web3Modal.current);
  
      setIsWalletConnected(true);
    } catch(err) {
      alert("An error ocurred, consult the console of your browser for more information");
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
    const fetchedProposalsCount = (await providerContract.numProposals()).toNumber();
    setProposalsCount(fetchedProposalsCount);

    // fetch proposals
    let fetchedProposals = [];
    for (let i = 0; i < fetchedProposalsCount; ++i) {
      fetchedProposals.push(await providerContract.proposals(i));
    }
    setProposals(fetchedProposals);
    
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

    // update app's state every minute
    setInterval(async () => {
      await updateAppState();
    }, 1000 * 60);
  }, [isWalletConnected]);

  /**
   * Renders a proposal and it's options based on the given proposal state.
   * 
   * @prop `proposalId` - Id of the proposal to show. It must match the id inside the contract.
   * @prop `proposal` - Proposal object.
   * @returns Proposal component.
   */
  const Proposal = ({proposalId, proposal}) => {
    const tokenId = proposal.nftTokenId.toNumber();

    const deadlineDate = new Date(proposal.deadline.toNumber() * 1000)
    const deadlineExpired =  deadlineDate < Date.now();
    const executed = proposal.executed;

    const passed = proposal.yays > proposal.nays;

    const headerStateStyles = 
      !deadlineExpired ? styles.active :
      (executed && passed) ? styles.passed :
      (executed && !passed) ? styles.declined :
      "";

    console.log(`p with tokenid ${tokenId} header styles is ${headerStateStyles}`)

    return <div className={styles.proposal} title={deadlineExpired && `This proposal's voting time limit was ${deadlineDate.toLocaleString()}`}>
      <div className={`${styles.header} ${headerStateStyles}`}>
        { !deadlineExpired && <i>Ongoing proposal</i> }
        { deadlineExpired && !executed && <i>Waiting for execution</i> }
        { executed && <i>Executed proposal</i> }
        <h3>Token #{ tokenId }</h3>
      </div>


      <div className={styles.content}>
        {/* Show proposal current vote count */}
        <div className={styles.section}>
          <p>Proposal votes:</p>
          <div className={styles.votes}>
            <p className={styles.yays}>{ `${proposal.yays.toNumber()} Yays` }</p>
            <p className={styles.nays}>{ `${proposal.nays.toNumber()} Nays` }</p>
          </div>
        </div>

        {/* Show deadline only if it has not been exceeded yet */}
        { !deadlineExpired && <p>Deadline: { deadlineDate.toLocaleString() }</p>}

        <div className={styles.section}>
          {/* show vote buttons if deadline has not expired yet */}
          { !deadlineExpired && <div className={styles.proposalOptions}>
            <div onClick={() => voteOnProposal(proposalId, "YAY")} className={`${styles.button} ${styles.yay}`}>Vote YAY</div>
            <div onClick={() => voteOnProposal(proposalId, "NAY")} className={`${styles.button} ${styles.nay}`}>Vote NAY</div>
          </div> }

          {/* If deadline has expired but proposal has not been executed yet, show a button to execute */}
          { deadlineExpired && !proposal.executed && <div className={styles.proposalOptions}>
            <div onClick={() => executeProposal(proposalId)} className={styles.button}>Execute proposal</div>
          </div> }

          {/* if proposal is active, show votes options */}
          {/* if already executed, show the outcome */}
          { proposal.executed && <div>
            <p style={{ color: passed ? "green" : "red" }}>This proposal was { passed ? "passed" : "declined" }</p>
          </div> }
        </div>
      </div>
    </div>
  }

  /**
   * A component that displays all the proposals in the DAO.
   * 
   * @returns ProposalsList component.
   */
  const ProposalsList = () => {
    if (isLoading) {
      return <div>
        Loading...
      </div>
    }

    if (proposals.length === 0) {
      return <div>
        There are still no proposals made in this DAO
      </div>
    }

    return <div className={styles.proposalsList}>
      { proposals.map((p, id) => <Proposal key={id} proposalId={id} proposal={p} />) }
    </div>;
  }

  /**
   * Returns a simple form to be able to create a new proposal in the DAO.
   * 
   * @returns CreateProposalForm component.
   */
  const CreateProposalForm = () => {
    if (isLoading) {
      return <p>Loading...</p>
    }

    const cancelCreation = () => {
      setIsCreatingProposal(false);
    }

    return <div className={styles.createProposalForm}>
      <h3>Create new proposal:</h3>
      <input type="number" ref={tokenIdInput} placeholder="Fake NFT Id"/>
      <div className={styles.options}>
        { InfoButton("Create", createProposal, null, { alignSelf: 'flex-start' }) }
        <div onClick={cancelCreation} className={styles.option}>Cancel</div>
      </div>
    </div>
  }

  /**
   * A helper component that renders a custom button that can also show additional information
   * 
   * @param {string} buttonText - Text to display inside the button
   * @param {() => void} onClickAction - What to do when user clicks in the button
   * @param {string} info - Additional information to show above the button
   * @param {object} buttonStyles - Additional CSS styles to apply to the button
   * @returns InfoButton Component
   */
  const InfoButton = (buttonText, onClickAction = () => {}, info = null, buttonStyles) => {
    return <div className={styles.infoButton}>
      { info && <div className="info">{ info }</div> }
      <div onClick={onClickAction} className={styles.button} style={buttonStyles}>{ buttonText }</div>
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

  /**
   * OnClick function for the `Create Proposal` button.
   */
  const handleCreateProposalOnClick = () => {
    setIsCreatingProposal(true);
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
            {/* <div style={{ display: 'flex', flexDirection: 'row', columnGap: '.5em', alignItems: 'center' }}> */}
            <h2>Proposals</h2>
            {/* </div> */}
            { isCreatingProposal && <CreateProposalForm />}
            { !isCreatingProposal && <ProposalsList />}
            { !isCreatingProposal && !isLoading && InfoButton("Create proposal", handleCreateProposalOnClick, null, { alignSelf: "flex-start" }) }
            
          </div>
          <UserPanel />
        </div>
        <img className={styles.img} src="https://raw.githubusercontent.com/RobertoCDiaz/nft-collection/main/app/public/nfts/0.svg" alt="NFT logo" />


      </div>
    </div>
  );
}
