import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor"
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import * as fs from "fs";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import bs58 from "bs58";

export const Transaction = () => {
    const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
    
    const keyData = JSON.parse(fs.readFileSync("./turbin3.json", "utf8"));
    const secretKeyBytes = bs58.decode(keyData.secret_key);
    const keypair = Keypair.fromSecretKey(secretKeyBytes);
    
    console.log("Keypair public key:", keypair.publicKey.toBase58());
    console.log("Key data:", keyData);
    
    const connection = new Connection("https://api.devnet.solana.com");
    const provider = new AnchorProvider(connection, new Wallet(keypair), {
        commitment: "confirmed"
    });
    
    const program: Program<Turbin3Prereq> = new Program(IDL, provider);

    const account_seeds = [
        Buffer.from("prereqs"),
        keypair.publicKey.toBuffer(),
    ];
    
    const [account_key, _account_bump] = PublicKey.findProgramAddressSync(account_seeds, program.programId);
    
    const mintCollection = new PublicKey("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");
    const mintTs = Keypair.generate();

    const authority_seeds = [
        Buffer.from("collection"),
        mintCollection.toBuffer(),
    ];
    
    const [authority_key, _authority_bump] = PublicKey.findProgramAddressSync(authority_seeds, program.programId);
    
    console.log("Account PDA:", account_key.toBase58());
    console.log("Authority PDA:", authority_key.toBase58());
    
    console.log("Available methods:", Object.keys(program.methods));
    
//     (async () => {
//         try {
//             const txhash = await program.methods
//                 .initialize("ross2121")
//                 .accountsPartial({
//                     user: keypair.publicKey,
//                     account: account_key,
//                     system_program: SYSTEM_PROGRAM_ID,
//                 })
//                 .signers([keypair])
//                 .rpc();
//             console.log(`Initialize Success! Check out your TX here:
// https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
//         } catch (e) {
//             console.error(`Initialize failed: ${e}`);
//         }
//     })();
    
    (async () => {
        try {
            const txhash = await program.methods
                .submitTs()
                .accountsPartial({
                    user: keypair.publicKey,
                    account: account_key,
                    mint: mintTs.publicKey,
                    collection: mintCollection,
                    authority: authority_key,
                    mplCoreProgram: MPL_CORE_PROGRAM_ID,
                    system_program: SYSTEM_PROGRAM_ID,
                })
                .signers([keypair, mintTs])
                .rpc();
            console.log(`Submit TS Success! Check out your TX here:
https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
        } catch (e) {
            console.error(`Submit TS failed: ${e}`);
        }
    })();
}

Transaction();