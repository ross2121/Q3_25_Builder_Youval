import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import * as fs from 'fs';

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  // Use local validator instead of devnet
  const connection = new Connection("http://127.0.0.1:8899");

  const program = anchor.workspace.vault as Program<Vault>;

  it("Is initialized!", async () => {
    const provider = anchor.getProvider();
    const wallet = provider.wallet;
    console.log(wallet.payer.publicKey.toString());
    const tx3 = await connection.requestAirdrop(wallet.payer.publicKey, 2 * LAMPORTS_PER_SOL);
    console.log("Airdrop tx:", tx3);
    await connection.confirmTransaction(tx3);
   let vault=Keypair.generate();
    console.log("Wallet public key:", wallet.publicKey.toString());
    await connection.requestAirdrop(vault.publicKey,3);
  
    // const tx = await program.methods.initialize().accounts({signer:wallet.payer.publicKey}).signers([wallet.payer]).rpc();
    // console.log("Your transaction signature", tx);
    
    const amount = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const tx2 = await program.methods.transfers(amount)
      .accounts({
        signer: wallet.payer.publicKey,
        // vault:vault.publicKey
      })
      .signers([wallet.payer]) 
      .rpc();
    console.log(tx2);
    const withdraw=await program.methods.withdraw(amount).rpc();
    console.log("tx3",withdraw);
    
  });
});
