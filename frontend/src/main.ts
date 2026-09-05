import './style.css'
import QRCode from 'qrcode'

import {
  createPublicClient,
  defineChain,
  encodeFunctionData,
  formatEther,
  http,
  parseEther,
} from 'viem'

type Eip1193Provider = {
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

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

const ARC_CHAIN_ID = 5042002
const ARC_CHAIN_HEX = `0x${ARC_CHAIN_ID.toString(16)}`
const ARC_RPC = 'https://rpc.testnet.arc.network'
const ARC_EXPLORER = 'https://testnet.arcscan.app'
const MULTISEND_CONTRACT = '0xAB147D7269dAe842D01A0985Ae62208A1A4f0476'



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
let activeProvider: Eip1193Provider | null = null
let activeConnectionType: 'browser' | null = null

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

        <button id="disconnectButton" class="disconnect-button">
          Disconnect Wallet
        </button>

      </div>

      <div id="paymentLinkPanel" class="payment-panel hidden">
        <h2>Create Payment Link</h2>

        <label for="requestAmount">Amount to Request</label>
        <input
          id="requestAmount"
          type="number"
          min="0"
          step="0.000001"
          placeholder="5"
        />

        <button id="createPaymentLinkButton" class="primary-button">
          Create Payment Link
        </button>

        <div id="paymentLinkResult" class="hidden">
          <label for="paymentLinkOutput">Your Payment Link</label>
          <input
            id="paymentLinkOutput"
            type="text"
            readonly
          />

          <img
            id="paymentQrCode"
            class="payment-qr hidden"
            alt="ArcPay payment QR code"
          />

          <button id="copyPaymentLinkButton" class="primary-button">
            Copy Link
          </button>
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

      <div id="multiSendPanel" class="payment-panel hidden">
        <h2>Multi-Send</h2>
        <p class="label">Send different USDC amounts to 3 wallets in one transaction.</p>

        <label for="multiRecipient1">Wallet 1</label>
        <input id="multiRecipient1" type="text" placeholder="0x..." autocomplete="off" />
        <label for="multiAmount1">Amount 1</label>
        <input id="multiAmount1" type="number" min="0" step="0.000001" placeholder="0.01" />

        <label for="multiRecipient2">Wallet 2</label>
        <input id="multiRecipient2" type="text" placeholder="0x..." autocomplete="off" />
        <label for="multiAmount2">Amount 2</label>
        <input id="multiAmount2" type="number" min="0" step="0.000001" placeholder="0.02" />

        <label for="multiRecipient3">Wallet 3</label>
        <input id="multiRecipient3" type="text" placeholder="0x..." autocomplete="off" />
        <label for="multiAmount3">Amount 3</label>
        <input id="multiAmount3" type="number" min="0" step="0.000001" placeholder="0.03" />

        <div class="balance-row">
          <span class="label">Total</span>
          <strong id="multiTotal">0 USDC</strong>
        </div>

        <button id="multiSendButton" class="primary-button">
          Send to All — 1 Transaction
        </button>
      </div>

      <div id="txPanel" class="tx-panel hidden"></div>

      <p id="status" class="status">Ready to connect.</p>
    </section>
  </main>
`

const connectButton =
  document.querySelector<HTMLButtonElement>('#connectButton')!





const disconnectButton =
  document.querySelector<HTMLButtonElement>('#disconnectButton')!

const sendButton =
  document.querySelector<HTMLButtonElement>('#sendButton')!

const createPaymentLinkButton =
  document.querySelector<HTMLButtonElement>('#createPaymentLinkButton')!

const copyPaymentLinkButton =
  document.querySelector<HTMLButtonElement>('#copyPaymentLinkButton')!

const walletPanel =
  document.querySelector<HTMLDivElement>('#walletPanel')!

const paymentLinkPanel =
  document.querySelector<HTMLDivElement>('#paymentLinkPanel')!

const paymentLinkResult =
  document.querySelector<HTMLDivElement>('#paymentLinkResult')!

const paymentPanel =
  document.querySelector<HTMLDivElement>('#paymentPanel')!

const multiSendPanel =
  document.querySelector<HTMLDivElement>('#multiSendPanel')!

const multiSendButton =
  document.querySelector<HTMLButtonElement>('#multiSendButton')!

const multiRecipient1 =
  document.querySelector<HTMLInputElement>('#multiRecipient1')!
const multiRecipient2 =
  document.querySelector<HTMLInputElement>('#multiRecipient2')!
const multiRecipient3 =
  document.querySelector<HTMLInputElement>('#multiRecipient3')!

const multiAmount1 =
  document.querySelector<HTMLInputElement>('#multiAmount1')!
const multiAmount2 =
  document.querySelector<HTMLInputElement>('#multiAmount2')!
const multiAmount3 =
  document.querySelector<HTMLInputElement>('#multiAmount3')!

const multiTotal =
  document.querySelector<HTMLElement>('#multiTotal')!

const requestAmountInput =
  document.querySelector<HTMLInputElement>('#requestAmount')!

const paymentLinkOutput =
  document.querySelector<HTMLInputElement>('#paymentLinkOutput')!

const paymentQrCode =
  document.querySelector<HTMLImageElement>('#paymentQrCode')!

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

function updateConnectionButtons() {
  connectButton.textContent =
    activeConnectionType === 'browser'
      ? 'Wallet Connected'
      : 'Browser Wallet'
}

function resetConnectedUi(message = 'Wallet disconnected.') {
  connectedAddress = null
  activeProvider = null
  activeConnectionType = null

  walletPanel.classList.add('hidden')
  paymentLinkPanel.classList.add('hidden')
  paymentPanel.classList.add('hidden')
  multiSendPanel.classList.add('hidden')
  txPanel.classList.add('hidden')
  paymentLinkResult.classList.add('hidden')

  walletAddress.textContent = '-'
  walletBalance.textContent = '- USDC'
  requestAmountInput.value = ''
  paymentLinkOutput.value = ''
  paymentQrCode.removeAttribute('src')
  paymentQrCode.classList.add('hidden')
  txPanel.innerHTML = ''
  multiRecipient1.value = ''
  multiRecipient2.value = ''
  multiRecipient3.value = ''
  multiAmount1.value = ''
  multiAmount2.value = ''
  multiAmount3.value = ''
  multiTotal.textContent = '0 USDC'

  updateConnectionButtons()
  setStatus(message)
}

async function ensureArcNetwork(provider: Eip1193Provider) {
  const currentChainId = await provider.request({
    method: 'eth_chainId',
  })

  if (
    typeof currentChainId === 'string' &&
    currentChainId.toLowerCase() === ARC_CHAIN_HEX.toLowerCase()
  ) {
    return
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_CHAIN_HEX }],
    })
  } catch (switchError: any) {
    const code = switchError?.code

    if (code === 4902 || code === -32603) {
      await provider.request({
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

  try {
    const balance = await publicClient.getBalance({
      address: connectedAddress,
    })

    walletBalance.textContent =
      `${Number(formatEther(balance)).toFixed(4)} USDC`
  } catch (error) {
    console.warn('Balance refresh failed:', error)
    walletBalance.textContent = 'Unavailable'
  }
}

function showConnectedWallet(address: `0x${string}`) {
  connectedAddress = address

  walletAddress.textContent = shortenAddress(address)

  walletPanel.classList.remove('hidden')
  paymentLinkPanel.classList.remove('hidden')
  paymentPanel.classList.remove('hidden')
  multiSendPanel.classList.remove('hidden')
  txPanel.classList.add('hidden')

  updateConnectionButtons()
}

function readableWalletError(error: any) {
  const code = error?.code

  if (code === 4001) {
    return 'Wallet request was rejected by the user.'
  }

  if (code === -32002) {
    return 'A wallet request is already pending. Please open your wallet.'
  }

  return error?.message
    ? `Wallet error: ${error.message}`
    : 'Wallet connection failed. Please try again.'
}

async function connectWallet() {
  const ethereum = getEthereum()

  if (!ethereum) {
    setStatus(
      'No browser wallet detected. Open ArcPay inside a compatible wallet browser or install an EVM browser wallet.'
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

    activeProvider = ethereum
    activeConnectionType = 'browser'

    await ensureArcNetwork(ethereum)

    const address = accounts[0] as `0x${string}`

    showConnectedWallet(address)
    await refreshBalance()

    setStatus('Connected to Arc Testnet.')
  } catch (error: any) {
    console.error('Wallet connection error:', error)
    resetConnectedUi(readableWalletError(error))
  } finally {
    connectButton.disabled = false
    updateConnectionButtons()
  }
}

async function disconnectWallet() {
  try {
    if (
      activeProvider &&
      typeof activeProvider.request === 'function'
    ) {
      try {
        await activeProvider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
      } catch (error) {
        console.warn(
          'Wallet permission revoke is not supported by this wallet:',
          error
        )
      }
    }
  } finally {
    resetConnectedUi('Wallet disconnected.')
  }
}

async function createPaymentLink() {
  if (!connectedAddress) {
    setStatus('Connect your wallet first.')
    return
  }

  const amount = requestAmountInput.value.trim()

  if (!amount || Number(amount) <= 0) {
    setStatus('Please enter a valid USDC amount to request.')
    return
  }

  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set('to', connectedAddress)
  url.searchParams.set('amount', amount)

  const paymentLink = url.toString()

  paymentLinkOutput.value = paymentLink
  paymentLinkResult.classList.remove('hidden')
  paymentQrCode.classList.add('hidden')

  try {
    const qrDataUrl = await QRCode.toDataURL(paymentLink, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })

    paymentQrCode.src = qrDataUrl
    paymentQrCode.classList.remove('hidden')

    setStatus('Payment link and QR code created. Share either one to receive payment.')
  } catch (error) {
    console.error('QR code error:', error)
    setStatus('Payment link created, but the QR code could not be generated.')
  }
}

async function copyPaymentLink() {
  const link = paymentLinkOutput.value.trim()

  if (!link) {
    setStatus('Create a payment link first.')
    return
  }

  try {
    await navigator.clipboard.writeText(link)
    copyPaymentLinkButton.textContent = 'Copied!'
    setStatus('Payment link copied to clipboard.')

    window.setTimeout(() => {
      copyPaymentLinkButton.textContent = 'Copy Link'
    }, 1600)
  } catch {
    paymentLinkOutput.focus()
    paymentLinkOutput.select()

    const copied = document.execCommand('copy')

    if (copied) {
      copyPaymentLinkButton.textContent = 'Copied!'
      setStatus('Payment link copied to clipboard.')

      window.setTimeout(() => {
        copyPaymentLinkButton.textContent = 'Copy Link'
      }, 1600)
    } else {
      setStatus('Could not copy automatically. Please copy the link manually.')
    }
  }
}

function loadPaymentRequestFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const recipient = params.get('to')?.trim() ?? ''
  const amount = params.get('amount')?.trim() ?? ''

  if (!recipient && !amount) {
    return
  }

  const recipientInput =
    document.querySelector<HTMLInputElement>('#recipient')!

  const amountInput =
    document.querySelector<HTMLInputElement>('#amount')!

  if (/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    recipientInput.value = recipient
  }

  if (amount && Number(amount) > 0) {
    amountInput.value = amount
  }

  if (
    /^0x[a-fA-F0-9]{40}$/.test(recipient) &&
    amount &&
    Number(amount) > 0
  ) {
    setStatus('Payment request loaded. Connect your wallet to continue.')
  }
}

function updateMultiTotal() {
  const amounts = [
    multiAmount1.value.trim(),
    multiAmount2.value.trim(),
    multiAmount3.value.trim(),
  ]

  try {
    let total = 0n
    for (const amount of amounts) {
      if (amount && Number(amount) > 0) {
        total += parseEther(amount)
      }
    }
    multiTotal.textContent = `${formatEther(total)} USDC`
  } catch {
    multiTotal.textContent = 'Invalid amount'
  }
}

async function sendMultiPayment() {
  if (!activeProvider || !connectedAddress) {
    setStatus('Connect your wallet first.')
    return
  }

  const recipients = [
    multiRecipient1.value.trim(),
    multiRecipient2.value.trim(),
    multiRecipient3.value.trim(),
  ]

  const amounts = [
    multiAmount1.value.trim(),
    multiAmount2.value.trim(),
    multiAmount3.value.trim(),
  ]

  for (const recipient of recipients) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setStatus('Please enter all 3 valid recipient addresses.')
      return
    }
  }

  for (const amount of amounts) {
    if (!amount || Number(amount) <= 0) {
      setStatus('Please enter all 3 valid USDC amounts.')
      return
    }
  }

  multiSendButton.disabled = true
  multiSendButton.textContent = 'Sending...'
  txPanel.classList.add('hidden')

  try {
    await ensureArcNetwork(activeProvider)

    const amount1 = parseEther(amounts[0])
    const amount2 = parseEther(amounts[1])
    const amount3 = parseEther(amounts[2])
    const total = amount1 + amount2 + amount3

    const data = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'sendToThree',
          stateMutability: 'payable',
          inputs: [
            { name: 'recipient1', type: 'address' },
            { name: 'amount1', type: 'uint256' },
            { name: 'recipient2', type: 'address' },
            { name: 'amount2', type: 'uint256' },
            { name: 'recipient3', type: 'address' },
            { name: 'amount3', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'sendToThree',
      args: [
        recipients[0] as `0x${string}`,
        amount1,
        recipients[1] as `0x${string}`,
        amount2,
        recipients[2] as `0x${string}`,
        amount3,
      ],
    })

    setStatus('Confirm the 3-wallet batch payment in your wallet...')

    const txHash = await activeProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: connectedAddress,
          to: MULTISEND_CONTRACT,
          value: `0x${total.toString(16)}`,
          data,
        },
      ],
    })

    setStatus('Batch transaction submitted. Waiting for confirmation...')

    await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    txPanel.innerHTML = `
      <strong>Multi-Send confirmed ✅</strong>
      <a
        href="${ARC_EXPLORER}/tx/${txHash}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View batch transaction on ArcScan
      </a>
    `
    txPanel.classList.remove('hidden')
    setStatus('3-wallet payment confirmed in one Arc transaction.')

    multiRecipient1.value = ''
    multiRecipient2.value = ''
    multiRecipient3.value = ''
    multiAmount1.value = ''
    multiAmount2.value = ''
    multiAmount3.value = ''
    updateMultiTotal()

    await refreshBalance()
  } catch (error: any) {
    console.error('Multi-Send error:', error)

    if (error?.code === 4001) {
      setStatus('Batch transaction cancelled by the user.')
    } else {
      setStatus(
        error?.message
          ? `Multi-Send failed: ${error.message}`
          : 'Multi-Send failed. Please try again.'
      )
    }
  } finally {
    multiSendButton.disabled = false
    multiSendButton.textContent = 'Send to All — 1 Transaction'
  }
}

async function sendPayment() {
  if (!activeProvider || !connectedAddress) {
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
    await ensureArcNetwork(activeProvider)

    const value = parseEther(amount)

    setStatus('Confirm the payment in your wallet...')


    const txHash = await activeProvider.request({
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
disconnectButton.addEventListener('click', disconnectWallet)
createPaymentLinkButton.addEventListener('click', createPaymentLink)
copyPaymentLinkButton.addEventListener('click', copyPaymentLink)
sendButton.addEventListener('click', sendPayment)
multiSendButton.addEventListener('click', sendMultiPayment)
multiAmount1.addEventListener('input', updateMultiTotal)
multiAmount2.addEventListener('input', updateMultiTotal)
multiAmount3.addEventListener('input', updateMultiTotal)

loadPaymentRequestFromUrl()

window.ethereum?.on?.('accountsChanged', async (accounts: string[]) => {
  if (activeConnectionType !== 'browser') return

  if (!accounts.length) {
    resetConnectedUi()
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
  if (
    activeConnectionType !== 'browser' ||
    !activeProvider ||
    !connectedAddress
  ) {
    return
  }

  try {
    await ensureArcNetwork(activeProvider)
    await refreshBalance()
    setStatus('Connected to Arc Testnet.')
  } catch (error: any) {
    setStatus(readableWalletError(error))
  }
})
