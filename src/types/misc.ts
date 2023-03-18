import * as anchor from "@project-serum/anchor";

export interface Project {
  program: string;
  address: string;
  key: number[];
  rpc?: string;
}

export interface Config<T extends anchor.Idl> {
  wallet: anchor.Wallet;
  connection: anchor.web3.Connection;
  provider: anchor.AnchorProvider;
  program: anchor.Program<T>;
  project: anchor.web3.PublicKey;
}
