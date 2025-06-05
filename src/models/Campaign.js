const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contents: [
      {
        content: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Content",
          required: true,
        },
        order: {
          type: Number,
          required: true,
          min: 0,
        },
        duration: {
          type: Number,
          min: 1,
        },
      },
    ],
    schedule: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      frequency: {
        type: String,
        enum: ["once", "daily", "weekly", "monthly"],
        default: "daily",
      },
      timeSlots: [
        {
          dayOfWeek: {
            type: Number,
            min: 0,
            max: 6,
          },
          startTime: {
            type: String,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm format
          },
          endTime: {
            type: String,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm format
          },
        },
      ],
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
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedScreens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add indexes
campaignSchema.index({ name: 1 });
campaignSchema.index({ "schedule.startDate": 1, "schedule.endDate": 1 });
campaignSchema.index({ isActive: 1, priority: -1 });

// Validate end date is after start date
campaignSchema.pre("save", function (next) {
  if (this.schedule.endDate <= this.schedule.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

module.exports = mongoose.model("Campaign", campaignSchema);
