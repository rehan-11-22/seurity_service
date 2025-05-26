const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getUsers,
  updateUser,
  deleteUser,
  deleteAllUsers,
  getUserById,
} = require("../controller/userController");
const {
  authenticate,
  isAdminOrSuperadmin,
} = require("../middleware/roleMiddleware");

// Public routes
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes (require authentication and admin/superadmin role)
router.post("/register", register);
router.get("/getusers", authenticate, isAdminOrSuperadmin, getUsers);
// for specific user
router.get("/getuser/:userId", authenticate, getUserById);
router.put(
  "/updateusers/:userId",
  authenticate,
  isAdminOrSuperadmin,
  updateUser
);
router.delete("/deleteUser/:id", authenticate, isAdminOrSuperadmin, deleteUser);
router.delete(
  "/deleteAllUsers",
  authenticate,
  isAdminOrSuperadmin,
  deleteAllUsers
);

module.exports = router;
