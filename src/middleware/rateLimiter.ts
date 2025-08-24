import rateLimit from "express-rate-limit";
import config from "../config/env";

export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: max || config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: "Too many requests, please try again later",
      error: "Rate limit exceeded",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter(10 * 60 * 1000, 20); // 5 attempts per 15 minutes for auth
export const generalRateLimit = createRateLimiter(); // Default rate limit
