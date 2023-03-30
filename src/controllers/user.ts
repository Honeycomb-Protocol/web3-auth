import * as web3 from "@solana/web3.js";
import express, { Response } from "express";
import { Request } from "../types";
import { ResponseHelper } from "../utils";

const router = express.Router();

router.post("/addWallet", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.honeycomb) return response.error("Honey");
  if (!req.body.tx || !req.body.blockhash)
    return response.badRequest("Tx or blockhash not found in body");

  if (req.body.tx.type !== "Buffer")
    return response.badRequest("Tx must be a buffer");

  let tx: web3.Transaction;
  try {
    tx = web3.Transaction.from(Buffer.from(req.body.tx.data));
  } catch (e: any) {
    console.error(e);
    return response.badRequest(e.message);
  }

  console.log({
    tx: tx.signatures.map((x) => x.publicKey.toString()),
    identity: req.honeycomb.identity().publicKey.toString(),
  });

  try {
    tx = await req.honeycomb.identity().signTransaction(tx);
  } catch (e) {
    console.error(e);
    return response.error("Failed to sign transaction", e);
  }

  const signature = await req.honeycomb.connection.sendRawTransaction(
    tx.serialize(),
    { skipPreflight: true }
  );

  let confirmResponse: web3.RpcResponseAndContext<web3.SignatureResult> | null =
    null;
  if (req.body.blockhash) {
    try {
      confirmResponse = await req.honeycomb.connection.confirmTransaction({
        signature,
        blockhash: req.body.blockhash.blockhash,
        lastValidBlockHeight: req.body.blockhash.lastValidBlockHeight,
      });
    } catch (e) {
      console.error(e);
      return response.error("Transaction failed to confirm", e);
    }
  }

  return response.ok("Transaction successfull", { signature, confirmResponse });
});

export default router;
