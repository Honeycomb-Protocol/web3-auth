import { Honeycomb } from "@honeycomb-protocol/hive-control";
import { MikroORM } from "@mikro-orm/core";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { Request as ExpressRequest } from "express";
import { User } from "../models";

export type IResponse<T = any> = {
  success: boolean;
  code: number;
  message: string;
  data?: T;
};

export type Request = ExpressRequest & {
  user?: User;
  orm?: MikroORM<SqliteDriver>;
  honeycomb?: Honeycomb;
  session?: any;
};
