use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct Escrow{
    pub seed:u64,
    pub maker:Pubkey,
    pub minta:Pubkey,
    pub mint_b:Pubkey,
    pub reciveve_amt:u64,
    pub deposit_amt:u64,
    pub bump:u8
}