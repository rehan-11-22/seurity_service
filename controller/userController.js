const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Role = require("../models/roleModel");
const { v4: uuidv4 } = require("uuid");
const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwtUtils");
const mongoose = require("mongoose");

// Register User
exports.register = async (req, res) => {
  const { email, password, role, roleId, fullName } = req.body;

  try {
    // Validate required fields
    if (!fullName || !email || !password || !role || !roleId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate roleId
    const existingRole = await Role.findOne({ roleId });
    if (!existingRole) {
      return res
        .status(400)
        .json({ message: "Invalid roleId: Role does not exist" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      email,
      userId: uuidv4(),
      password,
      role,
      roleId,
      fullName,
    });

    await newUser.save();

    // Generate tokens
    const token = generateToken(newUser.userId, newUser.role);
    const refreshToken = generateRefreshToken(newUser.userId);

    return res.status(201).json({
      message: "User registered successfully",
      userId: newUser.userId,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email, isDeleted: { $ne: true } });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials or account deleted" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const token = generateToken(user.userId, user.role);
    const refreshToken = generateRefreshToken(user.userId);

    return res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        fullName: user.fullName,
        userId: user.userId,
        role: user.role,
        roleId: user.roleId,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const newToken = generateToken(user.userId, user.role);

    return res.status(200).json({
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Get Users (protected)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select(
      "-password -__v"
    ); // Exclude password and version key

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get User by userId
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ userId, isDeleted: false }).select(
      "-password -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email, role, roleId, password } = req.body;

  try {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    const user = isValidObjectId
      ? await User.findById(userId)
      : await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (roleId) {
      const existingRole = await Role.findOne({ roleId });
      if (!existingRole) {
        return res
          .status(400)
          .json({ message: "Invalid roleId: Role does not exist" });
      }
    }

    const updates = {
      fullName: fullName ?? user.fullName,
      role: role ?? user.role,
      roleId: roleId ?? user.roleId,
    };

    if (email) {
      if (!email.endsWith("@rawasialbina.com")) {
        return res.status(400).json({
          message: "Invalid email domain. Only rawasialbina.com is allowed.",
        });
      }
      updates.email = email;
    }

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(new mongoose.Types.ObjectId(id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: "User is already deleted" });
    }

    user.isDeleted = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete All Users
exports.deleteAllUsers = async (req, res) => {
  try {
    await User.updateMany({}, { isDeleted: true });
    return res
      .status(200)
      .json({ message: "All users soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting all users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
