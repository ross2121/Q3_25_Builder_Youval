use anchor_lang:: prelude::* ;
use anchor_lang::prelude::Id;
use anchor_spl::{associated_token::AssociatedToken, token::{close_account, CloseAccount}, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked}};
use crate::state::Escrow;
#[derive(Accounts)] 
pub struct Take<'info>{
    #[account(mut)]
    pub taker:Signer<'info>,
    #[account(mut)]
    pub maker:SystemAccount<'info>,
    #[account(mint::token_program=token_program)]
    pub minta:InterfaceAccount<'info,Mint>,
    #[account(mint::token_program=token_program)]
    pub mintb:InterfaceAccount<'info,Mint>,
    #[account(mut,associated_token::mint=mintb,associated_token::authority=taker,associated_token::token_program=token_program)]
    pub taker_mint_b:InterfaceAccount<'info,TokenAccount>,
    #[account(init_if_needed,associated_token::mint=minta,associated_token::authority=taker,token::token_program=token_program,payer=taker)]
    pub taker_mint_a:InterfaceAccount<'info,TokenAccount>,
    #[account(init_if_needed,associated_token::mint=mintb,associated_token::authority=maker,associated_token::token_program=token_program,payer=taker)]
    pub maker_mintb:InterfaceAccount<'info,TokenAccount>,
    #[account(mut,seeds=[b"escrow",maker.key().as_ref(),escrow.seed.to_le_bytes().as_ref()],bump=escrow.bump,close=maker)]
    pub escrow:Account<'info,Escrow>,
    #[account(mut,associated_token::mint=minta,associated_token::authority=escrow,associated_token::token_program=token_program)]
    pub vault:InterfaceAccount<'info,TokenAccount>,
    pub token_program:Interface<'info,TokenInterface>,
    pub associated_token_program:Program<'info,AssociatedToken>,  
  pub system_program:Program<'info,System>
}

impl<'info> Take<'info>{
        pub fn transfer(&mut self)->Result<()>{ 
            let accounts=TransferChecked{
            from:self.taker_mint_b.to_account_info(),
            to:self.maker_mintb.to_account_info(),
            mint:self.mintb.to_account_info(),
            authority:self.taker.to_account_info()
           };
           let program=self.token_program.to_account_info();
            let cpi=CpiContext::new(program, accounts);
             transfer_checked(cpi, self.escrow.reciveve_amt, self.mintb.decimals) 
            
}
pub fn withdraw(&mut self)->Result<()>{
    let signer_seeds: [&[&[u8]]; 1] = [&[
        b"escrow",
        self.maker.to_account_info().key.as_ref(),
        &self.escrow.seed.to_le_bytes()[..],
        &[self.escrow.bump],
    ]];
    
    let account2=TransferChecked{
        from:self.vault.to_account_info(),
        to:self.taker_mint_a.to_account_info(),
        mint:self.minta.to_account_info(),
        authority:self.escrow.to_account_info()
     };
     
     let cpi=CpiContext::new_with_signer(self.token_program.to_account_info(), account2, &signer_seeds);
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