import { PublicKey, Keypair } from "@solana/web3.js";
import express, { Response } from "express";
import { authenticate } from "../middlewares";
import { AuthRequest, User, Wallets } from "../models";

import { Request } from "../types";
import { create_token, ResponseHelper, verify_signature } from "../utils";
import { saveUser } from "../sockets";
import { Honeycomb, User as UserChain } from "@honeycomb-protocol/hive-control";
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
      console.log("userChain", userChain);
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
  // req.session.web3UserAuthReq = {
  //   userAddress: user.address,
  //   signerWallet,
  //   nonce,
  // };
  // if (!sendSignerHTMLInAuth)
  //   return response.ok("Authentication session initialized", {
  //     nonce,
  //   });

  try {
    await req.orm.em.upsert(
      AuthRequest,
      {
        userAddress: user.address,
        signerWallet,
        nonce,
      },
      {
        upsert: true,
      }
    );
    return response.ok("Authentication session initialized", {
      nonce,
    });
  } catch (e: any) {
    return response.error(e.message, e);
  }
});

router.post(
  "/verify/:signer/:signature",
  async (req: Request, res: Response) => {
    const response = new ResponseHelper(res);
    const { signer, signature } = req.params;

    if (!req.orm || !req.session) throw new Error("ORM or Session not found");

    // if (!req.session.web3UserAuthReq) {
    //   return response.notFound("Authentication session not initialized!");
    // }
    // const { userAddress, signerWallet, nonce } = req.session.web3UserAuthReq;

    // if (!(userAddress && signerWallet && nonce)) {
    //   return response.notFound("Authentication session not valid!");
    // }

    const authRequest = await req.orm.em.findOne(AuthRequest, {
      signerWallet: signer,
    });
    if (!authRequest)
      return response.notFound("Authentication session not initialized!");
    const { userAddress, signerWallet, nonce } = authRequest;

    const user = await req.orm.em.findOne(User, {
      address: userAddress,
      wallets: {
        $like: `%${signerWallet}%`,
      },
    });
    if (!user) {
      return response.notFound("User not found!");
    }

    const verified = await verify_signature(
      signature,
      signerWallet.toString(),
      nonce.toString()
    ).catch(console.error);

    delete req.session.web3UserAuthReq;
    await req.orm.em.removeAndFlush(authRequest);

    if (!verified) {
      return response.error("Verification failed, Auth session closed;");
    }
    req.session.web3User = user.toJSON();
    response.ok("Authenticated", {
      auth_token: create_token({
        user_address: user.address,
      }),
    });
  }
);

router.post("/refresh", (req: Request, res) => {
  const response = new ResponseHelper(res);

  if (!req.session.web3User) return response.unauthorized("Not logged in");

  response.ok("Authenticated", {
    auth_token: create_token({
      user_address: req.session.web3User.address,
    }),
  });
});

router.get("/verify/username/:name", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { name } = req.params;
  if (!name) return response.badRequest("Username not found in params");
  if (!req.honeycomb) return response.error("Honeycomb not found");
  try {
    const user = await req.orm?.em.findOne(User, {
      username: name,
    });
    response.ok("success", {
      available: !!!user,
      username: !user ? name : user.username,
    });
  } catch (err: any) {
    console.error(err);
    return response.error(err.message);
  }
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
    return response.ok(undefined, user);
  } else {
    return response.unauthorized();
  }
});

export default router;
