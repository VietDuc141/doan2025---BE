const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hardwareId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    displaySpecs: {
      resolution: {
        width: Number,
        height: Number,
      },
      orientation: {
        type: String,
        enum: ["landscape", "portrait"],
        default: "landscape",
      },
      model: String,
      manufacturer: String,
    },
    status: {
      type: String,
      enum: ["online", "offline", "error"],
      default: "offline",
    },
    lastHeartbeat: {
      type: Date,
    },
    lastError: {
      message: String,
      timestamp: Date,
    },
    assignedCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
      autoStart: {
        type: Boolean,
        default: true,
      },
      cacheContent: {
        type: Boolean,
        default: true,
      },
      logLevel: {
        type: String,
        enum: ["error", "warn", "info", "debug"],
        default: "info",
      },
      heartbeatInterval: {
        type: Number,
        default: 30, // seconds
        min: 10,
        max: 300,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
playerSchema.index({ hardwareId: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ lastHeartbeat: 1 });

// Update status based on last heartbeat
playerSchema.pre("save", function (next) {
  const now = new Date();
  const heartbeatTimeout = 5 * 60 * 1000; // 5 minutes

  if (this.lastHeartbeat && now - this.lastHeartbeat > heartbeatTimeout) {
    this.status = "offline";
  }
  next();
});

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
