import express, { Response } from "express";
import { User } from "../models";
import { Request } from "../types";
import { ResponseHelper } from "../utils";

const router = express.Router();

router.post("/update", async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  const { name } = req.body;

  if (!req.orm) return response.error("ORM not found");

  const user = await req.orm.em.findOne(User, {
    address: req.user?.address,
  });

  if (!user) return response.notFound("User not found");

  user.name = name;
  req.session.web3User = user.toJSON();
  response.ok();
});

export default router;
