const { validationResult } = require("express-validator");
const Group = require("../models/Group");

const groupController = {
  // Get all groups
  getAllGroups: async (req, res) => {
    try {
      const groups = await Group.find();
      res.json({
        status: "success",
        data: { groups },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get group by ID
  getGroupById: async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          status: "error",
          message: "Group not found",
        });
      }

      res.json({
        status: "success",
        data: { group },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Create new group
  createGroup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, description, permissions } = req.body;

      // Check if group with same name exists
      const existingGroup = await Group.findOne({ name });
      if (existingGroup) {
        return res.status(400).json({
          status: "error",
          message: "Group with this name already exists",
        });
      }

      // Create group
      const group = new Group({
        name,
        description,
        permissions,
      });

      await group.save();

      res.status(201).json({
        status: "success",
        data: { group },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Update group
  updateGroup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, description, permissions } = req.body;

      // Check if group exists
      let group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          status: "error",
          message: "Group not found",
        });
      }

      // Check if new name is taken by another group
      if (name !== group.name) {
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) {
          return res.status(400).json({
            status: "error",
            message: "Group with this name already exists",
          });
        }
      }

      // Update group
      group.name = name;
      group.description = description;
      group.permissions = permissions;

      await group.save();

      res.json({
        status: "success",
        data: { group },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Delete group
  deleteGroup: async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          status: "error",
          message: "Group not found",
        });
      }

      await group.remove();

      res.json({
        status: "success",
        message: "Group deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Toggle group status
  toggleGroupStatus: async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          status: "error",
          message: "Group not found",
        });
      }

      group.isActive = !group.isActive;
      await group.save();

      res.json({
        status: "success",
        data: { group },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = groupController;
