use anchor_lang::{prelude::*};
use anchor_spl::{metadata::{mpl_token_metadata::instructions::{FreezeDelegatedAccountCpi, FreezeDelegatedAccountCpiAccounts}, FreezeDelegatedAccount, MasterEditionAccount, Metadata, MetadataAccount}, token::{approve, Approve, Mint, Token, TokenAccount}};

use crate::{ user, Config, StakeError, Stakeaccount, User};
#[derive(Accounts)]
pub struct Stake<'info>{
    #[account(mut)]
pub user:Signer<'info>,
pub owner:SystemAccount<'info>, 
pub mint:Account<'info,Mint>,
pub collection:Account<'info,Mint>,
#[account(mut,associated_token::mint=mint,associated_token::authority=user)]
pub user_ata:Account<'info,TokenAccount>,
#[account(seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref()],bump,constraint=metadata.collection.as_ref().unwrap().key.as_ref()==collection.key().as_ref(),constraint=metadata.collection.as_ref().unwrap().verified==true,seeds::program=metadata_program.key())]
pub metadata:Account<'info,MetadataAccount>,
#[account(seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref(),b"edition"],bump,seeds::program=metadata_program.key())]
pub edition_account:Account<'info,MasterEditionAccount>,
#[account(seeds=[b"config",owner.key().as_ref()],bump=config.bump)]
pub config:Account<'info,Config>,
#[account(seeds=[b"user",user.key().as_ref()],bump=user_account.bump)]
pub user_account:Account<'info,User>,
#[account(init,space=8+Stakeaccount::INIT_SPACE,seeds=[b"stake",mint.key().as_ref(),config.key().as_ref()],bump,payer=user)]
pub stake_account:Account<'info,Stakeaccount>,
pub metadata_program:Program<'info,Metadata>,
pub token_program:Program<'info,Token>,
pub system_program:Program<'info,System>
}
impl<'info> Stake<'info> {
    pub fn Stake(&mut self,bump:&StakeBumps)->Result<()>{
        require!(self.config.max>=self.user_account.amount,   StakeError::MaxStakeReached);
        self.stake_account.set_inner(Stakeaccount{
            owner:self.user.key(),
            mint:self.mint.key(),
            bump:bump.stake_account,
            stake_at:Clock::get()?.unix_timestamp
        });
        let account=Approve{
            to:self.user_ata.to_account_info(),
            authority:self.user.to_account_info(),
            delegate:self.stake_account.to_account_info()
        };
        let cpi_ctx=CpiContext::new(self.token_program.to_account_info(), account);
        approve(cpi_ctx, 1)?;
       let seeds=&[b"stake",self.mint.to_account_info().key.as_ref(),self.config.to_account_info().key.as_ref(),&[bump.stake_account]];
       let signer_seed=&[&seeds[..]];
       let freezeaccount=FreezeDelegatedAccountCpiAccounts{
        edition:&self.edition_account.to_account_info(),
         delegate:&self.stake_account.to_account_info(),
         token_program:&self.token_program.to_account_info(),
         token_account:&self.user_ata.to_account_info(),
         mint:&self.mint.to_account_info()
       };
       FreezeDelegatedAccountCpi::new(&self.metadata_program.to_account_info(), freezeaccount).invoke_signed(signer_seed)?;
         self.user_account.amount+=1;
         Ok(())
    }
}