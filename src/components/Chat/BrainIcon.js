import React from 'react';

const BrainIcon = ({ size = 36, color = '#7FD1FF' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brain */}
      <path d="M250,50 C360,50 440,150 440,250 C440,320 400,380 340,410 C310,425 280,430 250,430 C220,430 190,425 160,410 C100,380 60,320 60,250 C60,150 140,50 250,50 Z M250,100 C230,130 200,120 180,140 C160,160 150,190 130,210 C110,230 100,260 100,290 C100,330 120,360 150,380 C190,400 210,390 250,390 C290,390 310,400 350,380 C380,360 400,330 400,290 C400,260 390,230 370,210 C350,190 340,160 320,140 C300,120 270,130 250,100 Z" 
        fill={color} stroke="#000" strokeWidth="2" />
      
      {/* Monitor */}
      <rect x="180" y="180" width="140" height="120" rx="10" 
        fill="#E0F0FF" stroke="#000" strokeWidth="2" />
      <rect x="190" y="190" width="120" height="90" fill="#111" />
      
      {/* Keyboard */}
      <rect x="160" y="320" width="180" height="20" rx="5" 
        fill="#D0E8FF" stroke="#000" strokeWidth="1.5" />
      <rect x="170" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="185" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="200" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="215" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="230" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="245" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="260" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="275" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="290" y="325" width="10" height="5" rx="1" fill="#555" />
      <rect x="305" y="325" width="10" height="5" rx="1" fill="#555" />
      
      {/* Stand */}
      <rect x="230" y="300" width="40" height="40" 
        fill="#9ECAFF" stroke="#000" strokeWidth="1.5" />
      <rect x="248" y="300" width="4" height="40" 
        fill="#D0E8FF" stroke="#000" strokeWidth="1" />
      
      {/* Base */}
      <ellipse cx="250" cy="355" rx="70" ry="15" 
        fill="#B2DAFF" stroke="#000" strokeWidth="1.5" />
    </svg>
  );
};

export default BrainIcon;