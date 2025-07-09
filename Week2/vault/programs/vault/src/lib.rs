use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer,transfer};

declare_id!("A5sBbA3xEphjj1WH5FhcBTy4aN516bRQiyGPwvCQzCjZ");

#[program]
pub mod vault {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
      ctx.accounts.vault_system.account_bump=ctx.bumps.vault_system;
      ctx.accounts.vault_system.vault_bump=ctx.bumps.vault;
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
    pub fn transfers(ctx: Context<Transfers>,amount:u64)->Result<()>{
      let cpi_program_id=ctx.accounts.system_program.to_account_info();
      let accounts=Transfer{
        from:ctx.accounts.signer.to_account_info(),
        to:ctx.accounts.vault.to_account_info()
      };
      let ctxs=CpiContext::new(cpi_program_id,accounts);
       transfer(ctxs,amount)?;
       Ok(())
    }
    pub fn withdraw(ctx: Context<withdraw>,amount:u64)->Result<()>{
        require!(ctx.accounts.vault.lamports() > amount,ErrorCode::WithdrawError);
        
        let cpi_program_id=ctx.accounts.system_program.to_account_info();
        let accounts=Transfer{
          from:ctx.accounts.vault.to_account_info(),
          to:ctx.accounts.signer.to_account_info()
        };
        let key=ctx.accounts.vault_system.key();
        let signer_seeds:&[&[&[u8]]]=&[&[b"vault",key.as_ref(),&[ctx.accounts.vault_system.vault_bump]]];
        
       let ctxs=CpiContext::new_with_signer(cpi_program_id, accounts,signer_seeds);
       transfer(ctxs,amount)?;
      Ok(())
    }
    

}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(mut)]
  pub signer:Signer<'info>,
  #[account(mut,seeds=[b"vault",vault_system.key().as_ref()],bump)]
  pub vault:SystemAccount<'info>,
  #[account(init,seeds=[b"signer",signer.key().as_ref()],bump,payer=signer,space=8+Vault::INIT_SPACE)]
  pub vault_system:Account<'info,Vault>,
  pub system_program:Program<'info,System>
}
#[derive(Accounts)]
pub struct Transfers<'info>{
  #[account(mut)]
  pub signer:Signer<'info>,
  #[account(mut,seeds=[b"vault",vault_system.key().as_ref()],bump)]
  pub vault:SystemAccount<'info>,
  #[account(mut,seeds=[b"signer",signer.key().as_ref()],bump)]
  pub vault_system:Account<'info,Vault>,
  pub system_program:Program<'info,System>
}
#[derive(Accounts)]
pub struct  withdraw<'info>{
   #[account(mut)]
  pub signer:Signer<'info>,
  #[account(mut,seeds=[b"vault",vault_system.key().as_ref()],bump)]
  pub vault:SystemAccount<'info>,
  #[account(mut,seeds=[b"signer",signer.key().as_ref()],bump,close=signer)]
  pub vault_system:Account<'info,Vault>,
  pub system_program:Program<'info,System>
}
#[account]
#[derive(InitSpace)]
pub struct Vault{
  pub vault_bump:u8,
  pub account_bump:u8
}
#[error_code]
pub enum  ErrorCode {
      #[msg("Withdraw amount is greater then deposit")]
      WithdrawError
}


