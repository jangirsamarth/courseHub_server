import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/User.js";

// Promisify fs.unlink for asynchronous file deletion
const unlinkAsync = promisify(fs.unlink);

// Create a new course
export const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price } = req.body;
  const image = req.file;

  if (!title || !description || !category || !createdBy || !duration || !price || !image) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  await Courses.create({
    title,
    description,
    category,
    createdBy,
    image: image.path,
    duration,
    price,
  });

  res.status(201).json({
    message: "Course Created Successfully",
  });
});

// Add a new lecture to a course
export const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "No Course with this id",
    });
  }

  const { title, description } = req.body;
  const file = req.file;

  if (!title || !description || !file) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const lecture = await Lecture.create({
    title,
    description,
    video: file.path,
    course: course._id,
  });

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

// Delete a lecture and its associated video
export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return res.status(404).json({
      message: "No Lecture with this id",
    });
  }

  await unlinkAsync(lecture.video);
  console.log("Video deleted");

  await lecture.deleteOne();

  res.json({
    message: "Lecture Deleted",
  });
});

// Delete a course and its associated lectures and image
export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "No Course with this id",
    });
  }

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(
    lectures.map(async (lecture) => {
      await unlinkAsync(lecture.video);
      console.log("Video deleted");
    })
  );

  await unlinkAsync(course.image);
  console.log("Image deleted");

  await Lecture.deleteMany({ course: req.params.id });

  await course.deleteOne();

  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({
    message: "Course Deleted",
  });
});

// Get all statistics (courses, lectures, and users)
export const getAllStats = TryCatch(async (req, res) => {
  const totalCourses = await Courses.countDocuments();
  const totalLectures = await Lecture.countDocuments();
  const totalUsers = await User.countDocuments();

  const stats = {
    totalCourses,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
});

// Get all users except the current user
export const getAllUser = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");

  res.json({ users });
});

// Update a user's role (only for superadmins)
export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin") {
    return res.status(403).json({
      message: "This endpoint is assigned to superadmin",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: "No User with this id",
    });
  }

  if (user.role === "user") {
    user.role = "admin";
  } else if (user.role === "admin") {
    user.role = "user";
  } else {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  await user.save();

  res.status(200).json({
    message: `Role updated to ${user.role}`,
  });
});
