import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../trubin3-wallet.json";
import { getMint, getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("735dt5HekUQQq3qi9NLttRegp6koRAA5nX6Uv3LHMXJS");

// Recipient address
const to = new PublicKey("CMamkEpJh2xgoWNf4dxdXqeF5Yg4Ndh3bpLUkxJE9amC");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromata=await getOrCreateAssociatedTokenAccount(connection,keypair,mint,keypair.publicKey);
        const toata=await getOrCreateAssociatedTokenAccount(connection,keypair,mint,to);
        const mintInfo = await getMint(connection, mint);
    
        
        const token_decimals = BigInt(10 ** mintInfo.decimals);
      const tx=await transfer(connection,keypair,fromata.address,toata.address,keypair,BigInt(2)*token_decimals);
      console.log(tx);
        // Get the token account of the toWallet address, and if it does not exist, create it

        // Transfer the new token to the "toTokenAccount" we just created
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();