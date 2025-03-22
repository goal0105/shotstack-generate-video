import { OpenAI } from "openai";
import fs from "fs";
import path from 'path';
import { languageSchema} from '@validation/openai';
import Groq from "groq-sdk";

const LANGUAGE_NAME_MAP: { [key: string]: string } = {
    'english': 'en',
    'hebrew': 'he',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'chinese': 'zh',
    // Add other mappings as necessary
  };
  
  const normalizeLangCode = (lang: string): string => {
    // Normalize the language code to lower case and trim whitespace
    lang = lang.trim().toLowerCase();
    
    // Check if it's already a valid 2-letter code
    if (lang.length === 2 && Object.values(LANGUAGE_NAME_MAP).includes(lang)) {
      return lang;
    }
  
    // Check if it's a locale code (e.g., en-US)
    if (lang.includes('-')) {
      lang = lang.split('-')[0];
    }
  
    // Map common language names to codes
    return LANGUAGE_NAME_MAP[lang] || lang; // Return the mapped code or the input language if no mapping is found
  };

export const detectLanguage = async (audioPath: string): Promise<string> => {
    console.info("Start language detection ...");

    // console.log("Audio path:", audioPath);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

    const transcriptionResponse = await groq.audio.transcriptions.create({
        url: audioPath,
        model: "whisper-large-v3",
        response_format: "verbose_json",
        });

    const parsedResponse = languageSchema.safeParse(transcriptionResponse);
    const detectedLanguage = parsedResponse.success
                ? parsedResponse.data.language
                : "en";     // Default to 'en' if parsing fails

    // console.log("Transcription response:", transcriptionResponse);
    console.info("Detected language:", detectedLanguage);
    return normalizeLangCode(detectedLanguage);
};

export const transcribeWithGroq = async (
  audioPath: string,
  sourceLang: string,
  targetLang: string
): Promise<{
  segments: { start: number; end: number; text: string }[];
  detected_language: string;
  sample_text: string;
}> => {
  console.info('Start transcription with Groq ...');

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

  let response: any = null;

  try {
    // Try translations API first if target is English
    if (targetLang === 'en' && sourceLang !== 'en') {
      try {
        response = await groq.audio.translations.create({
         url: audioPath,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
        });
      } catch (error) {
        // Retry with transcription if translation fails
        response = await groq.audio.transcriptions.create({
          url: audioPath,
          model: 'whisper-large-v3',
          response_format: 'verbose_json',
          language: sourceLang,
        });
      }
    } else {
      // Regular transcription
      response = await groq.audio.transcriptions.create({
        url: audioPath,
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        language: sourceLang,
      });
    }

    // Parse response with zod schema to ensure it's valid
    const parsedResponse = languageSchema.safeParse(response);
    const detectedLanguage = parsedResponse.success
        ? parsedResponse.data.language
        : sourceLang; // Default to sourceLang if parsing fails

    const normalizedDetected = detectedLanguage.toLowerCase();

    // Process and validate segments
    const processedSegments: { start: number; end: number; text: string }[] = [];
    const segments = response.segments || [];
    const sampleText = segments[0]?.text || '';

    // console.log('segments:', segments);
    for (const segment of segments) {
      // Check if segment has start, end, and text properties
      //   if (segment.start !='' && segment.end && segment.text) {
      if (segment.end > segment.start && segment.text.trim()) {

        console.log('Origin Sentence:', segment.text.trim());
        const translateText = await translateWithGroqFallback(
          segment.text.trim(), 
          sourceLang, 
          targetLang);

        console.log('translateText:', translateText);

        processedSegments.push({
          start: parseFloat(segment.start),
          end: parseFloat(segment.end),
          text: translateText,
        });
      }
    }    // console.log('processedSegments:', processedSegments);
    console.info('Transcription completed. Detected language:', normalizedDetected);

    return {
      segments: processedSegments,
      detected_language: normalizedDetected,
      sample_text: sampleText,
    };
  } catch (error) {
    console.error('Transcription failed:', error);
    return {
      segments: [],
      detected_language: sourceLang,
      sample_text: '',
    };
  }
};
/**
 * Generates an SRT file from the provided subtitles.
 * 
 * @param subtitles - Array of subtitle objects, each containing 'start', 'end', and 'text'.
 * @returns The path of the generated SRT file.
 */
export const generateSrtFile = async (
  subtitles: { start: number; end: number; text: string }[]
): Promise<string> => {
  console.info('Start generating SRT file ...');
  
  // Generate unique SRT file path
  const srtPath = "subtitle.srt";

  try {
    // Open the SRT file for writing
    const srtFile = fs.createWriteStream(srtPath, { encoding: 'utf-8' });

    // Iterate through the subtitles and write them to the SRT file
    subtitles.forEach((sub, idx) => {
      const start = formatSrtTime(sub.start);
      const end = formatSrtTime(sub.end);
      const text = sub.text;

      // Write subtitle block to the SRT file
      srtFile.write(`${idx + 1}\n${start} --> ${end}\n${text}\n\n`);
    });

    // Close the file stream after writing
    srtFile.end();

    console.info('SRT file generated at:', srtPath);
    return srtPath;
  } catch (error) {
    console.error('Error generating SRT file:', error);
    throw new Error('Failed to generate SRT file');
  }
};

/**
 * Generates an SRT formatted buffer from the provided subtitles.
 * 
 * @param subtitles - Array of subtitle objects, each containing 'start', 'end', and 'text'.
 * @returns A buffer containing the generated SRT content.
 */
export const generateSrtBuffer = async (
    subtitles: { start: number; end: number; text: string }[]
  ): Promise<Buffer> => {
    console.info('Start generating SRT buffer ...');
  
    console.log('Subtitles:', subtitles);
    // Create an array to hold the SRT formatted text
    let srtContent = '';
  
    try {
      // Iterate through the subtitles and format them into SRT content
      subtitles.forEach((sub, idx) => {
        const start = formatSrtTime(sub.start);
        const end = formatSrtTime(sub.end);
        const text = sub.text;
  
        // Append each subtitle block to the content
        srtContent += `${idx + 1}\n${start} --> ${end}\n${text}\n\n`;
      });
  
      // Convert the formatted SRT content to a Buffer
      const srtBuffer = Buffer.from(srtContent, 'utf-8');
  
      console.info('SRT buffer generated.');
      return srtBuffer;
    } catch (error) {
      console.error('Error generating SRT buffer:', error);
      throw new Error('Failed to generate SRT buffer');
    }
  };

/**
 * Helper function to format the time into SRT format (HH:MM:SS,MS).
 * 
 * @param time - The time in seconds to format.
 * @returns The formatted time string in SRT format.
 */
const formatSrtTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};

/**
 * Helper function to pad numbers with leading zeros.
 * 
 * @param num - The number to pad.
 * @param size - The target size for the string (default is 2).
 * @returns The padded number as a string.
 */
const pad = (num: number, size: number = 2): string => {
  return num.toString().padStart(size, '0');
};

export const translateWithGroqFallback = async (
  text: string, 
  sourceLang: string, 
  targetLang: string): 
  Promise<string> => {

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

  try {
      let systemPrompt = "";
      // if (sourceLang === "ar") {
      //     systemPrompt = "You are an expert Arabic translator. Translate the following text to English, maintaining proper context and nuance. Preserve any technical terms, names, and numbers exactly as they appear.";
      // } else if (sourceLang === "he") {
      //     systemPrompt = "You are an expert Hebrew translator. Translate the following text to English, maintaining proper context and nuance. Preserve any technical terms, names, and numbers exactly as they appear.";
      // } else {
      //     systemPrompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
      //                     Maintain exact meaning, preserve numbers and proper nouns.`;
      // }

      systemPrompt = `Translate the following text from ${sourceLang} to Hebrew. 
                          Maintain exact meaning, preserve numbers and proper nouns.`;

      const completion = await groq.chat.completions.create
      ({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text.trim()}
        ],
        
        temperature: 0.1,
        max_tokens: 1000,
        model: "llama-3.3-70b-versatile",
      })

    const translatedText = completion.choices[0].message.content || text;
    return translatedText;
  } catch (error) {
      console.log(error);
      return text;
  }
}