import { createPublicClient, http, defineChain, formatEther } from "viem";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
});

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

async function main() {
  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.log("Wallet address missing.");
    console.log("Example: npx tsx src\\balance.ts 0xYourWalletAddress");
    return;
  }

  const balance = await client.getBalance({
    address: walletAddress as `0x${string}`,
  });

  console.log("ArcPay Balance Checker");
  console.log("Wallet:", walletAddress);
  console.log("Balance:", formatEther(balance), "USDC");
}

main().catch(console.error);