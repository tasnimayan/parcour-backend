import { body, query, param } from "express-validator";

export const parcelValidators = {
  // Common validations
  parcelId: param("id").isUUID().withMessage("Valid parcel ID is required"),

  // Create parcel validation
  createParcel: [
    body("pickupAddress")
      .isLength({ min: 10, max: 500 })
      .withMessage("Pickup address must be between 5 and 500 characters"),

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
      .withMessage("Delivery address must be between 5 and 500 characters"),

    body("deliveryLat")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("Delivery latitude must be between -90 and 90"),

    body("deliveryLng")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("Delivery longitude must be between -180 and 180"),

    body("recipientName")
      .isLength({ min: 3, max: 100 })
      .withMessage("Recipient name must be between 3 and 100 characters"),

    body("recipientPhone")
      .isLength({ min: 10, max: 15 })
      .withMessage("Recipient phone must be between 10 and 15 characters"),

    body("parcelType")
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type"),

    body("serviceType").toLowerCase().isIn(["standard", "express", "urgent"]).withMessage("Invalid service type"),

    body("parcelSize")
      .toLowerCase()
      .isIn(["small", "medium", "large", "extra_large"])
      .withMessage("Parcel size must be one of: small, medium, large, extra_large"),

    body("parcelWeight").optional().isFloat({ min: 0.01 }).withMessage("Parcel weight must be greater than 0"),

    body("paymentType")
      .toLowerCase()
      .isIn(["cod", "prepaid", "online"])
      .withMessage("Payment type must be one of: cod, prepaid, online"),

    body("codAmount").optional().isFloat({ min: 0.01 }).withMessage("COD amount must be greater than 0"),

    // Custom validation for COD amount
    body("codAmount").custom((value, { req }) => {
      if (req.body.paymentType === "cod" && (!value || value <= 0)) {
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
      .toLowerCase()
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type"),

    body("parcelSize")
      .optional()
      .toLowerCase()
      .isIn(["small", "medium", "large", "extra_large"])
      .withMessage("Parcel size must be one of: small, medium, large, extra_large"),
    body("parcelWeight").optional().isFloat({ min: 0.01 }).withMessage("Parcel weight must be greater than 0"),

    body("paymentType")
      .optional()
      .toLowerCase()
      .isIn(["cod", "prepaid", "online"])
      .withMessage("Payment type must be one of: cod, prepaid, online"),

    body("codAmount").optional().isFloat({ min: 0.01 }).withMessage("COD amount must be greater than 0"),

    // Custom validation for COD amount
    body("codAmount").custom((value, { req }) => {
      if (req.body.paymentType === "cod" && (!value || value <= 0)) {
        throw new Error("COD amount is required and must be greater than 0 for COD payments");
      }
      return true;
    }),
  ],

  // Update status validation
  updateStatus: [
    body("status")
      .toLowerCase()
      .isIn(["pending", "assigned", "picked_up", "in_transit", "delivered", "failed"])
      .withMessage("Invalid parcel status"),
  ],

  // Query parameters validation for listing parcels
  listParcels: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    query("status")
      .optional()
      .toLowerCase()
      .isIn(["pending", "assigned", "picked_up", "in_transit", "delivered", "failed"])
      .withMessage("Invalid status filter"),

    query("paymentType")
      .optional()
      .toLowerCase()
      .isIn(["cod", "prepaid", "online"])
      .withMessage("Invalid payment type filter"),

    query("parcelType")
      .optional()
      .toLowerCase()
      .isIn(["document", "package", "fragile", "electronics", "clothing", "food", "medicine", "other"])
      .withMessage("Invalid parcel type filter"),

    query("sortBy")
      .optional()
      .toLowerCase()
      .isIn(["createdAt", "updatedAt", "status", "paymentType", "parcelType"])
      .withMessage("Invalid sort field"),

    query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  ],
};
