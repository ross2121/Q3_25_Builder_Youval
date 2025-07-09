use anchor_lang::{accounts::program, prelude::*};
use anchor_spl::{associated_token::AssociatedToken, token::{close_account, CloseAccount, Token}, token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked}};
use crate::state::Escrow;
#[derive(Accounts)]

pub struct Refund<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    #[account(mint::token_program=token_program)]
    pub minta:InterfaceAccount<'info,Mint>,
    #[account(mint::token_program=token_program)]
    pub mintb:InterfaceAccount<'info,Mint>,
    #[account(mut,associated_token::mint=minta,associated_token::authority=maker,associated_token::token_program=token_program)]
    pub maker_minta:InterfaceAccount<'info,TokenAccount>,
    #[account(mut,close=maker,seeds=[b"escrow",maker.key().as_ref(),escrow.seed.to_le_bytes().as_ref()],bump=escrow.bump)]
    pub escrow:Account<'info,Escrow>,
    #[account(mut,associated_token::mint=minta,associated_token::authority=escrow,associated_token::token_program=token_program)]
    pub vault:InterfaceAccount<'info,TokenAccount>,
    pub token_program:Program<'info,Token>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub system_program:Program<'info,System>
}
impl<'info> Refund<'info>{
        pub fn deposit(&mut self)->Result<()>{ 
            let signer_seeds: [&[&[u8]]; 1] = [&[
                b"escrow",
                self.maker.to_account_info().key.as_ref(),
                &self.escrow.seed.to_le_bytes()[..],
                &[self.escrow.bump],
            ]];
            let accounts=TransferChecked{
            from:self.vault.to_account_info(),
            to:self.maker_minta.to_account_info(),
            mint:self.minta.to_account_info(),
            authority:self.escrow.to_account_info()
           };
           let program=self.token_program.to_account_info();
            let cpi=CpiContext::new_with_signer(program, accounts,&signer_seeds);
             transfer_checked(cpi, self.vault.amount, self.minta.decimals)?;
             let closed_Account=CloseAccount{
              account:self.vault.to_account_info(),
              destination:self.maker.to_account_info(),
              authority:self.escrow.to_account_info()
             };
          
            let close_ctx=CpiContext::new_with_signer(self.token_program.to_account_info(), closed_Account, &signer_seeds);
            close_account(close_ctx)

}
            
    
}