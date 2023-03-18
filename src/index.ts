import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import routes from "./controllers";
import { connectMongoDB } from "./utils";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(morgan("dev"));

app.use(express.static("/"));

app.use(express.json({ limit: process.env.REQUEST_LIMIT }));
app.use(
  express.urlencoded({
    limit: process.env.REQUEST_LIMIT,
    extended: true,
  })
);

app.use("/", (_, res) => res.status(200).send("Server Running..."));
app.use("/api/", routes);

process.env.MONGO_DB && connectMongoDB(process.env.MONGO_DB, "database_tmp");

app.listen(port, () => {
  console.log(colors.green(`[server] Listening on port ${port}`));
});
