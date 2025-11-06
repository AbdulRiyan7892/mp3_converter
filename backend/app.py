from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Temporary directory for downloads
TEMP_DIR = "temp_downloads"
os.makedirs(TEMP_DIR, exist_ok=True)


def sanitize_filename(name: str) -> str:
    """
    Remove invalid filename characters for safety across OS.
    """
    return re.sub(r'[\\/*?:"<>|]', "", name)


@app.route("/download", methods=["POST"])
def download_mp3():
    try:
        data = request.get_json()
        url = data.get("url")

        if not url:
            return jsonify({"error": "Missing URL"}), 400

        # Step 1️⃣: Get video info (without downloading)
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            title = sanitize_filename(info.get("title", "song"))

        # Step 2️⃣: Define proper output path using the title
        output_path = os.path.join(TEMP_DIR, f"{title}.mp3")

        # Step 3️⃣: Download audio and convert to MP3
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": os.path.join(TEMP_DIR, "%(title)s.%(ext)s"),
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "quiet": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Step 4️⃣: Return the file to frontend
        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"{title}.mp3"
        )

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
