import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { generateSigner, keypairPayer, percentAmount, some, publicKey, signerIdentity, sol, createSignerFromKeypair } from "@metaplex-foundation/umi";
import { createNft, printSupply, mplTokenMetadata, verifyCollectionV1, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

describe("marketplace", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.marketplace as Program<Marketplace>;
  const provider = anchor.AnchorProvider.env();
  console.log(provider);
  
  
  const umi = createUmi(provider.connection.rpcEndpoint).use(mplTokenMetadata());
  let admin: Keypair;
  let buyer: Keypair;
  let seller: Keypair;
  let collectionMint: any;
  let nftMint: any;
  let marketplaceName: string;
  let marketplacePda: PublicKey;
  let treasuryPda: PublicKey;
  let rewardMintPda: PublicKey;
  let listPda: PublicKey;
  let vaultPda: PublicKey;

  before(async () => {
   
    admin = provider.wallet as any;
   

seller = Keypair.generate();
    marketplaceName = "Test";
    console.log("Public key:", buyer.secretKey.toString());
    console.log(buyer.publicKey.toString());
    // await provider.connection.requestAirdrop(buyer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    // await provider.connection.requestAirdrop(seller.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(seller.secretKey);
    const umiSigner = createSignerFromKeypair(umi, umiKeypair);
    umi.use(signerIdentity(umiSigner));

    await new Promise(resolve => setTimeout(resolve, 2000));

  
    [marketplacePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId
    );

    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), admin.publicKey.toBuffer()],
      program.programId
    );

    [rewardMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reward"), marketplacePda.toBuffer()],
      program.programId
    );

  });

  it("Initialize marketplace", async () => {
    const tx = await program.methods
      .initializeMarket(marketplaceName, 250)
      .accountsStrict({
        owner: admin.publicKey,
        marketplace: marketplacePda,
        treasury: treasuryPda,
        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Marketplace initialized:", tx);
    const marketplaceAccount = await program.account.marketplace.fetch(marketplacePda);
    console.log("Marketplace fee:", marketplaceAccount.fee);
    console.log("Marketplace name:", marketplaceAccount.name);
  });

  it("Create collection and NFT", async () => {
    collectionMint = generateSigner(umi);
    nftMint = generateSigner(umi);
  
    await createNft(umi, {
      mint: collectionMint,
      name: 'Test Collection',
      uri: 'https://example.com/collection.json',
      sellerFeeBasisPoints: percentAmount(5.5),
      isCollection: true,
    }).sendAndConfirm(umi);
    
    console.log("Collection created:", collectionMint.publicKey);

    await createNft(umi, {
      mint: nftMint,
      name: 'Test NFT',
      uri: 'https://example.com/my-nft.json',
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: some({ 
        key: collectionMint.publicKey, 
        verified: false 
      }),
      printSupply: printSupply('Zero'),
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
    console.log("Collection verified");

   
  });

  it("Create listing", async () => {
    console.log("csdas");
    [listPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("list"), seller.publicKey.toBuffer()],
      program.programId
    );
    const nftMintPubkey =new PublicKey("BNfMRcS4NqLHkbBmpA4nVUmpos8KsD5X79jvHrSkyJJf")
    const collectionMintPubkey =new PublicKey("Aoi4zrf9sWsgTRV7CdENPwcCohkUkKLCg3wmuyg7Cu14");
    console.log("csdas");
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("list"),seller.publicKey.toBuffer()], 
      TOKEN_PROGRAM_ID
    );
   console.log("csdas");
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(), 
        nftMintPubkey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
    console.log("csdaasdasds");
    const [editionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        nftMintPubkey.toBuffer(),
        Buffer.from("edition"),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
    const maketata=getAssociatedTokenAddressSync(rewardMintPda,seller.publicKey);
 
    const sellerAta = getAssociatedTokenAddressSync(nftMintPubkey, seller.publicKey);
    const vaultAta = getAssociatedTokenAddressSync(nftMintPubkey, listPda, true);

    const price = 1_000_000_000; 

    const tx = await program.methods
      .createList(price)
      .accountsStrict({
        maker: seller.publicKey,
        mint: nftMintPubkey,
        collection: collectionMintPubkey,
        list: listPda,
        metadata: metadataPda,
        edition: editionPda,
        makerata:maketata,
        userata: sellerAta,
        vault: vaultAta,
        marketplace: marketplacePda,
        treasury: treasuryPda,
        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([seller])
      .rpc();

    console.log("NFT listed for sale:", tx);

  
    const listAccount = await program.account.lists.fetch(listPda);
    console.log("List price:", listAccount.price);
    console.log("List maker:", listAccount.maker.toString());
  });

  it("Purchase NFT", async () => {
    const nftMintPubkey =new PublicKey("BNfMRcS4NqLHkbBmpA4nVUmpos8KsD5X79jvHrSkyJJf");
    [listPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("list"), seller.publicKey.toBuffer()],
          program.programId
        );
    const buyerAta = getAssociatedTokenAddressSync(nftMintPubkey, buyer.publicKey);
    
    const vaultAta = getAssociatedTokenAddressSync(nftMintPubkey, listPda, true);
    const maketata=getAssociatedTokenAddressSync(rewardMintPda,seller.publicKey);
    const rewardbuyer=getAssociatedTokenAddressSync(rewardMintPda,buyer.publicKey)
    const tx = await program.methods
      .purchase() 
      .accountsStrict({
        taker: buyer.publicKey,
        maker: seller.publicKey,
        mint: nftMintPubkey,
        list: listPda,
        takerata: buyerAta,
        vault: vaultAta,
        makerata:maketata,
        takerrewardata:rewardbuyer,
        marketplace: marketplacePda,
        treasury: treasuryPda,
        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([buyer])
      .rpc();

    console.log("NFT purchased:", tx);

    const buyerTokenAccount = await provider.connection.getTokenAccountBalance(buyerAta);
    console.log("Buyer NFT balance:", buyerTokenAccount.value.amount);
  });

  it("Delist NFT (seller cancels listing)", async () => {
    console.log("csdas");
    [listPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("list"), seller.publicKey.toBuffer()],
      program.programId
    );
    const nftMintPubkey =new PublicKey("BNfMRcS4NqLHkbBmpA4nVUmpos8KsD5X79jvHrSkyJJf")
    const collectionMintPubkey =new PublicKey("Aoi4zrf9sWsgTRV7CdENPwcCohkUkKLCg3wmuyg7Cu14");
    console.log("csdas");
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("list"),seller.publicKey.toBuffer()], 
      TOKEN_PROGRAM_ID
    );
   console.log("csdas");
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(), 
        nftMintPubkey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
    console.log("csdaasdasds");
    const [editionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        nftMintPubkey.toBuffer(),
        Buffer.from("edition"),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
    const maketata=getAssociatedTokenAddressSync(rewardMintPda,seller.publicKey);
 
    const sellerAta = getAssociatedTokenAddressSync(nftMintPubkey, seller.publicKey);
    const vaultAta = getAssociatedTokenAddressSync(nftMintPubkey, listPda, true);

    const price = 1_000_000_000; 

    const tx = await program.methods
      .delist()
      .accountsStrict({
        maker: seller.publicKey,
        mint: nftMintPubkey,

        list: listPda,
      
      
        userata: sellerAta,
        vault: vaultAta,
        marketplace: marketplacePda,

        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([seller])
      .rpc();

    console.log("NFT listed for sale:", tx);

  
    const listAccount = await program.account.lists.fetch(listPda);
    console.log("List price:", listAccount.price);
    console.log("List maker:", listAccount.maker.toString());
  });

  it("Purchase NFT", async () => {
    const nftMintPubkey =new PublicKey("BNfMRcS4NqLHkbBmpA4nVUmpos8KsD5X79jvHrSkyJJf");
    [listPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("list"), seller.publicKey.toBuffer()],
          program.programId
        );
    const buyerAta = getAssociatedTokenAddressSync(nftMintPubkey, buyer.publicKey);
    
    const vaultAta = getAssociatedTokenAddressSync(nftMintPubkey, listPda, true);
    const maketata=getAssociatedTokenAddressSync(rewardMintPda,seller.publicKey);
    const rewardbuyer=getAssociatedTokenAddressSync(rewardMintPda,buyer.publicKey)
    const tx = await program.methods
      .purchase() 
      .accountsStrict({
        taker: buyer.publicKey,
        maker: seller.publicKey,
        mint: nftMintPubkey,
        list: listPda,
        takerata: buyerAta,
        vault: vaultAta,
        makerata:maketata,
        takerrewardata:rewardbuyer,
        marketplace: marketplacePda,
        treasury: treasuryPda,
        rewardMint: rewardMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([buyer])
      .rpc();

    console.log("NFT purchased:", tx);

    const buyerTokenAccount = await provider.connection.getTokenAccountBalance(buyerAta);
    console.log("Buyer NFT balance:", buyerTokenAccount.value.amount);
  });
});
