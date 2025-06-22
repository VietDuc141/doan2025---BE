const Player = require("../models/Player");
const User = require("../models/User");

const logger = require("../utils/logger");

class SocketService {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.users = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      logger.info("New client connected:", socket.id);

      // Handle user connection
      socket.on("user-connect", async (data) => {
        try {
          const { userId } = data;
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

            // Broadcast user status to all connected clients
            this.io.emit("user-status-change", {
              userId: user._id,
              isOnline: true,
              lastActive: user.lastActive,
            });
          }
        } catch (error) {
          console.error("Error handling user connection:", error);
        }
      });

      // Handle player registration
      socket.on("register-player", async (data) => {
        try {
          const { deviceId } = data;

          // Update or create player in database
          const player = await Player.findOneAndUpdate(
            { deviceId },
            {
              status: "online",
              lastConnection: new Date(),
            },
            { upsert: true, new: true }
          );

          // Store socket connection
          this.players.set(deviceId, socket);
          socket.deviceId = deviceId;

          // Join player-specific room
          socket.join(`player:${deviceId}`);

          // Notify admin about player connection
          this.io.emit("player-status-change", {
            deviceId,
            status: "online",
          });
        } catch (error) {
          console.error("Error registering player:", error);
        }
      });

      // Handle content update requests from admin
      socket.on("update-content", async (data) => {
        const { deviceId, content } = data;
        const playerSocket = this.players.get(deviceId);

        if (playerSocket) {
          this.io.to(`player:${deviceId}`).emit("content-update", content);
        }
      });

      // Handle player settings update
      socket.on("update-settings", async (data) => {
        const { deviceId, settings } = data;
        try {
          await Player.findOneAndUpdate({ deviceId }, { settings });
          this.io.to(`player:${deviceId}`).emit("settings-update", settings);
        } catch (error) {
          console.error("Error updating player settings:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          if (socket.userId) {
            const user = await User.findById(socket.userId);
            if (user) {
              // Update user status
              user.isOnline = false;
              user.lastActive = new Date();
              await user.save();

              // Remove from users map
              this.users.delete(socket.userId);

              // Broadcast user status to all connected clients
              this.io.emit("user-status-change", {
                userId: user._id,
                isOnline: false,
                lastActive: user.lastActive,
              });
            }
          }

          if (socket.deviceId) {
            try {
              await Player.findOneAndUpdate(
                { deviceId: socket.deviceId },
                {
                  status: "offline",
                  lastConnection: new Date(),
                }
              );

              this.players.delete(socket.deviceId);

              // Notify admin about player disconnection
              this.io.emit("player-status-change", {
                deviceId: socket.deviceId,
                status: "offline",
              });
            } catch (error) {
              console.error("Error handling disconnect:", error);
            }
          }
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      });

      // Handle heartbeat to update user's last active time
      socket.on("heartbeat", async () => {
        try {
          if (socket.userId) {
            await User.findByIdAndUpdate(socket.userId, {
              lastActive: new Date(),
            });
          }
        } catch (error) {
          console.error("Error handling heartbeat:", error);
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
    this.io.to(`player:${deviceId}`).emit("content-update", content);
  }

  // Method to broadcast to all players
  broadcastToAllPlayers(event, data) {
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
