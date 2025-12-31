'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, ChordEvent, Instrument } from '@/lib/audio-engine';
import { getAllKeys, nashvilleToChord, type Key } from '@/lib/music-theory';
import ChordBuilder from '@/components/chord-builder';
import Transport from '@/components/transport';

export default function Home() {
  const [key, setKey] = useState<Key>('C');
  const [chords, setChords] = useState<ChordEvent[]>([
    { nashville: 1, bars: 2, beats: 0 },
    { nashville: 4, bars: 2, beats: 0 },
    { nashville: 5, bars: 2, beats: 0 },
    { nashville: 1, bars: 2, beats: 0 },
  ]);
  const [tempo, setTempo] = useState(120);
  const [instrument, setInstrument] = useState<Instrument>('clean-guitar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordVolume, setChordVolume] = useState(80);
  const [metronomeVolume, setMetronomeVolume] = useState(50);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [currentChordName, setCurrentChordName] = useState('');

  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    // Initialize audio engine
    audioEngineRef.current = new AudioEngine();
    const engine = audioEngineRef.current;

    engine.setChordChangeCallback((nashville, chordName, index) => {
      console.warn('[Page] Callback received:', chordName, index);
      setCurrentChordName(chordName);
      setCurrentChordIndex(index);
    });

    engine.setBeatChangeCallback(() => {
      // Could add visual beat indicator here if needed
    });

    return () => {
      engine.stop();
    };
  }, []);
  
  // Debug: log state changes
  useEffect(() => {
    console.warn('[Page] State updated - isPlaying:', isPlaying, 'currentChordName:', currentChordName);
  }, [isPlaying, currentChordName]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setKey(key);
      audioEngineRef.current.setChordProgression(chords);
    }
  }, [key, chords]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setTempo(tempo);
    }
  }, [tempo]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setInstrument(instrument);
    }
  }, [instrument]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setInstrumentVolume(chordVolume);
    }
  }, [chordVolume]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMetronomeVolume(metronomeVolume);
    }
  }, [metronomeVolume]);

  const handlePlay = async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.start();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleChordChange = (newChords: ChordEvent[]) => {
    setChords(newChords);
    // Update current chord index based on progression
    if (newChords.length > 0) {
      setCurrentChordIndex(0);
      const firstChord = nashvilleToChord(newChords[0].nashville, key);
      setCurrentChordName(firstChord.name);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Strum
          </h1>
          <p className="text-zinc-400">Pentatonic Practice Companion</p>
        </header>

        <div className="space-y-8">
          {/* Key, Tempo, and Instrument Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Key
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value as Key)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isPlaying}
              >
                {getAllKeys().map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Tempo: {tempo} BPM
              </label>
              <input
                type="range"
                min="60"
                max="200"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                disabled={isPlaying}
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>60</span>
                <span>200</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Instrument
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as Instrument)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isPlaying}
              >
                <option value="clean-guitar">Electric Guitar (samples)</option>
                <option value="pluck">Acoustic Guitar (samples)</option>
                <option value="synth">Synth</option>
              </select>
            </div>
          </div>

          {/* Volume Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                🎸 Chord Volume: {chordVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={chordVolume}
                onChange={(e) => setChordVolume(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                🥁 Metronome Volume: {metronomeVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Current Chord Display */}
          {isPlaying && currentChordName && (
            <div className="text-center py-6 bg-zinc-800 rounded-lg border-2 border-amber-500 shadow-lg shadow-amber-500/20">
              <p className="text-sm text-zinc-400 mb-2">Current Chord</p>
              <p className="text-4xl font-bold text-amber-400">{currentChordName}</p>
              <p className="text-sm text-zinc-500 mt-2">
                {chords[currentChordIndex]?.nashville && (
                  <>Nashville: {chords[currentChordIndex].nashville}</>
                )}
              </p>
            </div>
          )}

          {/* Transport Controls */}
          <div className="flex justify-center py-8">
            <Transport isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} />
          </div>

          {/* Chord Builder */}
          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <ChordBuilder chords={chords} onChange={handleChordChange} />
          </div>

          {/* Chord Progression Preview */}
          <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-xl font-semibold text-amber-200 mb-4">Progression Preview</h2>
            <div className="flex flex-wrap gap-3">
              {chords.map((chord, index) => {
                const chordInfo = nashvilleToChord(chord.nashville, key);
                const duration = `${chord.bars}${chord.beats > 0 ? `+${chord.beats}` : ''}`;
                return (
                  <div
                    key={index}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all
                      ${
                        isPlaying && index === currentChordIndex
                          ? 'border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/30'
                          : 'border-zinc-600 bg-zinc-900'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{chordInfo.name}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {chord.nashville} • {duration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
