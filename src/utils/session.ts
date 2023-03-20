import sqlite from "better-sqlite3";
import session from "express-session";

const SqliteStore = require("better-sqlite3-session-store")(session);
const db = new sqlite("sessions.sqlite");

export const sessionStore = new SqliteStore({
  client: db,
});
