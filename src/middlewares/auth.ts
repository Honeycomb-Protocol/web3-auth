import { Handler, Response, NextFunction } from "express";
import { IUser } from "../models";
import { Request } from "../types";
import { fetchUser, ResponseHelper, verify_token } from "../utils";

export const authenticate: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = new ResponseHelper(res);
  if (!req.orm) return response.error("ORM not found");
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");
    try {
      req.user = await fetchUser(req.orm, decoded.user_address).then(
        (x) => x?.toJSON() as IUser
      );
      next();
    } catch {
      return response.unauthorized("Invalid Token");
    }
  } else {
    return response.unauthorized("Token not found");
  }
};

export const bypass_authenticate: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = new ResponseHelper(res);
  if (!req.orm) return response.error("ORM not found");
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");
    try {
      req.user = await fetchUser(req.orm, decoded.user_address).then(
        (x) => x?.toJSON() as IUser
      );
    } catch (e) {}
  }

  next();
};
