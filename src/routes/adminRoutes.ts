import { authenticate } from "./../middleware/auth";
import { Router } from "express";
import * as adminController from "../controllers/adminController";

const router = Router();

// All parcel routes require authentication
router.use(authenticate);

// Public routes
router.post("/assign/agent", adminController.assignAgentToParcel);
router.get("/agents", adminController.getAgentsList);
router.get("/users", adminController.getUsersList);

export default router;
