const express = require("express");
const router = express.Router();
const timelineController = require("../controllers/timeline.controller");

// Lấy danh sách Timeline (có filter, search, phân trang)
router.get("/", timelineController.getTimelines);

// Lấy chi tiết 1 Timeline
router.get("/:id", timelineController.getTimelineById);

// Tạo mới Timeline
router.post("/", timelineController.createTimeline);

// Cập nhật Timeline
router.put("/:id", timelineController.updateTimeline);

// Xóa Timeline
router.delete("/:id", timelineController.deleteTimeline);

module.exports = router;
