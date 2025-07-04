const Plan = require('../models/Plan');
const scheduleService = require('../services/schedule.service');

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

exports.getAllPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, eventType } = req.query;
    const query = {};

    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    const plans = await Plan.find(query)
      .populate('campaigns.campaign')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Plan.countDocuments(query);

    // Đảm bảo campaigns là mảng cho mỗi plan
    const sanitizedPlans = plans.map(plan => ({
      ...plan.toJSON(),
      campaigns: plan.campaigns || []
    }));

    res.json({
      data: sanitizedPlans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết 1 Plan
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate('campaigns.campaign');
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Đảm bảo campaigns là mảng
    const sanitizedPlan = {
      ...plan.toJSON(),
      campaigns: plan.campaigns || []
    };

    res.json(sanitizedPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo mới Plan
exports.createPlan = async (req, res) => {
  try {
    const plan = new Plan(req.body);
    const savedPlan = await plan.save();

    // Khởi tạo schedule nếu có start và end time
    if (savedPlan.start && savedPlan.end) {
      try {
        await scheduleService.initializePlanSchedule(savedPlan._id);
      } catch (scheduleError) {
        console.error('Error initializing schedule:', scheduleError);
        // Không throw error để không ảnh hưởng đến luồng tạo plan
      }
    }

    res.status(201).json(savedPlan);
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

    // Cập nhật schedule nếu có start và end time
    if (plan.start && plan.end) {
      try {
        await scheduleService.initializePlanSchedule(plan._id);
      } catch (scheduleError) {
        console.error('Error updating schedule:', scheduleError);
        // Không throw error để không ảnh hưởng đến luồng update plan
      }
    }

    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: "Cập nhật Plan thất bại", error: err.message });
  }
};

// Xóa Plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Không tìm thấy Plan" });

    // Hủy schedule trước khi xóa
    try {
      scheduleService.stopPlanSchedule(plan._id);
    } catch (scheduleError) {
      console.error('Error stopping schedule:', scheduleError);
      // Không throw error để không ảnh hưởng đến luồng xóa plan
    }

    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa Plan thành công" });
  } catch (err) {
    res.status(500).json({ message: "Xóa Plan thất bại", error: err.message });
  }
};
