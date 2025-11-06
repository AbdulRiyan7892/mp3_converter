import { useState } from "react";
import "./App.css";
import ProgressBar from "./components/ProgressBar";

export default function App() {
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [dirHandle, setDirHandle] = useState(null);

  // Step 1️⃣ — Choose folder (purely user action)
  const handleChooseFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      alert("✅ Folder access granted!");
    } catch (err) {
      console.error("Folder selection canceled or not supported:", err);
      alert("❌ Folder access canceled or not supported.");
    }
  };

  // Step 2️⃣ — Download and save
  const handleDownload = async () => {
    if (!url) return alert("Please enter a valid YouTube link!");
    if (!dirHandle) return alert("Please select a folder first!");

    setDownloading(true);
    setProgress(10);

    try {
      // ✅ Request permission explicitly before writing
      const permission = await dirHandle.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        alert("❌ Permission to write to folder denied.");
        return;
      }

      // 🔹 Fetch from backend
      const response = await fetch("http://127.0.0.1:5000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Download failed on server");
      setProgress(60);

      const blob = await response.blob();

      // 🔹 Save file to chosen directory
      const fileHandle = await dirHandle.getFileHandle("song.mp3", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      setProgress(100);
      alert("✅ Downloaded and saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error: " + err.message);
    } finally {
      setDownloading(false);
      setTimeout(() => setProgress(0), 2500);
    }
  };

  return (
    <div className="app">
      <h1>🎵 YouTube to MP3 Downloader</h1>

      <input
        type="text"
        placeholder="Paste YouTube or Music link..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="buttons">
        <button onClick={handleChooseFolder}>📁 Choose Folder</button>
        <button disabled={downloading} onClick={handleDownload}>
          {downloading ? "Downloading..." : "Download & Save MP3"}
        </button>
      </div>

      {progress > 0 && <ProgressBar progress={progress} />}

      <p className="footer">Developed with ❤️ using yt-dlp + Flask + React</p>
    </div>
  );
}
