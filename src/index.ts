import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import routes from "./controllers";
import { connectDB, sessionStore } from "./utils";
import { Request } from "./types";
import session from "express-session";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "PUT", "GET", "DELETE"],
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(express.static("/"));

app.use(express.json({ limit: process.env.REQUEST_LIMIT }));
app.use(
  express.urlencoded({
    limit: process.env.REQUEST_LIMIT,
    extended: true,
  })
);
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    // cookie: { secure: true },
  })
);

app.use("/check", (_, res) => res.status(200).send("Server Running..."));

(async () => {
  const orm = await connectDB(process.env.DB_NAME || "temp_db");
  app.use((req: Request, _res, next) => {
    req.orm = orm;
    next();
  });

  app.use(routes);

  app.listen(port, () => {
    console.log(colors.green(`[server] Listening on port ${port}`));
  });
})();
