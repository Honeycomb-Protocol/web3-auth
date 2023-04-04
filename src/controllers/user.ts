import * as web3 from "@solana/web3.js";
import express, { Response } from "express";
import { Request } from "../types";
import { ResponseHelper } from "../utils";
import { createCtx } from "@honeycomb-protocol/hive-control";

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

  try {
    tx = await req.honeycomb.identity().signTransaction(tx);
  } catch (e) {
    console.error(e);
    return response.error("Failed to sign transaction", e);
  }

  let signature: string;
  try {
    console.log("Semd tx");
    signature = await req.honeycomb.connection.sendRawTransaction(
      tx.serialize()
      // { skipPreflight: true }
    );
    console.log("Sent tx");
  } catch (e) {
    console.error(e);
    return response.error("Failed to send transaction", e);
  }

  let confirmResponse: web3.RpcResponseAndContext<web3.SignatureResult> | null =
    null;
  if (req.body.blockhash) {
    try {
      console.log("Confirm tx");
      confirmResponse = await req.honeycomb.connection.confirmTransaction({
        signature,
        blockhash: req.body.blockhash.blockhash,
        lastValidBlockHeight: req.body.blockhash.lastValidBlockHeight,
      });
      console.log("Confirmed tx");
    } catch (e) {
      console.error(e);
      return response.error("Transaction failed to confirm", e);
    }
  }

  return response.ok("Transaction successfull", { signature, confirmResponse });
});

router.post("/edit", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  // try {
  if (!req.orm) return response.error("ORM not found");
  if (!req.honeycomb) return response.error("Honey");
  if (!req.user) return response.unauthorized();

  // const ctx = await req.honeycomb.rpc().sendAndConfirmTransaction(
  //   createCtx([
  //     web3.SystemProgram.transfer({
  //       fromPubkey: req.honeycomb.identity().publicKey,
  //       toPubkey: web3.Keypair.generate().publicKey,
  //       lamports: 1000000,
  //     }),
  //   ])
  // );

  // response.ok("Transaction successfull", { signature: ctx.signature });

  const user = await req.honeycomb
    .identity()
    .fetch()
    .user(new web3.PublicKey(req.user.address));

  if (!user) return response.notFound("User not found");

  try {
    await user.update({
      name: req.body.name,
      bio: req.body.bio,
      pfp: req.body.pfp,
    });

    req.body.name && (req.user.name = user.data.name);
    req.body.bio && (req.user.bio = user.data.bio);
    req.body.pfp && (req.user.pfp = user.data.pfp);

    req.orm.em.persist(req.user);
    await req.orm.em.flush();

    return response.ok("User updated", req.user.toJSON());
  } catch (e: any) {
    console.error(e);
    return response.error(e.message, e);
  }
});

export default router;
