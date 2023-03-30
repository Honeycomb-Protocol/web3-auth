import * as web3 from "@solana/web3.js";
import fs from "fs";
import dotenv from "dotenv";
import { Honeycomb, identityModule } from "@honeycomb-protocol/hive-control";

dotenv.config();

const config = {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT || 4000,
  cors_origin: process.env.CORS_ORIGIN || "*",
  request_limit: process.env.REQUEST_LIMIT || "100kb",
  jwt_secret: process.env.JWT_SECRET || "secret",
  rpc_url: process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
  db_name: process.env.DB_NAME || "temp",
} as { [k: string]: string };
export default config;

export async function getHoneycomb(opts?: web3.ConfirmOptions) {
  const RPC = config.rpc_url;

  if (!opts) {
    opts = {
      commitment: "processed",
      skipPreflight: false,
    };
  }

  const honeycomb = new Honeycomb(new web3.Connection(RPC, opts));
  honeycomb.use(
    identityModule(
      web3.Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync("./key.json").toString()))
      )
    )
  );

  return honeycomb;
}
