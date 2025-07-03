import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo, getMint } from '@solana/spl-token';
import wallet from "../trubin3-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("735dt5HekUQQq3qi9NLttRegp6koRAA5nX6Uv3LHMXJS");

(async () => {
    try {
        // First, let's check the mint info to see the actual decimals
        const mintInfo = await getMint(connection, mint);
        console.log(`Mint decimals: ${mintInfo.decimals}`);
        
        // Calculate token_decimals based on actual decimals
        const token_decimals = BigInt(10 ** mintInfo.decimals);
        console.log(`Token decimals multiplier: ${token_decimals}`);
        
        const ata = await getOrCreateAssociatedTokenAccount(connection,keypair,mint,keypair.publicKey);
        console.log(`Your ata is: ${ata.address.toBase58()}`);

        // Calculate the amount to mint (100 tokens)
        const amountToMint = BigInt(100) * token_decimals;
        console.log(`Amount to mint (in base units): ${amountToMint}`);

        // Mint to ATA
        const mintTx = await mintTo(connection,keypair,mint,ata.address,keypair.publicKey,amountToMint);
        console.log(`Your mint txid: ${mintTx}`);
        
        // Check balance after minting
        console.log(`Check your balance at: https://explorer.solana.com/address/${ata.address.toBase58()}?cluster=devnet`);
        
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
