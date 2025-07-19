use anchor_lang::{prelude::*};
use anchor_spl::{metadata::{mpl_token_metadata::instructions::{ ThawDelegatedAccountCpi, ThawDelegatedAccountCpiAccounts}, MasterEditionAccount, Metadata, MetadataAccount, ThawDelegatedAccount}, token::{approve, Approve, Mint, Revoke, Token, TokenAccount,revoke}};

use crate::{ user, Config, Stakeaccount, User};
#[derive(Accounts)]
pub struct UnStake<'info>{
    #[account(mut)]
pub user:Signer<'info>,
#[account(mut)]
pub owner:SystemAccount<'info>, 
pub mint:Account<'info,Mint>,
pub collection:Account<'info,Mint>,
#[account(mut,associated_token::mint=mint,associated_token::authority=user)]
pub user_ata:Account<'info,TokenAccount>,
#[account(mut,seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref()],bump,constraint=metadata.collection.as_ref().unwrap().key.as_ref()==collection.key().as_ref(),constraint=metadata.collection.as_ref().unwrap().verified==true,seeds::program=metadata_program.key())]
pub metadata:Account<'info,MetadataAccount>,
#[account(mut,seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref(),b"edition"],bump,seeds::program=metadata_program.key())]
pub edition_account:Account<'info,MasterEditionAccount>,
#[account(mut,seeds=[b"config",owner.key().as_ref()],bump=config.bump)]
pub config:Account<'info,Config>,
#[account(mut,seeds=[b"user",user.key().as_ref()],bump=user_account.bump)]
pub user_account:Account<'info,User>,
#[account(mut,seeds=[b"stake",mint.key().as_ref(),config.key().as_ref()],bump=stake_account.bump)]
pub stake_account:Account<'info,Stakeaccount>,
pub metadata_program:Program<'info,Metadata>,
pub token_program:Program<'info,Token>,
pub system_program:Program<'info,System>
}
impl<'info> UnStake<'info> {
    pub fn unstake(&mut self)->Result<()>{

      let seeds=&[b"stake",self.mint.to_account_info().key.as_ref(),self.config.to_account_info().key.as_ref(),&[self.stake_account.bump]];
      let signer_seeds=&[&seeds[..]];
      let account=ThawDelegatedAccountCpiAccounts{
        delegate:&self.stake_account.to_account_info(),
          token_account:&self.user_ata.to_account_info(),
          mint:&self.mint.to_account_info(),
          edition:&self.edition_account.to_account_info(),
          token_program:&self.token_program.to_account_info()
      };
      ThawDelegatedAccountCpi::new(&self.system_program.to_account_info(), account).invoke_signed(signer_seeds)?;

      let cpi_account=Revoke{
        source:self.user_ata.to_account_info(),
        authority:self.user.to_account_info()
      };
      let cpi_Ctx=CpiContext::new(self.token_program.to_account_info(), cpi_account);
      revoke(cpi_Ctx)?;
        
         Ok(())
    }
}