import './style.css'
import { EthereumProvider } from '@walletconnect/ethereum-provider'

import {
  createPublicClient,
  defineChain,
  formatEther,
  http,
  parseEther,
} from 'viem'

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string
        params?: unknown[] | object[]
      }) => Promise<any>
      on?: (event: string, callback: (...args: any[]) => void) => void
      removeListener?: (
        event: string,
        callback: (...args: any[]) => void
      ) => void
    }
  }
}

const ARC_CHAIN_ID = 5042002
const ARC_CHAIN_HEX = `0x${ARC_CHAIN_ID.toString(16)}`
const ARC_RPC = 'https://rpc.testnet.arc.network'
const ARC_EXPLORER = 'https://testnet.arcscan.app'

const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

let walletConnectProvider: any = null

const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: ARC_EXPLORER,
    },
  },
})

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC),
})

let connectedAddress: `0x${string}` | null = null

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="app-shell">
    <section class="card">
      <div class="badge">Built on Arc Testnet</div>

      <h1>ArcPay</h1>
      <p class="subtitle">Simple USDC payments powered by Arc.</p>

      <div class="wallet-buttons">
  <button id="connectButton" class="primary-button">
    Browser Wallet
  </button>

  <button id="walletConnectButton" class="primary-button">
    WalletConnect / Trust Wallet
  </button>
</div>
        
      <div id="walletPanel" class="wallet-panel hidden">
        <div>
          <span class="label">Connected Wallet</span>
          <strong id="walletAddress">-</strong>
        </div>

        <div class="balance-row">
          <span class="label">Balance</span>
          <strong id="walletBalance">- USDC</strong>
        </div>
      </div>

      <div id="paymentPanel" class="payment-panel hidden">
        <h2>Send USDC</h2>

        <label for="recipient">Recipient Address</label>
        <input
          id="recipient"
          type="text"
          placeholder="0x..."
          autocomplete="off"
        />

        <label for="amount">Amount</label>
        <input
          id="amount"
          type="number"
          min="0"
          step="0.000001"
          placeholder="0.01"
        />

        <button id="sendButton" class="primary-button">
          Send Payment
        </button>
      </div>

      <div id="txPanel" class="tx-panel hidden"></div>

      <p id="status" class="status">Ready to connect.</p>
    </section>
  </main>
`

const connectButton =
  document.querySelector<HTMLButtonElement>('#connectButton')!

const walletConnectButton =
  document.querySelector<HTMLButtonElement>('#walletConnectButton')!

const sendButton =
  document.querySelector<HTMLButtonElement>('#sendButton')!

const walletPanel =
  document.querySelector<HTMLDivElement>('#walletPanel')!

const paymentPanel =
  document.querySelector<HTMLDivElement>('#paymentPanel')!

const txPanel =
  document.querySelector<HTMLDivElement>('#txPanel')!

const walletAddress =
  document.querySelector<HTMLElement>('#walletAddress')!

const walletBalance =
  document.querySelector<HTMLElement>('#walletBalance')!

const status =
  document.querySelector<HTMLParagraphElement>('#status')!

function setStatus(message: string) {
  status.textContent = message
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getEthereum() {
  return window.ethereum
}

async function ensureArcNetwork() {
  const ethereum = getEthereum()

  if (!ethereum) {
    throw new Error(
      'No compatible wallet detected. Open ArcPay in Chrome/Brave with MetaMask or another EVM wallet installed.'
    )
  }

  const currentChainId = await ethereum.request({
    method: 'eth_chainId',
  })

  if (
    typeof currentChainId === 'string' &&
    currentChainId.toLowerCase() === ARC_CHAIN_HEX.toLowerCase()
  ) {
    return
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_CHAIN_HEX }],
    })
  } catch (switchError: any) {
    const code = switchError?.code

    if (code === 4902 || code === -32603) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ARC_CHAIN_HEX,
            chainName: 'Arc Testnet',
            nativeCurrency: {
              name: 'USDC',
              symbol: 'USDC',
              decimals: 18,
            },
            rpcUrls: [ARC_RPC],
            blockExplorerUrls: [ARC_EXPLORER],
          },
        ],
      })
      return
    }

    throw switchError
  }
}

async function refreshBalance() {
  if (!connectedAddress) return

  const balance = await publicClient.getBalance({
    address: connectedAddress,
  })

  walletBalance.textContent =
    `${Number(formatEther(balance)).toFixed(4)} USDC`
}

function showConnectedWallet(address: `0x${string}`) {
  connectedAddress = address

  walletAddress.textContent = shortenAddress(address)

  walletPanel.classList.remove('hidden')
  paymentPanel.classList.remove('hidden')

  connectButton.textContent = 'Wallet Connected'
  setStatus('Connected to Arc Testnet.')
}

function readableWalletError(error: any) {
  const code = error?.code

  if (code === 4001) {
    return 'Wallet connection was rejected by the user.'
  }

  if (code === -32002) {
    return 'A wallet request is already pending. Please open your wallet extension.'
  }

  if (error?.message?.includes('No compatible wallet')) {
    return error.message
  }

  return error?.message
    ? `Wallet error: ${error.message}`
    : 'Wallet connection failed. Please try again.'
}

async function connectWithWalletConnect() {
  if (!WALLETCONNECT_PROJECT_ID) {
    setStatus('WalletConnect Project ID is missing.')
    return
  }

  try {
    setStatus('Opening WalletConnect...')

    walletConnectProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      optionalChains: [ARC_CHAIN_ID],
      showQrModal: true,
      rpcMap: {
        [ARC_CHAIN_ID]: ARC_RPC,
      },
      metadata: {
        name: 'ArcPay',
        description: 'Simple USDC payments powered by Arc.',
        url: window.location.origin,
        icons: [],
      },
    })

    await walletConnectProvider.connect()

    const address =
      walletConnectProvider.accounts?.[0] as `0x${string}`

    if (!address) {
      throw new Error('No wallet account returned.')
    }

    connectedAddress = address

    showConnectedWallet(address)
    await refreshBalance()

    setStatus('Connected through WalletConnect.')
  } catch (error: any) {
    console.error('WalletConnect error:', error)

    setStatus(
      error?.message
        ? `WalletConnect error: ${error.message}`
        : 'WalletConnect connection failed.'
    )
  }
}

async function connectWallet() {
  const ethereum = getEthereum()

  if (!ethereum) {
    setStatus(
      'No wallet detected. Please open ArcPay in Chrome/Brave with MetaMask or another EVM wallet installed.'
    )
    return
  }

  connectButton.disabled = true
  connectButton.textContent = 'Connecting...'
  setStatus('Waiting for wallet approval...')

  try {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet account was selected.')
    }

    await ensureArcNetwork()

    const address = accounts[0] as `0x${string}`

    showConnectedWallet(address)
    await refreshBalance()
  } catch (error: any) {
    console.error('Wallet connection error:', error)

    connectedAddress = null
    connectButton.textContent = 'Connect Wallet'
    setStatus(readableWalletError(error))
  } finally {
    connectButton.disabled = false
  }
}

async function sendPayment() {
  const ethereum = getEthereum()

  if (!ethereum || !connectedAddress) {
    setStatus('Connect your wallet first.')
    return
  }

  const recipientInput =
    document.querySelector<HTMLInputElement>('#recipient')!

  const amountInput =
    document.querySelector<HTMLInputElement>('#amount')!

  const recipient = recipientInput.value.trim()
  const amount = amountInput.value.trim()

  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    setStatus('Please enter a valid recipient address.')
    return
  }

  if (!amount || Number(amount) <= 0) {
    setStatus('Please enter a valid USDC amount.')
    return
  }

  sendButton.disabled = true
  sendButton.textContent = 'Sending...'
  txPanel.classList.add('hidden')

  try {
    await ensureArcNetwork()

    const value = parseEther(amount)

    setStatus('Confirm the payment in your wallet...')

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: connectedAddress,
          to: recipient,
          value: `0x${value.toString(16)}`,
        },
      ],
    })

    setStatus('Transaction submitted. Waiting for confirmation...')

    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    txPanel.innerHTML = `
      <strong>Payment confirmed ✅</strong>
      <a
        href="${ARC_EXPLORER}/tx/${txHash}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View transaction on ArcScan
      </a>
    `

    txPanel.classList.remove('hidden')
    setStatus('Payment confirmed on Arc Testnet.')

    recipientInput.value = ''
    amountInput.value = ''

    await refreshBalance()
  } catch (error: any) {
    console.error('Payment error:', error)

    if (error?.code === 4001) {
      setStatus('Transaction cancelled by the user.')
    } else {
      setStatus(
        error?.message
          ? `Payment failed: ${error.message}`
          : 'Payment failed. Please try again.'
      )
    }
  } finally {
    sendButton.disabled = false
    sendButton.textContent = 'Send Payment'
  }
}

connectButton.addEventListener('click', connectWallet)
walletConnectButton.addEventListener('click', connectWithWalletConnect)
sendButton.addEventListener('click', sendPayment)

window.ethereum?.on?.('accountsChanged', async (accounts: string[]) => {
  if (!accounts.length) {
    connectedAddress = null
    walletPanel.classList.add('hidden')
    paymentPanel.classList.add('hidden')
    connectButton.textContent = 'Connect Wallet'
    setStatus('Wallet disconnected.')
    return
  }

  const address = accounts[0] as `0x${string}`
  showConnectedWallet(address)

  try {
    await refreshBalance()
  } catch {
    setStatus('Wallet connected, but balance could not be loaded.')
  }
})

window.ethereum?.on?.('chainChanged', async () => {
  if (!connectedAddress) return

  try {
    await ensureArcNetwork()
    await refreshBalance()
    setStatus('Connected to Arc Testnet.')
  } catch (error: any) {
    setStatus(readableWalletError(error))
  }
})