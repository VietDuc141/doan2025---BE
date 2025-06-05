require("dotenv").config();

module.exports = {
  app: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || "development",
  },

  // MongoDB configuration
  db: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/xibo_cms_dev",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || "noreply@xibo-cms.com",
  },

  // Frontend URL for email links
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // File upload configuration
  upload: {
    path: "uploads",
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/mpeg",
    ],
  },

  // Player configuration
  player: {
    heartbeatTimeout: 5 * 60 * 1000, // 5 minutes
    offlineTimeout: 15 * 60 * 1000, // 15 minutes
  },
};
