use anchor_lang::prelude::*;

declare_id!("Gi8aUwip4dAKiAF4r1ueVEERNSRDHrrN1A2HFifMw3jq");

pub mod state;
pub use state::*;
pub mod instructions;
pub use instructions::*;
pub mod error;
pub use error::*;
#[program]
pub mod staking {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        points_per_stake: u32,
        max_stake: u8,
        freeze_period: u32
    ) -> Result<()> {
        ctx.accounts.initialize(points_per_stake, max_stake, freeze_period, &ctx.bumps)?;
        Ok(())
    }

    pub fn initializeuser(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.initializeuser(&ctx.bumps)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.Stake(&ctx.bumps)
    }

    pub fn unstake(ctx: Context<UnStake>) -> Result<()> {
        ctx.accounts.unstake()
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }
}


