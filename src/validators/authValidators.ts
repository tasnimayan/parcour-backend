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

  phone: body("phone").trim().isMobilePhone("any").withMessage("Valid phone number is required"),

  altPhone: body("altPhone")
    .trim()
    .optional({ checkFalsy: true, nullable: true })
    .isMobilePhone("any")
    .withMessage("Valid alternative phone number is required"),

  governmentId: body("governmentId")
    .trim()
    .optional({ checkFalsy: true, nullable: true })
    .isLength({ min: 5, max: 20 })
    .withMessage("Government ID must be between 5 and 20 characters"),

  dob: body("dob")
    .optional({ checkFalsy: true, nullable: true })
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

  gender: body("gender")
    .optional()
    .toLowerCase()
    .isIn(["male", "female"])
    .withMessage("Gender must be either male or female"),

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
    body("phone").trim().isMobilePhone("any").withMessage("Valid phone number is required"),
    body("altPhone")
      .trim()
      .optional({ checkFalsy: true, nullable: true })
      .isMobilePhone("any")
      .withMessage("Valid alternative phone number is required"),
    body("governmentId")
      .trim()
      .optional({ checkFalsy: true, nullable: true })
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
      .toLowerCase()
      .optional()
      .isIn(["male", "female"])
      .withMessage("Gender must be either male or female"),
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
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),
    body("phone").trim().isMobilePhone("any").withMessage("Valid phone number is required"),
    body("altPhone")
      .trim()
      .optional({ checkFalsy: true, nullable: true })
      .isMobilePhone("any")
      .withMessage("Valid alternative phone number is required"),
    body("governmentId")
      .trim()
      .optional({ checkFalsy: true, nullable: true })
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
      .toLowerCase()
      .isIn(["bike", "car", "van", "truck", "bicycle"])
      .withMessage("Vehicle type must be one of: bike, car, van, truck, bicycle"),
    body("vehicleNumber")
      .optional({ checkFalsy: true, nullable: true })
      .isLength({ min: 3, max: 15 })
      .withMessage("Vehicle number must be between 3 and 15 characters"),
    body("licenseNo")
      .optional({ checkFalsy: true, nullable: true })
      .isLength({ min: 5, max: 20 })
      .withMessage("License number must be between 5 and 20 characters"),
    body("employmentType")
      .toLowerCase()
      .optional()
      .isIn(["full_time", "part_time", "contract"])
      .withMessage("Employment type must be one of: full_time, part_time, contract"),
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
