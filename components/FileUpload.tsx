import { useState, useEffect, useCallback, useRef } from "react";
import { ConfigProps } from '@models/config';
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 50MB vercel size

export default function FileUpload({ config, setConfig }: ConfigProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [strUrl, setStrUrl] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  const updateConfig = useCallback(() => {
    if (fileUrl && strUrl) {
      // Avoid unnecessary updates by checking if values have actually changed
      if (config.videoFile !== fileUrl || config.strFile !== strUrl) {
        setConfig(prevConfig => ({
          ...prevConfig,
          videoFile: fileUrl,
          strFile: strUrl,
        }));
        console.log("Updated Config:", { videoFile: fileUrl, strFile: strUrl });
      }
    }
  }, [fileUrl, strUrl, config, setConfig]);

  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateConfig();
  }, [fileUrl, strUrl, updateConfig]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {

    if (event.target.files) {
    const selectedFile = event.target.files[0]

      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setMessage("Please select a valid video file (MP4, MOV, AVI, or WebM)")
        return
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setMessage("Please select a video file under 500MB")
        return
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {

    console.log("Uploading file...");
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
   
    try {
      const response = await fetch("/api/upload", {
        method: 'POST',
        body: formData,
      });

      console.log("Response:", response);
      if (!response.ok) {
        const errorText = await response.text(); // Get error details
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();

      setMessage("File uploaded successfully!");
      setFileUrl(data.fileUrl);
      setStrUrl(data.strUrl);

    } catch (error) {
      setMessage("An error occurred while uploading." + error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md w-96 mx-auto mb-5">
      <h2 className="text-lg font-bold mb-2">Upload Video File</h2>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
