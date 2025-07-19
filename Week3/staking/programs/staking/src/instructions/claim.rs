use anchor_lang::{prelude::*};
use anchor_spl::{associated_token::AssociatedToken, metadata::{mpl_token_metadata::instructions::{FreezeDelegatedAccountCpi, FreezeDelegatedAccountCpiAccounts}, FreezeDelegatedAccount, MasterEditionAccount, Metadata, MetadataAccount}, token::{approve, mint_to, Approve, Mint, MintTo, Token, TokenAccount}};

use crate::{ user, Config, Stakeaccount, User};
#[derive(Accounts)]
pub struct Claim<'info>{
    #[account(mut)]
pub user:Signer<'info>,
pub owner:SystemAccount<'info>, 
#[account(mut, seeds = [b"rewards".as_ref(), config.key().as_ref()],
bump = config.rewardbump,)]
pub mint:Account<'info,Mint>,
pub reward_mint:Account<'info,Mint>,
#[account(init_if_needed,associated_token::mint=reward_mint,associated_token::authority=user,payer=user)]
pub user_reward_ata:Account<'info,TokenAccount>,
#[account(mut,seeds=[b"config",owner.key().as_ref()],bump=config.bump)]
pub config:Account<'info,Config>,
#[account(mut,seeds=[b"user",user.key().as_ref()],bump=user_account.bump)]
pub user_account:Account<'info,User>,
#[account(mut,seeds=[b"stake",mint.key().as_ref(),config.key().as_ref()],bump=stake_account.bump)]
pub stake_account:Account<'info,Stakeaccount>,
pub metadata_program:Program<'info,Metadata>,
pub token_program:Program<'info,Token>,
pub system_program:Program<'info,System>,
pub associated_token_program:Program<'info,AssociatedToken>
}
impl<'info> Claim<'info> {
    pub fn claim(&mut self)->Result<()>{
       let clock = Clock::get()?;
       let current_time = clock.unix_timestamp;
       let time_staked = current_time - self.stake_account.stake_at;
       let points_earned = time_staked as u32; 
       let point=self.config.point_per_stake * points_earned as u8;
       let amount = point as u64; 
        let account=MintTo{
            mint:self.reward_mint.to_account_info(),
            authority:self.user.to_account_info(),
            to:self.user_reward_ata.to_account_info()
        };
        let  cpi_ctx=CpiContext::new(self.token_program.to_account_info(), account);
        mint_to(cpi_ctx, amount)?;
         Ok(())
    }
}