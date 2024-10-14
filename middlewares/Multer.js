import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Re-create the __dirname variable in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//For iMages
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../images/")); // Adjust the path to the images folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};

export const multerUploader = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fieldSize: 2000000 }, // Limit size to 2MB
});



//For Resume

const multerStorage_resume = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../resumes/")); // Adjust path for your resumes folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const id = file.fieldname + "-" + uniqueSuffix + ".pdf";
    req.resume_id = id;
    cb(null, id);
  },
});

// File filter to only allow PDFs and reject images
const multerFilter_resume = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);  // Accept PDF files
  } else if (file.mimetype.startsWith("image")) {
    cb({ message: "Image files are not allowed. Please upload a PDF." }, false);
  } else {
    cb({ message: "Unsupported file format. Please upload a PDF." }, false);
  }
};

export const multerUploader_resume = multer({
  storage: multerStorage_resume,          
  fileFilter: multerFilter_resume,       
  limits: { fileSize: 2000000 },          
});