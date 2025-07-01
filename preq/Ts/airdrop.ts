import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";


const keyData = JSON.parse(fs.readFileSync("./key.json", "utf8"));


const secretKeyArray = keyData["secret key"].split(",").map((num: string) => parseInt(num.trim()));
const secretKey = Uint8Array.from(secretKeyArray);


const keypair = Keypair.fromSecretKey(secretKey);


const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

async function airdrop() {
    try {
        console.log("Public Key:", keypair.publicKey.toBase58());
        console.log("Requesting airdrop of 2 SOL...");
        
        const airdropSignature = await connection.requestAirdrop(
            keypair.publicKey,
            2 * LAMPORTS_PER_SOL
        );
        
        console.log("Airdrop signature:", airdropSignature);
        

        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdropSignature,
        });
        
        console.log("Airdrop confirmed!");
        
       
        const balance = await connection.getBalance(keypair.publicKey);
        console.log("New balance:", balance / LAMPORTS_PER_SOL, "SOL");
        
    } catch (error) {
        console.error("Error during airdrop:", error);
    }
}

// Execute the airdrop
airdrop();
