require("dotenv").config();
const mongoose = require("mongoose");
const seedDatabase = require("../config/seedData");

const runSeed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/xibo-cms"
    );
    console.log("Connected to MongoDB");

    // Run seed
    await seedDatabase();
    console.log("Seeding completed");

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error running seed:", error);
    process.exit(1);
  }
};

runSeed();
