import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from "fs";

describe("escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.escrow as Program<Escrow>;

  it("Is initialized!", async () => {
    const provider = anchor.getProvider();
    const wallet = provider.wallet;
    console.log(wallet.payer.publicKey.toString());
    const walletData = readFileSync("walllet.json", "utf8").trim();
    const privateKeyString = walletData.replace(/"/g, "");
    const privateKeyBytes = anchor.utils.bytes.bs58.decode(privateKeyString);
    const takerKeypair = Keypair.fromSecretKey(privateKeyBytes);
    console.log("Taker public key:", takerKeypair.publicKey.toString());
    
    const minta = new PublicKey("735dt5HekUQQq3qi9NLttRegp6koRAA5nX6Uv3LHMXJS");
    const mintb = new PublicKey("AuzCK8jdZQ9Dvud9DnFbZ8KuUeuhqZJ2BDoAwzGEmEWd");
    const seeds = new anchor.BN(11);
    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        wallet.payer.publicKey.toBuffer(),
        seeds.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
  
    const makerMinta = getAssociatedTokenAddressSync(
      minta,
      wallet.payer.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    
    const vault = getAssociatedTokenAddressSync(
      minta,
      escrow,
      true,
      TOKEN_PROGRAM_ID
    );

    const tx = await program.methods
      .make(seeds, new anchor.BN(1*10^6), new anchor.BN(1*10^6))
      .accountsStrict({
        maker: wallet.payer.publicKey,
        minta: minta,
        mintb: mintb,
        makerMinta: makerMinta,
        escrow: escrow,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([wallet.payer])
      .rpc();
      console.log("Make transaction signature:", tx);
    const takerMintB = getAssociatedTokenAddressSync(
      mintb,
      takerKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const takerMintA = getAssociatedTokenAddressSync(
      minta,
      takerKeypair.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const makerMintb = getAssociatedTokenAddressSync(
      mintb,
      wallet.payer.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const tx2 = await program.methods
      .take()
      .accountsStrict({
        taker: takerKeypair.publicKey,
        maker: wallet.payer.publicKey,
        minta: minta,
        mintb: mintb,
        takerMintB: takerMintB,
        takerMintA: takerMintA,
        makerMintb: makerMintb,
        escrow: escrow,
        vault: vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([takerKeypair])
      .rpc();   
      console.log("Take transaction signature:", tx2); 
      const tx3= await program.methods
      .refund()
      .accountsStrict({
        maker: wallet.payer.publicKey,
        minta: minta,
        mintb: mintb,
        makerMinta: makerMinta,
        escrow: escrow,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([wallet.payer])
      .rpc();

    console.log("Take transaction signature:", tx3);
    // const refund=await program.methods.refund().accountsStrict({

    // })
  });
});
