import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidGen } from "uuid"
import { uploadVideo } from "./controller.js";


const UploadVideoRouter = express.Router();

/* =========================================================
   MULTER CONFIG
========================================================= */
// --- Multer middleware ---
const uploadsPath = path.resolve("uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname;
    const uploadPath = path.join("uploads", "gallery", folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidGen();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// Routes
UploadVideoRouter.post("/", upload.single('attachment'), uploadVideo);

export default UploadVideoRouter;
