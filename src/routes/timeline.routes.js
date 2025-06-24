const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timeline.controller");

// Lấy danh sách all Timeline
router.get("/", timelineController.getAllTimelines);

// Lấy chi tiết 1 Timeline
router.get("/:id", timelineController.getTimelineById);

// Tạo mới Timeline
router.post("/", timelineController.createTimeline);

// Cập nhật Timeline
router.put("/:id", timelineController.updateTimeline);

// Xóa Timeline
router.delete("/:id", timelineController.deleteTimeline);

module.exports = router;
