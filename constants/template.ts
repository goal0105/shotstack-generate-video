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
  // timeline: {
  //   background: '#000000',
  //   tracks: [
  //     {
  //       clips: [
  //         {
  //           asset: {
  //             type: 'text',
  //             text: '{{ headline }}',
  //             alignment: {
  //               horizontal: 'left',
  //               vertical: 'center'
  //             },
  //             font: {
  //               color: '#000000',
  //               family: 'Montserrat ExtraBold',
  //               size: '60',
  //               lineHeight: 1
  //             },
  //             width: 437,
  //             height: 200
  //           },
  //           start: 0.954,
  //           length: 'auto',
  //           offset: {
  //             x: 0,
  //             y: 0.302
  //           },
  //           position: 'center',
  //           fit: 'none',
  //           scale: 1
  //         }
  //       ]
  //     },
  //     {
  //       clips: [
  //         {
  //           length: 'auto',
  //           asset: {
  //             type: 'image',
  //             src: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/wzr6y0wtti/zzz01j7c-z74py-r3651-kegfa-f703hd/source.png'
  //           },
  //           start: 0.954,
  //           scale: 0.199,
  //           offset: {
  //             x: -0.016,
  //             y: 0.304
  //           },
  //           position: 'center'
  //         }
  //       ]
  //     },
  //     {
  //       clips: [
  //         {
  //           length: 'end',
  //           asset: {
  //             type: 'caption',
  //             src: 'alias://voiceover',
  //             background: {
  //               color: '#ff0000',
  //               padding: 19,
  //               borderRadius: 7
  //             },
  //             font: {
  //               size: '28'
  //             }
  //           },
  //           start: 0
  //         }
  //       ]
  //     },
  //     {
  //       clips: [
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 5,
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-2 }}'
  //           },
  //           start: 4,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         },
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 5,
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-4 }}'
  //           },
  //           start: 12,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         },
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 'end',
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-6 }}'
  //           },
  //           start: 20,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       clips: [
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 5,
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-1 }}'
  //           },
  //           start: 0,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         },
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 5,
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-3 }}'
  //           },
  //           start: 8,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         },
  //         {
  //           fit: 'crop',
  //           scale: 1,
  //           length: 5,
  //           asset: {
  //             width: '768',
  //             height: '1280',
  //             type: 'text-to-image',
  //             prompt: '{{ image-prompt-5 }}'
  //           },
  //           start: 16,
  //           effect: 'zoomOut',
  //           transition: {
  //             in: 'fade',
  //             out: 'fade'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       clips: [
  //         {
  //           length: 'auto',
  //           asset: {
  //             voice: 'Olivia',
  //             text: '{{ voiceover }}',
  //             type: 'text-to-speech'
  //           },
  //           start: 0,
  //           alias: 'voiceover'
  //         }
  //       ]
  //     }
  //   ]
  // },
  // output: {
  //   format: 'mp4',
  //   fps: 25,
  //   size: {
  //     width: 720,
  //     height: 1280
  //   },
  //   destinations: [
  //     {
  //       provider: 'tiktok'
  //     }
  //   ]

     "timeline":{
        "soundtrack":{
            "src":"https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
            "effect":"fadeOut"
        },
        "fonts": [
          {
              "src": "https://templates.shotstack.io/basic/asset/font/opensans-regular.ttf"
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
                            "font": {
                                "color": "#000000",
                                "family": "Open Sans",
                                "lineHeight": 1,
                                "size": 20
                            },
                            "background": {
                                "color": "#FFFFFF"
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

            // { clips }// Dynamic text clips

          //   {
          //     "clips":[
          //           {
          //             "asset": {
          //               "type": "html",
          //               "html": "<p>גדגדגדגדג</p>",
          //               "css": "p {font-family: 'Open Sans'; color: #ffffff; font-size: 42px; text-align: center; }",
          //               "width": 400,
          //               "height": 200,
          //               "background": "transparent",
          //               "position": "center"							 
          //             },
          //             "start": 0,
          //             "length": 11,
          //             "offset": {
          //                 "x": -0.25,
          //                 "y": -0.16
          //             },
          //             "transition": {
          //                 "in": "fade",
          //                 "out": "fade"
          //             },
          //             "effect": "zoomIn"
          //           }
          //     ]
          // },
          {
            "clips": [
                {
                    "asset": {
                        "type": "video",
                        "src": "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/earth.mp4",
                        "trim": 5
                    },
                    "start": 0,
                    "length": "auto",
                    "transition": {
                        "in": "fade",
                        "out": "fade"
                    }
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

