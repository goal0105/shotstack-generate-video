import {
  ShotstackRenderResponse,
  ShotstackStatusResponse
} from '@models/shotstack';
import { VideoConfig } from '@models/config';
import {
  generateVoiceover,
  generateImagePrompts
} from '@services/openAIService';

import { template } from '@constants/template';

// const SHOTSTACK_API_URL = 'https://api.shotstack.io/edit/v1';
const SHOTSTACK_API_URL = 'https://api.shotstack.io/edit/stage';
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || '';

export const generateVideo = async (
  configData: VideoConfig
): Promise<string> => {
  console.info('Start video generation ...');

  // const voiceover = await generateVoiceover(configData.content);
  // console.log('voiceover', voiceover);
  // const imagePrompts = await generateImagePrompts(voiceover.text);
  // console.log('imagePrompts', imagePrompts);
  // const merge = [
  //   { find: 'headline', replace: imagePrompts.headline },
  //   { find: 'voice', replace: configData.voice },
  //   ...imagePrompts.prompts.map((prompt: string, index: number) => ({
  //     find: `image-prompt-${index + 1}`,
  //     replace: prompt
  //   })),
  //   { find: 'voiceover', replace: voiceover.text }
  // ];

  // console.log('merge', merge);

  // const payload = {
  //   ...template,
  //   merge: merge
  // };

    const payload = {
      "timeline":{
          "soundtrack":{
              "src":"https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
              "effect":"fadeOut"
          },
          "background":"#000000",
          "tracks":[
              {
                  "clips":[
                      {
                          "asset": {
                              "type": "text",
                              "text": "HELLO WORLD"
                          },
                          "start":0,
                          "length":5,
                          "transition":{
                              "in":"fade",
                              "out":"fade"
                         }
                      }
                  ]
              }
          ]
      },
      "output":{
          "format":"mp4",
          "size": {
              "width": 1024,
              "height": 576
          }
      }
  }

  console.log('payload', payload);

  const response = await fetch(`${SHOTSTACK_API_URL}/render`, {
    method: 'POST',
    headers: {
      'x-api-key': SHOTSTACK_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log('response', response);

  if (!response.ok) {
    throw new Error('Failed to generate video');
  }

  const data: ShotstackRenderResponse = await response.json();

  console.info(`Video generated successfully: ${data.response.id}`);

  return data.response.id;
};

export const pollVideoStatus = async (
  id: string
): Promise<{ status: string; url?: string }> => {
  const VIDEO_STATUS_URL = `${SHOTSTACK_API_URL}/render/${id}`;

  const response = await fetch(VIDEO_STATUS_URL, {
    method: 'GET',
    headers: {
      'x-api-key': SHOTSTACK_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video status');
  }

  const data: ShotstackStatusResponse = await response.json();

  const { status, url } = data.response;
  return { status, url };
};
