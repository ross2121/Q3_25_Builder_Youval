use anchor_lang::{accounts::account, prelude::*, system_program::{Transfer,transfer}};

use crate::Dice;

#[derive(Accounts)]
#[instruction(seed:u8)]
pub struct MakeBet<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub  home:SystemAccount<'info>,
    #[account(init,seeds=[b"bet",seed.to_le_bytes().as_ref()],payer=maker,bump,space=8+Dice::INIT_SPACE)]
    pub  bet:Account<'info,Dice>,
    #[account(mut,seeds=[b"vault",home.key().as_ref()],bump)]
    pub vault:SystemAccount<'info>,
    pub system_program:Program<'info,System>
}
impl <'info> MakeBet<'info>   {
     pub fn makebet(&mut self,seed:u8,amount:u64,roll:u8,bump:&MakeBetBumps)->Result<( )>{
        self.bet.amount=amount;
        self.bet.bump=bump.bet;
        self.bet.player=self.maker.to_account_info().key();
        self.bet.seed=seed;
        self.bet.slot=Clock::get()?.slot;
         self.bet.roll=roll;
                let account=Transfer{
            from:self.maker.to_account_info(),
            to:self.vault.to_account_info()
        };  
        let cpi_ctx=CpiContext::new(self.system_program.to_account_info(), account);
        transfer(cpi_ctx, amount)
     }
}