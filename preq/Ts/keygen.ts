import { Keypair } from "@solana/web3.js";
export const keypair=()=>{
    const keypair=Keypair.generate();
    console.log("public key",keypair.publicKey.toBase58());
    console.log("secret key",keypair.secretKey.toString());
}
keypair();