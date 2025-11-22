import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const OneStreamNFT = await ethers.getContractFactory("OneStreamNFT");
  const contract = await OneStreamNFT.deploy(deployer.address);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("OneStreamNFT deployed to:", address);
  console.log("\nNext steps:");
  console.log("1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  console.log("2. Verify contract on BaseScan (optional)");
  console.log(`3. Contract address: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

