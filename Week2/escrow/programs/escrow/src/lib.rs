use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub use state::*;
pub use instructions::*;


declare_id!("FT3saBzyp9n4ECZf3En4Y4EHRfiBH5MF1J62VkaN8Ap9");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seeds: u64, receive_amt: u64, deposit_amt: u64) -> Result<()> {
        ctx.accounts.init_escrow(seeds, receive_amt, &ctx.bumps, deposit_amt)?;
        ctx.accounts.deposit(deposit_amt)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.transfer()?;
        ctx.accounts.withdraw()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.deposit()
    }
}

