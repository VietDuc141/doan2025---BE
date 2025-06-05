const { validationResult } = require("express-validator");
const Player = require("../models/Player");
const Campaign = require("../models/Campaign");

const playerController = {
  // Get all players
  getAllPlayers: async (req, res) => {
    try {
      const players = await Player.find()
        .populate("assignedCampaign", "name")
        .populate("createdBy", "username email");

      res.json({
        status: "success",
        data: { players },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get player by ID
  getPlayerById: async (req, res) => {
    try {
      const player = await Player.findById(req.params.id)
        .populate("assignedCampaign", "name contents schedule")
        .populate("createdBy", "username email");

      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      res.json({
        status: "success",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Register new player
  registerPlayer: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, location, hardwareId, displaySpecs } = req.body;

      // Check if player with same hardware ID exists
      const existingPlayer = await Player.findOne({ hardwareId });
      if (existingPlayer) {
        return res.status(400).json({
          status: "error",
          message: "Player with this hardware ID already exists",
        });
      }

      const player = new Player({
        name,
        location,
        hardwareId,
        displaySpecs,
        createdBy: req.user._id,
      });

      await player.save();

      res.status(201).json({
        status: "success",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Update player
  updatePlayer: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, location, displaySpecs } = req.body;

      const player = await Player.findById(req.params.id);
      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      // Update player
      player.name = name;
      player.location = location;
      if (displaySpecs) player.displaySpecs = displaySpecs;

      await player.save();

      res.json({
        status: "success",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Delete player
  deletePlayer: async (req, res) => {
    try {
      const player = await Player.findById(req.params.id);
      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      await player.remove();

      res.json({
        status: "success",
        message: "Player deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Assign campaign to player
  assignCampaign: async (req, res) => {
    try {
      const { campaignId } = req.body;

      // Check if campaign exists
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      // Check if player exists
      const player = await Player.findById(req.params.id);
      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      // Assign campaign
      player.assignedCampaign = campaignId;
      await player.save();

      res.json({
        status: "success",
        message: "Campaign assigned successfully",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Remove campaign from player
  removeCampaign: async (req, res) => {
    try {
      const player = await Player.findById(req.params.id);
      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      player.assignedCampaign = null;
      await player.save();

      res.json({
        status: "success",
        message: "Campaign removed successfully",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get player status
  getPlayerStatus: async (req, res) => {
    try {
      const player = await Player.findById(req.params.id).select(
        "name status lastHeartbeat lastError"
      );

      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      res.json({
        status: "success",
        data: { player },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Update player heartbeat
  updateHeartbeat: async (req, res) => {
    try {
      const { hardwareId, status, error } = req.body;

      const player = await Player.findOne({ hardwareId });
      if (!player) {
        return res.status(404).json({
          status: "error",
          message: "Player not found",
        });
      }

      player.status = status;
      player.lastHeartbeat = new Date();
      if (error) {
        player.lastError = error;
      }

      await player.save();

      res.json({
        status: "success",
        message: "Heartbeat updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = playerController;
