const Plan = require("../models/Plan");

// Lấy danh sách Plan (có filter, search, phân trang)
exports.getPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, eventType } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (eventType) filter.eventType = eventType;
    const plans = await Plan.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Plan.countDocuments(filter);
    res.json({ data: plans, total });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 Plan
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Không tìm thấy Plan" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tạo mới Plan
exports.createPlan = async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: "Tạo Plan thất bại", error: err.message });
  }
};

// Cập nhật Plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!plan) return res.status(404).json({ message: "Không tìm thấy Plan" });
    res.json(plan);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Cập nhật Plan thất bại", error: err.message });
  }
};

// Xóa Plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Không tìm thấy Plan" });
    res.json({ message: "Đã xóa Plan thành công" });
  } catch (err) {
    res.status(500).json({ message: "Xóa Plan thất bại", error: err.message });
  }
};
