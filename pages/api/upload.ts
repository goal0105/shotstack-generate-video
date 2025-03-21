import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";

// Ensure bodyParser is disabled for formidable to work
export const config = {
  api: {
    bodyParser: false,
  },
};

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || '';
const BUNNY_PULL_ZONE = process.env.BUNNY_PULL_ZONE || '';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';
const BUNNY_API_BASE_URL = 'https://storage.bunnycdn.com';
const BUNNY_LINKED_HOSTNAME = `${BUNNY_PULL_ZONE}.b-cdn.net`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  console.log("Uploading file...");
  try {
    const form = formidable({ multiples: false });

    // Parse the form as a Promise
    const parseForm = (): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
      return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          console.log("Parsing form...");
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });
    };

    const { files } = await parseForm();
    const fileData = files.file;
    const uploadedFile = Array.isArray(fileData) ? fileData[0] : fileData;

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
    console.log("File Path : " + uploadedFile.filepath);
    const fileName = path.basename(uploadedFile.originalFilename || "uploaded_file");
    const uniqueFileName = `${Date.now()}_${fileName}`;

    const uploadUrl = `${BUNNY_API_BASE_URL}/${BUNNY_STORAGE_ZONE}/${uniqueFileName}`;
    console.log("Upload URL: " + uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: new Headers({
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
      }),
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`Bunny.net upload failed: ${response.statusText}`);
    }

    const pullzoneFileUrl = `https://${BUNNY_LINKED_HOSTNAME}/${uniqueFileName}`;
    console.log("File uploaded successfully");
    return res.status(200).json({ message: "File uploaded successfully", fileUrl: pullzoneFileUrl });
  } catch (error) {
    console.error("Error during file upload:", error);
    return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
};
