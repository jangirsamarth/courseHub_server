import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// console.log("DB URI:", process.env.DB); // This should output your MongoDB URI

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Database Connected");
  } catch (error) {
    console.log("Error connecting to the database:", error);
  }
};
