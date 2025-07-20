use anchor_lang::prelude::*;

declare_id!("DELJbG1srq1ftrnEXMTQt2HghoBddBt9XHrwm7AXBAki");

pub mod Struct;
pub use Struct::*;
pub mod instructions;
pub use instructions::*;

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize_market(
        ctx: Context<Init>,
        name: String,
        fee: u16,
    ) -> Result<()> {
        ctx.accounts.initialize(name, fee, &ctx.bumps);
        Ok(())
    }

    pub fn create_list(
        ctx: Context<List>,
        price: u32,
    ) -> Result<()> {
        ctx.accounts.initialize(price, &ctx.bumps);
        ctx.accounts.transfernft()?;
        Ok(())
    }

    pub fn purchase(
        ctx: Context<Purchase>,
    ) -> Result<()> {
        ctx.accounts.sendsol()?;
        ctx.accounts.sendreward()?;
        ctx.accounts.transfernft()?;
        ctx.accounts.closeaccount()?;
        Ok(())
    }

    pub fn delist(
        ctx: Context<Delist>
    ) -> Result<()> {
        ctx.accounts.transfernft()?;
        ctx.accounts.closeaccount()?;
        Ok(())
    }

    
}

