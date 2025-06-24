const express = require("express");
const router = express.Router();
const planController = require("../controllers/plan.controller");

// Lấy danh sách Plan (có filter, search, phân trang)
router.get("/", planController.getPlans);

// Lấy chi tiết 1 Plan
router.get("/:id", planController.getPlanById);

// Tạo mới Plan
router.post("/", planController.createPlan);

// Cập nhật Plan
router.put("/:id", planController.updatePlan);

// Xóa Plan
router.delete("/:id", planController.deletePlan);

module.exports = router;
