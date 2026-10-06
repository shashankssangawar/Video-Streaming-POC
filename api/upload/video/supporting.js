import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const MAX_CONCURRENT_JOBS = 2;

const queue = [];
let activeJobs = 0;

export const addVideoJob = (job) => {
  queue.push(job);
  processQueue();
};

const processQueue = () => {
  if (activeJobs >= MAX_CONCURRENT_JOBS) {
    return;
  }

  if (queue.length === 0) {
    return;
  }

  const job = queue.shift();

  activeJobs++;

  processVideo(job)
    .catch((error) => {
      console.error("Video processing failed:", error);
    })
    .finally(() => {
      activeJobs--;
      processQueue();
    });

  processQueue();
};

const processVideo = async ({
  videoPath,
  outputPath,
  video_id,
}) => {
  console.log(`Starting FFmpeg ABR job: ${video_id}`);

  const resolutions = {
    "1080p": {
      width: 1920,
      height: 1080,
      videoBitrate: "5000k",
      maxrate: "5350k",
      bufsize: "7500k",
      bandwidth: 5350000,
    },

    "720p": {
      width: 1280,
      height: 720,
      videoBitrate: "3000k",
      maxrate: "3210k",
      bufsize: "4500k",
      bandwidth: 3210000,
    },

    "480p": {
      width: 854,
      height: 480,
      videoBitrate: "1500k",
      maxrate: "1605k",
      bufsize: "2250k",
      bandwidth: 1605000,
    },

    "360p": {
      width: 640,
      height: 360,
      videoBitrate: "800k",
      maxrate: "856k",
      bufsize: "1200k",
      bandwidth: 856000,
    },
  };

  /*
   * Create directories
   */
  for (const resolution of Object.keys(resolutions)) {
    const dir = path.join(outputPath, resolution);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }
  }

  return new Promise((resolve, reject) => {
    const filterComplex = Object.entries(resolutions)
      .map(
        ([name, config], index) =>
          `[0:v]scale=w=${config.width}:h=${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`
      )
      .join(";");

    const mapArgs = [];

    Object.entries(resolutions).forEach(
      ([name, config], index) => {
        const outputDir = path.join(outputPath, name);

        mapArgs.push(
          "-map",
          `[v${index}]`,
          "-map",
          "0:a:0",

          `-c:v:${index}`,
          "libx264",

          `-b:v:${index}`,
          config.videoBitrate,

          `-maxrate:v:${index}`,
          config.maxrate,

          `-bufsize:v:${index}`,
          config.bufsize,

          `-preset`,
          "veryfast",

          `-profile:v:${index}`,
          "main",

          `-c:a:${index}`,
          "aac",

          `-b:a:${index}`,
          "128k",

          `-ac:a:${index}`,
          "2",

          `-ar:a:${index}`,
          "48000"
        );
      }
    );

    const varStreamMap = Object.keys(resolutions)
      .map(
        (_, index) => `v:${index},a:${index}`
      )
      .join(" ");

    const args = [
      "-y",

      "-i",
      videoPath,

      /*
       * Generate all resolutions from
       * the same input video.
       */
      "-filter_complex",
      filterComplex,

      /*
       * Map each video + audio pair.
       */
      ...mapArgs,

      /*
       * Force keyframes every 10 seconds.
       *
       * This is important for ABR switching because
       * all renditions need aligned segment boundaries.
       */
      "-force_key_frames",
      "expr:gte(t,n_forced*10)",

      /*
       * HLS
       */
      "-f",
      "hls",

      "-hls_time",
      "10",

      "-hls_playlist_type",
      "vod",

      "-hls_flags",
      "independent_segments",

      "-hls_segment_type",
      "mpegts",

      "-master_pl_name",
      "master.m3u8",

      "-var_stream_map",
      varStreamMap,

      "-hls_segment_filename",
      path.join(
        outputPath,
        "%v",
        "segment%03d.ts"
      ),

      path.join(
        outputPath,
        "%v",
        "playlist.m3u8"
      ),
    ];

    console.log(
      `FFmpeg command for ${video_id}:`,
      args.join(" ")
    );

    const ffmpeg = spawn("ffmpeg", args);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      const message = data.toString();

      stderr += message;

      /*
       * FFmpeg writes progress to stderr.
       *
       * Avoid logging everything in production.
       */
    });

    ffmpeg.on("error", (error) => {
      console.error(
        `FFmpeg spawn error [${video_id}]`,
        error
      );

      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log(
          `FFmpeg ABR completed: ${video_id}`
        );

        resolve();
      } else {
        console.error(
          `FFmpeg failed [${video_id}] with code ${code}`
        );

        console.error(stderr);

        reject(
          new Error(
            `FFmpeg exited with code ${code}`
          )
        );
      }
    });
  });
};
