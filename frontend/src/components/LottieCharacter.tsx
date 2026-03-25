import Lottie from 'react-lottie';

interface LottieCharacterProps {
  animationData: object;
  state: 'idle' | 'talking' | 'thinking' | 'happy' | 'lookingAway';
  message?: string;
  width?: number;
  height?: number;
}

export default function LottieCharacter({
  animationData,
  state: _unusedState,
  message,
  width = 200,
  height = 200
}: LottieCharacterProps) {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div className="relative transition-transform duration-300 transform hover:scale-105">
      {message && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 
          bg-white px-4 py-2 rounded-xl shadow-lg animate-slide-up">
          <p className="text-sm text-gray-800 whitespace-nowrap">{message}</p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 
            w-3 h-3 bg-white rotate-45"></div>
        </div>
      )}

      <div style={{ width, height }}>
        <Lottie 
          options={defaultOptions}
          height={height}
          width={width}
          isStopped={false}
          isPaused={false}
        />
      </div>
    </div>
  );
}