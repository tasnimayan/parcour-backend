import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../config/database";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import { AuthRequest } from "../types";

// Assign an agent to a parcel
export const assignAgentToParcel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== UserRole.ADMIN) {
      ResponseHandler.forbidden(res, "Only Admin can assign agents");
      return;
    }

    const { parcelId, agentId } = req.body;

    if (!parcelId || !agentId) {
      ResponseHandler.error(res, "parcelId and agentId are required");
      return;
    }

    // Ensure agent exists and is an AGENT
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== UserRole.AGENT) {
      ResponseHandler.notFound(res, "Agent not found or invalid role");
      return;
    }

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
        parcel: true,
        agent: true,
      },
    });

    ResponseHandler.success(res, "Agent assigned successfully", assignment);
  } catch (error) {
    Logger.error("Error assigning agent:", error);
    ResponseHandler.serverError(res, "Failed to assign agent");
  }
};

// Get agent list with pagination (for Admin assignment screen)
export const getAgentsList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole !== UserRole.ADMIN) {
      ResponseHandler.forbidden(res, "Only admin can view agents");
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        skip,
        take: limit,
        include: { user: { select: { id: true, email: true } } },
      }),
      prisma.agent.count(),
    ]);

    ResponseHandler.success(res, "Agents list fetched successfully", {
      data: agents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
    if (userRole !== UserRole.ADMIN) {
      ResponseHandler.forbidden(res, "Only admin can view users");
      return;
    }

    const { search, role } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
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
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    ResponseHandler.success(res, "Users list fetched successfully", {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    Logger.error("Get users list error:", error);
    ResponseHandler.serverError(res, "Failed to fetch users");
  }
};
