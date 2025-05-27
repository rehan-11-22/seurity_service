const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Routes imports
const userRoutes = require("./routes/userRoute");
const rolesRoute = require("./routes/roleRoute");
const userPolicies = require("./routes/userPolicyRoute");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Route setup
app.use("/api/user", userRoutes);
app.use("/api/roles", rolesRoute);
app.use("/api", userPolicies);

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the CRUD API");
});

// Start the server
module.exports = app;

// Or for better Vercel compatibility:
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
