'use client';

import { useEffect, useRef } from 'react';

interface TransportProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export default function Transport({ isPlaying, onPlay, onPause }: TransportProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          onPause();
        } else {
          onPlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, onPlay, onPause]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        ref={buttonRef}
        onClick={isPlaying ? onPause : onPlay}
        className={`
          w-32 h-32 rounded-full
          flex items-center justify-center
          text-4xl font-bold
          transition-all duration-200
          shadow-lg
          ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/50'
              : 'bg-amber-500 hover:bg-amber-600 text-zinc-900 shadow-amber-900/50'
          }
          focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-900
          active:scale-95
        `}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <p className="text-sm text-zinc-400">
        Press <kbd className="px-2 py-1 bg-zinc-800 rounded text-amber-400">Space</kbd> to play/pause
      </p>
    </div>
  );
}
