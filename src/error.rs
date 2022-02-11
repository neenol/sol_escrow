//use the thiserror crate for help with handling program errors .
//this crate gives us a dope macro to help us define our own errors. 
use thiserror::Error;
//define an error type here. 
//this is where we define our error type of "Invalid Instructions"
//the #[error(<string>)] portion will generate a display enum for our InvalidInstruction errors.
//so, essentially, it creates enums with error messages. 
#[derive(Error,Debug,Copy,Clone)]
pub enum EscrowError {
  //invalid instructions
  #[error("Invalid Instruction")]
  InvalidInstruction,
  //account not rent exempt
  #[error("Account not rent exempt")]
  NotRentExempt,
  //account initiating the escrow is already initialized.
  #[error("Account already initialized")]
  AccountAlreadyInitialized,
  //mismatch between Bob's expected amount of token X to receive and what's in the state account
  #[error("Expected amount mismatch")]
  ExpectedAmountMismatch,
  //invalid data in the state account
  #[error("Invalid data in state account")]
  InvalidAccountData,
  //not sure what this does yet. 
  #[error("amount overflow")]
  AmountOverflow,
}

//also use the solana_program crate.
//This is a generic trait implementation. It means that we can now use the from
//function on EscrowErrors, which we'll need to use the <?> operator with our
//new InvalidInstructions error type. 
//Once we do this, we can use the functions in this implementation on 
//InvalidInstruction errors (?)

use solana_program::program_error::ProgramError;
impl From<EscrowError> for ProgramError {
  fn from(e: EscrowError) -> Self {
    ProgramError::Custom(e as u32)
  }
}
