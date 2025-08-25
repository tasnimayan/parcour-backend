import { Request, Response } from "express";
import { ParcelPriority, ParcelService, ParcelStatus, PaymentType, UserRole } from "@prisma/client";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";

interface CreateParcelRequest {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  recipientName: string;
  recipientPhone: string;
  parcelType: string;
  parcelSize: string;
  serviceType: ParcelService;
  priorityType: ParcelPriority;
  parcelWeight: number;
  paymentType: PaymentType;
  codAmount?: number;
}

interface UpdateParcelRequest {
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  parcelType?: string;
  parcelSize?: string;
  parcelWeight?: number;
  paymentType?: PaymentType;
  codAmount?: number;
}

interface UpdateParcelStatusRequest {
  status: ParcelStatus;
}

const generateTrackingCode = (): string => {
  const year = new Date().getFullYear();

  // Generate a random number (4 digits)
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  // Use last 4 digits of timestamp (ms since epoch) for collision resistance
  const timestampPart = Number(Date.now().toString().slice(-4));

  return `TRK-${year}-${randomPart}${timestampPart}`;
};

// Helper function to validate status transitions
const getValidStatusTransitions = (currentStatus: ParcelStatus, userRole: UserRole): ParcelStatus[] => {
  const transitions: Record<ParcelStatus, { [key in UserRole]?: ParcelStatus[] }> = {
    [ParcelStatus.pending]: {
      [UserRole.admin]: [ParcelStatus.assigned],
    },
    [ParcelStatus.assigned]: {
      [UserRole.agent]: [ParcelStatus.picked_up],
      [UserRole.admin]: [ParcelStatus.picked_up, ParcelStatus.pending],
    },
    [ParcelStatus.picked_up]: {
      [UserRole.agent]: [ParcelStatus.in_transit],
      [UserRole.admin]: [ParcelStatus.in_transit, ParcelStatus.assigned],
    },
    [ParcelStatus.in_transit]: {
      [UserRole.agent]: [ParcelStatus.delivered, ParcelStatus.failed],
      [UserRole.admin]: [ParcelStatus.delivered, ParcelStatus.failed, ParcelStatus.picked_up],
    },
    [ParcelStatus.delivered]: {
      [UserRole.admin]: [ParcelStatus.in_transit], // In case of disputes
    },
    [ParcelStatus.failed]: {
      [UserRole.admin]: [ParcelStatus.pending, ParcelStatus.assigned],
    },
  };

  return transitions[currentStatus]?.[userRole] || [];
};

// Create new parcel (Customer only)
export const createParcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== UserRole.customer) {
      ResponseHandler.forbidden(res, "Only customers can create parcels");
      return;
    }

    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      recipientName,
      recipientPhone,
      parcelType,
      serviceType,
      priorityType,
      parcelWeight,
      parcelSize,
      paymentType,
      codAmount,
    }: CreateParcelRequest = req.body;

    // Validate COD amount if payment type is COD
    if (paymentType === "cod" && (!codAmount || codAmount <= 0)) {
      ResponseHandler.error(res, "COD amount is required and must be greater than 0 for COD payments");
      return;
    }

    // Create parcel
    const parcel = await prisma.parcel.create({
      data: {
        customerId: userId!,
        trackingCode: generateTrackingCode(),
        pickupAddress,
        pickupLat,
        pickupLng,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        recipientName,
        recipientPhone,
        parcelType,
        serviceType,
        priorityType,
        parcelWeight,
        parcelSize,
        paymentType,
        codAmount: paymentType === "cod" ? codAmount : null,
        status: ParcelStatus.pending,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    ResponseHandler.success(res, "Parcel created successfully", parcel, 201);
  } catch (error) {
    Logger.error("Create parcel error:", error);
    ResponseHandler.serverError(res, "Failed to create parcel");
  }
};

// Get all parcels with filtering and pagination
export const getParcels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const {
      page = "1",
      limit = "10",
      status,
      paymentType,
      parcelType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause based on user role
    let whereClause: any = {};

    if (userRole === UserRole.customer) {
      // Customers can only see their own parcels
      whereClause.customerId = userId;
    } else if (userRole === UserRole.agent) {
      // Agents can see assigned parcels
      whereClause.assignment = {
        agentId: userId,
      };
    }
    // Admins can see all parcels (no additional filter)

    // Add optional filters
    if (status) {
      whereClause.status = status;
    }
    if (paymentType) {
      whereClause.paymentType = paymentType;
    }
    if (parcelType) {
      whereClause.parcelType = parcelType;
    }

    // Get parcels with pagination
    const [parcels, total] = await Promise.all([
      prisma.parcel.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              fullName: true,
              phone: true,
            },
          },
          assignment: {
            select: {
              agentId: true,
              assignedAt: true,
              agent: {
                select: {
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          payment: {
            select: {
              amount: true,
              status: true,
              paymentType: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.parcel.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    ResponseHandler.success(res, "Parcels retrieved successfully", parcels, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });
  } catch (error) {
    Logger.error("Get parcels error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve parcels");
  }
};

// Get single parcel by ID
export const getParcelById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            user: {
              select: {
                email: true,
              },
            },
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
            admin: {
              select: {
                fullName: true,
              },
            },
          },
        },
        payment: true,
        feedback: true,
      },
    });

    if (!parcel) {
      ResponseHandler.notFound(res, "Parcel not found");
      return;
    }

    // Check access permissions
    if (userRole === UserRole.customer && parcel.customerId !== userId) {
      ResponseHandler.forbidden(res, "You can only access your own parcels");
      return;
    }

    if (userRole === UserRole.agent && parcel.assignment?.agentId !== userId) {
      ResponseHandler.forbidden(res, "You can only access assigned parcels");
      return;
    }

    ResponseHandler.success(res, "Parcel retrieved successfully", parcel);
  } catch (error) {
    Logger.error("Get parcel by ID error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve parcel");
  }
};

// Update parcel (Customer only, and only if status is PENDING)
export const updateParcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== UserRole.customer) {
      ResponseHandler.forbidden(res, "Only customers can update parcel details");
      return;
    }

    const parcel = await prisma.parcel.findUnique({
      where: { id },
    });

    if (!parcel) {
      ResponseHandler.notFound(res, "Parcel not found");
      return;
    }

    if (parcel.customerId !== userId) {
      ResponseHandler.forbidden(res, "You can only update your own parcels");
      return;
    }

    if (parcel.status !== ParcelStatus.pending) {
      ResponseHandler.error(res, "Parcel can only be updated when status is PENDING");
      return;
    }

    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      parcelType,
      parcelSize,
      parcelWeight,
      paymentType,
      codAmount,
    }: UpdateParcelRequest = req.body;

    const updateData: any = {
      ...(pickupAddress !== undefined && { pickupAddress }),
      ...(pickupLat !== undefined && { pickupLat }),
      ...(pickupLng !== undefined && { pickupLng }),
      ...(deliveryAddress !== undefined && { deliveryAddress }),
      ...(deliveryLat !== undefined && { deliveryLat }),
      ...(deliveryLng !== undefined && { deliveryLng }),
      ...(parcelType !== undefined && { parcelType }),
      ...(parcelSize !== undefined && { parcelSize }),
      ...(parcelWeight !== undefined && { parcelWeight }),
      ...(paymentType !== undefined && { paymentType }),
    };

    // Validate COD amount if payment type is being changed to COD
    if (paymentType === "cod" && (!codAmount || codAmount <= 0)) {
      ResponseHandler.error(res, "COD amount is required and must be greater than 0 for COD payments");
      return;
    }

    const updatedParcel = await prisma.parcel.update({
      where: { id },
      data: {
        ...updateData,
        codAmount: updateData.paymentType === "COD" ? updateData.codAmount : null,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    ResponseHandler.success(res, "Parcel updated successfully", updatedParcel);
  } catch (error) {
    Logger.error("Update parcel error:", error);
    ResponseHandler.serverError(res, "Failed to update parcel");
  }
};

// Update parcel status (Admin and Agent only)
export const updateParcelStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status }: UpdateParcelStatusRequest = req.body;

    if (userRole !== UserRole.admin && userRole !== UserRole.agent) {
      ResponseHandler.forbidden(res, "Parcel status update permission denied.");
      return;
    }

    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!parcel) {
      ResponseHandler.notFound(res, "Parcel not found");
      return;
    }

    // Agents can only update status of assigned parcels
    if (userRole === UserRole.agent && parcel.assignment?.agentId !== userId) {
      ResponseHandler.forbidden(res, "You can only update status of assigned parcels");
      return;
    }

    // Validate status transitions
    const validTransitions = getValidStatusTransitions(parcel.status, userRole as UserRole);
    if (!validTransitions.includes(status)) {
      ResponseHandler.error(res, `Invalid status transition from ${parcel.status} to ${status}`);
      return;
    }

    const updatedParcel = await prisma.parcel.update({
      where: { id },
      data: { status },
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
              },
            },
          },
        },
      },
    });

    ResponseHandler.success(res, "Parcel status updated successfully", updatedParcel);
  } catch (error) {
    Logger.error("Update parcel status error:", error);
    ResponseHandler.serverError(res, "Failed to update parcel status");
  }
};

// Delete parcel (Customer only, and only if status is PENDING)
export const deleteParcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const parcel = await prisma.parcel.findUnique({
      where: { id },
    });

    if (!parcel) {
      ResponseHandler.notFound(res, "Parcel not found");
      return;
    }

    if (parcel.customerId !== userId) {
      ResponseHandler.forbidden(res, "You can only delete your own parcels");
      return;
    }

    if (parcel.status !== ParcelStatus.pending) {
      ResponseHandler.error(res, "Parcel can only be deleted when status is PENDING");
      return;
    }

    await prisma.parcel.delete({
      where: { id },
    });

    ResponseHandler.success(res, "Parcel deleted successfully");
  } catch (error) {
    Logger.error("Delete parcel error:", error);
    ResponseHandler.serverError(res, "Failed to delete parcel");
  }
};

// Get parcel statistics (Admin only)
export const getParcelStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (userRole !== UserRole.customer) {
      ResponseHandler.forbidden(res, "Only admins can access parcel statistics");
      return;
    }

    const [
      totalParcels,
      pendingParcels,
      assignedParcels,
      inTransitParcels,
      deliveredParcels,
      failedParcels,
      codParcels,
      prepaidParcels,
    ] = await Promise.all([
      prisma.parcel.count(),
      prisma.parcel.count({ where: { status: ParcelStatus.pending } }),
      prisma.parcel.count({ where: { status: ParcelStatus.assigned } }),
      prisma.parcel.count({ where: { status: ParcelStatus.in_transit } }),
      prisma.parcel.count({ where: { status: ParcelStatus.delivered } }),
      prisma.parcel.count({ where: { status: ParcelStatus.failed } }),
      prisma.parcel.count({ where: { paymentType: "cod" } }),
      prisma.parcel.count({ where: { paymentType: "prepaid" } }),
    ]);

    const stats = {
      total: totalParcels,
      byStatus: {
        pending: pendingParcels,
        assigned: assignedParcels,
        inTransit: inTransitParcels,
        delivered: deliveredParcels,
        failed: failedParcels,
      },
      byPaymentType: {
        cod: codParcels,
        prepaid: prepaidParcels,
      },
      deliveryRate: totalParcels > 0 ? ((deliveredParcels / totalParcels) * 100).toFixed(2) : "0.00",
    };

    ResponseHandler.success(res, "Parcel statistics retrieved successfully", stats);
  } catch (error) {
    Logger.error("Get parcel stats error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve parcel statistics");
  }
};
