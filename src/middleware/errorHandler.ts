import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import config from "../config/env";

// Global Error Handler Middleware

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  Logger.error("Unhandled error:", error);

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        ResponseHandler.error(res, "Resource already exists", "Duplicate entry", 409);
        return;
      case "P2025":
        ResponseHandler.notFound(res, "Resource not found");
        return;
      default:
        ResponseHandler.serverError(res, "Database error");
        return;
    }
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    ResponseHandler.unauthorized(res, "Invalid token");
    return;
  }

  if (error.name === "TokenExpiredError") {
    ResponseHandler.unauthorized(res, "Token expired");
    return;
  }

  // Default server error
  const message = config.NODE_ENV === "development" ? error.message : "Internal server error";
  ResponseHandler.serverError(res, message);
};
