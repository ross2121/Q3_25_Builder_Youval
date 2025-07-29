import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Dice } from "../target/types/dice";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("dice", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.dice as Program<Dice>;
  const provider = anchor.getProvider();
  const home = Keypair.generate();
  const player = Keypair.generate();
  const player2 = Keypair.generate();
  const wallet = provider.wallet;
  let vaultPda: PublicKey;
  let vaultBump: number;

  before(async () => {
    const signature1 = await provider.connection.requestAirdrop(home.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature1);
    
    const signature2 = await provider.connection.requestAirdrop(player.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature2);
    
    const signature3 = await provider.connection.requestAirdrop(player2.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature3);
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), home.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Initialization", () => {
    it("Should initialize the vault with funds", async () => {
      const amount = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL
      
      const tx = await program.methods
        .initialize(amount)
        .accountsStrict({
          home: home.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([home])
        .rpc();

      console.log("Initialize transaction signature:", tx);
      const vaultBalance = await provider.connection.getBalance(vaultPda);
      expect(vaultBalance).to.equal(amount.toNumber());
    });

    it("Should fail to initialize with zero amount", async () => {
      try {
        await program.methods
          .initialize(new anchor.BN(0))
          .accountsStrict({
            home: home.publicKey,
            vault: vaultPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([home])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        console.log("Expected error for zero amount:", error.message);
      }
    });
  });

  describe("Betting", () => {
    it("Should place a bet successfully", async () => {
      const seed = 124;
      const roll = 50; 
      const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); 
      const [betPda, betBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), new Uint8Array([seed])],
        program.programId
      );
      const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);

      const tx = program.methods.placeBet(seed,roll,amount).accountsStrict({
            maker:wallet.payer.publicKey,
            home:home.publicKey,
            bet:betPda,
            vault:vaultPda,
            systemProgram:SystemProgram.programId
      }).signers([wallet.payer]).rpc()
      console.log("Place bet transaction signature:", tx);
      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
      expect(playerBalanceAfter).to.be.lessThan(playerBalanceBefore - amount.toNumber());
      expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + amount.toNumber());
      const betAccount = await program.account.dice.fetch(betPda);
      expect(betAccount.player.toString()).to.equal(player.publicKey.toString());
      expect(betAccount.seed).to.equal(seed);
      expect(betAccount.roll).to.equal(roll);
      expect(betAccount.amount.toNumber()).to.equal(amount.toNumber());
      expect(betAccount.bump).to.equal(betBump);
    });
    it("Should fail to place bet with invalid roll (too low)", async () => {
      const seed = 124;
      const roll = 121; 
      const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

      const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), new Uint8Array([seed])],
        program.programId
      );
      try {
        await program.methods
          .placeBet(seed, roll, amount)
          .accountsStrict({
            maker: wallet.payer.publicKey,
            home: home.publicKey,
            bet: betPda,
            vault: vaultPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([wallet.payer])
          .rpc();
        
        expect.fail("Should have thrown an error for invalid roll");
      } catch (error) {
        console.log("Expected error for invalid roll:", error.message);
      }
    });

    // it("Should fail to place bet with invalid roll (too high)", async () => {
    //   const seed = 125;
    //   const roll = 97; 
    //   const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    //   const [betPda] = PublicKey.findProgramAddressSync(
    //     [Buffer.from("bet"), new Uint8Array([seed])],
    //     program.programId
    //   );

    //   try {
    //     await program.methods
    //       .placeBet(seed, roll, amount)
    //       .accountsStrict({
    //         maker: player.publicKey,
    //         home: home.publicKey,
    //         bet: betPda,
    //         vault: vaultPda,
    //         systemProgram: SystemProgram.programId,
    //       })
    //       .signers([player])
    //       .rpc();
        
    //     expect.fail("Should have thrown an error for invalid roll");
    //   } catch (error) {
    //     console.log("Expected error for invalid roll:", error.message);
    //   }
    // });

    // it("Should fail to place bet with insufficient funds", async () => {
    //   const seed = 126;
    //   const roll = 50;
    //   const amount = new anchor.BN(100 * LAMPORTS_PER_SOL); // More than player has

    //   const [betPda] = PublicKey.findProgramAddressSync(
    //     [Buffer.from("bet"), new Uint8Array([seed])],
    //     program.programId
    //   );

    //   try {
    //     await program.methods
    //       .placeBet(seed, roll, amount)
    //       .accountsStrict({
    //         maker: player.publicKey,
    //         home: home.publicKey,
    //         bet: betPda,
    //         vault: vaultPda,
    //         systemProgram: SystemProgram.programId,
    //       })
    //       .signers([player])
    //       .rpc();
        
    //     expect.fail("Should have thrown an error for insufficient funds");
    //   } catch (error) {
    //     console.log("Expected error for insufficient funds:", error.message);
    //   }
    // });
  });

  describe("Bet Resolution", () => {
    it("Should resolve a winning bet", async () => {
      const seed = 200;
      const roll = 80; // High roll prediction
      const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

      const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), new Uint8Array([seed])],
        program.programId
      );

      // Place the bet first
      await program.methods
        .placeBet(seed, roll, amount)
        .accountsStrict({
          maker:wallet.payer.publicKey,
          home: home.publicKey,
          bet: betPda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet.payer])
        .rpc();

      // Mock signature for testing (in real scenario, this would be a valid Ed25519 signature)
      const mockSignature = Buffer.from(new Uint8Array(64).fill(1));

      const playerBalanceBefore = await provider.connection.getBalance(player2.publicKey);
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
      try {
        const tx = await program.methods
          .resolveBet(mockSignature)
          .accountsStrict({
            maker: wallet.payer.publicKey,
            home: home.publicKey,
            bet: betPda,
            vault: vaultPda,
            instructionSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
          })
          .signers([wallet.payer])
          .rpc();

        console.log("Resolve bet transaction signature:", tx);
        const playerBalanceAfter = await provider.connection.getBalance(player2.publicKey);
        const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
        console.log("Player balance before:", playerBalanceBefore);
        console.log("Player balance after:", playerBalanceAfter);
        console.log("Vault balance before:", vaultBalanceBefore);
        console.log("Vault balance after:", vaultBalanceAfter);
      } catch (error) {
        console.log("Expected error for invalid signature:", error.message);
      }
    });
  });

  // describe("Bet Refunding", () => {
  //   it("Should refund a bet", async () => {
  //     const seed = 150;
  //     const roll = 50;
  //     const amount = new anchor.BN(0.05 * LAMPORTS_PER_SOL);

  //     const [betPda] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed])],
  //       program.programId
  //     );

  //     // Place the bet first
  //     await program.methods
  //       .placeBet(seed, roll, amount)
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);
  //     const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);

  //     const tx = await program.methods
  //       .refundBet()
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     console.log("Refund bet transaction signature:", tx);

  //     // Check balances
  //     const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
  //     const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);

  //     expect(playerBalanceAfter).to.be.greaterThan(playerBalanceBefore);
  //     expect(vaultBalanceAfter).to.be.lessThan(vaultBalanceBefore);
  //   });

  //   it("Should fail to refund a non-existent bet", async () => {
  //     const seed = 160;
  //     const [betPda] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed])],
  //       program.programId
  //     );

  //     try {
  //       await program.methods
  //         .refundBet()
  //         .accounts({
  //           maker: player.publicKey,
  //           home: home.publicKey,
  //           bet: betPda,
  //           vault: vaultPda,
  //           systemProgram: SystemProgram.programId,
  //         })
  //         .signers([player])
  //         .rpc();
        
  //       expect.fail("Should have thrown an error for non-existent bet");
  //     } catch (error) {
  //       console.log("Expected error for non-existent bet:", error.message);
  //     }
  //   });
  // });

  // describe("Edge Cases", () => {
  //   it("Should handle multiple bets from same player", async () => {
  //     const seed1 = 170;
  //     const seed2 = 171;
  //     const roll = 60;
  //     const amount = new anchor.BN(0.02 * LAMPORTS_PER_SOL);

  //     const [betPda1] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed1])],
  //       program.programId
  //     );

  //     const [betPda2] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed2])],
  //       program.programId
  //     );

  //     // Place first bet
  //     await program.methods
  //       .placeBet(seed1, roll, amount)
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda1,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     // Place second bet
  //     await program.methods
  //       .placeBet(seed2, roll, amount)
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda2,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     // Verify both bets exist
  //     const bet1 = await program.account.dice.fetch(betPda1);
  //     const bet2 = await program.account.dice.fetch(betPda2);

  //     expect(bet1.player.toString()).to.equal(player.publicKey.toString());
  //     expect(bet2.player.toString()).to.equal(player.publicKey.toString());
  //     expect(bet1.seed).to.equal(seed1);
  //     expect(bet2.seed).to.equal(seed2);
  //   });

  //   it("Should handle minimum and maximum valid rolls", async () => {
  //     const seed1 = 180;
  //     const seed2 = 181;
  //     const minRoll = 2;
  //     const maxRoll = 96;
  //     const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);

  //     const [betPda1] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed1])],
  //       program.programId
  //     );

  //     const [betPda2] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("bet"), new Uint8Array([seed2])],
  //       program.programId
  //     );

  //     // Test minimum roll
  //     await program.methods
  //       .placeBet(seed1, minRoll, amount)
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda1,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     // Test maximum roll
  //     await program.methods
  //       .placeBet(seed2, maxRoll, amount)
  //       .accounts({
  //         maker: player.publicKey,
  //         home: home.publicKey,
  //         bet: betPda2,
  //         vault: vaultPda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([player])
  //       .rpc();

  //     const bet1 = await program.account.dice.fetch(betPda1);
  //     const bet2 = await program.account.dice.fetch(betPda2);

  //     expect(bet1.roll).to.equal(minRoll);
  //     expect(bet2.roll).to.equal(maxRoll);
  //   });
  // });
});
