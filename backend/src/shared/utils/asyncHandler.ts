import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler so thrown errors are forwarded to next().
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
