// src/Root.jsx
import { Composition } from 'remotion';
import { AudioSyncedScene } from './Pdfviewer';

// 1. Import your transcript data
import  transcriptData  from './section_2.json';

// 2. Define the data for your scene
const matchData = {
    "text": "To address this challenge, we propose   HERO Hybrid   Ensemble   Reward   Optimization, a reinforcement learning framework that integrates verifier-anchored and dense reward-model signals to provide reliable yet informative",
    "page": 2,
    "boundingBox": {
      "x": 70.508,
      "y": 359.603,
      "width": 470.63037058640026,
      "height": 21.917599999999993
    },
  fuzzyMatch: false,
};

export const RemotionRoot= () => (
  <Composition
    id="PaperAnalysis"
    component={AudioSyncedScene}
    durationInFrames={1600} // ~53 seconds at 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      transcript: transcriptData, // 👈 Pass the full transcript
      match: matchData,
      matchNumber: 1,
      pageImageFile: 'page_2 copy.png', // Your PDF page image
      audioFile: 'section_2.wav', // Your audio file
      paperTitle: 'Scaling Principle-Driven Reasoning with Synthetic Data',
    }}
  />
);