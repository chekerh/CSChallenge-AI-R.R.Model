import React, { useState, useEffect } from 'react';

interface SpriteCharacterProps {
  spriteSheet: string;
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  state: 'idle' | 'talking' | 'thinking' | 'happy' | 'lookingAway';
  message?: string;
}

const stateToFrameMap = {
  idle: { start: 0, end: 3 },
  talking: { start: 4, end: 7 },
  thinking: { start: 8, end: 11 },
  happy: { start: 12, end: 15 },
  lookingAway: { start: 16, end: 19 }
};

export default function SpriteCharacter({
  spriteSheet,
  frameCount,
  fps,
  width,
  height,
  state,
  message
}: SpriteCharacterProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const { start, end } = stateToFrameMap[state];
    let frame = start;
    
    const interval = setInterval(() => {
      frame = frame >= end ? start : frame + 1;
      setCurrentFrame(frame);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [state, fps]);

  return (
    <div 
      className="relative transition-transform duration-300 transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(message || isHovered) && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 
          bg-white px-4 py-2 rounded-xl shadow-lg animate-slide-up">
          <p className="text-sm text-gray-800 whitespace-nowrap">{message}</p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 
            w-3 h-3 bg-white rotate-45"></div>
        </div>
      )}

      <div style={{
        width,
        height,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${currentFrame * width}px 0px`,
        imageRendering: 'pixelated'
      }} />
    </div>
  );
}