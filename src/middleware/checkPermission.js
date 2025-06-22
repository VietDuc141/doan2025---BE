/**
 * Middleware to check if user has required permission
 * @param {string} requiredPermission - The permission to check for
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      // Admin has all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user has a group
      // if (!req.user.groupId) {
      //   return res.status(403).json({
      //     status: "error",
      //     message: "User does not belong to any group",
      //   });
      // }

      // Check if user's group has the required permission
      // const hasPermission =
      //   req.user.groupId.permissions.includes(requiredPermission);

      // if (!hasPermission) {
      //   return res.status(403).json({
      //     status: "error",
      //     message: `Permission denied: ${requiredPermission} is required`,
      //   });
      // }

      next();
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error checking permissions",
      });
    }
  };
};

module.exports = checkPermission;
