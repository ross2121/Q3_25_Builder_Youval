import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo, getMint } from '@solana/spl-token';
import wallet from "../turbin3-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("735dt5HekUQQq3qi9NLttRegp6koRAA5nX6Uv3LHMXJS");

(async () => {
    try {
    
        const mintInfo = await getMint(connection, mint);
    
        
        const token_decimals = BigInt(10 ** mintInfo.decimals);
    
        
        const ata = await getOrCreateAssociatedTokenAccount(connection,keypair,mint,keypair.publicKey);
        console.log(`Your ata is: ${ata.address.toBase58()}`);

    
        const amountToMint = BigInt(100) * token_decimals;
        console.log(`Amount to mint (in base units): ${amountToMint}`);
        const mintTx = await mintTo(connection,keypair,mint,ata.address,keypair.publicKey,amountToMint);
        console.log(`Your mint txid: ${mintTx}`);
        

        console.log(`Check your balance at: https://explorer.solana.com/address/${ata.address.toBase58()}?cluster=devnet`);
        
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
