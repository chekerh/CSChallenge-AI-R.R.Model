import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function LoadingSpinner({ text = 'Chargement…', size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="relative">
        <div className={`${SIZE_MAP[size]} rounded-full border-2 border-gray-200 dark:border-gray-700`} />
        <Loader2 className={`${SIZE_MAP[size]} absolute inset-0 animate-spin text-indigo-600 dark:text-indigo-400`} />
      </div>
      {text && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">{text}</p>}
    </div>
  );
}
