const mongoose = require("mongoose");

const config = {
  development: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/xibo_cms_dev",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  test: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/xibo_cms_test",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      wtimeoutMS: 2500,
      socketTimeoutMS: 45000,
    },
  },
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      config[process.env.NODE_ENV || "development"].uri,
      config[process.env.NODE_ENV || "development"].options
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
