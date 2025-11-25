import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("🚀 Deploying OneStreamNFT Contract");
  console.log("=".repeat(60));
  console.log("\n📋 Deployment Info:");
  console.log("  Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("  Deployer balance:", ethers.formatEther(balance), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("  Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
  
  if (balance === 0n) {
    console.error("\n❌ ERROR: Deployer account has no balance!");
    console.error("   Please fund your account with ETH before deploying.");
    process.exit(1);
  }

  console.log("\n📝 Contract Parameters:");
  const contractName = "OneStream";
  const contractSymbol = "OST";
  // Base URI - можно использовать IPFS или ваш API endpoint
  // Для тестирования используем placeholder, потом можно обновить через setBaseURI
  const baseURI = process.env.BASE_URI || "ipfs://QmYourIPFSHash/";
  console.log("  Name:", contractName);
  console.log("  Symbol:", contractSymbol);
  console.log("  Base URI:", baseURI);

  console.log("\n⏳ Deploying contract...");
  const OneStreamNFT = await ethers.getContractFactory("OneStreamNFT");
  const contract = await OneStreamNFT.deploy(deployer.address, baseURI);

  console.log("  Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Successful!");
  console.log("=".repeat(60));
  console.log("\n📍 Contract Address:", address);
  console.log("\n📋 Next Steps:");
  console.log("  1. Add to .env.local:");
  console.log(`     NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("\n  2. Add to Vercel Environment Variables:");
  console.log(`     NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("\n  3. Verify contract on BaseScan:");
  if (network.chainId === 84532n) {
    console.log(`     https://sepolia.basescan.org/address/${address}`);
  } else if (network.chainId === 8453n) {
    console.log(`     https://basescan.org/address/${address}`);
  }
  console.log("\n  4. Test mint (optional):");
  console.log(`     npm run mint:test -- --network ${network.name === "base-sepolia" ? "baseSepolia" : "base"} --address ${address}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

