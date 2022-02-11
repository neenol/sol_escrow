use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  program_error::ProgramError,
  msg,
  pubkey::Pubkey,
  program_pack::{Pack, IsInitialized},
  sysvar::{rent::Rent, Sysvar},
  program::invoke,
  program::invoke_signed,
};

//use the Account struct from the spl_token crate, but rename it to Token Account
use spl_token::state::Account as TokenAccount;
//use the EscrowInstructions enum from instruction.rs, our EscrowError from error.rs, and
//our Escrwo strict from state.rs
use crate::{instruction::EscrowInstruction, error::EscrowError, state::Escrow};

pub struct Processor;
impl Processor {
  //instruction_data is a reference to a u8 slice that holds instruction data.
  //we pass that data to the unpack function from our instruction file. 
  pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    //Note the ? at the end of this call means we either return the valid amount of an error
    //this calls a function written in instruction.rs that returns an EscrowInstruction
    //enum. The variant of the enum tells us what processing function to call. 
    let instruction = EscrowInstruction::unpack(instruction_data)?;

    //now, we use match to find out what procesing function to call. EscrowInstructions are
    //an enum with variants InitEscrow and Exchange. Depending on which one we have, we
    //call different processing functions.
    //msg! logs where we're going (?)
    match instruction {
      EscrowInstruction::InitEscrow {amount} => {
        msg!("Instruction: InitEscrow");
        Self::process_init_escrow(accounts,amount,program_id)
      },
      EscrowInstruction::Exchange { amount } => {
        msg!("Instrution: Exchange");
        Self::process_exchange(accounts, amount, program_id)
      }
    }
  }


  //this function will handle the initilization of the escrow account.
  //so this fn is called when Alice deposits X tokens into the escrow program.
  fn process_init_escrow(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: & Pubkey,
  ) -> ProgramResult {
    //first, create a mutable iterator of acccounts. Needs to be mutable b/c we'll remove
    //elements from it.
    let account_info_iter = &mut accounts.iter();

    //as defined in instructions.rs, we expect the first account to be the 
    //escrow initalizer: Alice's main account. 
    let initializer = next_account_info(account_info_iter)?;
    //expect the initalizer to be a signer. Check that quickly and throw an error if that's
    //not the case
    if !initializer.is_signer {
      return Err(ProgramError::MissingRequiredSignature);
    }

    //get the temp token account owned by initalizer (Alice)
    //don't need to check the owner for this account rn. We'll be doing stuff with it
    //later that will fail if the owner isn't the current program, so we'll put the check there
    let temp_token_account = next_account_info(account_info_iter)?;

    //next is the account for the token the initalizer will receive if the trade goes through
    //why do we check the owner of this though? The program needs to own this account so it
    //can send Bob's Y tokens to Alice when the trade goes through. 
    //spl_token::id() just returns the current program ID. Need to put a crate in toml to use it
    //put a check here to make sure that transaction goes off without a hitch when it happens

    //Not sure why we need to do this part though? I thought you didn't need to own an 
    //account to credit it?
    let token_to_receive_account = next_account_info(account_info_iter)?;
    if *token_to_receive_account.owner != spl_token::id() {
      return Err(ProgramError::IncorrectProgramId);
    }
    
    //escrow account is the 4th account in play here. This makes use of the Rent sysvar
    //rent = lamports deducted from acount balance due to space requirements. 
    let escrow_account = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

    //accounts can be made rent exempt if their balance is over a certain threshold that
    //depends on the balance in their acount (escrow_account.lamports()) and the amount
    //of data within them (escrow_account.data_len()). We usually want accounts to be 
    //rent exempt because they disappear once their balance goes to 0. 
    //We'll be using the escrow account to store info about this transaction on the
    //blockchain until Bob takes the trade. Thus, we want to make sure that this
    //account is rent exempt so it doesn't just go away. That would mean Bob couldn't
    //take the trade, and Alice couldn't get her tokens back.

    //How did we make the token rent exempt? I'm assuming that Alice populated
    //it with some lamports in the Alice script... but how many?

    //also have our custom error type here (EscrowError), so we'll need to 
    //add error.rs to the crates this file uses. 
    if !rent.is_exempt(escrow_account.lamports(), escrow_account.data_len()) {
      return Err(EscrowError::NotRentExempt.into());
    }

    //we're accessing the data field of an account for the first time here. data is just an
    //array of u8s, so we'll need to use Escrow::unpack_unchecked to deserialize it.
    //this function is inside state.rs
    //note, we don't ACTUALLY implement unpack_unchecked in state.rs - instead, we rely on 
    //the default behavior of the Pack trait > https://docs.rs/solana-program/1.8.1/src/solana_program/program_pack.rs.html#29-39
    //the default behavior is to make sure that the input len equals the LEN constant,
    //then we call unpack_from_slice, which we've implemented for Escrow structs in state.
    //So this code creats a new instance of an Escrow struct, and throws an error if its 
    //already been initialized (since we should be initializing the escrow here)
    //shouldn't unpck_from_slice already populate the struct though?
    let mut escrow_info = Escrow::unpack_unchecked(&escrow_account.data.borrow())?;
    if escrow_info.is_initialized() {
      return Err(ProgramError::AccountAlreadyInitialized);
    }

    //populate our new Escrow instance
    escrow_info.is_initialized = true;
    escrow_info.initializer_pubkey = *initializer.key;
    escrow_info.temp_token_account_pubkey = *temp_token_account.key;
    escrow_info.initializer_token_to_receive_account_pubkey = *token_to_receive_account.key;
    escrow_info.expected_amount = amount;
    
    //pack function eventually calls into pack_into_slice. So this takes our Escrow struct
    //and serializes it. 
    Escrow::pack(escrow_info, &mut escrow_account.data.borrow_mut())?;

    //PDA info - create a new pda address with find_program_addess that uses the program_id
    //and the bump seed such that it isn't on the ed25519 curve that's used to generate normal
    //SOL addresses. 
    //at the most basic level, a pda is just a collection of bytes that aren;t on the 
    //ed25519 curve. Note that we don't actually use the bump seed yet, since we've got 
    //<_> before the name. 
    let (pda, _bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);

    //now, use a cross program invocation to pass ownership of Alice's token account to 
    //the PDA
    let token_program = next_account_info(account_info_iter)?;
    //use the set_authority function in the token program's instructions file to 
    //create a set of instructions to pass to the token program. The instructions
    //are made up of the following ingredients.
    let owner_change_ix = spl_token::instruction::set_authority(
      token_program.key, //token program ID
      temp_token_account.key, //account who's authority we're changing.
      Some(&pda), //the account that will have the new authority (the PDA)
      spl_token::instruction::AuthorityType::AccountOwner, //type of authority change
      initializer.key, //current account owner (Alice, she's the initializer)
      &[&initializer.key], //public keys signing the cross program invocation. Use a weird
      //format here because that's just what the set_authority function expects. 
    )?;
    //note that when we do this, we're allowing a signed transaction to carry over to the 
    //CPI. in other words, when Alice signs the transaction moving tokens into her temp
    //token account, this program can use that signature to sign the set_authority CPI
    //transaction that changes that token account's owner. 

    msg!("Calling the token program to transfer token account ownership...");
    //invoke takes the instructions we created above, and an array that has the accounts 
    //that are referenced within the instructions. Some token accoints may or may not
    //be required though. To find out, check out the token program's setAuthority enum.
    invoke(
      &owner_change_ix,
      &[
        temp_token_account.clone(),
        initializer.clone(),
        token_program.clone(),
      ],
    )?;
    Ok(())
  }

  //process an exchange transaction
  fn process_exchange(
    accounts: &[AccountInfo],
    amount_expected_by_taker: u64,
    program_id: &Pubkey,
  ) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    //Bob's main account - needs to be a signer
    let taker = next_account_info(account_info_iter)?;
    if !taker.is_signer {
      return Err(ProgramError::MissingRequiredSignature);
    }

    //Bob's Y token account
    let takers_sending_token_account = next_account_info(account_info_iter)?;

    //Bob's X token account
    let takers_token_to_receive_account = next_account_info(account_info_iter)?;

    //PDA owned account with Alice's X tokens. 
    let pdas_temp_token_account = next_account_info(account_info_iter)?;
    //unpack info from the PDA owned token account
    let pdas_temp_token_account_info = 
      TokenAccount::unpack(&pdas_temp_token_account.data.borrow())?;
    //re-create our pda public key and bump seed. We'll need this later
    let (pda, bump_seed) = Pubkey::find_program_address(&[b"escrow"], program_id);

    //make sure that the amount of X tokens Bob expects to receive matches what's in the
    //PDA account. 
    if amount_expected_by_taker != pdas_temp_token_account_info.amount {
      return Err(EscrowError::ExpectedAmountMismatch.into());
    }

    //Alice's main account to send rent fees to (?)
    let initializers_main_account = next_account_info(account_info_iter)?;

    //Alice's token Y account
    let initializers_token_to_receive_account = next_account_info(account_info_iter)?;

    //Escrow state account holding trade info.
    let escrow_account = next_account_info(account_info_iter)?;
    let escrow_info = Escrow::unpack(&escrow_account.data.borrow())?;

    //error if the address of the PDA account in the state account isn't the addrss of the 
    //PDA account passed in with the instructions
    if escrow_info.temp_token_account_pubkey != *pdas_temp_token_account.key {
      return Err(ProgramError::InvalidAccountData);
    }

    //error if Alice's public key from the escrow account does not match the account passed
    //in with the instructions
    if escrow_info.initializer_pubkey != *initializers_main_account.key {
      return Err(ProgramError::InvalidAccountData);
    }

    //error if Alice's account to receive Y tokens from the escrow account does not match
    //the account passed in with the instructions
    if escrow_info.initializer_token_to_receive_account_pubkey != * initializers_token_to_receive_account.key {
      return Err(ProgramError::InvalidAccountData);
    }

    //the token program.
    let token_program = next_account_info(account_info_iter)?;

    //use the transfer function in the token program's instructions file to 
    //create a set of instructions to pass to the token program. The instructions
    //are made up of the following ingredients.
    let transfer_to_initializer_ix = spl_token::instruction::transfer(
      token_program.key, //token account public key
      takers_sending_token_account.key, //Bob's token Y account (source)
      initializers_token_to_receive_account.key, //Alice's token Y account (dest)
      taker.key, //Bob's main account (authority key)
      &[&taker.key], //Public keys that will sign the CPI (Bob's main account key's)
      escrow_info.expected_amount, //amount of Y tokens that alice is expecting to receive
    )?;
    msg!("calling the token program to transfer tokens to the escrow's initializer....");
    //note that when we do this, we're allowing a signed transaction to carry over to the 
    //CPI. in other words, when Bob signs this transaction, he's giving the token program
    //permission to move Y tokens from his account to Alices (?)

    //invoke takes the instructions we created above, and an array that has the accounts 
    //that are referenced within the instructions. Some token acconts may or may not
    //be required though. To find out, check out the token program's transfer enum.
    invoke(
      &transfer_to_initializer_ix,
      &[
          takers_sending_token_account.clone(),
          initializers_token_to_receive_account.clone(),
          taker.clone(),
          token_program.clone(),
      ],
    )?;

    //the pda account - reference it again so we can close it.
    let pda_account = next_account_info(account_info_iter)?;

    //now create a set of instructions to send X tokens from the PDA account to Bob's
    let transfer_to_taker_ix = spl_token::instruction::transfer(
      token_program.key, //program key
      pdas_temp_token_account.key, //pda owned account with Alice's X tokens (source)
      takers_token_to_receive_account.key, //Bob's token X account (dest)
      &pda, //authority account
      &[&pda], //signing account
      pdas_temp_token_account_info.amount, //ammount of X tokens to send to Bob. 
    )?;
    msg!("calling the token program to transfer tokens to the taker");
    //what does invoke_signed do, and how is it different from invoke?
    //invokes a CPI with program signatures. This allows the PDA to sign
    //something, as oppoesed to an account used by Alice or Bob, which is the 
    //signer for when we call invoke. Remember, PDAs are weird because they don't live on
    //the ed25519 curve, so they don't have private keys... so they can't sign transactions
    //unless we use invoke_signed. 
    //remember though, we created the PDA pubkey using the pubkeys of our programId account.
    //invoke_signed works by taking our program ID and bump seed, then recreating 
    //the PDA pubkey and making sure it matches the pda we passed in. This works because
    //our program is the one calling invoke_signed, so ONLY our program can create transactions
    //signed by this PDA's pubkey. 
    invoke_signed(
      &transfer_to_taker_ix,
      &[
          pdas_temp_token_account.clone(),
          takers_token_to_receive_account.clone(),
          pda_account.clone(),
          token_program.clone(),
      ],
      &[&[&b"escrow"[..], &[bump_seed]]],
    )?;
  

    //close the pda account
    //destination account is the account of the person who should get the rent balance.
    //remember, in order for an account to be rent exempt, there needs to be a certain balance
    //within it. Alice created both the pda account and the escrow state acount, so she needed
    //to front that balance. When we close the PDA account, she'll get that lamport balance back
    let close_pdas_temp_acc_ix = spl_token::instruction::close_account(
      token_program.key, //token program
      pdas_temp_token_account.key, //account ot be closed
      initializers_main_account.key, //destination accont
      &pda, //authority account
      &[&pda] //signer
    )?;
    msg!("calling the token program to close the pda's temp account");
    invoke_signed(
      &close_pdas_temp_acc_ix,
      &[
          pdas_temp_token_account.clone(),
          initializers_main_account.clone(),
          pda_account.clone(),
          token_program.clone(),
      ],
      &[&[&b"escrow"[..], &[bump_seed]]],
    )?;

    //close the escrow state account. the state account was rent exempt because of the Lamports
    //that Alice fronted to it. Now that the transaction has been completed, we can pass the
    //lamports back to her. We can credit Alice's main account with the lamports easily, since
    //any program can credit any account. And we can debit the escrow account easily as well,
    //since our program owns the escrow account (right?)
    msg!("Closing the escrow account...");
    **initializers_main_account.lamports.borrow_mut() = initializers_main_account.lamports()
    .checked_add(escrow_account.lamports())
    .ok_or(EscrowError::AmountOverflow)?;
    //setting the lamports of the account to 0 will effectively close it, since it will be 
    //removed from memory once the transaction is finished.
    **escrow_account.lamports.borrow_mut() = 0;
    //we clear the data field of the account too. This is just good practice. Even if the account 
    //is purged from memory after the transaction is done, a transaction could have multiple
    //instructions. need to make sure that none of the subsequent instructions commit fuckery
    //with this account, since we're done with it at this point. 
    *escrow_account.data.borrow_mut() = &mut [];
    Ok(())
  }
}