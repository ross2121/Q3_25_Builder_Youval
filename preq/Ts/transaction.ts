import { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction,
    TransactionInstruction,
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
const keypair = Keypair.fromSecretKey(secretKey);

// Connect to Solana devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Program ID from the IDL
const PROGRAM_ID = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");

// System Program ID
const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

async function initialize() {
    try {
        console.log("User (signer):", keypair.publicKey.toBase58());
        
        // Create account seeds as specified
        const account_seeds = [
            Buffer.from("prereqs"),
            keypair.publicKey.toBuffer(),
        ];
        
        // Find PDA for the account
        const [accountPDA, bump] = PublicKey.findProgramAddressSync(
            account_seeds,
            PROGRAM_ID
        );
        
        console.log("Account PDA:", accountPDA.toBase58());
        console.log("Bump:", bump);
        
        // GitHub username - you can modify this
        const github = "ross2121"; // Replace with actual GitHub username
        
        // Create instruction data
        // Discriminator for initialize: [175, 175, 109, 31, 13, 152, 155, 237]
        const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
        
        // Serialize github string (length + string bytes)
        const githubBuffer = Buffer.from(github, 'utf8');
        const githubLengthBuffer = Buffer.alloc(4);
        githubLengthBuffer.writeUInt32LE(githubBuffer.length, 0);
        
        // Combine instruction data
        const instructionData = Buffer.concat([
            discriminator,
            githubLengthBuffer,
            githubBuffer
        ]);
        
        // Create accounts array
        const accounts = [
            {
                pubkey: keypair.publicKey,
                isSigner: true,
                isWritable: true,
            },
            {
                pubkey: accountPDA,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: SYSTEM_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
        ];
        
        // Create the instruction
        const instruction = new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_ID,
            data: instructionData,
        });
        
        // Create transaction
        const transaction = new Transaction().add(instruction);
        
        console.log("Sending initialize transaction...");
        console.log("GitHub username:", github);
        
        // Send and confirm transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );
        
        console.log("Initialize transaction completed!");
        console.log("Transaction signature:", signature);
        console.log("Account created at:", accountPDA.toBase58());
        
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// Execute the initialization
initialize();
