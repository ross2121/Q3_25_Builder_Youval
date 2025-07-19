use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct  Stakeaccount{
    pub owner :Pubkey,
    pub mint:Pubkey,
    pub stake_at:i64,
    pub bump:u8
}