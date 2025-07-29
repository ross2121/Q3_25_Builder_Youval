use anchor_lang::{accounts::account, prelude::*, system_program::{Transfer,transfer}};

#[derive(Accounts)]
pub struct Init<'info>{
    #[account(mut)]
    pub  home:Signer<'info>,
    #[account(mut,seeds=[b"vault",home.key().as_ref()],bump)]
    pub vault:SystemAccount<'info>,
    pub system_program:Program<'info,System>
}
impl <'info> Init<'info>   {
     pub fn init(&mut self,amount:u64)->Result<(    )>{
        let account=Transfer{
            from:self.home.to_account_info(),
            to:self.vault.to_account_info()
        };  
        let cpi_ctx=CpiContext::new(self.system_program.to_account_info(), account);
        transfer(cpi_ctx, amount)
     }
}