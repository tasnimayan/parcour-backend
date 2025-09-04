import { type Socket, Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { Logger } from "../utils/logger";
import config from "../config/env";
import { UserRole, AgentLocationStatus, UserStatus, ParcelStatus } from "@prisma/client";

interface LocationUpdate {
  latitude: number;
  longitude: number;
  status?: AgentLocationStatus;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

export class LocationService {
  private io: SocketIOServer;
  private connectedAgents: Map<string, string> = new Map(); // agentId -> socketId
  private agentSockets: Map<string, string> = new Map(); // socketId -> agentId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket: any) => {
      Logger.info(`Socket connected: ${socket.id}`);

      // Handle agent connection
      socket.on("agent:connect", () => {
        this.handleAgentConnect(socket);
      });

      // Handle location updates from agents
      socket.on("agent:location-update", (data: LocationUpdate) => {
        this.handleLocationUpdate(socket, data);
      });

      // Handle customer tracking requests
      socket.on("customer:track-parcel", (parcelId: string) => {
        this.handleParcelTracking(socket, parcelId);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateSocket(socket: any, next: any) {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== UserStatus.active) {
        return next(new Error("Invalid or inactive user"));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      Logger.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  }

  private async handleAgentConnect(socket: AuthenticatedSocket) {
    if (socket.userRole !== UserRole.agent) {
      socket.emit("error", { message: "Only agents can connect for location sharing" });
      return;
    }

    const agentId = socket.userId!;
    this.connectedAgents.set(agentId, socket.id);
    this.agentSockets.set(socket.id, agentId);

    // Update agent's last active time
    await prisma.agent.update({
      where: { userId: agentId },
      data: {
        lastActive: new Date(),
      },
    });

    socket.join(`agent:${agentId}`);
    Logger.info(`Agent ${agentId} connected for location sharing`);

    socket.emit("agent:connected", { message: "Connected successfully" });
  }

  private async handleLocationUpdate(socket: AuthenticatedSocket, data: LocationUpdate) {
    if (socket.userRole !== UserRole.agent) {
      return;
    }

    const agentId = socket.userId!;
    const { latitude, longitude, status = AgentLocationStatus.available } = data;

    try {
      // Update agent location in database
      const updatedLocation = await prisma.agentLocation.upsert({
        where: { agentId },
        update: {
          latitude,
          longitude,
          status,
          updatedAt: new Date(),
        },
        create: {
          agentId,
          latitude,
          longitude,
          status,
        },
      });

      // Find all parcels assigned to this agent that are in active delivery states
      const activeParcels = await prisma.parcel.findMany({
        where: {
          assignment: { agentId },
          status: { in: [ParcelStatus.assigned, ParcelStatus.picked_up, ParcelStatus.in_transit] },
        },
        select: { id: true, customerId: true },
      });

      // Broadcast location to customers tracking these parcels
      for (const parcel of activeParcels) {
        this.io.to(`customer:${parcel.customerId}`).emit("parcel:location-update", {
          parcelId: parcel.id,
          agentLocation: {
            latitude: updatedLocation.latitude,
            longitude: updatedLocation.longitude,
            status: updatedLocation.status,
            updatedAt: updatedLocation.updatedAt,
          },
        });
      }

      socket.emit("location:updated", { success: true });
      Logger.debug(`Location updated for agent ${agentId}`);
    } catch (error) {
      Logger.error("Location update error:", error);
      socket.emit("location:error", { message: "Failed to update location" });
    }
  }

  private async handleParcelTracking(socket: AuthenticatedSocket, parcelId: string) {
    if (socket.userRole !== UserRole.customer) {
      socket.emit("error", { message: "Only customers can track parcels" });
      return;
    }

    const customerId = socket.userId!;

    try {
      // Verify customer owns this parcel
      const parcel = await prisma.parcel.findFirst({
        where: {
          id: parcelId,
          customerId,
        },
        include: {
          assignment: {
            include: {
              agent: {
                include: {
                  location: true,
                },
              },
            },
          },
        },
      });

      if (!parcel) {
        socket.emit("tracking:error", { message: "Parcel not found or access denied" });
        return;
      }

      if (!parcel.assignment) {
        socket.emit("tracking:error", { message: "Parcel not yet assigned to an agent" });
        return;
      }

      // Join customer to tracking room
      socket.join(`customer:${customerId}`);

      // Send current agent location if available
      if (parcel.assignment?.agent.location?.status === AgentLocationStatus.on_delivery) {
        socket.emit("parcel:location-update", {
          parcelId,
          agentLocation: {
            latitude: parcel.assignment.agent.location.latitude,
            longitude: parcel.assignment.agent.location.longitude,
            status: parcel.assignment.agent.location.status,
            updatedAt: parcel.assignment.agent.location.updatedAt,
          },
        });
      }

      socket.emit("tracking:started", {
        parcelId,
        message: "Real-time tracking started",
        agentInfo: {
          name: parcel.assignment.agent.fullName,
          phone: parcel.assignment.agent.phone,
          vehicleType: parcel.assignment.agent.vehicleType,
        },
      });

      Logger.info(`Customer ${customerId} started tracking parcel ${parcelId}`);
    } catch (error) {
      Logger.error("Parcel tracking error:", error);
      socket.emit("tracking:error", { message: "Failed to start tracking" });
    }
  }

  private async handleDisconnect(socket: AuthenticatedSocket) {
    const agentId = this.agentSockets.get(socket.id);

    if (agentId) {
      this.connectedAgents.delete(agentId);
      this.agentSockets.delete(socket.id);

      await prisma.agentLocation.update({
        where: { agentId },
        data: {
          status: AgentLocationStatus.available,
        },
      });

      Logger.info(`Agent ${agentId} disconnected from location sharing`);
    }

    Logger.info(`Socket disconnected: ${socket.id}`);
  }

  // Public method to get connected agents (for admin dashboard)
  public getConnectedAgents(): string[] {
    return Array.from(this.connectedAgents.keys());
  }

  // Public method to broadcast system messages
  public broadcastToAgent(agentId: string, event: string, data: any) {
    const socketId = this.connectedAgents.get(agentId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}
