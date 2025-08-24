import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import config from "../config/env";
import { UserRole, UserStatus } from "@prisma/client";

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ResponseHandler.unauthorized(res);
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      ResponseHandler.unauthorized(res, "Invalid or inactive user");
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    ResponseHandler.unauthorized(res, "Invalid access token");
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, "Authentication required");
      return;
    }

    if (!roles.includes(req.user.role)) {
      ResponseHandler.forbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
};
