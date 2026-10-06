import '@videojs/react/video/compat-skin.css';
import { VideoPlayer, CompatVideoSkin } from "@videojs/react/video";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import "./video-player.css";

export default function UploadedVideoPlayer({
  src,
  autoPlay = false,
  muted = false,
  controls = true,
}) {
  if (!src) {
    return (
      <div className="video-empty">
        <p>Video source is not available</p>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <VideoPlayer>
        <CompatVideoSkin
          controls={controls}
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
          }}
        >
          <HlsJsVideo
            src={src}
            playsInline
            autoPlay={autoPlay}
            muted={muted}
          />
        </CompatVideoSkin>
      </VideoPlayer>
    </div>
  );
}
