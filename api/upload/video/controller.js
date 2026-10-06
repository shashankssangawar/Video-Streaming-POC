import fs from "fs";
import path from "path";
import { v4 as uuidGen } from "uuid";
import { API_BASE_URL } from "../../../constants/server.js";
import { addVideoJob } from "./supporting.js";

export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        returncode: 400,
        message: "Please upload a video file.",
        output: [],
      });
    }

    const video_id = uuidGen();
    const videoPath = req.file.path;
    const outputPath = path.resolve(`./uploads/gallery/streaming-materials/${video_id}`);

    /* Create output directory */
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, {
        recursive: true,
      });
    }

    /* Add video processing job */
    addVideoJob({ video_id, videoPath, outputPath });

    /*
     * IMPORTANT:
     * Return master.m3u8 instead of index.m3u8
     */
    const video_url =
      `${API_BASE_URL}` +
      `/uploads/gallery/streaming-materials/` +
      `${video_id}/master.m3u8`;

    return res.json({
      returncode: 200,
      message: "Video uploaded and added to processing queue.",
      output: {
        video_id,
        video_url,
        status: "processing",
      },
    });
  } catch (error) {
    console.log("Upload video error:", error);
    return res.status(500).json({
      returncode: 500,
      message: "Some errors occurred while completing your request, please try again later.",
      output: [],
    });
  }
};
