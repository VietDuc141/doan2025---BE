const { validationResult } = require("express-validator");
const Campaign = require("../models/Campaign");

const campaignController = {
  // Get all campaigns
  getAllCampaigns: async (req, res) => {
    try {
      const campaigns = await Campaign.find()
        .populate("contents.content", "name type url duration")
        .populate("createdBy", "username email");

      res.json({
        status: "success",
        data: { campaigns },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get campaign by ID
  getCampaignById: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate("contents.content", "name type url duration")
        .populate("createdBy", "username email");

      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      res.json({
        status: "success",
        data: { campaign },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Create new campaign
  createCampaign: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, description, contents, schedule } = req.body;

      const campaign = new Campaign({
        name,
        description,
        contents: contents.map((content) => ({
          content: content.contentId,
          order: content.order,
          duration: content.duration,
        })),
        schedule: {
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          frequency: schedule.frequency,
          timeSlots: schedule.timeSlots,
        },
        createdBy: req.user._id,
      });

      await campaign.save();

      // Populate the response
      const populatedCampaign = await Campaign.findById(campaign._id)
        .populate("contents.content", "name type url duration")
        .populate("createdBy", "username email");

      res.status(201).json({
        status: "success",
        data: { campaign: populatedCampaign },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Update campaign
  updateCampaign: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const { name, description, contents, schedule } = req.body;

      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      // Update campaign
      campaign.name = name;
      campaign.description = description;
      campaign.contents = contents.map((content) => ({
        content: content.contentId,
        order: content.order,
        duration: content.duration,
      }));
      campaign.schedule = {
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        frequency: schedule.frequency,
        timeSlots: schedule.timeSlots,
      };

      await campaign.save();

      // Populate the response
      const populatedCampaign = await Campaign.findById(campaign._id)
        .populate("contents.content", "name type url duration")
        .populate("createdBy", "username email");

      res.json({
        status: "success",
        data: { campaign: populatedCampaign },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Delete campaign
  deleteCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      await campaign.remove();

      res.json({
        status: "success",
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Toggle campaign status
  toggleCampaignStatus: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      campaign.isActive = !campaign.isActive;
      await campaign.save();

      res.json({
        status: "success",
        data: { campaign },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },

  // Get campaign preview
  getCampaignPreview: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id).populate(
        "contents.content",
        "name type url duration"
      );

      if (!campaign) {
        return res.status(404).json({
          status: "error",
          message: "Campaign not found",
        });
      }

      // Sort contents by order
      const sortedContents = campaign.contents
        .sort((a, b) => a.order - b.order)
        .map((content) => ({
          contentId: content.content._id,
          name: content.content.name,
          type: content.content.type,
          url: content.content.url,
          duration: content.duration || content.content.duration,
        }));

      res.json({
        status: "success",
        data: {
          campaignId: campaign._id,
          name: campaign.name,
          contents: sortedContents,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  },
};

module.exports = campaignController;
