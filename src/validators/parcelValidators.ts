import { body, query, param } from "express-validator";

export const parcelValidators = {
  // Common validations
  parcelId: param("id").isUUID().withMessage("Valid parcel ID is required"),

  // Create parcel validation
  createParcel: [
    body("pickupAddress")
      .isLength({ min: 10, max: 500 })
      .withMessage("Pickup address must be between 10 and 500 characters"),

    body("pickupLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Pickup latitude must be between -90 and 90"),

    body("pickupLng")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Pickup longitude must be between -180 and 180"),

    body("deliveryAddress")
      .isLength({ min: 10, max: 500 })
      .withMessage("Delivery address must be between 10 and 500 characters"),

    body("deliveryLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Delivery latitude must be between -90 and 90"),

    body("deliveryLng")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Delivery longitude must be between -180 and 180"),

    body("parcelType")
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type"),

    body("parcelSize")
      .isIn(["small", "medium", "large", "extra_large"])
      .withMessage("Parcel size must be one of: small, medium, large, extra_large"),

    body("paymentType")
      .isIn(["COD", "PREPAID", "ONLINE"])
      .withMessage("Payment type must be one of: COD, PREPAID, ONLINE"),

    body("codAmount").optional().isFloat({ min: 0.01 }).withMessage("COD amount must be greater than 0"),

    // Custom validation for COD amount
    body("codAmount").custom((value, { req }) => {
      if (req.body.paymentType === "COD" && (!value || value <= 0)) {
        throw new Error("COD amount is required and must be greater than 0 for COD payments");
      }
      return true;
    }),
  ],

  // Update parcel validation
  updateParcel: [
    body("pickupAddress")
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage("Pickup address must be between 10 and 500 characters"),

    body("pickupLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Pickup latitude must be between -90 and 90"),

    body("pickupLng")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Pickup longitude must be between -180 and 180"),

    body("deliveryAddress")
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage("Delivery address must be between 10 and 500 characters"),

    body("deliveryLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Delivery latitude must be between -90 and 90"),

    body("deliveryLng")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Delivery longitude must be between -180 and 180"),

    body("parcelType")
      .optional()
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type"),

    body("parcelSize")
      .optional()
      .isIn(["small", "medium", "large", "extra_large"])
      .withMessage("Parcel size must be one of: small, medium, large, extra_large"),

    body("paymentType")
      .optional()
      .isIn(["COD", "PREPAID", "ONLINE"])
      .withMessage("Payment type must be one of: COD, PREPAID, ONLINE"),

    body("codAmount").optional().isFloat({ min: 0.01 }).withMessage("COD amount must be greater than 0"),

    // Custom validation for COD amount
    body("codAmount").custom((value, { req }) => {
      if (req.body.paymentType === "COD" && (!value || value <= 0)) {
        throw new Error("COD amount is required and must be greater than 0 for COD payments");
      }
      return true;
    }),
  ],

  // Update status validation
  updateStatus: [
    body("status")
      .isIn(["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"])
      .withMessage("Invalid parcel status"),
  ],

  // Query parameters validation for listing parcels
  listParcels: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    query("status")
      .optional()
      .isIn(["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"])
      .withMessage("Invalid status filter"),

    query("paymentType").optional().isIn(["COD", "PREPAID", "ONLINE"]).withMessage("Invalid payment type filter"),

    query("parcelType")
      .optional()
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type filter"),

    query("sortBy")
      .optional()
      .isIn(["createdAt", "updatedAt", "status", "paymentType", "parcelType"])
      .withMessage("Invalid sort field"),

    query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  ],
};
