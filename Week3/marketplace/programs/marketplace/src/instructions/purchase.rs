use anchor_lang::{prelude::*,system_program::{Transfer,transfer}};
use anchor_spl::{associated_token::AssociatedToken, metadata::{MasterEditionAccount, Metadata, MetadataAccount}, token::{close_account, mint_to,  transfer_checked, CloseAccount, Mint, MintTo, Token, TokenAccount,TransferChecked}};

use crate::{Lists, Struct::marketplace::marketplace};
#[derive(Accounts)]

pub struct  Purchase<'info>{
    #[account(mut)]
    pub taker:Signer<'info>,
    #[account(mut)]
    pub maker:SystemAccount<'info>,
    pub mint:Account<'info,Mint>,
#[account(mut,seeds=[b"list",maker.key().as_ref()],bump=list.bump)]
    pub list:Account<'info,Lists>,
    #[account(init_if_needed,associated_token::mint=mint,associated_token::authority=taker,payer=taker)]
    pub takerata:Account<'info,TokenAccount>,
    #[account(mut,associated_token::mint=reward_mint,associated_token::authority=maker)]
    pub makerata:Account<'info,TokenAccount>,
    #[account(init_if_needed,associated_token::mint=reward_mint,associated_token::authority=taker,payer=taker)]
    pub takerrewardata:Account<'info,TokenAccount>,
    #[account(mut,associated_token::mint=mint,associated_token::authority=list)]
    pub vault:Account<'info,TokenAccount>,
    #[account(mut,seeds=[b"marketplace",marketplace.name.as_bytes()],bump=marketplace.bump)]
    pub marketplace:Account<'info,marketplace>,
    #[account(mut,seeds=[b"vault",marketplace.admin.key().as_ref()],bump)]
    pub treasury:SystemAccount<'info>,
    #[account(mut,seeds=[b"reward",marketplace.key().as_ref()],bump=marketplace.reward_bump,)] 
    pub reward_mint:Account<'info,Mint>,
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub metadata_program:Program<'info,Metadata>
}
impl <'info> Purchase<'info>{
  pub fn sendsol(&mut self)->Result<()>{
    let marketplace_fee = (self.marketplace.fee as u64)
    .checked_mul(self.list.price as u64)
    .unwrap()
    .checked_div(10000_u64)
    .unwrap();
    let account=Transfer{
        from:self.taker.to_account_info(),
        to:self.treasury.to_account_info(),
    };
    let cpi_ctx=CpiContext::new(self.system_program.to_account_info(), account);
  transfer(cpi_ctx, marketplace_fee)?;
  let secondaccount=Transfer{
    from:self.taker.to_account_info(),
    to:self.maker.to_account_info()
  };
  let cpi_ctx=CpiContext::new(self.system_program.to_account_info(), secondaccount);
   transfer(cpi_ctx, self.list.price as u64)?;
    Ok(())
  }
  pub fn sendreward(&mut self)->Result<()>{
    let seed=&[b"marketplace",&self.marketplace.name.as_bytes()[..],&[self.marketplace.bump]];
    let signer_seed=&[&seed[..]];
   let account=MintTo{
    mint:self.reward_mint.to_account_info(),
    authority:self.marketplace.to_account_info(),
    to:self.makerata.to_account_info()
   };
   let cpi_ctx=CpiContext::new_with_signer(self.system_program.to_account_info(), account,signer_seed);
    mint_to(cpi_ctx,self.marketplace.fee as u64)?;  
   let account2=MintTo{
    mint:self.reward_mint.to_account_info(),
    authority:self.marketplace.to_account_info(),
    to:self.takerrewardata.to_account_info()
   };
   let cpi_ctx=CpiContext::new_with_signer(self.system_program.to_account_info(), account2,signer_seed);
   mint_to(cpi_ctx,self.marketplace.fee as u64)?; 
   
Ok(())
  }
  pub fn transfernft(&mut self)->Result<()>{
    let seed=&[b"list",&self.maker.key().to_bytes()[..],&[self.list.bump]];
    let signer_seed=&[&seed[..]];
    let account=TransferChecked{
        from:self.vault.to_account_info(),
        mint:self.mint.to_account_info(),
        authority:self.list.to_account_info(),
        to:self.takerata.to_account_info()
    };
    let cpi_ctx=CpiContext::new_with_signer(self.token_program.to_account_info(), account, signer_seed);
    transfer_checked(cpi_ctx, 1, self.mint.decimals)
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

