const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "No token, authorization denied",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user exists
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Token is not valid",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "User account is disabled",
      });
    }

    // Add user to request
    req.user = {
      userId: user._id,
      _id: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Token is not valid",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token has expired",
      });
    }
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
};

module.exports = auth;
