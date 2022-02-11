use std::convert::TryInto;
use solana_program::program_error::ProgramError;
//this will be a crate that we build ourselves
use crate::error::EscrowError::InvalidInstruction;

pub enum EscrowInstruction {
  ///API for processing instruction_data passed to our program's entrypoint
  /// Starts the trade by creating and populating an escrow account and transferring ownership of the given temp token account to the PDA
  ///
  ///instruction.rs doesn't touch the accounts, but its a good reference to outline the 
  ///kinds of accounts that will be in play here, as well as special properties about them.
  ///for example, we couldn't write to accounts 1 and 3 if we didn't designate them as such.
  /// Accounts expected:
  ///
  /// 0. `[signer]` The account of the person initializing the escrow. Needs to be designated as a signer in order to transfer ownership of the account to the PDA.
  /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
  /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
  /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
  /// 4. `[]` The rent sysvar
  /// 5. `[]` The token program
  InitEscrow {
    //amount party a expects to recieve of token Y in exchange for their X tokens
    //this will be provided via the instruction_data
    amount: u64
  },

  //here, we define instructions for the second transaction in the escrow. Here are 
  //the accounts that are in play here. Note that these accounts come from the code that 
  //calls into this solana program. For this example, its the JS scripts that Paul created
  //to interact with a test version of the Solana blockchain. 
  //0. [signer]: account of person taking the trade (Bob)
  //1. [writable]: The takers token account for the token they send (Bob's Y token account)
  //2. [wirtable]: the taker's token account for the token they will receive if the trade goes through (Bob's X token account)
  //3. [writable]: The PDA's temp token account to get the tokens from and close (The PDA owned account with Alice's X tokens)
  //4. [writable]: The initializer's main account to send their rent fees to (?)
  //5. [writable]: the initializer's token account that will receive the tokesn (Alice's token X account)
  //6. [writable]: The escrow state account holding the trade info
  //7. [] the token program
  //8. [] the PDA account (?)
  //
  Exchange {
    //amount the taker (Bob) expects to be paid in the other token (X)
    //as a u64 because that's the max possible supply of a token
    //why do we need to include this in Bob's transaction if we know this info already lives in
    //the state account at this point? Maybe there's been price movement and Bob wants a
    //slightly different deal? 

    //no, it makes a frontrunning attack impossible. Put the expected ammount in the instruction
    //so that if Alice tries some fuckery and creates a new state account with 0 X tokens
    //before Bob's transaction is processed (which is possible via collusion with SOL validators)
    //then Bob would get 0 X tokens for his Y tokens. Putting the amount of X tokens he expects
    //to receive in the instructions makes this situation impossible if we include a check that
    //makes sure Bob's expected ammount of X tokens matches what's in the state account. 
    amount: u64,
  }
}

//what can we do with our EscrowInstruction enum?
impl EscrowInstruction {
  //unpack expects a reference to a slice of u8
  pub fn unpack(input: &[u8])-> Result<Self,ProgramError> {
    //tag is the first byte of the u8 slice. rest is the rest of it
    let (tag,rest)=input.split_first().ok_or(InvalidInstruction)?;

    //use match on the tag (first byte of input) to determine what to do. 
    //only have one decision here, but there can be multiple. 
    //this is the most important part of the intructions file: its where we 
    //decide what should happen.

    //note that the decision depends on the first byte of the instructions. This 
    //is determined by the js scripts that interact with the program. 

    //this decides what variant of our EscrowInstructions enum is returned: is it an 
    //InitEscrow variant, or an Exchange variant?
    Ok(match tag {
      0=> Self::InitEscrow {
        amount: Self::unpack_amount(rest)?,
      },
      1 => Self::Exchange {
        amount: Self::unpack_amount(rest)?
      },
      _ =>return Err(InvalidInstruction.into()),
    })
  }
  //unpack_amount decodes the rest of the instructions to get a u64 for the amount
  fn unpack_amount(input: &[u8]) ->Result<u64, ProgramError> {
    let amount=input
      .get(..8) //get a slice of input (rest) from bit 0 to bit 8. Returns an Option
      .and_then(|slice| slice.try_into().ok()) //validate each slice is okay (?) Return an option
      .map(u64::from_le_bytes) //transforms the option of a u8 byte array to an option with a u64 integer value
      .ok_or(InvalidInstruction)?; //transform the Option into a Result. the <?> operator means we take the Result value, or throw an error of type Invalid instruction
    Ok(amount) //amount is a Result enum. calling Ok on it returns the success value in the Ok variant.
  }
}