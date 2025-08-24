import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import prisma from "../config/database";
import jwt, { SignOptions } from "jsonwebtoken";
import { ResponseHandler } from "../utils/response";
import { Logger } from "../utils/logger";
import config from "../config/env";

interface SignupRequest {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  phone: string;
  altPhone?: string;
  governmentId?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE";
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNo?: string;
  employmentType?: string;
  department?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Generate JWT token
const generateToken = (userId: string, email: string, role: UserRole): string => {
  return jwt.sign({ userId, email, role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN } as SignOptions);
};

// Customer Signup
export const customerSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, altPhone, governmentId, dob, gender }: SignupRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      ResponseHandler.error(res, "User already exists with this email", undefined, 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user and customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.CUSTOMER,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          fullName,
          phone,
          altPhone,
          governmentId,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
        },
      });

      return { user, customer };
    });

    // Generate token
    const token = generateToken(result.user.id, result.user.email, result.user.role);

    ResponseHandler.success(
      res,
      "Customer account created successfully",
      {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          profile: {
            fullName: result.customer.fullName,
            phone: result.customer.phone,
            emailVerified: result.customer.emailVerified,
          },
        },
      },
      201
    );
  } catch (error) {
    Logger.error("Customer signup error:", error);
    ResponseHandler.serverError(res, "Failed to create customer account");
  }
};

// Agent Signup
export const agentSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      altPhone,
      governmentId,
      dob,
      vehicleType,
      vehicleNumber,
      licenseNo,
      employmentType,
    }: SignupRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      ResponseHandler.error(res, "User already exists with this email", undefined, 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user and agent in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.AGENT,
        },
      });

      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          fullName,
          phone,
          altPhone,
          governmentId,
          dob: dob ? new Date(dob) : null,
          vehicleType: vehicleType as any,
          vehicleNumber,
          licenseNo,
          employmentType: employmentType as any,
        },
      });

      return { user, agent };
    });

    // Generate token
    const token = generateToken(result.user.id, result.user.email, result.user.role);

    ResponseHandler.success(
      res,
      "Delivery agent account created successfully",
      {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          profile: {
            fullName: result.agent.fullName,
            phone: result.agent.phone,
            vehicleType: result.agent.vehicleType,
            employmentType: result.agent.employmentType,
            availability: result.agent.availability,
            rating: result.agent.rating,
          },
        },
      },
      201
    );
  } catch (error) {
    Logger.error("Agent signup error:", error);
    ResponseHandler.serverError(res, "Failed to create delivery agent account");
  }
};

// Admin Signup (restricted - only for system setup)
export const adminSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, department }: SignupRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      ResponseHandler.error(res, "User already exists with this email", undefined, 409);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Default admin permissions
    const defaultPermissions = ["manage_users", "assign_parcels", "view_analytics", "manage_agents", "handle_disputes"];

    // Create user and admin in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });

      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          fullName,
          department: department as string,
          permissions: defaultPermissions,
        },
      });

      return { user, admin };
    });

    // Generate token
    const token = generateToken(result.user.id, result.user.email, result.user.role);

    ResponseHandler.success(
      res,
      "Admin account created successfully",
      {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          profile: {
            fullName: result.admin.fullName,
            department: result.admin.department,
            permissions: result.admin.permissions,
          },
        },
      },
      201
    );
  } catch (error) {
    Logger.error("Admin signup error:", error);
    ResponseHandler.serverError(res, "Failed to create admin account");
  }
};

// Universal Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user with role-specific profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        agent: true,
        admin: true,
      },
    });

    if (!user) {
      ResponseHandler.error(res, "Invalid email or password", undefined, 401);
      return;
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      ResponseHandler.error(res, "Account is suspended or deactivated", undefined, 403);
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ResponseHandler.error(res, "Invalid email or password", undefined, 401);
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Prepare role-specific profile data
    let profile: any = {};
    switch (user.role) {
      case UserRole.CUSTOMER:
        profile = user.customer
          ? {
              fullName: user.customer.fullName,
              phone: user.customer.phone,
              emailVerified: user.customer.emailVerified,
              defaultAddress: user.customer.defaultAddress,
            }
          : {};
        break;
      case UserRole.AGENT:
        profile = user.agent
          ? {
              fullName: user.agent.fullName,
              phone: user.agent.phone,
              vehicleType: user.agent.vehicleType,
              employmentType: user.agent.employmentType,
              availability: user.agent.availability,
              rating: user.agent.rating,
              totalDeliveries: user.agent.totalDeliveries,
            }
          : {};
        break;
      case UserRole.ADMIN:
        profile = user.admin
          ? {
              fullName: user.admin.fullName,
              department: user.admin.department,
              permissions: user.admin.permissions,
            }
          : {};
        break;
    }

    ResponseHandler.success(res, "Login successful", {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        profile,
      },
    });
  } catch (error) {
    Logger.error("Login error:", error);
    ResponseHandler.serverError(res, "Login failed");
  }
};

// Logout (optional - mainly for logging purposes)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        Logger.info(`User logged out: ${decoded.email}`);
      } catch (error) {
        // Token might be invalid, but that's okay for logout
      }
    }

    ResponseHandler.success(res, "Logout successful", {
      message: "Please remove the token from client storage",
    });
  } catch (error) {
    Logger.error("Logout error:", error);
    ResponseHandler.serverError(res, "Logout failed");
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        agent: {
          include: {
            location: true,
          },
        },
        admin: true,
      },
    });

    if (!user) {
      ResponseHandler.notFound(res, "User not found");
      return;
    }

    // Prepare role-specific profile data
    let profile: any = {};
    switch (user.role) {
      case UserRole.CUSTOMER:
        profile = user.customer;
        break;
      case UserRole.AGENT:
        profile = {
          ...user.agent,
          currentLocation: user.agent?.location,
        };
        break;
      case UserRole.ADMIN:
        profile = user.admin;
        break;
    }

    ResponseHandler.success(res, "Profile retrieved successfully", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      profile,
    });
  } catch (error) {
    Logger.error("Get profile error:", error);
    ResponseHandler.serverError(res, "Failed to retrieve profile");
  }
};
