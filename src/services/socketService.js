const Player = require("../models/Player");
const User = require("../models/User");

const logger = require("../utils/logger");

class SocketService {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.users = new Map();
    logger.info("Socket service initialized");
    this.setupSocketHandlers();

    // Listen for plan events
    this.io.on('plan-started', (data) => {
      logger.info(`Plan started event received`, data);
      this.handlePlanStarted(data);
    });

    this.io.on('plan-ended', (data) => {
      logger.info(`Plan ended event received`, data);
      this.handlePlanEnded(data);
    });
  }

  async handlePlanStarted(data) {
    try {
      const { planId, campaigns } = data;
      logger.info(`Processing plan start - Plan ID: ${planId}, Campaigns: ${campaigns.length}`);

      // Get all connected players
      const connectedPlayers = Array.from(this.players.keys());
      logger.info(`Broadcasting to ${connectedPlayers.length} connected players`);

      // Send content to each connected player
      connectedPlayers.forEach(deviceId => {
        this.sendContentToPlayer(deviceId, campaigns);
        logger.info(`Sent campaigns to player - Device ID: ${deviceId}`);
      });
    } catch (error) {
      logger.error("Error handling plan start:", error);
    }
  }

  async handlePlanEnded(data) {
    try {
      const { planId } = data;
      logger.info(`Processing plan end - Plan ID: ${planId}`);

      // Get all connected players
      const connectedPlayers = Array.from(this.players.keys());
      
      // Clear content for each connected player
      connectedPlayers.forEach(deviceId => {
        this.sendContentToPlayer(deviceId, []);
        logger.info(`Cleared content for player - Device ID: ${deviceId}`);
      });
    } catch (error) {
      logger.error("Error handling plan end:", error);
    }
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      logger.info(`New client connected - Socket ID: ${socket.id}`);

      // Handle user connection
      socket.on("user-connect", async (data) => {
        try {
          const { userId } = data;
          logger.info(`User connection attempt - User ID: ${userId}, Socket ID: ${socket.id}`);
          
          const user = await User.findById(userId);

          if (user) {
            // Update user status
            user.isOnline = true;
            user.lastActive = new Date();
            await user.save();

            // Store socket connection
            this.users.set(userId, socket);
            socket.userId = userId;

            // Join user-specific room
            socket.join(`user:${userId}`);
            logger.info(`User successfully connected - User: ${user.username}, ID: ${userId}`);

            // Broadcast user status to all connected clients
            this.io.emit("user-status-change", {
              userId: user._id,
              isOnline: true,
              lastActive: user.lastActive,
            });
          } else {
            logger.warn(`User connection failed - Invalid User ID: ${userId}`);
          }
        } catch (error) {
          logger.error("Error handling user connection:", error);
        }
      });

      // Handle player registration
      socket.on("register-player", async (data) => {
        try {
          const { deviceId } = data;
          logger.info(`Player registration attempt - Device ID: ${deviceId}, Socket ID: ${socket.id}`);

          // Update or create player in database
          const player = await Player.findOneAndUpdate(
            { hardwareId: deviceId },
            {
              status: "online",
              lastHeartbeat: new Date(),
              name: `Player ${deviceId}`, // Default name
              createdBy: "684f5c00faa4fb21259996f4" // Default admin user ID
            },
            { upsert: true, new: true }
          );

          // Store socket connection
          this.players.set(deviceId, socket);
          socket.deviceId = deviceId;

          // Join player-specific room
          socket.join(`player:${deviceId}`);
          logger.info(`Player successfully registered - Device ID: ${deviceId}, Player ID: ${player._id}`);

          // Check for active plans and send content immediately
          this.sendActiveContentToPlayer(deviceId);

          // Notify admin about player connection
          this.io.emit("player-status-change", {
            deviceId,
            status: "online",
          });
        } catch (error) {
          logger.error("Error registering player:", error);
        }
      });

      // Handle content update requests from admin
      socket.on("update-content", async (data) => {
        const { deviceId, content } = data;
        logger.info(`Content update request - Device ID: ${deviceId}, Content ID: ${content?.id || 'N/A'}`);
        
        const playerSocket = this.players.get(deviceId);
        if (playerSocket) {
          this.io.to(`player:${deviceId}`).emit("content-update", content);
          logger.info(`Content update sent to player - Device ID: ${deviceId}`);
        } else {
          logger.warn(`Content update failed - Player not found - Device ID: ${deviceId}`);
        }
      });

      // Handle player settings update
      socket.on("update-settings", async (data) => {
        const { deviceId, settings } = data;
        logger.info(`Settings update request - Device ID: ${deviceId}`);
        
        try {
          await Player.findOneAndUpdate({ hardwareId: deviceId }, { settings });
          this.io.to(`player:${deviceId}`).emit("settings-update", settings);
          logger.info(`Settings successfully updated - Device ID: ${deviceId}`);
        } catch (error) {
          logger.error("Error updating player settings:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          if (socket.userId) {
            logger.info(`User disconnecting - User ID: ${socket.userId}, Socket ID: ${socket.id}`);
            const user = await User.findById(socket.userId);
            if (user) {
              // Update user status
              user.isOnline = false;
              user.lastActive = new Date();
              await user.save();

              // Remove from users map
              this.users.delete(socket.userId);
              logger.info(`User successfully disconnected - User: ${user.username}, ID: ${socket.userId}`);

              // Broadcast user status to all connected clients
              this.io.emit("user-status-change", {
                userId: user._id,
                isOnline: false,
                lastActive: user.lastActive,
              });
            }
          }

          if (socket.deviceId) {
            logger.info(`Player disconnecting - Device ID: ${socket.deviceId}, Socket ID: ${socket.id}`);
            try {
              await Player.findOneAndUpdate(
                { hardwareId: socket.deviceId },
                {
                  status: "offline",
                  lastHeartbeat: new Date(),
                }
              );

              this.players.delete(socket.deviceId);
              logger.info(`Player successfully disconnected - Device ID: ${socket.deviceId}`);

              // Notify admin about player disconnection
              this.io.emit("player-status-change", {
                deviceId: socket.deviceId,
                status: "offline",
              });
            } catch (error) {
              logger.error("Error handling player disconnect:", error);
            }
          }
        } catch (error) {
          logger.error("Error handling disconnect:", error);
        }
      });

      // Handle heartbeat to update user's last active time
      socket.on("heartbeat", async () => {
        try {
          if (socket.deviceId) {
            await Player.findOneAndUpdate(
              { hardwareId: socket.deviceId },
              { lastHeartbeat: new Date() }
            );
            logger.debug(`Heartbeat received - Device ID: ${socket.deviceId}`);
          }
        } catch (error) {
          logger.error("Error handling heartbeat:", error);
        }
      });
    });
  }

  // Method to get all connected players
  getConnectedPlayers() {
    return Array.from(this.players.keys());
  }

  // Method to send content to specific player
  sendContentToPlayer(deviceId, content) {
    logger.info(`Sending content to player - Device ID: ${deviceId}, Content: ${Array.isArray(content) ? content.length + ' items' : 'single item'}`);
    this.io.to(`player:${deviceId}`).emit("content-update", content);
  }

  // Method to check for active plans and send content to a player
  async sendActiveContentToPlayer(deviceId) {
    try {
      const Plan = require('../models/Plan');
      const now = new Date();

      // Find active plans
      const activePlans = await Plan.find({
        status: 'active',
        start: { $lte: now },
        end: { $gt: now }
      }).populate('campaigns.campaign');

      logger.info(`Found ${activePlans.length} active plans for player ${deviceId}`);

      if (activePlans.length > 0) {
        // For now, just send the campaigns from the first active plan
        const plan = activePlans[0];
        this.sendContentToPlayer(deviceId, plan.campaigns);
        logger.info(`Sent content from plan ${plan._id} to player ${deviceId}`);
      }
    } catch (error) {
      logger.error(`Error sending active content to player ${deviceId}:`, error);
    }
  }

  // Method to broadcast to all players
  broadcastToAllPlayers(event, data) {
    logger.info(`Broadcasting to all players - Event: ${event}`);
    this.io.emit(event, data);
  }

  // Get online status of specific user
  async getUserStatus(userId) {
    const user = await User.findById(userId).select("isOnline lastActive");
    return user ? { isOnline: user.isOnline, lastActive: user.lastActive } : null;
  }

  // Get all online users
  async getOnlineUsers() {
    return await User.find({ isOnline: true }).select(
      "_id username isOnline lastActive"
    );
  }
}

module.exports = SocketService;
