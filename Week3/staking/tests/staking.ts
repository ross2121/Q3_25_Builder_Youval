import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Staking } from "../target/types/staking";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import { generateSigner, keypairPayer, percentAmount, some, publicKey, signerIdentity, sol, createSignerFromKeypair } from "@metaplex-foundation/umi";
import { createNft, printSupply, mplTokenMetadata, verifyCollectionV1, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

describe("staking", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let provider=anchor.getProvider();
  const wallet=provider.wallet;
  const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());
  const userpublic = Keypair.generate();
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(userpublic.secretKey);
  const umiSigner = createSignerFromKeypair(umi, umiKeypair);
  umi.use(signerIdentity(umiSigner));

  const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  console.log(wallet.payer.publicKey.toBase58());
  const program = anchor.workspace.staking as Program<Staking>;
  let [config]= PublicKey.findProgramAddressSync([Buffer.from("config"),wallet.payer.publicKey.toBuffer()],program.programId);
  const [user]=PublicKey.findProgramAddressSync([Buffer.from("user"),userpublic.publicKey.toBuffer()],program.programId);
  const mint=new PublicKey("BNfMRcS4NqLHkbBmpA4nVUmpos8KsD5X79jvHrSkyJJf")
  const collection=new PublicKey("Aoi4zrf9sWsgTRV7CdENPwcCohkUkKLCg3wmuyg7Cu14");
  const user_ata=getAssociatedTokenAddressSync(mint,userpublic.publicKey);
  const [metadata]=PublicKey.findProgramAddressSync([Buffer.from("metadata"),METADATA_PROGRAM_ID.toBuffer(),mint.toBuffer()],METADATA_PROGRAM_ID);
  const [edititon]=PublicKey.findProgramAddressSync([Buffer.from("metadata"),METADATA_PROGRAM_ID.toBuffer(),mint.toBuffer(),Buffer.from("edition")],METADATA_PROGRAM_ID);
  const [stake]=PublicKey.findProgramAddressSync([Buffer.from("stake"),mint.toBuffer(),config.toBuffer()],program.programId);
  const [rewardmint]=PublicKey.findProgramAddressSync([Buffer.from("reward"),config.toBuffer()],program.programId);
  const userata=getAssociatedTokenAddressSync(rewardmint,userpublic.publicKey);  
  it("Is initialized!", async () => {

     const tx = program.methods.initialize(12,10,12).accountsStrict({
       owner:wallet.payer.publicKey,
    config:config,
    rewardMint:rewardmint,
    tokenProgram:TOKEN_PROGRAM_ID,
    systemProgram:SYSTEM_PROGRAM_ID
     })
     console.log("Your transaction signature", tx);
   });
   it("USer initializxe", async () => {

     const tx = program.methods.initializeuser().accountsStrict({
       user:userpublic.publicKey,
        userAccount:user,
    systemProgram:SYSTEM_PROGRAM_ID
     })
     console.log("Your transaction signature", tx);
   });
  it("create collection and mint nft", async () => {
   
    
  
    
   
    const collectionMint = generateSigner(umi);
    const nftMint = generateSigner(umi);
    
   
    await createNft(umi, {
      mint: collectionMint,
      name: 'My Collection',
      uri: 'https://example.com/collection.json',
      sellerFeeBasisPoints: percentAmount(5.5),
      isCollection: true, 
    }).sendAndConfirm(umi);
    
    console.log("Collection created:", collectionMint.publicKey);
    
   
  
    await createNft(umi, {
      mint: nftMint,
      name: 'My NFT',
      uri: 'https://example.com/my-nft.json',
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: some({ 
        key: collectionMint.publicKey, 
        verified: false 
      }),
      printSupply: printSupply('Limited', [1]), 
    }).sendAndConfirm(umi);
    
  
   
    const nftMetadata = findMetadataPda(umi, { 
      mint: nftMint.publicKey
    });
    await verifyCollectionV1(umi, {
      metadata: nftMetadata,
      collectionMint: collectionMint.publicKey,
      authority: umi.identity,
    }).sendAndConfirm(umi);
    
    console.log("NFT created:", nftMint.publicKey);
    console.log("Collection:", collectionMint.publicKey);
  });

  it("Stake ", async () => {
    const tx = await program.methods.stake().accountsStrict({
      user:userpublic.publicKey,
   userAccount:user,
   systemProgram:SYSTEM_PROGRAM_ID,
   config:config,
   metadata:metadata,
     editionAccount:edititon,
     userAta:user_ata,
     stakeAccount:stake,
     collection:collection,
     metadataProgram:METADATA_PROGRAM_ID,
     tokenProgram:TOKEN_PROGRAM_ID,
    owner:wallet.payer.publicKey,
    mint:mint
    }).signers([userpublic]).rpc()
    console.log("Your transaction signature", tx);
  });
  it("Claim!", async () => {
    const tx = program.methods.claim().accountsStrict({
      user:userpublic.publicKey,
   userAccount:user,
   systemProgram:SYSTEM_PROGRAM_ID,
   config:config,
     stakeAccount:stake,
    rewardMint:rewardmint,
    userRewardAta:user_ata,
    associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
     metadataProgram:METADATA_PROGRAM_ID,
     tokenProgram:TOKEN_PROGRAM_ID,
    owner:wallet.payer.publicKey,
    mint:mint
    })
    console.log("Your transaction signature", tx);
  });
  it("UnStake ", async () => {
    const tx = await program.methods.unstake().accountsStrict({
      user:userpublic.publicKey,
   userAccount:user,
   systemProgram:SYSTEM_PROGRAM_ID,
   config:config,
   metadata:metadata,
     editionAccount:edititon,
     userAta:user_ata,
     stakeAccount:stake,
     collection:collection,
     metadataProgram:METADATA_PROGRAM_ID,
     tokenProgram:TOKEN_PROGRAM_ID,
    owner:wallet.payer.publicKey,
    mint:mint
    }).signers([userpublic]).rpc()
    console.log("Your transaction signature", tx);
  });
});
  