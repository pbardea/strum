'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, ChordEvent, Instrument, StrumFrequency } from '@/lib/audio-engine';
import { getAllKeys, nashvilleToChord, type Key } from '@/lib/music-theory';
import ChordBuilder from '@/components/chord-builder';
import Transport from '@/components/transport';

const STORAGE_KEY = 'strum-settings';

interface StoredSettings {
  key: Key;
  chords: ChordEvent[];
  tempo: number;
  instrument: Instrument;
  strumFrequency: StrumFrequency;
  chordVolume: number;
  metronomeVolume: number;
}

const defaultSettings: StoredSettings = {
  key: 'C',
  chords: [
    { nashville: 1, bars: 2, beats: 0 },
    { nashville: 4, bars: 2, beats: 0 },
    { nashville: 5, bars: 2, beats: 0 },
    { nashville: 1, bars: 2, beats: 0 },
  ],
  tempo: 120,
  instrument: 'pluck', // Default to acoustic guitar
  strumFrequency: 4,
  chordVolume: 80,
  metronomeVolume: 50,
};

function loadSettings(): StoredSettings {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: Partial<StoredSettings>) {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [key, setKey] = useState<Key>(defaultSettings.key);
  const [chords, setChords] = useState<ChordEvent[]>(defaultSettings.chords);
  const [tempo, setTempo] = useState(defaultSettings.tempo);
  const [instrument, setInstrument] = useState<Instrument>(defaultSettings.instrument);
  const [strumFrequency, setStrumFrequency] = useState<StrumFrequency>(defaultSettings.strumFrequency);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordVolume, setChordVolume] = useState(defaultSettings.chordVolume);
  const [metronomeVolume, setMetronomeVolume] = useState(defaultSettings.metronomeVolume);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [currentChordName, setCurrentChordName] = useState('');
  const [progress, setProgress] = useState(0);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Calculate total beats for timeline
  const totalBeats = chords.reduce((sum, chord) => sum + (chord.bars * 4) + chord.beats, 0);

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = loadSettings();
    setKey(settings.key);
    setChords(settings.chords);
    setTempo(settings.tempo);
    setInstrument(settings.instrument);
    setStrumFrequency(settings.strumFrequency);
    setChordVolume(settings.chordVolume);
    setMetronomeVolume(settings.metronomeVolume);
    setIsLoaded(true);
  }, []);

  // Initialize audio engine
  useEffect(() => {
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

  // Save and apply key changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ key });
    if (audioEngineRef.current) {
      audioEngineRef.current.setKey(key);
    }
  }, [key, isLoaded]);

  // Save and apply chord changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ chords });
    if (audioEngineRef.current) {
      audioEngineRef.current.setChordProgression(chords);
    }
  }, [chords, isLoaded]);

  // Save and apply tempo changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ tempo });
    if (audioEngineRef.current) {
      audioEngineRef.current.setTempo(tempo);
    }
  }, [tempo, isLoaded]);

  // Save and apply instrument changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ instrument });
    if (audioEngineRef.current) {
      audioEngineRef.current.setInstrument(instrument);
    }
  }, [instrument, isLoaded]);

  // Save and apply strum frequency changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ strumFrequency });
    if (audioEngineRef.current) {
      audioEngineRef.current.setStrumFrequency(strumFrequency);
    }
  }, [strumFrequency, isLoaded]);

  // Save and apply chord volume changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ chordVolume });
    if (audioEngineRef.current) {
      audioEngineRef.current.setInstrumentVolume(chordVolume);
    }
  }, [chordVolume, isLoaded]);

  // Save and apply metronome volume changes
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings({ metronomeVolume });
    if (audioEngineRef.current) {
      audioEngineRef.current.setMetronomeVolume(metronomeVolume);
    }
  }, [metronomeVolume, isLoaded]);

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
    const positions: { chord: ChordEvent; chordInfo: ReturnType<typeof nashvilleToChord>; startPercent: number; widthPercent: number; index: number }[] = [];
    let beatOffset = 0;
    
    chords.forEach((chord, index) => {
      const chordBeats = (chord.bars * 4) + chord.beats;
      const startPercent = (beatOffset / totalBeats) * 100;
      const widthPercent = (chordBeats / totalBeats) * 100;
      const chordInfo = nashvilleToChord(chord.nashville, key);
      
      positions.push({ chord, chordInfo, startPercent, widthPercent, index });
      beatOffset += chordBeats;
    });
    
    return positions;
  };

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

        {/* Transport at Top */}
        <div className="flex justify-center mb-6">
          <Transport isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} />
        </div>

        {/* Current Chord + Volume Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Current Chord Display */}
          <div className="md:col-span-1 flex flex-col justify-center items-center py-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">Current Chord</p>
            <p className={`text-4xl font-bold transition-colors ${isPlaying ? 'text-amber-400' : 'text-zinc-600'}`}>
              {currentChordName || nashvilleToChord(chords[0]?.nashville || 1, key).name}
            </p>
            {chords[currentChordIndex] && (
              <p className="text-xs text-zinc-500 mt-1">
                Nashville: {chords[currentChordIndex].nashville}
              </p>
            )}
          </div>

          {/* Volume Controls - Compact */}
          <div className="md:col-span-2 bg-zinc-800 rounded-lg p-3 border border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium mb-2">Volume</p>
            <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                🎸 Chords: {chordVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={chordVolume}
                onChange={(e) => setChordVolume(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                🎵 Metronome: {metronomeVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="mb-6 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="relative h-16 bg-zinc-900 rounded-lg overflow-hidden">
            {/* Chord segments */}
            {getChordPositions().map(({ chordInfo, startPercent, widthPercent, index }) => (
              <div
                key={index}
                className={`absolute top-0 h-full flex items-center justify-center border-r border-zinc-700 transition-colors ${
                  index === currentChordIndex && isPlaying
                    ? 'bg-amber-500/30'
                    : 'bg-zinc-800'
                }`}
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <span className={`text-sm font-semibold ${
                  index === currentChordIndex && isPlaying ? 'text-amber-400' : 'text-zinc-400'
                }`}>
                  {chordInfo.name}
                </span>
              </div>
            ))}
            
            {/* Playhead cursor */}
            <div
              className="absolute top-0 h-full w-0.5 bg-amber-500 shadow-lg shadow-amber-500/50 transition-all duration-75"
              style={{
                left: `${progress * 100}%`,
                opacity: isPlaying ? 1 : 0,
              }}
            />
          </div>
          
          {/* Beat markers */}
          <div className="relative h-2 mt-1">
            {Array.from({ length: totalBeats }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-px h-full ${i % 4 === 0 ? 'bg-zinc-500' : 'bg-zinc-700'}`}
                style={{ left: `${(i / totalBeats) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Key</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as Key)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={isPlaying}
            >
              {getAllKeys().map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tempo: {tempo} BPM</label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
              disabled={isPlaying}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Instrument</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as Instrument)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={isPlaying}
            >
              <option value="pluck">Acoustic Guitar</option>
              <option value="clean-guitar">Electric Guitar</option>
              <option value="synth">Synth</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Strum Every</label>
            <select
              value={strumFrequency}
              onChange={(e) => setStrumFrequency(parseInt(e.target.value) as StrumFrequency)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={1}>1 Beat</option>
              <option value={2}>2 Beats</option>
              <option value={4}>4 Beats (Measure)</option>
            </select>
          </div>
        </div>

        {/* Chord Builder */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <ChordBuilder chords={chords} onChange={handleChordChange} />
        </div>
      </div>
    </div>
  );
}
