const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    eventType: { type: String, required: true },
    start: { type: Date, required: false },
    end: { type: Date, required: false },
    event: { type: String, required: false },
    group: { type: String, required: false },
    sov: { type: String, required: false },
    maxPlaysPerHour: { type: Number, default: 0 },
    locationAware: { type: Boolean, default: false },
    repeat: { type: String, default: "Always" },
    priority: { type: String, default: "Trung bình" },
    criteria: { type: String, default: "" },
    layout: { type: String, default: "" },
    order: { type: Number, default: 0 },
    cmsTime: { type: Boolean, default: false },
    sharedSchedule: { type: Boolean, default: false },
    directSchedule: { type: Boolean, default: false },
    campaigns: [
      {
        campaign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Campaign",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
