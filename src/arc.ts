import { createPublicClient, http, defineChain } from "viem";

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
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
});

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

async function main() {
  console.log("ArcPay v0.1");
  console.log("Connecting to Arc Testnet...");

  const blockNumber = await client.getBlockNumber();

  console.log("Connected successfully!");
  console.log("Chain ID:", arcTestnet.id);
  console.log("Latest block:", blockNumber.toString());
}

main().catch(console.error);