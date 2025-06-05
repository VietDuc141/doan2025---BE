const Player = require("../models/Player");

class SocketService {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("New client connected");

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
}

module.exports = SocketService;
