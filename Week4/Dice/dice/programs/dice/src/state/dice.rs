use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct Dice{
    pub player:Pubkey,
    pub seed:u8,
    pub bump:u8,
    pub slot:u64,
    pub roll:u8,
    pub amount:u64
}
impl Dice{
    pub fn to_slice(&mut self)->Vec<u8>{
        let mut s=self.player.to_bytes().to_vec();
        s.extend_from_slice(&self.seed.to_le_bytes());
        s.extend_from_slice(&self.amount.to_le_bytes());
        s.extend_from_slice(&self.slot.to_be_bytes());
        s.extend_from_slice(&self.roll.to_be_bytes());
        s
    }
}