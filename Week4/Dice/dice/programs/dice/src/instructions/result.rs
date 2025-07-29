use anchor_lang::{accounts::account, prelude::*, system_program::{Transfer,transfer}};
use switchboard_on_demand::RandomnessAccountData;

use crate::{Dice, DiceError};
pub const HOUSE_EDGE: u16 = 150;
#[derive(Accounts)]
pub struct ResultSign<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub  home:SystemAccount<'info>,
    #[account(seeds=[b"bet",bet.seed.to_le_bytes().as_ref()],bump=bet.bump)]
    pub  bet:Account<'info,Dice>,
    #[account(mut,seeds=[b"vault",home.key().as_ref()],bump)]
    pub vault:SystemAccount<'info>,
    /// CHECK: This is a Switchboard randomness account that we validate in the instruction
    #[account(mut)]
    pub randomness_account:UncheckedAccount<'info>,
    pub system_program:Program<'info,System>
}
impl <'info> ResultSign<'info>   {
     pub fn bet(&mut self,bump:&ResultSignBumps)->Result<( )>{
        let clock=Clock::get()?;
        let randomness_data=RandomnessAccountData::parse(self.randomness_account.data.borrow()).unwrap();
        let reveal_random_value=randomness_data.get_value(&clock).map_err(|_|DiceError::Randomessnotresolved)?;
        if   self.bet.roll<reveal_random_value[0]{
            let payout = (self.bet.amount as u128)
            .checked_mul(10000 - (HOUSE_EDGE as u128))
            .ok_or(DiceError::Overflow)? 
            .checked_div((self.bet.roll as u128) - 1)
            .ok_or(DiceError::Overflow)?
            .checked_div(100)
            .ok_or(DiceError::Overflow)? as u64;

               let account=Transfer{
                from:self.vault.to_account_info(),
                to:self.maker.to_account_info()
               };
               let seeds = [b"vault", &self.home.key().to_bytes()[..], &[bump.vault]];
           let signer_seed = &[&seeds[..]];
           let ctx = CpiContext::new_with_signer(
            self.system_program.to_account_info(),
            account,
            signer_seed
        );
        transfer(ctx, payout)?;

        }
        Ok(())
     }
}