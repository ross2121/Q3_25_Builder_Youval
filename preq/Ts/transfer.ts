import { 
    Connection, 
    Keypair, 
    LAMPORTS_PER_SOL, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    clusterApiUrl,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import * as fs from "fs";

// Read the key from key.json
const keyData = JSON.parse(fs.readFileSync("./key.json", "utf8"));

// Parse the secret key from the comma-separated string
const secretKeyArray = keyData["secret key"].split(",").map((num: string) => parseInt(num.trim()));
const secretKey = Uint8Array.from(secretKeyArray);

// Create keypair from the secret key
const fromKeypair = Keypair.fromSecretKey(secretKey);

// Connect to Solana devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Destination address
const toPublicKey = new PublicKey("CMamkEpJh2xgoWNf4dxdXqeF5Yg4Ndh3bpLUkxJE9amC");

async function transferAll() {
    try {
        console.log("From address:", fromKeypair.publicKey.toBase58());
        console.log("To address:", toPublicKey.toBase58());
        
        // Check balance before transfer
        const fromBalance = await connection.getBalance(fromKeypair.publicKey);
        console.log("Current balance:", fromBalance / LAMPORTS_PER_SOL, "SOL");
        
        if (fromBalance === 0) {
            console.log("No balance to transfer!");
            return;
        }
        
        // Create a test transaction to estimate fees
        const testTransaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKey,
                lamports: fromBalance, // This will be adjusted
            })
        );
        
        // Get recent blockhash for fee calculation
        const { blockhash } = await connection.getLatestBlockhash();
        testTransaction.recentBlockhash = blockhash;
        testTransaction.feePayer = fromKeypair.publicKey;
        
        // Estimate transaction fee
        const fee = await connection.getFeeForMessage(testTransaction.compileMessage());
        const transactionFee = fee.value || 5000; // Default fee if estimation fails
        
        console.log("Estimated transaction fee:", transactionFee / LAMPORTS_PER_SOL, "SOL");
        
        // Calculate transfer amount (balance minus fee)
        const transferAmount = fromBalance - transactionFee;
        
        if (transferAmount <= 0) {
            console.log("Insufficient balance to cover transaction fee!");
            return;
        }
        
        console.log("Transferring:", transferAmount / LAMPORTS_PER_SOL, "SOL");
        
        // Create actual transfer instruction
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: transferAmount,
        });
        
        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        
        // Send and confirm transaction
        console.log("Sending transaction...");
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]
        );
        
        console.log("Transfer completed!");
        console.log("Transaction signature:", signature);
        
        // Check balances after transfer
        const fromBalanceAfter = await connection.getBalance(fromKeypair.publicKey);
        const toBalanceAfter = await connection.getBalance(toPublicKey);
        
        console.log("From balance after transfer:", fromBalanceAfter / LAMPORTS_PER_SOL, "SOL");
        console.log("To balance after transfer:", toBalanceAfter / LAMPORTS_PER_SOL, "SOL");
        
    } catch (error) {
        console.error("Error during transfer:", error);
    }
}

// Execute the transfer
transferAll();
