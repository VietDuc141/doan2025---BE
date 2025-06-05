const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Group = require("../models/Group");
const Campaign = require("../models/Campaign");
const Content = require("../models/Content");
const Player = require("../models/Player");

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Campaign.deleteMany({}),
      Content.deleteMany({}),
      Player.deleteMany({}),
    ]);

    // Create default group
    const defaultGroup = await Group.create({
      name: "Default Group",
      description: "Default group for all users",
    });

    // Create admin user
    const adminUser = await User.create({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      fullName: "System Administrator",
      role: "admin",
      groupId: defaultGroup._id,
      isActive: true,
    });

    // Create sample campaign
    const campaign = await Campaign.create({
      name: "Welcome Campaign",
      description: "Welcome campaign for new displays",
      status: "active",
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        frequency: "daily",
      },
      createdBy: adminUser._id,
    });

    // Create sample content
    const content = await Content.create({
      name: "Welcome Message",
      type: "image",
      url: "https://example.com/welcome.jpg",
      duration: 30,
      createdBy: adminUser._id,
    });

    // Create sample player
    const player = await Player.create({
      name: "Lobby Display",
      location: "Main Lobby",
      status: "active",
      groupId: defaultGroup._id,
      currentCampaign: campaign._id,
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedDatabase;
