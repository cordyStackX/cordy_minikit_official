import { ethers, parseUnits } from 'ethers';
import tokenAbi from '../config/ERC20_ABI.json';

const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || "";

export default async function CordyStackTrans(address: string, cost: number) {

  if (!address) {
    console.error("Address Not Found");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    const decimals = 18;
    const amount = parseUnits(String(cost), decimals);

    const balance = await tokenContract.balanceOf(await signer.getAddress());
    if (balance < amount) {
      console.log("Insuficient Funds");
      return false;
    }

    const tx = await tokenContract.transfer(platformAddress, amount);
    const receipt = await tx.wait();

    if (receipt) {
      console.log("Transaction Complete TX hash", receipt);
      return true;
    } else {
      console.log("Transaction Failed", receipt)
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
};