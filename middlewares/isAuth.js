import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import passport from "passport";  // Assuming Passport.js is configured for Google Auth

// Middleware to authenticate the user
export const isAuth = async (req, res, next) => {
  try {
    // First, check if user is authenticated via Google (from Passport session)
    if (req.isAuthenticated()) {
      // If the user is authenticated via Google, attach user to req and proceed
      req.user = req.user;
      return next();
    }

    // If not authenticated via Google, fallback to JWT token verification
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    // Verify the token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID from the decoded token
    req.user = await User.findById(decodedData._id);

    // Check if the user exists
    if (!req.user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Middleware to check if the user is an admin
export const isAdmin = (req, res, next) => {
  try {
    // Ensure req.user is defined before accessing properties
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Check if the user role is 'admin'
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not an admin",
      });
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({
      message: "Authorization failed",
      error: error.message,
    });
  }
};
