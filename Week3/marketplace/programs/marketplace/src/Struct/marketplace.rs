use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct marketplace{
    pub treasury_bump:u8,
    pub bump:u8,
    pub reward_bump:u8,
    pub admin:Pubkey,
    pub fee:u16,
    #[max_len(12)]
    pub name:String,
} 