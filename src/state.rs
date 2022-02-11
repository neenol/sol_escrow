use solana_program::{
  program_pack::{IsInitialized, Pack, Sealed},
  pubkey::Pubkey,
  program_error::ProgramError,
};

//new crate used in implementing Pack for our Escrow struct.
//https://docs.rs/arrayref/0.3.6/arrayref/
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct Escrow {
  pub is_initialized: bool, //this tells us if a given escrow account is in use already.
  //we can check this by implementing traits in the program_pack module
  pub initializer_pubkey: Pubkey,
  pub temp_token_account_pubkey: Pubkey, //the account with tokens that will be sent to Bob
  //we need to save this to make sure this account sends Bob its tokens.
  //Any accounts can be passed into the entrypoint of a program. We need this check here to 
  //save the accounts we're interested in between transactions to make sure money flows
  //from the right places. 
  pub initializer_token_to_receive_account_pubkey: Pubkey, //account that Bob's tokens
  //will be sent to when he takes the trade. 
  pub expected_amount: u64, //amount of Bob's tokens that Alice is expecting. 
}

//implement traits from the program_pack module
//https://docs.rs/solana-program/1.8.1/solana_program/program_pack/index.html
//we implement these two traits for our Escrow struct to define how their functions work

//Sealed is solana's version of Rust's Sized trait, but there's not much difference
impl Sealed for Escrow {}

//this tells us that when we call is_initialized on an Escrow struct, it'll just return
//the value of the is_initialized element of the struct. 
impl IsInitialized for Escrow {
  fn is_initialized(&self) -> bool {
    self.is_initialized
  }
}

impl Pack for Escrow {
  //LEN is the size of our type. get this by adding the sizes of our data types in bytes.
  //1 (bool) + 3 * 32 (Pubkey) + 1 * 8 (u64) = 105
  const LEN: usize = 105;

  //deserialization function
  //this turns an array of u8 into an instance of our escrow struct.
  //uses the arrayref library for getting references to a slice. This is a new crate,
  //so we'll need to add arrayref as a dependancy to our cargo file. 
  fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
    //creates an array of length LEN out of source
    let src = array_ref![src, 0, Escrow::LEN];
    //splits the src array into variables based on indicies.
    //so is_initialized becomes the first element in src
    //initializer_pubkey becomes the next 32 elements of src
    //temp-token_account_pubkey becomes the next 32 elements, etc
    let (
      is_initialized,
      initializer_pubkey,
      temp_token_account_pubkey,
      initializer_token_to_receive_account_pubkey,
      expected_amount,
    ) = array_refs![src, 1, 32, 32, 32, 8];

    //converts is_initialized to a bool value.
    let is_initialized = match is_initialized {
      [0] => false,
      [1] => true,
      _ => return Err(ProgramError::InvalidAccountData),
    };

    //creates a new Escrow struct from our variables.
    //note the use of <*>. looks like its used for de-referencing in this context.
    //ie, NOT the glob operator.
    //more info here https://doc.rust-lang.org/stable/book/ch15-02-deref.html
    Ok(Escrow {
      is_initialized,
      initializer_pubkey: Pubkey::new_from_array(*initializer_pubkey),
      temp_token_account_pubkey: Pubkey::new_from_array(*temp_token_account_pubkey),
      initializer_token_to_receive_account_pubkey: Pubkey::new_from_array(*initializer_token_to_receive_account_pubkey),
      expected_amount: u64::from_le_bytes(*expected_amount),
    })
  }

  //serialization function - inverse of unpack_from slice. We also have to pass in self 
  //though. in this case, Self is the instance of the Escrow struct that we're caling this on. 
  fn pack_into_slice(&self, dst: &mut [u8]) {
    let dst = array_mut_ref![dst, 0, Escrow::LEN];
    let (
      is_initialized_dst,
      initializer_pubkey_dst,
      temp_token_account_pubkey_dst,
      initializer_token_to_receive_account_pubkey_dst,
      expected_amount_dst,
    ) = mut_array_refs![dst, 1, 32, 32, 32, 8];

    let Escrow {
      is_initialized,
      initializer_pubkey,
      temp_token_account_pubkey,
      initializer_token_to_receive_account_pubkey,
      expected_amount,
    } = self; 

    is_initialized_dst[0] = *is_initialized as u8;
    initializer_pubkey_dst.copy_from_slice(initializer_pubkey.as_ref());
    temp_token_account_pubkey_dst.copy_from_slice(temp_token_account_pubkey.as_ref());
    initializer_token_to_receive_account_pubkey_dst.copy_from_slice(initializer_token_to_receive_account_pubkey.as_ref());
    *expected_amount_dst = expected_amount.to_le_bytes();
  }
}