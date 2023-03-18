import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import fs from "fs";
import dotenv from "dotenv";
import { Config, Project } from "./types";

dotenv.config();

export const PROD = process.env.PROD === "true";

const IDL: any = {};

const devnetRpc = "https://api.devnet.solana.com";
const mainnetdRpc =
  process.env.RPC_URL || "https://api.mainnet-beta.solana.com";

const projects = JSON.parse(fs.readFileSync("./projects.json").toString());

export const getConfig = <T extends anchor.Idl = any>(
  projectName: string,
  opts?: web3.ConfirmOptions
): Config<T> => {
  const project: Project = projects[projectName];
  if (!project) throw new Error("Project not found");

  const RPC = project.rpc || projectName !== "devnet" ? mainnetdRpc : devnetRpc;

  const connection = new web3.Connection(RPC);

  const wallet = new anchor.Wallet(
    web3.Keypair.fromSecretKey(Uint8Array.from(project.key))
  );

  if (!opts) {
    opts = {
      preflightCommitment: "singleGossip",
    };
  }
  const provider = new anchor.AnchorProvider(connection, wallet, opts);

  return {
    wallet,
    connection,
    provider,
    program: new anchor.Program<T>(
      IDL,
      new web3.PublicKey(project.program),
      provider
    ),
    project: new web3.PublicKey(project.address),
  };
};
