import { Router } from "express";
import * as trackingController from "../controllers/trackingController";
import { authenticate } from "../middleware/auth";
import { param } from "express-validator";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// All tracking routes require authentication
router.use(authenticate);

// Get parcel tracking by tracking code
router.get(
  "/code/:trackingCode",
  [param("trackingCode").notEmpty().withMessage("Tracking code is required")],
  handleValidationErrors,
  trackingController.getParcelTrackingByCode
);

export default router;
