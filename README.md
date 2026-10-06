# Video Streaming Platform

A full-stack video streaming platform with adaptive bitrate streaming (HLS) powered by FFmpeg, Express.js backend, and React + Video.js frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Video Streaming Platform                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │────▶│   Backend    │────▶│    FFmpeg    │    │
│  │  (React)     │     │  (Express)   │     │  (HLS/ABR)   │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│        │                    │                    │               │
│        │              ┌────▼────┐              │               │
│        │              │ Upload  │              │               │
│        │              │  Queue  │              │               │
│        │              └─────────┘              │               │
│        │                     │                 │               │
│        └─────────────────────┴─────────────────┘               │
│                              │                                  │
│                    ┌─────────▼─────────┐                        │
│                    │  Static File      │                        │
│                    │  Serving (/uploads)                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Backend (Express + FFmpeg)
- **Video Upload API**: `POST /api/upload/video` - Accepts video files via multipart/form-data
- **Adaptive Bitrate Streaming (ABR)**: Automatically transcodes videos to multiple resolutions (1080p, 720p, 480p, 360p)
- **HLS Output**: Generates MPEG-TS segments with `master.m3u8` playlist for adaptive streaming
- **Job Queue**: Concurrent processing with configurable job limits (default: 2)
- **Static File Serving**: Serves generated HLS segments and playlists via `/uploads` endpoint
- **CORS Enabled**: Configured for cross-origin requests from frontend

### Frontend (React + Vite + Video.js)
- **HLS Playback**: Uses Video.js with hls.js for adaptive streaming
- **Responsive Player**: 16:9 aspect ratio, full-width container
- **Auto-quality Selection**: Browser automatically selects best quality based on bandwidth

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend Runtime | Node.js (ES Modules) |
| Backend Framework | Express.js 5.x |
| Video Processing | FFmpeg (via child_process) |
| File Upload | Multer |
| Job Queue | In-memory with concurrency control |
| Frontend Framework | React 19 |
| Build Tool | Vite 8 |
| Video Player | Video.js 8 + @videojs/react + hls.js |
| Styling | Tailwind CSS 4 |

## Prerequisites

- **Node.js** 18+
- **FFmpeg** installed and in PATH
- **npm** or **yarn**

## Installation

### Backend
```bash
cd /home/punisher/Workspace/Experimental/Video-Stream
npm install
```

### Frontend
```bash
cd Frontend
npm install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
# From project root
npm start
# Server runs on http://0.0.0.0:5000
```

### Start Frontend (Terminal 2)
```bash
cd Frontend
npm run dev
# Vite dev server runs on http://localhost:5173
```

## API Endpoints

### Upload Video
```bash
POST /api/upload/video
Content-Type: multipart/form-data

Form field: attachment (video file)
```

**Response:**
```json
{
  "returncode": 200,
  "message": "Video uploaded and added to processing queue.",
  "output": {
    "video_id": "uuid",
    "video_url": "http://0.0.0.0:5000/uploads/gallery/streaming-materials/{video_id}/master.m3u8",
    "status": "processing"
  }
}
```

### Health Check
```bash
GET /
```

**Response:**
```json
{
  "message": "Hello World, Video Streaming is Playing!"
}
```

### Stream Video (HLS)
```
GET /uploads/gallery/streaming-materials/{video_id}/master.m3u8
GET /uploads/gallery/streaming-materials/{video_id}/{resolution}/playlist.m3u8
GET /uploads/gallery/streaming-materials/{video_id}/{resolution}/segment{number}.ts
```

## Video Processing Pipeline

1. **Upload**: Client POSTs video to `/api/upload/video`
2. **Queue**: Job added to processing queue (max 2 concurrent)
3. **Transcode**: FFmpeg generates 4 resolution variants:
   - 1080p (5000 kbps)
   - 720p (3000 kbps)
   - 480p (1500 kbps)
   - 360p (800 kbps)
4. **Segment**: Each variant split into 10-second MPEG-TS segments
5. **Playlist**: Generates `playlist.m3u8` per resolution + `master.m3u8`
6. **Serve**: Files accessible via static `/uploads` route

## Project Structure

```
Video-Stream/
├── server.js                 # Entry point
├── app.js                    # Express app setup
├── package.json              # Backend dependencies
├── constants/
│   └── server.js             # PORT, HOST, API_BASE_URL
├── config/
│   └── cors.js               # CORS middleware
├── api/
│   └── upload/video/
│       ├── route.js          # Multer + route definition
│       ├── controller.js     # Upload handler + job queue
│       └── supporting.js     # FFmpeg ABR processing logic
├── uploads/                  # Generated HLS files (gitignored)
│   ├── gallery/
│   │   ├── attachment/       # Original uploads
│   │   └── streaming-materials/
│   │       └── {video_id}/
│   │           ├── master.m3u8
│   │           ├── 1080p/playlist.m3u8 + segments
│   │           ├── 720p/playlist.m3u8 + segments
│   │           ├── 480p/playlist.m3u8 + segments
│   │           └── 360p/playlist.m3u8 + segments
└── Frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── VideoPlayer.jsx   # Video.js + hls.js wrapper
    │   ├── App.css
    │   ├── index.css
    │   └── video-player.css
    └── public/
```

## Configuration

### Backend (constants/server.js)
```javascript
export const PORT = 5000;
export const HOST = '0.0.0.0';
export const API_BASE_URL = `http://${HOST}:${PORT}`;
```

### Processing (supporting.js)
```javascript
const MAX_CONCURRENT_JOBS = 2;  // Adjust based on CPU cores

const resolutions = {
  "1080p": { width: 1920, height: 1080, videoBitrate: "5000k", ... },
  "720p":  { width: 1280, height: 720,  videoBitrate: "3000k", ... },
  "480p":  { width: 854,  height: 480,  videoBitrate: "1500k", ... },
  "360p":  { width: 640,  height: 360,  videoBitrate: "800k",  ... },
};
```

### Frontend (App.jsx)
```jsx
<UploadedVideoPlayer
  src="http://127.0.0.1:5000/uploads/gallery/streaming-materials/{video_id}/master.m3u8"
/>
```

## Development

### Backend Linting
```bash
npm run lint  # Not configured - add eslint if needed
```

### Frontend
```bash
cd Frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Troubleshooting

### FFmpeg not found
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verify
ffmpeg -version
```

### CORS Issues
Ensure frontend origin is allowed in `config/cors.js`

### Video not playing
1. Check backend is running on port 5000
2. Verify `master.m3u8` exists in uploads folder
3. Check browser network tab for failed segment requests
4. Ensure FFmpeg completed without errors (check backend logs)
