import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError";

/**
 * Central error-handling middleware.
 * Must have 4 parameters so Express recognises it as an error handler.
 * ai generated
 */ 
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
