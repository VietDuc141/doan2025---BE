const Timeline = require("../models/Timeline");

// Lấy danh sách Timeline (có filter, search, phân trang)
exports.getTimelines = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, isDisabled } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (isDisabled !== undefined) filter.isDisabled = isDisabled === "true";
    const timelines = await Timeline.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Timeline.countDocuments(filter);
    res.json({ data: timelines, total });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 Timeline
exports.getTimelineById = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline)
      return res.status(404).json({ message: "Không tìm thấy Timeline" });
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tạo mới Timeline
exports.createTimeline = async (req, res) => {
  try {
    const timeline = new Timeline(req.body);
    await timeline.save();
    res.status(201).json(timeline);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Tạo Timeline thất bại", error: err.message });
  }
};

// Cập nhật Timeline
exports.updateTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!timeline)
      return res.status(404).json({ message: "Không tìm thấy Timeline" });
    res.json(timeline);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Cập nhật Timeline thất bại", error: err.message });
  }
};

// Xóa Timeline
exports.deleteTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findByIdAndDelete(req.params.id);
    if (!timeline)
      return res.status(404).json({ message: "Không tìm thấy Timeline" });
    res.json({ message: "Đã xóa Timeline thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Xóa Timeline thất bại", error: err.message });
  }
};
