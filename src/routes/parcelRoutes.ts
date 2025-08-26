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
  authorize([UserRole.customer]),
  parcelValidators.createParcel,
  handleValidationErrors,
  parcelController.createParcel
);

// Get all parcels with filtering and pagination
router.get("/", parcelValidators.listParcels, handleValidationErrors, parcelController.getParcels);

// Get parcel statistics (Admin only)
router.get("/stats", authorize([UserRole.admin]), parcelController.getParcelStats);
router.get("/customer/stats", authorize([UserRole.customer]), parcelController.getCustomerStats);

router.get(
  "/track/:id",
  authorize([UserRole.agent, UserRole.customer, UserRole.admin]),
  parcelController.getParcelByTrackingCode
);

// Get single parcel by ID
router.get("/:id", parcelValidators.parcelId, handleValidationErrors, parcelController.getParcelById);

// Update parcel details (Customer only, PENDING status only)
router.put(
  "/:id",
  authorize([UserRole.customer]),
  parcelValidators.parcelId,
  parcelValidators.updateParcel,
  handleValidationErrors,
  parcelController.updateParcel
);

// Update parcel status (Admin and Agent only)
router.patch(
  "/:id/status",
  authorize([UserRole.admin, UserRole.agent]),
  parcelValidators.parcelId,
  parcelValidators.updateStatus,
  handleValidationErrors,
  parcelController.updateParcelStatus
);

// Delete parcel (Customer only, PENDING status only)
router.delete(
  "/:id",
  authorize([UserRole.customer]),
  parcelValidators.parcelId,
  handleValidationErrors,
  parcelController.deleteParcel
);

export default router;
