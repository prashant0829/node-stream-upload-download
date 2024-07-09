import React, { useState, useEffect } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/videos");
      setVideos(response.data);
    } catch (error) {
      console.error("Error fetching videos", error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const uploadChunk = async (file, chunkIndex, totalChunks, chunkSize) => {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("originalname", file.name);
    formData.append("chunkIndex", chunkIndex);
    formData.append("totalChunks", totalChunks);

    try {
      await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(`Chunk ${chunkIndex + 1} of ${totalChunks} uploaded.`);
    } catch (error) {
      console.error("Error uploading chunk", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const chunkSize = 10 * 1024 * 1024; // 10MB
    const totalChunks = Math.ceil(selectedFile.size / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      await uploadChunk(selectedFile, chunkIndex, totalChunks, chunkSize);
    }

    alert("File uploaded successfully");
    fetchVideos();
  };

  const handleVideoClick = (video) => {
    setCurrentVideo(video);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-10 text-white">
      <h1 className="text-4xl font-bold mb-8">Video Upload and Stream</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-2/3 mb-8">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 w-full py-2 px-3 border border-gray-600 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleUpload}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 w-full"
        >
          Upload
        </button>
      </div>
      <h2 className="text-3xl font-semibold mb-6">Uploaded Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-2/3">
        {videos.map((video, index) => (
          <div
            key={index}
            className="cursor-pointer hover:scale-105 transform transition-transform duration-300"
            onClick={() => handleVideoClick(video)}
          >
            <div className="relative pb-16/9">
              <video
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg"
                src={`http://localhost:3000/video?filename=${video}`}
              ></video>
            </div>
            <div className="mt-2 text-center text-sm">{video}</div>
          </div>
        ))}
      </div>
      {currentVideo && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md w-2/3 mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Now Playing: {currentVideo}
          </h2>
          <video
            controls
            src={`http://localhost:3000/video?filename=${currentVideo}`}
            width="100%"
            className="rounded-lg shadow-md"
          ></video>
        </div>
      )}
    </div>
  );
};

export default App;
