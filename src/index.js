require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const config = require("./config");
const logger = require("./utils/logger");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const groupRoutes = require("./routes/group.routes");
const contentRoutes = require("./routes/content.routes");
const campaignRoutes = require("./routes/campaign.routes");
const playerRoutes = require("./routes/player.routes");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Basic Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Xibo CMS API",
      version: "1.0.0",
      description: "API documentation for Xibo CMS",
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/players", playerRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({
      status: "healthy",
      database: "connected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Create required directories
const dirs = ["../uploads", "../logs", "../backups"];
dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

app.get("/", (req, res) => {
  res.send("CMS API is running!");
});

const PORT = config.app.port;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
