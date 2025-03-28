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
import { config } from 'process';

const SHOTSTACK_API_URL = 'https://api.shotstack.io/edit/v1';
// const SHOTSTACK_API_URL = 'https://api.shotstack.io/edit/stage';
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || '';

const CAPTION_ENGLISH = "https://roni-dev-storage.b-cdn.net/caption.srt";
// const CAPTION_HEBREW = "https://raw.githubusercontent.com/goal0105/ref/refs/heads/main/captions/caption-1.srt";
const CAPTION_HEBREW = "https://roni-dev-storage.b-cdn.net/caption111.srt";


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

  let replaceVidoeTitle = '';
  if (!configData.videoTitle) {
    replaceVidoeTitle = 'Hello World';
  }
  else {
    replaceVidoeTitle = configData.videoTitle
  }

  let captionSrc = '';
  if (configData.caption === 'English') {  
    captionSrc = CAPTION_ENGLISH;
  }
  else {
    captionSrc = CAPTION_HEBREW;
  }
  
  captionSrc = CAPTION_HEBREW;

  console.log('Str file : ', configData.strFile);
  console.log('Video file : ', configData.videoFile);
  
  const merge = [
    { find: 'VIDEO-FILE', replace : configData.videoFile},
    { find: 'video-title', replace: replaceVidoeTitle },
    { find: 'caption-src', replace: configData.strFile}
  ];

  // console.log('merge', merge);

  const payload = {
    ...template,
    merge: merge
  };

  console.log('payload', payload);
  console.log('SHOTSTACK API KEY : ', SHOTSTACK_API_KEY);

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
