const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/user.controller");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Validation middleware
const userValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("role").isIn(["admin", "user"]).withMessage("Invalid role"),
];

// Routes
router.get("/", auth, checkRole("admin"), userController.getAllUsers);
router.get("/:id", auth, checkRole("admin"), userController.getUserById);
router.post(
  "/",
  auth,
  checkRole("admin"),
  // userValidation,
  userController.createUser
);
router.put(
  "/:id",
  auth,
  checkRole("admin"),
  userValidation,
  userController.updateUser
);
router.delete("/:id", auth, checkRole("admin"), userController.deleteUser);
router.put(
  "/:id/status",
  auth,
  checkRole("admin"),
  userController.toggleUserStatus
);
router.put(
  "/:id/group",
  auth,
  checkRole("admin"),
  userController.updateUserGroup
);
router.get("/status/:id", auth, userController.getUserStatus);
router.get("/online/all", auth, userController.getOnlineUsers);
router.get("/online/count", auth, userController.countOnlineUsers);

module.exports = router;
