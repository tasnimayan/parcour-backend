import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Import configurations and utilities
import config from "./config/env";
import { Logger } from "./utils/logger";
import { ResponseHandler } from "./utils/response";
import { LocationService } from "./services/locationService";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { generalRateLimit } from "./middleware/rateLimiter";

// Import routes
import indexRoutes from "./routes";

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  public locationService: LocationService;

  constructor() {
    this.app = express();

    this.server = createServer(this.app);
    this.initializeSocket();

    this.initializeLogger();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.locationService = new LocationService(this.io);
    Logger.info("Socket.IO initialized for real-time location tracking");
  }

  private initializeLogger(): void {
    Logger.init();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Rate limiting
    this.app.use(generalRateLimit);

    // Request parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging
    if (config.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Request ID middleware for tracking
    this.app.use((req, res, next) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      req.headers["x-request-id"] = requestId;
      res.setHeader("x-request-id", requestId);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(`/api/${config.API_VERSION}`, indexRoutes);

    // 404 handler for undefined routes
    this.app.use("/{*any}", (req, res) => {
      ResponseHandler.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.server.listen(config.PORT, () => {
      Logger.info(`Server running on port ${config.PORT}`);
      Logger.info(`Environment: ${config.NODE_ENV}`);
      Logger.info(`API Base URL: http://localhost:${config.PORT}/api/${config.API_VERSION}`);
    });
  }
}

export default App;
