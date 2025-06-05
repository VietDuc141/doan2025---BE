const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "video", "text"],
    },
    url: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
      min: 1,
      default: 10,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      size: Number,
      format: String,
      resolution: String,
      duration: Number, // For videos
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add indexes
contentSchema.index({ name: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ tags: 1 });

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
