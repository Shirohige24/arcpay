# ArcPay

A lightweight USDC payment dApp built on Arc Testnet.

[🚀 Live Demo](https://arcpay-arc.vercel.app/) • [🔎 Verified Testnet Transaction](https://testnet.arcscan.app/tx/0x1864f2e5c3f3e4423d83c9ca2e93e5fc461ef5dbbd107449f1b1b5f70a63037b)

![ArcPay Demo](docs/arcpay-demo.png)




ArcPay demonstrates how users can connect an EVM-compatible wallet, view their USDC balance, and send onchain payments through a simple web interface.



\## Features



\- Connect MetaMask wallet

\- Automatic Arc Testnet network detection

\- Live USDC balance

\- Send USDC to any Arc Testnet address

\- MetaMask transaction confirmation

\- Onchain transaction tracking

\- Direct ArcScan transaction link

\- Responsive web interface



\## Built on Arc



ArcPay is built specifically to explore payments on Arc.



\*\*Network:\*\* Arc Testnet  

\*\*Chain ID:\*\* 5042002  

\*\*Native Gas Token:\*\* USDC



The application communicates directly with Arc Testnet through its RPC endpoint and uses `viem` for blockchain interactions.



\## Tech Stack



\- TypeScript

\- Vite

\- viem

\- MetaMask

\- Arc Testnet

\- Node.js



\## How It Works



1\. User connects a MetaMask wallet.

2\. ArcPay verifies that the wallet is connected to Arc Testnet.

3\. The application reads the wallet's live USDC balance.

4\. User enters a recipient address and payment amount.

5\. MetaMask requests transaction approval.

6\. The payment is submitted to Arc Testnet.

7\. ArcPay waits for onchain confirmation.

8\. The confirmed transaction can be viewed on ArcScan.



\## Run Locally



Clone the repository:



```bash

git clone https://github.com/Shirohige24/arcpay.git

## Live Testnet Transaction

ArcPay has been tested with a real onchain payment on Arc Testnet.

**Test Payment:** 0.01 USDC

**Transaction Hash:**
`0x1864f2e5c3f3e4423d83c9ca2e93e5fc461ef5dbbd107449f1b1b5f70a63037b`

[View transaction on ArcScan](https://testnet.arcscan.app/tx/0x1864f2e5c3f3e4423d83c9ca2e93e5fc461ef5dbbd107449f1b1b5f70a63037b)

This transaction demonstrates the complete ArcPay payment flow:

Wallet → ArcPay → MetaMask approval → Arc Testnet → Onchain confirmation
