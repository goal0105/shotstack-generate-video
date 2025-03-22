import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { detectLanguage, generateSrtBuffer, generateSrtFile, transcribeWithGroq } from "@services/videoService";

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

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe"); // Windows

class AudioExtractor {
  async extractAudio(videoPath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const audioStream = new PassThrough();
      const chunks: Buffer[] = [];

      ffmpeg(videoPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .toFormat("wav")
        .pipe(audioStream, { end: true }) // Pipe output directly to stream
        .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)));

      audioStream.on("data", (chunk) => chunks.push(chunk)); // Collect chunks
      audioStream.on("end", () => resolve(Buffer.concat(chunks))); // Convert to Buffer
    });
  }
}

async function uploadAudioFile(videoPath: string)
{
      // uploading audio data
      const audioExtractor = new AudioExtractor();
      try {
  
        const uploadAudioUrl = `${BUNNY_API_BASE_URL}/${BUNNY_STORAGE_ZONE}/temp_audio.wav`;
        const audioBuffer = await audioExtractor.extractAudio(videoPath);
    
        console.log("Extracted audio buffer size:", audioBuffer.length);
    
        const responseAudio = await fetch(uploadAudioUrl, {
          method: "PUT",
          headers: new Headers({
            "AccessKey": BUNNY_API_KEY,
            "Content-Type": "application/octet-stream",
          }),
          body: audioBuffer,
        });
    
        if (!responseAudio.ok) {
          throw new Error(`Upload failed: ${responseAudio.statusText}`);
        }
    
        console.log("Audio uploaded successfully.");
      } catch (error) {
        console.error("Error processing audio:", error);
      }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {

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

    const videoFilePath = uploadedFile.filepath;
    console.log("File Path : " + uploadedFile.filepath);

    // upload video File
    const videoBuffer = await fs.promises.readFile(videoFilePath);
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
      body: videoBuffer,
    });

    if (!response.ok) {
      throw new Error(`Bunny.net upload failed: ${response.statusText}`);
    }

    console.log("Uploaded Video file...");

    const bunnyFileUrl = `https://${BUNNY_LINKED_HOSTNAME}/${uniqueFileName}`;
    console.log("Video File uploaded successfully");

    //Upload srt file
    const audioPath = bunnyFileUrl;
    console.log("Uploading srt file...");
    const sourceLang = await detectLanguage(audioPath);

    console.log("Source Language: " + sourceLang);
    const targetLang = "he";
    
    const transcribeResult = await transcribeWithGroq(audioPath, sourceLang, targetLang);
    generateSrtFile(transcribeResult.segments);

    const srtBuffer = await generateSrtBuffer(transcribeResult.segments);

    const uploadSrtUrl = `${BUNNY_API_BASE_URL}/${BUNNY_STORAGE_ZONE}/${uniqueFileName}.srt`;
    console.log("Upload SRT URL: " + uploadSrtUrl);

    const responseSrt = await fetch(uploadSrtUrl, {
      method: "PUT",
      headers: new Headers({
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
      }),
      body: srtBuffer,
    });

    if (!responseSrt.ok) {
      throw new Error(`Bunny.net upload failed: ${responseSrt.statusText}`);
    }
    
    const bunnyStrUrl = `https://${BUNNY_LINKED_HOSTNAME}/${uniqueFileName}.srt`;
    console.log("Srt File uploaded successfully");

    return res.status(200).json({ message: "Srt File uploaded successfully", fileUrl: bunnyFileUrl, strUrl : bunnyStrUrl});
  } catch (error) {
    console.error("Error during file upload:", error);
    return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
  }
  }
  else {
    return res.status(405).json({ message: "Method not allowed" });
  }
};

