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
  const [progress, setProgress] = useState(0);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Calculate total bars for timeline
  const totalBars = chords.reduce((sum, chord) => sum + chord.bars, 0);

  useEffect(() => {
    // Initialize audio engine
    audioEngineRef.current = new AudioEngine();
    const engine = audioEngineRef.current;

    engine.setChordChangeCallback((nashville, chordName, index) => {
      setCurrentChordName(chordName);
      setCurrentChordIndex(index);
    });

    engine.setBeatChangeCallback(() => {
      // Visual beat indicator handled by progress
    });

    engine.setProgressChangeCallback((prog) => {
      setProgress(prog);
    });

    return () => {
      engine.stop();
    };
  }, []);

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
      setProgress(0);
    }
  };

  const handleChordChange = (newChords: ChordEvent[]) => {
    setChords(newChords);
    if (newChords.length > 0) {
      setCurrentChordIndex(0);
      const firstChord = nashvilleToChord(newChords[0].nashville, key);
      setCurrentChordName(firstChord.name);
    }
  };

  // Calculate chord positions for timeline
  const getChordPositions = () => {
    let offset = 0;
    return chords.map((chord, index) => {
      const position = { start: offset / totalBars, width: chord.bars / totalBars, index };
      offset += chord.bars;
      return position;
    });
  };

  const chordPositions = getChordPositions();

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Strum
          </h1>
          <p className="text-zinc-500 text-sm">Pentatonic Practice Companion</p>
        </header>

        {/* Play/Pause at Top */}
        <div className="flex justify-center mb-6">
          <Transport isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} />
        </div>

        {/* Current Chord + Volume Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Volume Controls - Compact */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs">🎸</span>
              <input
                type="range"
                min="0"
                max="100"
                value={chordVolume}
                onChange={(e) => setChordVolume(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-xs text-zinc-500 w-8">{chordVolume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">🥁</span>
              <input
                type="range"
                min="0"
                max="100"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-xs text-zinc-500 w-8">{metronomeVolume}%</span>
            </div>
          </div>

          {/* Current Chord Display - Center */}
          <div className="bg-zinc-800 rounded-lg p-4 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10 text-center">
            <p className="text-xs text-zinc-500 mb-1">Current Chord</p>
            <p className="text-3xl font-bold text-amber-400">
              {isPlaying && currentChordName ? currentChordName : '—'}
            </p>
            {isPlaying && chords[currentChordIndex]?.nashville && (
              <p className="text-xs text-zinc-500 mt-1">
                Nashville: {chords[currentChordIndex].nashville}
              </p>
            )}
          </div>

          {/* Settings Summary - Compact */}
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-zinc-500">Key:</span>
              <span className="text-amber-400 font-medium">{key}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-zinc-500">Tempo:</span>
              <span className="text-amber-400 font-medium">{tempo} BPM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Bars:</span>
              <span className="text-amber-400 font-medium">{totalBars}</span>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mb-6">
          <div className="relative h-16">
            {/* Chord blocks */}
            <div className="absolute inset-0 flex">
              {chordPositions.map((pos, index) => {
                const chordInfo = nashvilleToChord(chords[index].nashville, key);
                const isActive = isPlaying && index === currentChordIndex;
                return (
                  <div
                    key={index}
                    className={`
                      relative h-full border-r border-zinc-600 last:border-r-0
                      transition-all duration-150
                      ${isActive ? 'bg-amber-500/30' : 'bg-zinc-700/30'}
                    `}
                    style={{ width: `${pos.width * 100}%` }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-lg font-bold ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {chordInfo.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {chords[index].bars} bar{chords[index].bars > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Measure dividers */}
                    {chords[index].bars > 1 && (
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: chords[index].bars - 1 }).map((_, i) => (
                          <div
                            key={i}
                            className="border-r border-zinc-600/50"
                            style={{ width: `${100 / chords[index].bars}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Playhead cursor */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-lg shadow-amber-400/50 z-10 transition-all duration-75"
                style={{ left: `${progress * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
              </div>
            )}
          </div>
          
          {/* Bar numbers */}
          <div className="flex mt-2 text-xs text-zinc-600">
            {Array.from({ length: totalBars }).map((_, i) => (
              <div key={i} className="flex-1 text-center">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Controls */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Key
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value as Key)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Instrument
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as Instrument)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isPlaying}
              >
                <option value="clean-guitar">Electric Guitar</option>
                <option value="pluck">Acoustic Guitar</option>
                <option value="synth">Synth</option>
              </select>
            </div>
          </div>

          {/* Chord Builder */}
          <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
            <ChordBuilder chords={chords} onChange={handleChordChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
