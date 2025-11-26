import hre from "hardhat";
const { ethers } = hre;

async function main() {
  // Get contract address from command line or environment
  const contractAddress = process.argv[2] || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ ERROR: Contract address required!");
    console.error("   Usage: npx hardhat run scripts/mintTest.ts --network <network> <contractAddress>");
    console.error("   Or set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
    process.exit(1);
  }

  const [owner] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("🧪 Testing NFT Mint");
  console.log("=".repeat(60));
  console.log("\n📋 Test Info:");
  console.log("  Contract address:", contractAddress);
  console.log("  Owner address:", owner.address);
  console.log("  Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");

  // Get contract instance
  const OneStreamNFT = await ethers.getContractFactory("OneStreamNFT");
  const contract = OneStreamNFT.attach(contractAddress) as any; // Type assertion for contract methods

  // Check current token count
  const nextTokenId = await contract.nextTokenId();
  console.log("  Current nextTokenId:", nextTokenId.toString());

  // Test metadata URI
  const testTokenURI = `test-token-${Date.now()}`;
  console.log("\n⏳ Minting test NFT...");
  console.log("  Token URI:", testTokenURI);

  try {
    // Mint NFT
    const tx = await contract.mintTo(owner.address, testTokenURI);
    console.log("  Transaction hash:", tx.hash);
    console.log("  Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("  ✅ Transaction confirmed in block:", receipt?.blockNumber);

      // Get the minted token ID (should be nextTokenId - 1, since nextTokenId was incremented)
      const newNextTokenId = await contract.nextTokenId() as bigint;
      const mintedTokenId = newNextTokenId - 1n;
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Mint Successful!");
    console.log("=".repeat(60));
    console.log("\n📍 Minted Token ID:", mintedTokenId.toString());
    console.log("  Owner:", owner.address);
    
    // Verify ownership first
    try {
      const tokenOwner = await contract.ownerOf(mintedTokenId);
      console.log("  Verified owner:", tokenOwner);
      
      if (tokenOwner.toLowerCase() === owner.address.toLowerCase()) {
        console.log("  ✅ Ownership verified!");
      } else {
        console.log("  ❌ Ownership mismatch!");
      }
      
      // Get token URI (may fail if baseURI is not set properly)
      try {
        const fullTokenURI = await contract.tokenURI(mintedTokenId);
        console.log("  Token URI:", fullTokenURI);
      } catch (uriError: any) {
        console.log("  ⚠️  Token URI not available (baseURI may need to be set)");
      }
    } catch (error: any) {
      console.error("  ❌ Error verifying token:", error.message);
    }

    console.log("\n📋 View on BaseScan:");
    if (network.chainId === 84532n) {
      console.log(`  https://sepolia.basescan.org/token/${contractAddress}?a=${mintedTokenId}`);
    } else if (network.chainId === 8453n) {
      console.log(`  https://basescan.org/token/${contractAddress}?a=${mintedTokenId}`);
    }
    console.log("\n" + "=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ Mint failed:");
    if (error.message) {
      console.error("  Error:", error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });

