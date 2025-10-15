import { ethers, parseUnits } from 'ethers';
import tokenAbi from '../config/ERC20_ABI.json';
const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || "";
export default async function CordyStackTrans(address, cost) {
    if (!address)
        return alert("Address Not Found");
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const decimals = 18;
        const amount = parseUnits(String(cost), decimals);
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        if (balance < amount) {
            return alert("Insuficient Funds");
        }
        const tx = await tokenContract.transfer(platformAddress, amount);
        const receipt = await tx.wait();
        if (receipt) {
            return alert("Transactions Complete");
        }
        else {
            return alert("Transaction Failed");
        }
    }
    catch (err) {
        console.error(err);
    }
}
;
