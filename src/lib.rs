//lib.rs is the default starting point for Rust programs.
//but sol programs need to begin at the entrypoint.
pub mod entrypoint;
pub mod instruction;
pub mod error;
pub mod processor;
pub mod state;