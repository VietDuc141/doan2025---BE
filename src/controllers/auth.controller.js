const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const config = require("../config");
const sendEmail = require("../utils/email");

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        fullName,
      });

      await user.save();

      // Generate token
      const token = jwt.sign({ userId: user._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      res.status(201).json({
        status: "success",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Find user
      const user = await User.findOne({
        $or: [{ email: username }, { username: username }],
      });

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: "error",
          message: "Account is disabled",
        });
      }

      // Generate token
      const token = jwt.sign({ userId: user._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        status: "success",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select(
        "-password -refreshToken"
      );
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }
      res.json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId);

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: "error",
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        status: "success",
        message: "Password updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

      await user.save();

      // Create reset URL
      const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

      // Send email
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`,
      });

      res.json({
        status: "success",
        message: "Password reset email sent",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { token, password } = req.body;

      // Get hashed token
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired reset token",
        });
      }

      // Set new password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({
        status: "success",
        message: "Password reset successful",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.user.userId, {
        refreshToken: null,
      });

      res.json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = authController;
