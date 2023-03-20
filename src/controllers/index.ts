import express from "express";
import { ResponseHelper } from "../utils";

const router = express.Router();

router.use("/auth", require("./auth").default);
router.use("/user", require("./user").default);
router.use((_, res) => new ResponseHelper(res).notFound("Path not found"));

export default router;
