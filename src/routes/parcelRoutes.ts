import { Router } from "express";
import * as parcelController from "../controllers/parcelController";
import { parcelValidators } from "../validators/parcelValidators";
import { handleValidationErrors } from "../middleware/validation";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// All parcel routes require authentication
router.use(authenticate);

// Create parcel (Customer only)
router.post(
  "/",
  authorize([UserRole.CUSTOMER]),
  parcelValidators.createParcel,
  handleValidationErrors,
  parcelController.createParcel
);

// Get all parcels with filtering and pagination
router.get("/", parcelValidators.listParcels, handleValidationErrors, parcelController.getParcels);

// Get parcel statistics (Admin only)
router.get("/stats", authorize([UserRole.ADMIN]), parcelController.getParcelStats);

// Get single parcel by ID
router.get("/:id", parcelValidators.parcelId, handleValidationErrors, parcelController.getParcelById);

// Update parcel details (Customer only, PENDING status only)
router.put(
  "/:id",
  authorize([UserRole.CUSTOMER]),
  parcelValidators.parcelId,
  parcelValidators.updateParcel,
  handleValidationErrors,
  parcelController.updateParcel
);

// Update parcel status (Admin and Agent only)
router.patch(
  "/:id/status",
  authorize([UserRole.ADMIN, UserRole.AGENT]),
  parcelValidators.parcelId,
  parcelValidators.updateStatus,
  handleValidationErrors,
  parcelController.updateParcelStatus
);

// Delete parcel (Customer only, PENDING status only)
router.delete(
  "/:id",
  authorize([UserRole.CUSTOMER]),
  parcelValidators.parcelId,
  handleValidationErrors,
  parcelController.deleteParcel
);

export default router;
