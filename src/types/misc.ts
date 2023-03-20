import * as anchor from "@project-serum/anchor";

export interface Project {
  rpc?: string;
  address: string;
  driver: number[];
}

export interface Config<T extends anchor.Idl> {
  wallet: anchor.Wallet;
  connection: anchor.web3.Connection;
  provider: anchor.AnchorProvider;
  program: anchor.Program<T>;
  project: anchor.web3.PublicKey;
}
