use anchor_lang::{accounts::account, prelude::*, system_program::{Transfer,transfer}};

use crate::Dice;

#[derive(Accounts)]

pub struct RefundBet<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub  home:SystemAccount<'info>,
    #[account(seeds=[b"bet",bet.seed.to_le_bytes().as_ref()],bump=bet.bump)]
    pub  bet:Account<'info,Dice>,
    #[account(mut,seeds=[b"vault",home.key().as_ref()],bump)]
    pub vault:SystemAccount<'info>,
    pub system_program:Program<'info,System>
}
impl <'info> RefundBet<'info>   {

     pub fn refund_bet(&mut self,bump:&RefundBetBumps)->Result<( )>{
        let seeds = [b"vault", &self.home.key().to_bytes()[..], &[bump.vault]];
        let signer_seeds = &[&seeds[..]][..];
                let account=Transfer{
            from:self.vault.to_account_info(),
            to:self.maker.to_account_info()
        };  
        let cpi_ctx=CpiContext::new_with_signer(self.system_program.to_account_info(), account,signer_seeds);
        transfer(cpi_ctx, self.vault.lamports())
    
     }
}