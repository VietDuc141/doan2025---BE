require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const connectDB = require("./config/database");
const SocketService = require("./services/socketService");
const mongoose = require('mongoose');
const scheduleService = require('./services/schedule.service');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Basic route for health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Auth routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// User routes
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

// Group routes
const groupRoutes = require("./routes/group.routes");
app.use("/api/groups", groupRoutes);

// Player routes
const playerRoutes = require("./routes/player.routes");
app.use("/api/players", playerRoutes);

// Content routes
const contentRoutes = require("./routes/content.routes");
app.use("/api/content", contentRoutes);

// Campaign routes
const campaignRoutes = require("./routes/campaign.routes");
app.use("/api/campaigns", campaignRoutes);

// Plan routes
const planRoutes = require("./routes/plan.routes");
app.use("/api/plans", planRoutes);

// Timeline routes
const timelineRoutes = require("./routes/timeline.routes");
app.use("/api/timelines", timelineRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plandb')
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Initialize all plan schedules after DB connection
        scheduleService.initializeAllSchedules()
            .then(() => console.log('All plan schedules initialized'))
            .catch(err => console.error('Error initializing schedules:', err));
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message || "Something went wrong!",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
