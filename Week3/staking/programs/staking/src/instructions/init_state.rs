use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::Config;
#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(mut)]
pub owner:Signer<'info>,
#[account(init,seeds=[b"config",owner.key().as_ref()],bump,payer=owner,space=8+Config::INIT_SPACE)]
pub config:Account<'info,Config>,
#[account(
    init_if_needed,
    payer = owner,
    seeds = [b"reward".as_ref(), config.key().as_ref()],
    bump,
    mint::decimals = 6,
    mint::authority = config
)]
pub reward_mint: Account<'info, Mint>,
pub system_program:Program<'info,System>,
pub token_program:Program<'info,Token>
}
impl<'info> Initialize<'info> {
    pub fn initialize(&mut self,max:u32,point:u8,freeze:u32,bump:&InitializeBumps)->Result<()>{
         self.config.bump=bump.config;
         self.config.freeze_at=freeze;
         self.config.max=max;
         self.config.rewardbump=bump.reward_mint;
         self.config.point_per_stake=point;
         Ok(())
    }
}