const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "my_ultra_secure_secret_12345!@#";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "my_ultra_secure_refresh_secret_12345!@#";

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: "15m", // Access token expires in 15 minutes
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // Refresh token expires in 7 days
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
