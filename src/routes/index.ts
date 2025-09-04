import { Router } from "express";
import { ResponseHandler } from "../utils/response";
import config from "../config/env";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import agentRoutes from "./agentRoutes";
import parcelRoutes from "./parcelRoutes";
import trackingRoutes from "./trackingRoutes";

const router = Router();

// Authentication routes
router.use("/auth", authRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// Agent routes
router.use("/agent", agentRoutes);

// Parcel routes
router.use("/parcel", parcelRoutes);

// Tracking routes
router.use("/tracking", trackingRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  ResponseHandler.success(res, "API is running successfully", {
    version: config.API_VERSION,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API info endpoint
router.get("/", (req, res) => {
  ResponseHandler.success(res, "Parcour - Courier & Parcel Logistics API", {
    version: config.API_VERSION,
  });
});

export default router;
