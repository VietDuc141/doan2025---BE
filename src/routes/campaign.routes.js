const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const campaignController = require("../controllers/campaign.controller");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Validation middleware
const campaignValidation = [
  body("name").trim().notEmpty().withMessage("Campaign name is required"),
  body("contents")
    .isArray()
    .withMessage("Contents must be an array")
    .notEmpty()
    .withMessage("At least one content item is required"),
  body("contents.*.contentId").isMongoId().withMessage("Invalid content ID"),
  body("contents.*.order")
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative number"),
  body("contents.*.duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive number"),
  body("schedule.startDate").isISO8601().withMessage("Invalid start date"),
  body("schedule.endDate")
    .isISO8601()
    .withMessage("Invalid end date")
    .custom((value, { req }) => {
      return new Date(value) > new Date(req.body.schedule.startDate);
    })
    .withMessage("End date must be after start date"),
  body("schedule.frequency")
    .isIn(["once", "daily", "weekly", "monthly"])
    .withMessage("Invalid frequency"),
  body("schedule.timeSlots")
    .isArray()
    .withMessage("Time slots must be an array"),
  body("schedule.timeSlots.*.dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("Day of week must be between 0 and 6"),
  body("schedule.timeSlots.*.startTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:mm format"),
  body("schedule.timeSlots.*.endTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:mm format")
    .custom((value, { req }) => {
      const startTime = req.body.schedule.timeSlots[0].startTime;
      return value > startTime;
    })
    .withMessage("End time must be after start time"),
];

// Routes
router.use(auth); // All campaign routes require authentication

// Get all campaigns
router.get(
  "/",
  checkPermission("campaign:read"),
  campaignController.getAllCampaigns
);

// Get campaign by ID
router.get(
  "/:id",
  checkPermission("campaign:read"),
  campaignController.getCampaignById
);

// Create campaign
router.post(
  "/",
  checkPermission("campaign:write"),
  campaignValidation,
  campaignController.createCampaign
);

// Update campaign
router.put(
  "/:id",
  checkPermission("campaign:write"),
  campaignValidation,
  campaignController.updateCampaign
);

// Delete campaign
router.delete(
  "/:id",
  checkPermission("campaign:write"),
  campaignController.deleteCampaign
);

// Toggle campaign status
router.patch(
  "/:id/toggle-status",
  checkPermission("campaign:write"),
  campaignController.toggleCampaignStatus
);

// Get campaign preview
router.get(
  "/:id/preview",
  checkPermission("campaign:read"),
  campaignController.getCampaignPreview
);

module.exports = router;
