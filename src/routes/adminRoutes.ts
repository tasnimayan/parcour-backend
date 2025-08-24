import { authenticate } from "./../middleware/auth";
import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// All parcel routes require authentication
router.use(authenticate);

// Public routes
router.post("/assign/agent", authorize([UserRole.ADMIN]), adminController.assignAgentToParcel);
router.get("/agents", authorize([UserRole.ADMIN]), adminController.getAgentsList);
router.get("/users", authorize([UserRole.ADMIN]), adminController.getUsersList);

export default router;
