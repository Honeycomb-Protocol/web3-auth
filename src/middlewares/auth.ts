import { Handler, Response, NextFunction } from "express";
import { Request } from "../types";
import { ResponseHelper, verify_token } from "../utils";

const fetchUser = async (user_id: number) => {
  user_id;
};

export const authenticate: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = new ResponseHelper(res);
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");
    try {
      req.user = await fetchUser(decoded.user_id);
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

  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const decoded = verify_token(req.headers.authorization.split(" ")[1]);
    if (!decoded) return response.unauthorized("Invalid Token");
    try {
      req.user = await fetchUser(decoded.user_id);
    } catch (e) {}
  }

  next();
};
