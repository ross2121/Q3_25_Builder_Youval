use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct  Config{
    pub point_per_stake :u8,
    pub freeze_at:u32,
    pub max:u32,
    pub rewardbump:u8,
    pub bump:u8
}