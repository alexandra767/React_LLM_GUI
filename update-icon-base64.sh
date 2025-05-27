#!/bin/bash

# Read the base64 content
BASE64_CONTENT=$(cat brain-lightning-base64.txt)

# Create the new component file
cat > src/components/Chat/BrainLightningIcon.js << EOF
import React from 'react';

// Brain with lightning icon as base64
const BRAIN_LIGHTNING_BASE64 = "${BASE64_CONTENT}";

const BrainLightningIcon = ({ size = 24, className = '', style = {} }) => {
  return (
    <img 
      src={BRAIN_LIGHTNING_BASE64}
      alt="Brain Lightning"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        ...style
      }}
    />
  );
};

// Also export as a URL for use in other components
export const BRAIN_LIGHTNING_URL = BRAIN_LIGHTNING_BASE64;

export default BrainLightningIcon;
EOF

echo "✅ BrainLightningIcon.js updated with your image!"
echo "🎉 The brain lightning icon should now appear in your app!"