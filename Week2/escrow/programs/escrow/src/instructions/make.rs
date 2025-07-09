use anchor_lang::{accounts::program, prelude::*};
use anchor_spl::{associated_token::AssociatedToken, token_interface::{TokenInterface,transfer_checked,Mint,TokenAccount,TransferChecked}};
use crate::state::Escrow;
#[derive(Accounts)]
#[instruction(seeds:u64)]
pub struct Make<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    #[account(mint::token_program=token_program)]
    pub minta:InterfaceAccount<'info,Mint>,
    #[account(mint::token_program=token_program)]
    pub mintb:InterfaceAccount<'info,Mint>,
    #[account(mut,associated_token::mint=minta,associated_token::authority=maker,associated_token::token_program=token_program)]
    pub maker_minta:InterfaceAccount<'info,TokenAccount>,
    #[account(init,seeds=[b"escrow",maker.key().as_ref(),seeds.to_le_bytes().as_ref()],payer=maker,bump,space=8+Escrow::INIT_SPACE)]
    pub escrow:Account<'info,Escrow>,
    #[account(init,payer=maker,associated_token::mint=minta,associated_token::authority=escrow,associated_token::token_program=token_program)]
    pub vault:InterfaceAccount<'info,TokenAccount>,
    pub token_program:Interface<'info,TokenInterface>,
    pub associated_token_program:Program<'info,AssociatedToken>,
  pub system_program:Program<'info,System>
}
impl<'info> Make<'info>{
    pub fn init_escrow(&mut self,seed:u64,recive_amt:u64,bump:&MakeBumps,deposit_amt:u64)->Result<()>{
        self.escrow.minta=self.minta.key();
        self.escrow.mint_b=self.mintb.key();
        self.escrow.bump=bump.escrow;
        self.escrow.seed=seed;
        self.escrow.maker=self.maker.key();
        self.escrow.reciveve_amt=recive_amt;
        self.escrow.deposit_amt=deposit_amt;
        self.escrow.bump=bump.escrow;
        Ok(())
    }
        pub fn deposit(&mut self,deposit_amt:u64)->Result<()>{ 
            let accounts=TransferChecked{
            from:self.maker_minta.to_account_info(),
            to:self.vault.to_account_info(),
            mint:self.minta.to_account_info(),
            authority:self.maker.to_account_info()
           };
           let program=self.token_program.to_account_info();
            let cpi=CpiContext::new(program, accounts);
             transfer_checked(cpi, deposit_amt, self.minta.decimals)
}
            
    
}