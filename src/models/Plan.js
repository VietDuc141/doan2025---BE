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
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending'
    },
    campaigns: {
      type: [{
        campaign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Campaign",
          required: true,
        },
      }],
      default: []
    }
  },
  { timestamps: true }
);

// Validate thời gian kết thúc phải sau thời gian bắt đầu
PlanSchema.pre('save', function(next) {
    if (this.start && this.end && this.end <= this.start) {
        next(new Error('Thời gian kết thúc phải sau thời gian bắt đầu'));
    }
    next();
});

// Đảm bảo campaigns luôn là mảng khi trả về JSON
PlanSchema.set('toJSON', {
    transform: function(doc, ret) {
        if (!ret.campaigns) {
            ret.campaigns = [];
        }
        return ret;
    }
});

module.exports = mongoose.model("Plan", PlanSchema);
