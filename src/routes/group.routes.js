const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const groupController = require("../controllers/group.controller");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const checkPermission = require("../middleware/checkPermission");

// Validation middleware
const groupValidation = [
  body("name").trim().notEmpty().withMessage("Group name is required"),
  body("description").optional().trim(),
  body("permissions")
    .isArray()
    .withMessage("Permissions must be an array")
    .custom((value) => {
      const validPermissions = [
        "user:read",
        "user:write",
        "group:read",
        "group:write",
        "content:read",
        "content:write",
        "campaign:read",
        "campaign:write",
        "player:read",
        "player:write",
      ];
      return value.every((permission) => validPermissions.includes(permission));
    })
    .withMessage("Invalid permission(s)"),
];

// Routes
router.use(auth); // All group routes require authentication

// Get all groups
router.get("/", checkPermission("group:read"), groupController.getAllGroups);

// Get group by ID
router.get("/:id", checkPermission("group:read"), groupController.getGroupById);

// Create group
router.post(
  "/",
  checkRole("admin"),
  groupValidation,
  groupController.createGroup
);

// Update group
router.put(
  "/:id",
  checkRole("admin"),
  groupValidation,
  groupController.updateGroup
);

// Delete group
router.delete("/:id", checkRole("admin"), groupController.deleteGroup);

// Toggle group status
router.patch(
  "/:id/toggle-status",
  checkRole("admin"),
  groupController.toggleGroupStatus
);

module.exports = router;
