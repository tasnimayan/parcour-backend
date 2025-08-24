import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ResponseHandler } from "../utils/response";

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    ResponseHandler.error(res, "Validation failed", errorMessages, 422);
    return;
  }

  next();
};
