use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct Lists{
    pub mint:Pubkey,
    pub maker:Pubkey,
    pub bump:u8,
    pub price:u32
} 