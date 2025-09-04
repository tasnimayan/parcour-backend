import { Response } from "express";
import { ParcelStatus, UserRole, UserStatus } from "@prisma/client";
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
      const assignment = await tx.parcelAssignment.upsert({
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

      const parcelStatus = await tx.parcel.update({
        where: { id: parcelId, status: { in: [ParcelStatus.pending, ParcelStatus.assigned] } },
        data: { status: ParcelStatus.assigned },
        select: { updatedAt: true },
      });
      return { assignment, parcelStatus };
    });

    const activityData = {
      parcelId: parcelId,
      action: "assigned",
      activityBy: userId,
      role: UserRole.admin,
    };
    await prisma.parcelActivity.create({ data: activityData });

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

    const { search, role, status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role as UserRole;
    }
    if (status) {
      where.status = status as UserStatus;
    }
    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        { agent: { fullName: { contains: search, mode: "insensitive" } } },
        { admin: { fullName: { contains: search, mode: "insensitive" } } },
        { email: { contains: search, mode: "insensitive" } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { agent: { phone: { contains: search, mode: "insensitive" } } },
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

// Update user status
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole !== UserRole.admin) {
      ResponseHandler.forbidden(res, "Only admin can update user status");
      return;
    }

    const { userId, status } = req.body;
    if (!userId || !status) {
      ResponseHandler.error(res, "userId and status are required");
      return;
    }

    // Validate status
    const validStatuses = [UserStatus.active, UserStatus.inactive, UserStatus.suspended, UserStatus.deleted];
    if (!validStatuses.includes(status)) {
      ResponseHandler.error(res, "Invalid status value");
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      ResponseHandler.notFound(res, "User not found");
      return;
    }

    // Prevent admin from updating their own status
    if (req.user?.id === userId) {
      ResponseHandler.error(res, "You cannot update your own status");
      return;
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, role: true, status: true, updatedAt: true },
    });

    ResponseHandler.success(res, "User status updated successfully", updatedUser);
  } catch (error) {
    Logger.error("Update user status error:", error);
    ResponseHandler.serverError(res, "Failed to update user status");
  }
};
