import { body } from "express-validator";

export const authValidators = {
  // Common validation rules
  email: body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),

  password: body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  fullName: body("fullName")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  phone: body("phone").isMobilePhone("any").withMessage("Valid phone number is required"),

  altPhone: body("altPhone").optional().isMobilePhone("any").withMessage("Valid alternative phone number is required"),

  governmentId: body("governmentId")
    .optional()
    .isLength({ min: 5, max: 20 })
    .withMessage("Government ID must be between 5 and 20 characters"),

  dob: body("dob")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth is required (YYYY-MM-DD format)")
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 100) {
        throw new Error("Age must be between 18 and 100 years");
      }
      return true;
    }),

  gender: body("gender").optional().isIn(["MALE", "FEMALE"]).withMessage("Gender must be either MALE or FEMALE"),

  // Customer-specific validations
  customerSignup: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),
    body("phone").isMobilePhone("any").withMessage("Valid phone number is required"),
    body("altPhone").optional().isMobilePhone("any").withMessage("Valid alternative phone number is required"),
    body("governmentId")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("Government ID must be between 5 and 20 characters"),
    body("dob")
      .optional()
      .isISO8601()
      .withMessage("Valid date of birth is required (YYYY-MM-DD format)")
      .custom((value) => {
        if (value) {
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18 || age > 100) {
            throw new Error("Age must be between 18 and 100 years");
          }
        }
        return true;
      }),
    body("gender")
      .toUpperCase()
      .optional()
      .isIn(["MALE", "FEMALE"])
      .withMessage("Gender must be either MALE or FEMALE"),
  ],

  // Agent-specific validations
  agentSignup: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),
    body("phone").isMobilePhone("any").withMessage("Valid phone number is required"),
    body("altPhone").optional().isMobilePhone("any").withMessage("Valid alternative phone number is required"),
    body("governmentId")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("Government ID must be between 5 and 20 characters"),
    body("dob")
      .optional()
      .isISO8601()
      .withMessage("Valid date of birth is required (YYYY-MM-DD format)")
      .custom((value) => {
        if (value) {
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18 || age > 65) {
            throw new Error("Agent age must be between 18 and 65 years");
          }
        }
        return true;
      }),
    body("vehicleType")
      .toUpperCase()
      .isIn(["BIKE", "CAR", "VAN", "TRUCK", "BICYCLE"])
      .withMessage("Vehicle type must be one of: BIKE, CAR, VAN, TRUCK, BICYCLE"),
    body("vehicleNumber")
      .optional()
      .isLength({ min: 3, max: 15 })
      .withMessage("Vehicle number must be between 3 and 15 characters"),
    body("licenseNo")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("License number must be between 5 and 20 characters"),
    body("employmentType")
      .optional()
      .isIn(["FULL_TIME", "PART_TIME", "CONTRACT"])
      .withMessage("Employment type must be one of: FULL_TIME, PART_TIME, CONTRACT"),
  ],

  // Admin-specific validations
  adminSignup: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),
    body("department").isLength({ min: 2, max: 50 }).withMessage("Department must be between 2 and 50 characters"),
  ],

  // Login validation
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
};
