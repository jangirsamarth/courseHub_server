import multer from "multer";
import { v4 as uuid } from "uuid";

// Configure storage options for multer
const storage = multer.diskStorage({
  // Define destination for storing files
  destination(req, file, cb) {
    cb(null, "uploads"); // Directory where files will be uploaded
  },
  // Define the filename for uploaded files
  filename(req, file, cb) {
    // Generate a unique identifier for each file
    const id = uuid();
    // Extract file extension from the original filename
    const extName = file.originalname.split(".").pop();
    // Create a new filename using UUID and the original file extension
    const fileName = `${id}.${extName}`;
    // Pass the new filename to the callback
    cb(null, fileName);
  },
});

// Export a multer instance with the configured storage
export const uploadFiles = multer({ storage }).single("file");
