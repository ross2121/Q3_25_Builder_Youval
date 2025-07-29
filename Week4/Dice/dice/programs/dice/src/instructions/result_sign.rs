use anchor_lang::{accounts::account, prelude::*, solana_program::{blake3::hash, ed25519_program, loader_instruction, sysvar::instructions::load_instruction_at_checked}, system_program::{transfer, Transfer}};
use switchboard_on_demand::RandomnessAccountData;
use anchor_instruction_sysvar::Ed25519InstructionSignatures;
use crate::{Dice, DiceError};
pub const HOUSE_EDGE: u16 = 150;
#[derive(Accounts)]
pub struct MakeBetSign<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub  home:SystemAccount<'info>,
    #[account(seeds=[b"bet",bet.seed.to_le_bytes().as_ref()],bump=bet.bump)]
    pub  bet:Account<'info,Dice>,
    #[account(mut,seeds=[b"vault",home.key().as_ref()],bump)]
    pub vault:SystemAccount<'info>,
   /// CHECK: This is safe
   pub instruction_sysvar: AccountInfo<'info>,
    pub system_program:Program<'info,System>
}
impl <'info> MakeBetSign<'info>   {
     pub fn signature(&mut self,sig:&[u8])->Result<( )>{
              let ix=load_instruction_at_checked(0,&self.instruction_sysvar.to_account_info())?;
               require_keys_eq!(ix.program_id,ed25519_program::ID,DiceError::Ed25519Program);
             require_eq!(ix.accounts.len(),0,DiceError::Ed25519Accounts);
             let sign=Ed25519InstructionSignatures::unpack(&ix.data)?.0;
             require_eq!(sign.len(),1,DiceError::Ed25519DataLength);
             let signature=&sign[0];
            require!(signature.is_verifiable,DiceError::Ed25519Header);
            require_keys_eq!(signature.public_key.ok_or(DiceError::Ed25519Pubkey)?,
        self.home.key(),DiceError::Ed25519Pubkey);
        require!(&signature.signature.ok_or(DiceError::Ed25519Signature)?.eq(sig),DiceError::Ed25519Signature);
        require!(&signature.message.as_ref().ok_or(DiceError::Ed25519Signature)?.eq(&self.bet.to_slice()),DiceError::Ed25519Signature);
            Ok(())
     }
     pub fn  resolve(&mut self,bump:&MakeBetSignBumps,sig:&[u8])->Result<()>{
        let hash=hash(sig).to_bytes();
        let mut hash_16=[0;16];
        hash_16.copy_from_slice(&hash[0..16]);
        let lower=u128::from_le_bytes(hash_16);
        hash_16.copy_from_slice(&hash[16..32]);
        let upper=u128::from_le_bytes(hash_16);
        let roll=(lower.wrapping_add(upper).wrapping_rem(100) as u8) +1;    
        if self.bet.roll > roll {
            let payout = (self.bet.amount as u128)
                .checked_mul(10000 - (HOUSE_EDGE as u128))
                .ok_or(DiceError::Overflow)?
                .checked_div((self.bet.roll as u128) - 1)
                .ok_or(DiceError::Overflow)?
                .checked_div(100)
                .ok_or(DiceError::Overflow)? as u64;

            let accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.maker.to_account_info(),
            };

            let seeds = [b"vault", &self.home.key().to_bytes()[..], &[bump.vault]];
            let signer_seeds = &[&seeds[..]][..];

            let ctx = CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                accounts,
                signer_seeds
            );
            transfer(ctx, payout)?;
        }
        Ok(())   
     }
}