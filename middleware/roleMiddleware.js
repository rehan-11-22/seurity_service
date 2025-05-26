const { verifyToken } = require("../utils/jwtUtils");

// Authentication middleware
exports.authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Superadmin role check
exports.isSuperadmin = (req, res, next) => {
  if (req.user?.role === "SUPER_ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Superadmin role required." });
  }
};

// Admin role check
exports.isAdmin = (req, res, next) => {
  if (req.user?.role === "ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
};

// Admin or Superadmin role check
exports.isAdminOrSuperadmin = (req, res, next) => {
  if (req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin or Superadmin role required." });
  }
};
