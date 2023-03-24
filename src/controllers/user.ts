import fs from "fs";
import express, { Response } from "express";
import { multer } from "../middlewares";
import { User } from "../models";
import { Request } from "../types";
import { ResponseHelper } from "../utils";

const router = express.Router();

router.post(
  "/pfp",
  multer.single("pfp"),
  async (req: Request, res: Response) => {
    const response = new ResponseHelper(res);

    if (!req.file) return response.badRequest("File not provided");

    if (!req.orm) return response.error("ORM not found");

    const user = await req.orm.em.findOne(User, {
      address: req.user?.address,
    });

    if (!user) return response.notFound("User not found");

    if (user.pfp) {
      fs.rmSync(`./uploads/${user.pfp}`);
    }

    user.pfp = req.file.filename;

    response.ok();
  }
);

export default router;
