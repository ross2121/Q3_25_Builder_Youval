use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct  User{
   pub point:u32,
   pub amount:u32,
    pub bump:u8
}