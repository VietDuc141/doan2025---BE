const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "user:read",
          "user:write",
          "group:read",
          "group:write",
          "content:read",
          "content:write",
          "campaign:read",
          "campaign:write",
          "player:read",
          "player:write",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for name
groupSchema.index({ name: 1 });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
