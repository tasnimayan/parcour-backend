import { Response } from "express";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";
import { ParcelStatus, UserRole } from "@prisma/client";

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
        status: status ?? "on_delivery",
      },
      create: {
        agentId,
        latitude,
        longitude,
        status: status ?? "available",
      },
    });

    ResponseHandler.success(res, "Agent location updated successfully", updated);
  } catch (err) {
    Logger.error("Update agent location error:", err);
    ResponseHandler.serverError(res, "Failed to update agent location");
  }
};

// Get parcel statistics (Agents only)
export const getAgentParcelStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userRole !== UserRole.agent) {
      ResponseHandler.forbidden(res, "Only agents can access parcel statistics");
      return;
    }

    const [totalParcels, totalInTransit, totalDelivered, totalFailed, agentParcels] = await Promise.all([
      prisma.parcel.count({ where: { assignment: { agentId: userId } } }),
      prisma.parcel.count({ where: { assignment: { agentId: userId }, status: ParcelStatus.in_transit } }),
      prisma.parcel.count({ where: { assignment: { agentId: userId }, status: ParcelStatus.delivered } }),
      prisma.parcel.count({ where: { assignment: { agentId: userId }, status: ParcelStatus.failed } }),
      prisma.parcelAssignment.findMany({
        where: { agentId: userId, parcel: { status: ParcelStatus.delivered } },
        include: {
          parcel: {
            select: {
              deliveredAt: true,
              estimatedDeliveryDate: true,
            },
          },
        },
      }),
    ]);

    let total = 0;
    let onTime = 0;

    for (const { parcel } of agentParcels) {
      if (!parcel.deliveredAt || !parcel.estimatedDeliveryDate) continue; // skip undelivered
      total++;

      if (parcel.deliveredAt <= parcel.estimatedDeliveryDate) {
        onTime++;
      }
    }

    const stats = {
      totalParcels,
      totalInTransit,
      totalDelivered,
      totalFailed,
      onTimeRate: total > 0 ? (onTime / total) * 100 : 0,
      completionRate: totalParcels > 0 ? (totalDelivered / totalParcels) * 100 : 0,
    };

    ResponseHandler.success(res, "Parcel statistics retrieved successfully", stats);
  } catch (error) {
    Logger.error("Get parcel stats error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve parcel statistics");
  }
};
