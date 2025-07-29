use anchor_lang::prelude::*;

declare_id!("EZgMRyXkBa221NXSpyH4xM2B2dXCFk1aKmyRkM492h1f");
pub mod state;
pub use state::*;
pub mod instructions;
pub use instructions::*;
pub mod error;
pub use error::*;
#[program]
pub mod dice {
    use super::*;
    pub fn initialize(ctx: Context<Init>, amount: u64) -> Result<()> {
        ctx.accounts.init(amount)
    }
   
    pub fn place_bet(ctx: Context<MakeBet>, seed: u8, roll: u8, amount: u64) -> Result<()> {
        ctx.accounts.makebet(seed,amount,roll,&ctx.bumps)?;
      Ok(())
    }

    pub fn resolve_bet(ctx: Context<MakeBetSign>, sig: Vec<u8>) -> Result<()> {
          ctx.accounts.signature(&sig)?;
    ctx.accounts.resolve(&ctx.bumps, &sig)
    }

    pub fn refund_bet(ctx: Context<RefundBet>) -> Result<()> {
        ctx.accounts.refund_bet(&ctx.bumps)
    }
}

