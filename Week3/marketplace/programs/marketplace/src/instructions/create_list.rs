use anchor_lang::{prelude::*};
use anchor_spl::{associated_token::AssociatedToken, metadata::{MasterEditionAccount, Metadata, MetadataAccount}, token::{transfer, transfer_checked, Mint, Token, TokenAccount, Transfer, TransferChecked}};

use crate::{Lists, Struct::marketplace::marketplace};
#[derive(Accounts)]

pub struct  List<'info>{
    #[account(mut)]
    pub maker:Signer<'info>,
    pub mint:Account<'info,Mint>,
    pub collection:Account<'info,Mint>,
#[account(init_if_needed,seeds=[b"list",maker.key().as_ref()],bump,payer=maker,space=8+Lists::INIT_SPACE)]
    pub list:Account<'info,Lists>,
    #[account(seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref()],bump,
    constraint=metadata.collection.as_ref().unwrap().key.as_ref()==collection.key().as_ref(),
    constraint=metadata.collection.as_ref().unwrap().verified==true,
   seeds::program=metadata_program.key()     
)]
    pub metadata:Account<'info,MetadataAccount>,
    #[account(seeds=[b"metadata",metadata_program.key().as_ref(),mint.key().as_ref(),b"edition"],bump,
   seeds::program=metadata_program.key()     
)]
    pub edition:Account<'info,MasterEditionAccount>,
    #[account(mut,associated_token::mint=mint,associated_token::authority=maker)]
    pub userata:Account<'info,TokenAccount>,
    #[account(init_if_needed,associated_token::mint=mint,associated_token::authority=list,payer=maker)]
    pub vault:Account<'info,TokenAccount>,
    #[account(mut,seeds=[b"marketplace",marketplace.name.as_bytes()],bump=marketplace.bump)]
    pub marketplace:Account<'info,marketplace>,
    #[account(mut,seeds=[b"vault",marketplace.admin.key().as_ref()],bump)]
    pub treasury:SystemAccount<'info>,
    #[account(init_if_needed,associated_token::mint=reward_mint,associated_token::authority=maker,payer=maker)]
    pub makerata:Account<'info,TokenAccount>,
    #[account(seeds=[b"reward",marketplace.key().as_ref()],bump=marketplace.reward_bump,)] 
    pub reward_mint:Account<'info,Mint>,
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub metadata_program:Program<'info,Metadata>
}
impl <'info> List<'info>{
  pub fn initialize(&mut self,price:u32,bump:&ListBumps){
    self.list.bump=bump.list;
    self.list.maker=self.maker.to_account_info().key();
    self.list.price=price;
    self.list.mint=self.mint.to_account_info().key();
  }
  pub fn transfernft(&mut self)->Result<()>{
    let account=TransferChecked{
from:self.userata.to_account_info(),
authority:self.maker.to_account_info(),
to:self.vault.to_account_info(),
mint:self.mint.to_account_info()
    };
    let cpi_Ctx=CpiContext::new(self.token_program.to_account_info(), account);
    transfer_checked(cpi_Ctx, 1,self.mint.decimals)
  }

}