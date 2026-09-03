import './style.css'
import {
  createPublicClient,
  defineChain,
  formatEther,
  http,
  parseEther,
} from 'viem'

declare global {
  interface Window {
    ethereum?: any
  }
}

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
})

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

let connectedAddress: `0x${string}` | null = null

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="container">
    <div class="card">

      <div class="badge">Built on Arc Testnet</div>

      <h1>ArcPay</h1>

      <p class="subtitle">
        Simple USDC payments powered by Arc.
      </p>

      <button id="connectWallet">
        Connect Wallet
      </button>

      <div id="walletPanel" class="wallet-panel hidden">

        <p class="label">Connected Wallet</p>
        <p id="walletAddress" class="wallet-address"></p>

        <div class="balance-box">
          <span>Balance</span>
          <strong id="walletBalance">0 USDC</strong>
        </div>

      </div>

      <div id="paymentPanel" class="payment-panel hidden">

        <h2>Send USDC</h2>

        <label>Recipient Address</label>

        <input
          id="recipient"
          type="text"
          placeholder="0x..."
        />

        <label>Amount</label>

        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="1.00"
        />

        <button id="sendPayment">
          Send Payment
        </button>

      </div>

      <div id="txPanel" class="tx-panel hidden">

        <p>Transaction submitted successfully.</p>

        <a
          id="txLink"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          View transaction on ArcScan
        </a>

      </div>

      <p id="status" class="status">
        Ready to connect.
      </p>

    </div>
  </main>
`

const connectButton =
  document.querySelector<HTMLButtonElement>('#connectWallet')!

const walletPanel =
  document.querySelector<HTMLDivElement>('#walletPanel')!

const paymentPanel =
  document.querySelector<HTMLDivElement>('#paymentPanel')!

const txPanel =
  document.querySelector<HTMLDivElement>('#txPanel')!

const walletAddress =
  document.querySelector<HTMLParagraphElement>('#walletAddress')!

const walletBalance =
  document.querySelector<HTMLElement>('#walletBalance')!

const recipientInput =
  document.querySelector<HTMLInputElement>('#recipient')!

const amountInput =
  document.querySelector<HTMLInputElement>('#amount')!

const sendButton =
  document.querySelector<HTMLButtonElement>('#sendPayment')!

const status =
  document.querySelector<HTMLParagraphElement>('#status')!

const txLink =
  document.querySelector<HTMLAnchorElement>('#txLink')!

async function refreshBalance() {

  if (!connectedAddress) return

  const balance = await publicClient.getBalance({
    address: connectedAddress,
  })

  walletBalance.textContent =
    Number(formatEther(balance)).toFixed(4) + ' USDC'
}

async function connectWallet() {

  if (!window.ethereum) {

    status.textContent = 'MetaMask not detected.'
    return

  }

  try {

    status.textContent = 'Connecting wallet...'

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    connectedAddress = accounts[0] as `0x${string}`

    const currentChainId =
      await window.ethereum.request({
        method: 'eth_chainId',
      })

    const arcChainId =
      '0x' + arcTestnet.id.toString(16)

    if (currentChainId !== arcChainId) {

      status.textContent =
        'Switching to Arc Testnet...'

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: arcChainId,
          },
        ],
      })
    }

    walletAddress.textContent =
      connectedAddress.slice(0, 6) +
      '...' +
      connectedAddress.slice(-4)

    await refreshBalance()

    walletPanel.classList.remove('hidden')
    paymentPanel.classList.remove('hidden')

    connectButton.textContent =
      'Wallet Connected'

    status.textContent =
      'Connected to Arc Testnet.'

  } catch (error) {

    console.error(error)

    status.textContent =
      'Wallet connection failed.'

  }
}

async function sendPayment() {

  if (!window.ethereum || !connectedAddress) {

    status.textContent =
      'Connect your wallet first.'

    return
  }

  const recipient =
    recipientInput.value.trim()

  const amount =
    amountInput.value.trim()

  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {

    status.textContent =
      'Enter a valid recipient address.'

    return
  }

  if (!amount || Number(amount) <= 0) {

    status.textContent =
      'Enter a valid USDC amount.'

    return
  }

  try {

    sendButton.disabled = true

    status.textContent =
      'Confirm transaction in MetaMask...'

    const value =
      parseEther(amount)

    const txHash =
      await window.ethereum.request({

        method: 'eth_sendTransaction',

        params: [
          {
            from: connectedAddress,
            to: recipient,
            value:
              '0x' + value.toString(16),
          },
        ],

      })

    status.textContent =
      'Transaction submitted. Waiting for confirmation...'

    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    txLink.href =
      `https://testnet.arcscan.app/tx/${txHash}`

    txPanel.classList.remove('hidden')

    await refreshBalance()

    recipientInput.value = ''
    amountInput.value = ''

    status.textContent =
      'Payment confirmed on Arc Testnet!'

  } catch (error) {

    console.error(error)

    status.textContent =
      'Transaction cancelled or failed.'

  } finally {

    sendButton.disabled = false

  }
}

connectButton.addEventListener(
  'click',
  connectWallet
)

sendButton.addEventListener(
  'click',
  sendPayment
)