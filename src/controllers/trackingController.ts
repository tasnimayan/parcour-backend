import { Response } from "express";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";
import { UserRole } from "@prisma/client";

export const getParcelTrackingByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { trackingCode } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const parcel = await prisma.parcel.findUnique({
      where: { trackingCode },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        assignment: {
          include: {
            agent: {
              select: {
                fullName: true,
                phone: true,
                vehicleType: true,
                vehicleNumber: true,
              },
            },
          },
        },
      },
    });

    if (!parcel) {
      ResponseHandler.notFound(res, "Parcel not found with this tracking code");
      return;
    }

    // Check access permissions
    if (userRole === UserRole.customer && parcel.customerId !== userId) {
      ResponseHandler.forbidden(res, "You can only track your own parcels");
      return;
    }

    if (userRole === UserRole.agent && parcel.assignment?.agentId !== userId) {
      ResponseHandler.forbidden(res, "You can only track assigned parcels");
      return;
    }

    const trackingData = {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
      status: parcel.status,
      pickupAddress: parcel.pickupAddress,
      recipientName: parcel.recipientName,
      recipientPhone: parcel.recipientPhone,
      deliveryAddress: parcel.deliveryAddress,
      parcelType: parcel.parcelType,
      parcelSize: parcel.parcelSize,
      createdAt: parcel.createdAt,
      updatedAt: parcel.updatedAt,
      customer: parcel.customer,
      agent: parcel.assignment.agent,
      estimatedDeliveryDate: parcel.estimatedDeliveryDate,
    };

    ResponseHandler.success(res, "Parcel tracking data retrieved successfully", trackingData);
  } catch (error) {
    Logger.error("Get parcel tracking by code error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve tracking data");
  }
};
