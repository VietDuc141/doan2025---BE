/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error(err.stack);

  // Default error
  let statusCode = 500;
  let message = "Something went wrong!";
  let errors = null;

  // Handle different types of errors
  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  } else if (err.name === "CastError") {
    // Mongoose casting error (invalid ID)
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    statusCode = 400;
    message = "Duplicate field value entered";
    errors = Object.keys(err.keyValue).map((key) => ({
      field: key,
      message: `${key} already exists`,
    }));
  } else if (err.name === "JsonWebTokenError") {
    // JWT error
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    // JWT expired
    statusCode = 401;
    message = "Token expired";
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
