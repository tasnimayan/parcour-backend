import { Response } from "express";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";

export const updateAgentLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, status } = req.body;
    const agentId = req.params.id;

    if (!latitude || !longitude) {
      ResponseHandler.error(res, "Latitude and longitude required");
      return;
    }

    // 1. Update current/latest location
    const updated = await prisma.agentLocation.upsert({
      where: { agentId },
      update: {
        latitude,
        longitude,
        status: status ?? "AVAILABLE",
      },
      create: {
        agentId,
        latitude,
        longitude,
        status: status ?? "AVAILABLE",
      },
    });

    ResponseHandler.success(res, "Agent location updated successfully", updated);
  } catch (err) {
    Logger.error("Update agent location error:", err);
    ResponseHandler.serverError(res, "Failed to update agent location");
  }
};
