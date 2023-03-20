import { MikroORM } from "@mikro-orm/core";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { Request as ExpressRequest } from "express";
import { IUser } from "../models";

export type IResponse<T = any> = {
  success: boolean;
  code: number;
  message: string;
  data?: T;
};

export type Request = ExpressRequest & {
  user?: IUser;
  orm?: MikroORM<SqliteDriver>;
  session?: any;
};
