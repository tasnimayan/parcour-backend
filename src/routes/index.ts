import { Router } from "express";
import { ResponseHandler } from "../utils/response";
import config from "../config/env";

const router = Router();

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
