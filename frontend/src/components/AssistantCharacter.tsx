import React, { useState, useEffect } from 'react';

interface AssistantCharacterProps {
  name: string;
  image: string;
  position: 'left' | 'right';
  state: 'normal' | 'curious' | 'happy' | 'lookingAway';
  message?: string;
}

export default function AssistantCharacter({ 
  name, 
  image, 
  position = 'left',
  state = 'normal',
  message 
}: AssistantCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`fixed ${position}-8 top-1/2 -translate-y-1/2 z-50 select-none
        transition-transform duration-300 ease-in-out transform
        ${isHovered ? 'scale-105' : 'scale-100'}
        ${state === 'happy' ? 'animate-bounce' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Message Bubble */}
      {(message || isHovered) && (
        <div className={`
          absolute -top-16 left-1/2 transform -translate-x-1/2
          bg-white px-4 py-2 rounded-xl shadow-lg
          text-sm text-gray-800 whitespace-nowrap
          animate-slide-up
        `}>
          <div className="relative">
            {message || `Hi, I'm ${name}!`}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 
              w-3 h-3 bg-white rotate-45"></div>
          </div>
        </div>
      )}

      {/* Character Image */}
      <div className={`
        relative w-32 transition-all duration-300
        ${state === 'lookingAway' ? '-scale-x-100' : ''}
      `}>
        <img 
          src={image} 
          alt={name}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}