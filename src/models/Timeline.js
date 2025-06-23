const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, 
    description: { type: String, default: "" }, 
    startTime: { type: Date, required: false }, 
    endTime: { type: Date, required: false }, 
    isRelative: { type: Boolean, default: false }, 
    isDisabled: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timeline", TimelineSchema);
