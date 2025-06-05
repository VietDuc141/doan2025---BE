const logger = require("./logger");

exports.successResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  logger.info(`Success: ${message}`, { statusCode, data });
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.errorResponse = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null
) => {
  logger.error(`Error: ${message}`, { statusCode, errors });
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

exports.validationError = (res, errors) => {
  logger.warn("Validation Error", { errors });
  res.status(400).json({
    success: false,
    message: "Validation Error",
    errors: errors.array(),
  });
};
