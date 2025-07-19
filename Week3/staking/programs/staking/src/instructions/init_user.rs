use anchor_lang::prelude::*;

use crate::{ User};
#[derive(Accounts)]
pub struct InitializeUser<'info>{
    #[account(mut)]
pub user:Signer<'info>,
#[account(init,seeds=[b"user",user.key().as_ref()],bump,payer=user,space=8+User::INIT_SPACE)]
pub user_account:Account<'info,User>,
pub system_program:Program<'info,System>
}
impl<'info> InitializeUser<'info> {
    pub fn initializeuser(&mut self,bump:&InitializeUserBumps)->Result<()>{
         self.user_account.point=0;
         self.user_account.bump=bump.user_account;
         self.user_account.amount=0;
         Ok(())
    }
}