import { Response } from "express";
import { ParcelStatus, UserRole } from "@prisma/client";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";

// Assign an agent to a parcel
export const assignAgentToParcel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const { parcelId, agentId } = req.body;

    if (!parcelId || !agentId) {
      ResponseHandler.error(res, "parcelId and agentId are required");
      return;
    }

    // Ensure agent exists and is an AGENT
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== UserRole.agent) {
      ResponseHandler.notFound(res, "Agent not found or invalid role");
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await prisma.parcelAssignment.upsert({
        where: { parcelId },
        update: {
          agentId,
          assignedBy: userId!,
          assignedAt: new Date(),
        },
        create: {
          parcelId,
          agentId,
          assignedBy: userId!,
        },
        include: {
          agent: {
            select: {
              userId: true,
              fullName: true,
            },
          },
        },
      });

      const parcelStatus = await prisma.parcel.update({
        where: { id: parcelId, status: { in: [ParcelStatus.pending, ParcelStatus.assigned] } },
        data: { status: ParcelStatus.assigned },
        select: { updatedAt: true },
      });

      const activityData = {
        parcelId: parcelId,
        action: "assigned",
        activityBy: userId,
        role: UserRole.admin,
      };
      await prisma.parcelActivity.create({ data: activityData });

      return { assignment, parcelStatus };
    });

    ResponseHandler.success(res, "Agent assigned successfully", result.assignment);
  } catch (error) {
    Logger.error("Error assigning agent:", error);
    ResponseHandler.serverError(res, "Failed to assign agent");
  }
};

// Get agent list with pagination (for Admin assignment screen)
export const getAgentsList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    let whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          userId: true,
          fullName: true,
          phone: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.agent.count({ where: whereClause }),
    ]);

    ResponseHandler.success(res, "Agents list fetched successfully", agents, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    Logger.error("Get agents list error:", error);
    ResponseHandler.serverError(res, "Failed to fetch agents");
  }
};

// Get all users with filtering + pagination
export const getUsersList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole !== UserRole.admin) {
      ResponseHandler.forbidden(res, "Only admin can view users");
      return;
    }

    const { search, role } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = (role as string).toUpperCase() as UserRole;
    }

    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search as string, mode: "insensitive" } } },
        { agent: { fullName: { contains: search as string, mode: "insensitive" } } },
        { admin: { fullName: { contains: search as string, mode: "insensitive" } } },
        { email: { contains: search as string, mode: "insensitive" } },
        { customer: { phone: { contains: search as string, mode: "insensitive" } } },
        { agent: { phone: { contains: search as string, mode: "insensitive" } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              fullName: true,
              phone: true,
            },
          },
          agent: {
            select: {
              fullName: true,
              phone: true,
            },
          },
          admin: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const transformedUsers = users?.map((u) => {
      let profile = u.customer || u.agent || u.admin || null;
      return {
        ...u,
        profile,
        customer: undefined,
        agent: undefined,
        admin: undefined,
      };
    });

    ResponseHandler.success(res, "Users list fetched successfully", transformedUsers, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    Logger.error("Get users list error:", error);
    ResponseHandler.serverError(res, "Failed to fetch users");
  }
};

// Get parcel statistics (Admin only)
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (userRole !== UserRole.admin) {
      ResponseHandler.forbidden(res, "Only admins can access parcel statistics");
      return;
    }

    const [
      totalUsers,
      totalParcels,
      todayBookings,
      pendingParcels,
      assignedParcels,
      inTransitParcels,
      deliveredParcels,
      failedParcels,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.parcel.count(),
      prisma.parcel.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.parcel.count({ where: { status: ParcelStatus.pending } }),
      prisma.parcel.count({ where: { status: ParcelStatus.assigned } }),
      prisma.parcel.count({ where: { status: ParcelStatus.in_transit } }),
      prisma.parcel.count({ where: { status: ParcelStatus.delivered } }),
      prisma.parcel.count({ where: { status: ParcelStatus.failed } }),
    ]);

    const stats = {
      totalUsers,
      totalParcels,
      todayBookings,
      pendingParcels,
      assignedParcels,
      inTransitParcels,
      deliveredParcels,
      failedParcels,
    };

    ResponseHandler.success(res, "Parcel statistics retrieved successfully", stats);
  } catch (error) {
    Logger.error("Get parcel stats error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve parcel statistics");
  }
};
