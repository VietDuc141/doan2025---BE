/**
 * Middleware to check if user has required role
 * @param {string} requiredRole - The role to check for
 */
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          status: "error",
          message: `Role denied: ${requiredRole} role is required`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error checking role",
      });
    }
  };
};

module.exports = checkRole;
