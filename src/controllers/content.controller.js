const { validationResult } = require("express-validator");
const Content = require("../models/Content");
const fs = require("fs");
const path = require("path");

const contentController = {
  // Get all content
  getAllContent: async (req, res) => {
    try {
      const contents = await Content.find().populate(
        "createdBy",
        "username email"
      );

      res.json({
        status: "success",
        data: { contents },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get content by ID
  getContentById: async (req, res) => {
    try {
      const content = await Content.findById(req.params.id).populate(
        "createdBy",
        "username email"
      );

      if (!content) {
        return res.status(404).json({
          status: "error",
          message: "Content not found",
        });
      }

      res.json({
        status: "success",
        data: { content },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Create new content
  createContent: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, type, duration } = req.body;

      if (!req.file && type !== "text") {
        return res.status(400).json({
          status: "error",
          message: "File is required for image and video content",
        });
      }

      let url = "";
      let metadata = {};

      if (req.file) {
        // Get file path relative to uploads directory
        url = path.relative(
          path.join(__dirname, "../../uploads"),
          req.file.path
        );

        // Get file metadata
        const stats = fs.statSync(req.file.path);
        metadata = {
          size: stats.size,
          format: path.extname(req.file.originalname).substring(1),
          resolution: type === "video" ? "pending" : "pending", // You might want to use image/video processing library to get actual resolution
        };
      } else if (type === "text") {
        url = req.body.content; // For text content, store the actual text in url field
      }

      const content = new Content({
        name,
        type,
        url,
        duration: duration || 10,
        createdBy: req.user._id,
        metadata,
      });

      await content.save();

      res.status(201).json({
        status: "success",
        data: { content },
      });
    } catch (error) {
      // If error occurs, delete uploaded file if exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Update content
  updateContent: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, duration } = req.body;

      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({
          status: "error",
          message: "Content not found",
        });
      }

      // Update content
      content.name = name;
      if (duration) content.duration = duration;

      await content.save();

      res.json({
        status: "success",
        data: { content },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Delete content
  deleteContent: async (req, res) => {
    try {
      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({
          status: "error",
          message: "Content not found",
        });
      }

      // Delete file if exists
      if (content.type !== "text") {
        const filePath = path.join(__dirname, "../../uploads", content.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await content.remove();

      res.json({
        status: "success",
        message: "Content deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Toggle content status
  toggleContentStatus: async (req, res) => {
    try {
      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({
          status: "error",
          message: "Content not found",
        });
      }

      content.isActive = !content.isActive;
      await content.save();

      res.json({
        status: "success",
        data: { content },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Preview content
  previewContent: async (req, res) => {
    try {
      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({
          status: "error",
          message: "Content not found",
        });
      }

      if (content.type === "text") {
        return res.json({
          status: "success",
          data: { content: content.url },
        });
      }

      const filePath = path.join(__dirname, "../../uploads", content.url);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: "error",
          message: "Content file not found",
        });
      }

      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = contentController;
