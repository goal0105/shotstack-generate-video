import { useState, useEffect} from "react";
import { ConfigProps } from '@models/config';

export default function FileUpload({ config, setConfig }: ConfigProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileUrl) {
      setConfig({ ...config, videoFile: fileUrl });
    }
  }, [fileUrl, config, setConfig]);

  console.log("fileUrl", config.videoFile);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
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
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("File uploaded successfully!");
        setFileUrl(data.fileUrl);
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      setMessage("An error occurred while uploading." + error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md w-96 mx-auto">
      <h2 className="text-lg font-bold mb-2">Upload Video File</h2>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
      {fileUrl && (
        <p className="mt-2">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            View Uploaded File
          </a>
        </p>
      )}
    </div>
  );
}
