// You can edit this template on https://dashboard.shotstack.io/studio/overview
import fs from "fs";
import { auto } from "openai/_shims/registry.mjs";
import SrtParser  from "srt-parser-2";

interface Caption {
  id: string;           // ID is a string
  startTime: string;    // Start time in "hh:mm:ss,ms" format
  startSeconds: number; // Start time in seconds
  endTime: string;      // End time in "hh:mm:ss,ms" format
  endSeconds: number;   // End time in seconds
  text: string;         // Subtitle text
}

function parseSrtFile(srtFilePath: string) {
  const parser = new SrtParser();

  try {
    const srtContent = fs.readFileSync(srtFilePath, 'utf-8');
    const captions = parser.fromSrt(srtContent);
    // console.log(captions);
    return captions;
  } catch (error) {
    console.error("Error parsing SRT file:", error);
    return [];
  }
}

type Clip = {
  asset: {
    type: string;
    html?: string;
    css?: string;
  };
  start: number;
  length: number | string;
  offset: {
    x: Number;
    y: Number;
 },
  transition?: {
    in: string;
    out: string;
  };
};

function generateClips(srtFilePath: string) :  Clip[] {
  const clips: Clip[] = [];
  const captions: Caption[] = parseSrtFile(srtFilePath) as Caption[];

  for (let i = 0; i < 6; i++) {
    clips.push({
      asset: {
        type: 'html',
        html: `<p> Clip ${captions[i].text}</p>`,
        css: "p {font-family: 'Open Sans'; color: #ffffff; font-size: 42px; text-align: center; }",
      },
      start: captions[i].startSeconds, // Each clip starts after the previous one (6s duration)
      length: captions[i].endSeconds,    
      offset: {
        x: -0.25,
        y: -0.16
      },
      transition: {
        in: "fade",
        out: "fade"
      }
    });
  }

  // console.log(clips);
  return clips;
}

const clips: Clip[] =  generateClips("public/captions/caption-1.srt");

export const template = {
     "timeline":{
        "soundtrack":{
            "src":"https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
            "effect":"fadeOut"
        },
        "fonts": [
          {
              "src": "https://shotstack-assets.s3.amazonaws.com/fonts/Rubik-Medium.ttf"
          }
        ],
        "background":"#000000",
        "tracks":[
          {
              "clips": [
                  {
                      "asset": {
                          "type": "caption",
                          "src": '{{ caption-src }}',
                          "background": {
                            "color": "#0000FF",
                            "borderRadius": 2,
                            "padding": 8,
                            "opacity": 0.8
                        }, 
                        "font": {
                          "color": "#ffffff",
                          "family": "Rubik",
                          "size": 14,
                          "lineHeight": 0.8
                        },
                        "margin": {
                          "top": 0.88
                        }
                      },
                      "start": 0,
                      "length": "end"
                  }
              ]
          },
          {
              "clips":[
                  {
                      "asset": {
                          "type": 'text',
                            text: '{{video-title}}',
                            "font": {
                            "family": "Clear Sans",
                            "size": 32,
                            "color": "#FFFFFF"
                        }
                      },
                      "start" : 0,
                      "length": 24,
                      "transition":{
                          "in":"fade",
                          "out":"fade"
                      }
                  }
              ]
          },
          {
            "clips": [
                {
                    "asset": {
                        "type": "video",
                        "src": '{{VIDEO-FILE}}'
                    },
                    "start": 0,
                    "length": "auto"
                }
            ]
          }
        ]
    },
    output: {
    format: 'mp4',
    fps: 25,
    size: {
      width: 1280,
      height: 720
    }
  },
  merge: [
    {
      find: 'video-title',
      replace: 'Hello World'
    },
    {
      find: 'caption-src',
      replace: 'Caption Source'
    },
    {
      find : 'VIDEO-FILE',
      replace : ''
    },
    {
      find: 'headline',
      replace: 'Surprising Wildlife Wonders'
    },
    {
      find: 'voiceover',
      replace: 'wadup doc'
    },
    {
      find: 'image-prompt-1',
      replace: 'a sexy giraffe'
    },
    {
      find: 'image-prompt-2',
      replace: 'a sexy giraffe'
    },
    {
      find: 'image-prompt-3',
      replace: 'a sexy giraffe'
    },
    {
      find: 'image-prompt-4',
      replace: 'a sexy giraffe'
    },
    {
      find: 'image-prompt-5',
      replace: 'a sexy giraffe'
    },
    {
      find: 'image-prompt-6',
      replace: 'a sexy giraffe'
    },
    {
      find: 'voice',
      replace: 'Olivia'
    }
  ]
};

