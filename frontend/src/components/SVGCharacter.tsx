interface SVGCharacterProps {
  state: 'idle' | 'talking' | 'thinking' | 'happy' | 'lookingAway';
  message?: string;
  position: 'left' | 'right';
}

export default function SVGCharacter({ state, message, position }: SVGCharacterProps) {
  return (
    <div className={`fixed ${position}-8 top-1/2 -translate-y-1/2 z-50 select-none`}>
      {message && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 
          bg-white px-4 py-2 rounded-xl shadow-lg animate-slide-up">
          <p className="text-sm text-gray-800 whitespace-nowrap">{message}</p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 
            w-3 h-3 bg-white rotate-45"></div>
        </div>
      )}

      <svg 
        width="120" 
        height="120" 
        viewBox="0 0 120 120" 
        className={`transform transition-transform duration-300
          ${state === 'lookingAway' ? 'scale-x-[-1]' : ''}
          ${state === 'happy' ? 'animate-bounce' : ''}
        `}
      >
        {/* Basic character shape - customize this */}
        <circle cx="60" cy="60" r="50" fill="#4F46E5" opacity="0.2" />
        <circle cx="60" cy="60" r="40" fill="white" />
        {/* Eyes */}
        <circle 
          cx="45" 
          cy="50" 
          r="5" 
          fill="#1F2937"
          className={state === 'thinking' ? 'animate-blink' : ''}
        />
        <circle 
          cx="75" 
          cy="50" 
          r="5" 
          fill="#1F2937"
          className={state === 'thinking' ? 'animate-blink' : ''}
        />
        {/* Mouth - changes with state */}
        {state === 'happy' && (
          <path
            d="M40 70 Q60 90 80 70"
            stroke="#1F2937"
            strokeWidth="3"
            fill="none"
          />
        )}
        {state === 'talking' && (
          <circle cx="60" cy="75" r="10" fill="#1F2937" className="animate-pulse" />
        )}
        {state === 'thinking' && (
          <path
            d="M40 75 Q60 65 80 75"
            stroke="#1F2937"
            strokeWidth="3"
            fill="none"
          />
        )}
        {(state === 'idle' || state === 'lookingAway') && (
          <path
            d="M40 75 Q60 75 80 75"
            stroke="#1F2937"
            strokeWidth="3"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}