const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Load environment variables first
dotenv.config();

// Routes imports
const userRoutes = require("./routes/userRoute");
const rolesRoute = require("./routes/roleRoute");
const userPolicies = require("./routes/userPolicyRoute");

const app = express();

// Middleware setup
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection (wrap in async function)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Connected to MongoDB...");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

// Route setup
app.use("/api/user", userRoutes);
app.use("/api/roles", rolesRoute);
app.use("/api", userPolicies);

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the CRUD API");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Export the Express app for Vercel
module.exports = app;
