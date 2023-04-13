import { PublicKey, Keypair } from "@solana/web3.js";
import express, { Response } from "express";
import { authenticate } from "../middlewares";
import { User, Wallets } from "../models";

import { Request } from "../types";
import { create_token, ResponseHelper, verify_signature } from "../utils";
import { saveUser } from "../sockets";
const sendSignerHTMLInAuth = false;

const router = express.Router();

router.post("/request/:signerWallet", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { signerWallet } = req.params;

  if (!(req.orm && req.honeycomb)) {
    return response.error("ORM not found");
  }
  if (!signerWallet)
    return response.badRequest("Signer wallet not found in params");

  let user = await req.orm.em.findOne(User, {
    wallets: {
      $like: `%${signerWallet}%`,
    },
  });
  if (!user) {
    try {
      const { user: address } = await req.honeycomb
        .identity()
        .fetch()
        .walletResolver(new PublicKey(signerWallet));
      const userChain = await req.honeycomb.identity().fetch().user(address);
      await saveUser(req.orm, address, userChain.data);
      user = await req.orm.em.findOne(User, {
        address,
      });
      if (!user) throw new Error("User not found");
    } catch {
      return response.notFound("User not found!");
    }
  }

  const nonce = Keypair.generate().publicKey;
  req.session.web3UserAuthReq = {
    userAddress: user.address,
    signerWallet,
    nonce,
  };
  if (!sendSignerHTMLInAuth)
    return response.ok("Authentication session initialized", {
      nonce,
    });
});

router.post("/verify/:signature", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { signature } = req.params;

  if (!req.orm || !req.session) throw new Error("ORM or Session not found");

  if (!req.session.web3UserAuthReq) {
    return response.notFound("Authentication session not initialized!");
  }
  const { userAddress, signerWallet, nonce } = req.session.web3UserAuthReq;

  if (!(userAddress && signerWallet && nonce)) {
    return response.notFound("Authentication session not initialized!");
  }

  const user = await req.orm.em.findOne(User, {
    address: userAddress,
    wallets: {
      $like: `%${signerWallet}%`,
    },
  });
  if (!user) {
    return response.notFound("User not found!");
  }

  const verified = await verify_signature(signature, signerWallet, nonce).catch(
    console.error
  );
  if (!verified) {
    delete req.session.web3UserAuthReq;
    return response.error("Verification failed, Auth session closed;");
  }
  delete req.session.web3UserAuthReq;
  req.session.web3User = user.toJSON();
  response.ok("Authenticated", {
    auth_token: create_token({
      user_address: user.address,
    }),
  });
});

router.post("/refresh", (req: Request, res) => {
  const response = new ResponseHelper(res);

  if (!req.session.web3User) return response.unauthorized("Not logged in");

  response.ok("Authenticated", {
    auth_token: create_token({
      user_address: req.session.web3User.address,
    }),
  });
});

router.get("/session-user", (req: Request, res: Response) => {
  if (req.session.web3User) {
    res.send("You are logged in as " + req.session.web3User.address);
  } else {
    res.send("Please log in");
  }
});

router.get("/user", authenticate, (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  if (req.user) {
    let user = req.user.toJSON();
    // user.wallets = {
    //   primary_wallet: user.wallets.primary_wallet.toString(),
    //   secondary_wallets: user.wallets.secondary_wallets.map((x) =>
    //     x.toString()
    //   ) as any,
    // };
    return response.ok(undefined, user);
  } else {
    return response.unauthorized();
  }
});

export default router;
