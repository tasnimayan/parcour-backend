import { Router } from "express";
import * as authController from "../controllers/authController";
import { authValidators } from "../validators/authValidators";
import { handleValidationErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimiter";

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Public routes
router.post("/signup/customer", authValidators.customerSignup, handleValidationErrors, authController.customerSignup);

router.post("/signup/agent", authValidators.agentSignup, handleValidationErrors, authController.agentSignup);

router.post("/signup/admin", authValidators.adminSignup, handleValidationErrors, authController.adminSignup);

router.post("/login", authValidators.login, handleValidationErrors, authController.login);

// Protected routes
router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, authController.getProfile);

router.get("/session", authenticate, authController.getSessionUser);

export default router;
