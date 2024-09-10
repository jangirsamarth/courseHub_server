import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendMail, { sendForgotMail } from "../middlewares/sendMail.js";
import TryCatch from "../middlewares/TryCatch.js";
import dotenv from "dotenv";

dotenv.config();

export const register = TryCatch(async (req, res) => {
  const { email, name, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  user = new User({
    name,
    email,
    password: hashPassword,
  });

  const otp = Math.floor(Math.random() * 1000000);

  const activationToken = jwt.sign(
    {
      user: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
      otp,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "5m",
    }
  );

  const data = {
    name,
    otp,
  };

  await sendMail(email, "E-learning OTP", data);

  res.status(200).json({
    message: "OTP sent to your email",
    activationToken,
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { otp, activationToken } = req.body;

  const verify = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

  if (!verify) {
    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  if (verify.otp !== otp) {
    return res.status(400).json({
      message: "Incorrect OTP",
    });
  }

  const { name, email, password } = verify.user;

  await User.create({
    name,
    email,
    password,
  });

  res.json({
    message: "User registered successfully",
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "No user found with this email",
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(400).json({
      message: "Incorrect password",
    });
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.json({
    message: `Welcome back, ${user.name}`,
    token,
    user,
  });
});

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.json({ user });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: "No user found with this email",
    });
  }

  const token = jwt.sign({ email }, process.env.FORGOT_SECRET, {
    expiresIn: "10m",
  });

  const data = { email, token };

  await sendForgotMail("Reset Your Password", data);

  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
  await user.save();

  res.json({
    message: "Password reset link sent to your email",
  });
});

export const resetPassword = TryCatch(async (req, res) => {
  const { token } = req.query;

  const decodedData = jwt.verify(token, process.env.FORGOT_SECRET);

  const user = await User.findOne({ email: decodedData.email });

  if (!user) {
    return res.status(404).json({
      message: "No user found with this email",
    });
  }

  if (!user.resetPasswordExpire || user.resetPasswordExpire < Date.now()) {
    return res.status(400).json({
      message: "Password reset token has expired",
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  user.password = hashedPassword;
  user.resetPasswordExpire = null;
  await user.save();

  res.json({
    message: "Password has been reset successfully",
  });
});
