import './style.css'
import { createPublicClient, defineChain, formatEther, http } from 'viem'

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

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="container">
    <div class="card">
      <div class="badge">Built on Arc Testnet</div>

      <h1>ArcPay</h1>
      <p class="subtitle">
        Simple USDC payments powered by Arc.
      </p>

      <button id="connectWallet">Connect Wallet</button>

      <div id="walletPanel" class="wallet-panel hidden">
        <p class="label">Connected Wallet</p>
        <p id="walletAddress" class="wallet-address"></p>

        <div class="balance-box">
          <span>Balance</span>
          <strong id="walletBalance">0 USDC</strong>
        </div>
      </div>

      <p id="status" class="status">Ready to connect.</p>
    </div>
  </main>
`

const connectButton = document.querySelector<HTMLButtonElement>('#connectWallet')!
const walletPanel = document.querySelector<HTMLDivElement>('#walletPanel')!
const walletAddress = document.querySelector<HTMLParagraphElement>('#walletAddress')!
const walletBalance = document.querySelector<HTMLElement>('#walletBalance')!
const status = document.querySelector<HTMLParagraphElement>('#status')!

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

    const address = accounts[0] as `0x${string}`

    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    })

    const arcChainId = '0x' + arcTestnet.id.toString(16)

    if (chainId !== arcChainId) {
      status.textContent = 'Switching to Arc Testnet...'

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: arcChainId }],
      })
    }

    const balance = await publicClient.getBalance({
      address,
    })

    walletAddress.textContent =
      address.slice(0, 6) + '...' + address.slice(-4)

    walletBalance.textContent =
      Number(formatEther(balance)).toFixed(4) + ' USDC'

    walletPanel.classList.remove('hidden')
    connectButton.textContent = 'Wallet Connected'
    status.textContent = 'Connected to Arc Testnet.'
  } catch (error) {
    console.error(error)
    status.textContent = 'Wallet connection failed.'
  }
}

connectButton.addEventListener('click', connectWallet)