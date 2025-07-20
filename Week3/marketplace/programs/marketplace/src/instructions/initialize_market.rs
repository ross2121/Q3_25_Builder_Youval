use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::Struct::marketplace::marketplace;
#[derive(Accounts)]
#[instruction(name:String,fee:u16)]
pub struct  Init<'info>{
    #[account(mut)]
    pub owner:Signer<'info>,
    #[account(init,payer=owner,seeds=[b"marketplace",name.as_bytes()],bump,space=8+marketplace::INIT_SPACE)]
    pub marketplace:Account<'info,marketplace>,
    #[account(seeds=[b"vault",owner.key().as_ref()],bump)]
    pub treasury:SystemAccount<'info>,
    #[account(init,seeds=[b"reward",marketplace.key().as_ref()],payer=owner,bump,mint::authority=marketplace,mint::decimals=6)] 
    pub reward_mint:Account<'info,Mint>,
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>
}
impl <'info> Init<'info>{
  pub fn initialize(&mut self,name:String,fee:u16,bump:&InitBumps){
    self.marketplace.admin=self.owner.to_account_info().key();
    self.marketplace.bump=bump.marketplace;
    self.marketplace.fee=fee;
    self.marketplace.name=name;
     self.marketplace.treasury_bump=bump.treasury;
     self.marketplace.reward_bump=bump.reward_mint;
  }
}