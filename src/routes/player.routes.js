const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const playerController = require("../controllers/player.controller");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Validation middleware
const playerValidation = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Player name must be at least 3 characters long"),
  body("hardwareId")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Hardware ID must be at least 3 characters long"),
  body("location")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location cannot be empty if provided"),
  body("displaySpecs")
    .optional()
    .isObject()
    .withMessage("Display specs must be an object"),
];

// Routes
router.use(auth); // Apply auth middleware to all routes

// Basic CRUD operations
router.get("/", checkPermission("player:read"), playerController.getAllPlayers);
router.get(
  "/:id",
  checkPermission("player:read"),
  playerController.getPlayerById
);
router.post("/register", playerValidation, playerController.registerPlayer);
router.put(
  "/:id",
  checkPermission("player:write"),
  playerValidation,
  playerController.updatePlayer
);
router.delete(
  "/:id",
  checkPermission("player:write"),
  playerController.deletePlayer
);

// Campaign management
router.post(
  "/:id/campaign",
  checkPermission("player:write"),
  body("campaignId").isMongoId().withMessage("Invalid campaign ID"),
  playerController.assignCampaign
);

module.exports = router;
