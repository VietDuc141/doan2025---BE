const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const contentController = require("../controllers/content.controller");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../middleware/upload");

// Validation middleware
const contentValidation = [
  body("name").trim().notEmpty().withMessage("Content name is required"),
  body("type")
    .isIn(["image", "video", "text"])
    .withMessage("Invalid content type"),
  body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive number"),
];

// Text content validation
const textContentValidation = [
  ...contentValidation,
  body("content").notEmpty().withMessage("Text content is required"),
];

// Routes
router.use(auth); // All content routes require authentication

// Get all content
router.get(
  "/",
  checkPermission("content:read"),
  contentController.getAllContent
);

// Get content by ID
router.get(
  "/:id",
  checkPermission("content:read"),
  contentController.getContentById
);

// Create content (with file upload)
router.post(
  "/",
  checkPermission("content:write"),
  upload.single("file"),
  contentValidation,
  contentController.createContent
);

// Create text content
router.post(
  "/text",
  checkPermission("content:write"),
  textContentValidation,
  contentController.createContent
);

// Update content
router.put(
  "/:id",
  checkPermission("content:write"),
  upload.single("file"),
  contentValidation,
  contentController.updateContent
);

// Delete content
router.delete(
  "/:id",
  checkPermission("content:write"),
  contentController.deleteContent
);

// Toggle content status
router.patch(
  "/:id/toggle-status",
  checkPermission("content:write"),
  contentController.toggleContentStatus
);

// Preview content
router.get(
  "/:id/preview",
  checkPermission("content:read"),
  contentController.previewContent
);

module.exports = router;
