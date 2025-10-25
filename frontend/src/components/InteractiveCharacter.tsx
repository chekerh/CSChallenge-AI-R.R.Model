import React, { useState, useEffect } from 'react';

interface CharacterProps {
  isLookingAway?: boolean;
  isCurious?: boolean;
  isHappy?: boolean;
}

export default function InteractiveCharacter({ isLookingAway, isCurious, isHappy }: CharacterProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate angle between character and cursor
      const bounds = document.body.getBoundingClientRect();
      const characterX = bounds.width - 100; // Character is on the right side
      const characterY = bounds.height / 2;
      const dx = e.clientX - characterX;
      const dy = e.clientY - characterY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Smooth position following
      setPosition(prev => ({
        x: prev.x + (e.clientX - prev.x) * 0.1,
        y: prev.y + (e.clientY - prev.y) * 0.1
      }));
      
      // Set character rotation to face cursor (unless looking away)
      if (!isLookingAway) {
        setRotation(angle);
      } else {
        setRotation(angle + 180); // Look away
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLookingAway]);

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div 
        className={`
          w-32 h-32 transition-all duration-300 transform
          ${isLookingAway ? 'scale-x-[-1]' : ''}
          ${isCurious ? 'scale-110' : ''}
          ${isHappy ? 'animate-bounce' : ''}
        `}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className="relative w-full h-full">
          {/* Character Base */}
          <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-pulse"></div>
          
          {/* Character Body */}
          <div className="absolute inset-4 bg-white rounded-full shadow-lg">
            {/* Eyes */}
            <div className={`
              absolute top-1/3 left-1/4 w-3 h-3 bg-gray-800 rounded-full
              transition-all duration-300
              ${isLookingAway ? 'opacity-50' : 'animate-blink'}
            `}></div>
            <div className={`
              absolute top-1/3 right-1/4 w-3 h-3 bg-gray-800 rounded-full
              transition-all duration-300
              ${isLookingAway ? 'opacity-50' : 'animate-blink'}
            `}></div>
            
            {/* Expression */}
            <div className={`
              absolute bottom-1/3 left-1/2 transform -translate-x-1/2
              w-6 h-2 bg-gray-800 rounded-full
              transition-all duration-300
              ${isHappy ? 'scale-x-150 translate-y-1' : ''}
              ${isCurious ? 'rotate-12' : ''}
            `}></div>
          </div>
        </div>
      </div>
    </div>
  );
}