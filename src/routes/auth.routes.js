const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

// Register validation
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email").isEmail().withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
];

// Login validation
const loginValidation = [
  body("username").notEmpty().withMessage("Username/Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Change password validation
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// Reset password validation
const resetPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("token").notEmpty().withMessage("Reset token is required"),
];

// Public routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post(
  "/forgot-password",
  body("email").isEmail(),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.resetPassword
);

// Protected routes (require authentication)
router.use(auth); // Apply auth middleware to all routes below
router.get("/me", authController.getCurrentUser);
router.post(
  "/change-password",
  changePasswordValidation,
  authController.changePassword
);
router.post("/logout", authController.logout);

module.exports = router;
