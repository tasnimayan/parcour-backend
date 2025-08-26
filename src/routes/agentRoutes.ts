import { authenticate } from "../middleware/auth";
import { Router } from "express";
import * as agentController from "../controllers/agentController";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// All parcel routes require authentication
router.use(authenticate);

// Public routes
router.post("/location", authorize([UserRole.agent]), agentController.updateAgentLocation);
router.get("/stats", authorize([UserRole.agent]), agentController.getAgentParcelStats);

export default router;
