use anchor_lang::{prelude::*};
use anchor_spl::{associated_token::AssociatedToken, metadata::{MasterEditionAccount, Metadata, MetadataAccount}, token::{close_account, transfer, transfer_checked, CloseAccount, Mint, Token, TokenAccount, Transfer, TransferChecked}};

use crate::{Lists, Struct::marketplace::marketplace};
#[derive(Accounts)]
#[instruction(name:String)]
pub struct  Delist<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub mint:Account<'info,Mint>,
#[account(seeds=[b"list",maker.key().as_ref()],bump=list.bump,)]
    pub list:Account<'info,Lists>,
    #[account(mut,associated_token::mint=mint,associated_token::authority=maker)]
    pub userata:Account<'info,TokenAccount>,
    #[account(mut,associated_token::mint=mint,associated_token::authority=list)]
    pub vault:Account<'info,TokenAccount>,
    #[account(seeds=[b"marketplace",marketplace.name.as_bytes()],bump=marketplace.bump)]
    pub marketplace:Account<'info,marketplace>,
    #[account(seeds=[b"reward",marketplace.key().as_ref()],bump=marketplace.reward_bump,)] 
    pub reward_mint:Account<'info,Mint>,
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub metadata_program:Program<'info,Metadata>
}
impl <'info> Delist<'info>{

  pub fn transfernft(&mut self)->Result<()>{
    let seed=&[b"list",&self.maker.key().to_bytes()[..],&[self.list.bump]];
    let signer_seed=&[&seed[..]];
    let account=TransferChecked{
from:self.vault.to_account_info(),
authority:self.list.to_account_info(),
to:self.userata.to_account_info(),
mint:self.mint.to_account_info()
    };
    let cpi_Ctx=CpiContext::new_with_signer(self.token_program.to_account_info(), account,signer_seed);
    transfer_checked(cpi_Ctx, 1,self.mint.decimals)
  }
  pub fn closeaccount(&mut self)->Result<()>{
    let seed=&[b"list",&self.maker.key().to_bytes()[..],&[self.list.bump]];
    let signer_seed=&[&seed[..]];
    let account=CloseAccount{
        account:self.vault.to_account_info(),
        destination:self.maker.to_account_info(),
        authority:self.list.to_account_info()
    };
    let cpi_ctx=CpiContext::new_with_signer(self.token_program.to_account_info(), account, signer_seed);
    close_account(cpi_ctx)
 
  }

}

