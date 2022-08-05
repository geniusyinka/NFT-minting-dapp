//@ts-nocheck
import {
  ConnectButton, useConnectModal,
  useAccountModal,
  useChainModal,
} from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import { stringify } from 'querystring';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useConnect } from 'wagmi';
import styles from '../styles/Home.module.css';
import { ethers } from 'ethers'
import { hasEthereum } from '../utils/ethereum'
import Minter from '../src/artifacts/contracts/Minter.sol/Minter.json'
import TotalSupply from '../components/TotalSupply'
import Wallet from '../components/Wallet'
import YourNFTs from '../components/YourNFTs'
import { connected } from 'process';


function Home() {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  const { address, isConnecting, isDisconnected, isConnected, account } = useAccount({
    onConnect({ address, connector, isReconnected }) {
      console.log('Connected', { address, connector, isReconnected })
    },
  });

  const [add, setAdd] = useState('');
 


  useEffect(() => {
    async function getAccount() {
      const provider = new ethers.providers.Web3Provider(web3.currentProvider);
      const signer = provider.getSigner();
      const address = signer.getAddress()
      console.log(await address)
      setAdd(await address)
    }
    getAccount();
  }, [])


  const MINT_PRICE = 0.03
  const MAX_MINT = 20

  // UI state
  const [mintQuantity, setMintQuantity] = useState(1)
  const mintQuantityInputRef = useRef()
  const [mintError, setMintError] = useState(false)
  const [mintMessage, setMintMessage] = useState('')
  const [mintLoading, setMintLoading] = useState(false)
  const [text, changeText] = useState('')


  async function mintNFTs() {
    // Check quantity
    if (mintQuantity < 1) {
      setMintMessage('You need to mint at least 1 NFT.')
      setMintError(true)
      mintQuantityInputRef.current.focus()
      return
    }
    if (mintQuantity > MAX_MINT) {
      setMintMessage('You can only mint a maximum of 10 NFTs.')
      setMintError(true)
      mintQuantityInputRef.current.focus()
      return
    }

    // Get wallet details
    if (!hasEthereum()) return
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      try {
        const address = await signer.getAddress()

        setMintLoading(true)
        // Interact with contract
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_MINTER_ADDRESS,
          Minter.abi,
          signer,
        )
        const totalPrice = MINT_PRICE * mintQuantity
        const transaction = await contract.mint(mintQuantity, {
          value: ethers.utils.parseEther(totalPrice.toString()),
        })
        await transaction.wait()

        mintQuantityInputRef.current.value = 0
        setMintMessage(`Congrats, you minted ${mintQuantity} token(s)!`)
        setMintError(false)
      } catch {
        setMintMessage('Connect your wallet first.')
        setMintError(true)
      }
    } catch (error) {
      setMintMessage(error.message)
      setMintError(true)
    }
    setMintLoading(false)
  }


  return (
    <div className={styles.container}>
      <div className="max-w-xl mt-36 mx-auto px-4 text-center">
        <ConnectButton />
        <Head>

          <title>NFT Minting dApp Starter</title>
          <meta
            name="description"
            content="Mint an NFT, or a number of NFTs, from the client-side."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {/* <button onClick={() => disconnect()}>Disconnect</button> */}

        {/* <Connect /> */}
        {/* <Wallet /> */}

        <main className="space-y-8">
          <div className="head mt-14">
            {!process.env.NEXT_PUBLIC_MINTER_ADDRESS ? (
              <p className="text-md">
                Please add a value to the <pre>NEXT_PUBLIC_MINTER_ADDRESS</pre>{' '}
                environment variable.
              </p>
            ) : (
              <>
                <h1 className="text-4xl font-semibold mb-8">
                  NFT Minting dApp Starter v2
                </h1>
                <TotalSupply />
                <div className="space-y-8">
                  <div className="bg-gray-100 p-4 lg:p-8">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Mint NFTs</h2>
                      <label className="text-gray-600 text-sm mb-2 inline-block">
                        How many NFTs would you like to mint from the smart
                        contract?
                      </label>
                      <div className="flex">
                        <input
                          className={
                            !mintError
                              ? 'border p-4 text-center rounded-tl rounded-bl focus:outline-none focus:border-blue-600 w-2/3'
                              : 'border border-red-500 p-4 text-center rounded-tl rounded-bl focus:outline-none focus:border-blue-600 w-2/3'
                          }
                          onChange={(e) => setMintQuantity(e.target.value)}
                          value={mintQuantity}
                          placeholder="1"
                          type="number"
                          min="1"
                          max="20"
                          ref={mintQuantityInputRef}
                        />
                        {isConnected ? <button
                          className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-tr rounded-br w-1/3"
                          onClick={mintNFTs}
                        >
                          Mint
                        </button> :
                          openConnectModal && (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-tr rounded-br w-1/3"
                            onClick={openConnectModal}
                            type='button'
                          >
                            connect wallet
                          </button>)
                        }
                      </div>
                      {mintMessage && (
                        <span
                          className={
                            mintError
                              ? 'text-red-600 text-xs mt-2 block'
                              : 'text-green-600 text-xs mt-2 block'
                          }
                        >
                          {mintMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {isConnected ? <YourNFTs /> : null}
          </div>
        </main>
        <footer className="mt-20 text-center">
          <a
            href="https://github.com/tomhirst/solidity-nextjs-mint-starter/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 mb-8 inline-block"
          >
            Read the docs
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Home;
