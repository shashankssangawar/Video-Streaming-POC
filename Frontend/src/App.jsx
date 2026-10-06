import './App.css'
import UploadedVideoPlayer from './VideoPlayer';

function App() {
  return (
    <main className="app">
      <section className="video-section">
        <h1 className="video-title">
          Video Streaming
        </h1>

        <UploadedVideoPlayer
          src="http://127.0.0.1:5000/uploads/gallery/streaming-materials/15a08c77-32da-4a58-b002-65f8594f50de/master.m3u8"
        />
      </section>
    </main>
  )
}

export default App
