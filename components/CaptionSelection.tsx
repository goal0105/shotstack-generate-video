import React from 'react';
import { ConfigProps } from '@models/config';

const captions = ['English', 'Hebrew'];

function CaptionSelection({ config, setConfig }: ConfigProps) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 font-semibold text-left">Caption</h3>
      <select
        value={config.caption}
        onChange={e => setConfig({ ...config, caption: e.target.value })}
        className="w-full p-2 border border-gray-300 rounded"
      >
        {/* <option value="">Select Subtitle</option> */}
        {captions.map(caption => (
          <option key={caption} value={caption}>
            {caption}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CaptionSelection;
