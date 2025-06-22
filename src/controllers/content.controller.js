const { validationResult } = require("express-validator");
const Content = require("../models/Content");
const fs = require("fs");
const path = require("path");

const contentController = {
  // Get all content
  getAllContent: async (req, res) => {
    try {
      const { id, name, createdBy, type, isActive } = req.query;

      // Build filter conditions
      const filter = {};

      if (id) {
        filter._id = id;
      }

      if (name) {
        filter.name = { $regex: name, $options: 'i' }; // case-insensitive search
      }

      if (createdBy) {
        filter.createdBy = createdBy;
      }

      if (type) {
        filter.type = type; // filter by content type (text, image, video)
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const contents = await Content.find(filter).populate(
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

      await Content.deleteOne({ _id: req.params.id });

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

  // Get total size of all content
  getTotalSize: async (req, res) => {
    try {
      const result = await Content.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: "$metadata.size" }
          }
        }
      ]);

      const totalSize = result.length > 0 ? result[0].totalSize : 0;

      // Convert to MB with 2 decimal places
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      res.json({
        success: true,
        data: {
          totalSize: totalSize, // in bytes
          totalSizeMB: parseFloat(totalSizeMB), // in megabytes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error calculating total content size",
        error: error.message
      });
    }
  },

  // Get total size by content type
  getTotalSizeByType: async (req, res) => {
    try {
      const { type } = req.query;
      let result;

      if (type) {
        // If type is provided, get data for specific type
        const contents = await Content.find({ type });
        let totalSize = 0;

        contents.forEach(content => {
          if (content.metadata && content.metadata.size) {
            totalSize += content.metadata.size;
          }
        });

        result = [{
          type,
          totalSize,
          sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
          count: contents.length
        }];
      } else {
        // Get all unique types from database
        const types = await Content.distinct('type');

        // Get data for each type
        result = await Promise.all(
          types.map(async (contentType) => {
            const contents = await Content.find({ type: contentType });
            let totalSize = 0;

            contents.forEach(content => {
              if (content.metadata && content.metadata.size) {
                totalSize += content.metadata.size;
              }
            });

            return {
              type: contentType,
              totalSize,
              sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
              count: contents.length
            };
          })
        );
      }

      res.json({
        status: "success",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = contentController;
