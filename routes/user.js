import express from "express";
import {
  forgotPassword,
  loginUser,
  myProfile,
  register,
  resetPassword,
  verifyUser,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";
import { addProgress, getYourProgress } from "../controllers/course.js";
import passport from 'passport';  // Import passport

const router = express.Router();

// Traditional Auth Routes
router.post("/user/register", register);
router.post("/user/verify", verifyUser);
router.post("/user/login", loginUser);
router.get("/user/me", isAuth, myProfile);
router.post("/user/forgot", forgotPassword);
router.post("/user/reset", resetPassword);
router.post("/user/progress", isAuth, addProgress);
router.get("/user/progress", isAuth, getYourProgress);

// Google Authentication Routes
// Initiate Google Login
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle the Google Auth callback
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirect to profile or dashboard after successful authentication
    res.redirect('/dashboard');
  }
);

// Logout route
router.get('/auth/logout', (req, res) => {
  req.logout();  // Log out using passport
  res.redirect('/');  // Redirect to home or login page after logging out
});

export default router;
