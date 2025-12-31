import * as Tone from 'tone';
import { nashvilleToChord, chordToMidiNotes, type Key, type NashvilleNumber } from './music-theory';

export interface ChordEvent {
  nashville: NashvilleNumber;
  bars: number;
  beats: number;
}

export type Instrument = 'synth' | 'clean-guitar' | 'pluck';
export type StrumFrequency = 1 | 2 | 4; // Strum every 1, 2, or 4 beats

export class AudioEngine {
  private transport: typeof Tone.Transport;
  private instrument: Tone.PolySynth | Tone.Sampler;
  private currentInstrumentType: Instrument = 'synth';
  private instrumentEffects: Tone.Chorus | Tone.Reverb | null = null;
  private metronome: Tone.Synth;
  private bass: Tone.Synth;
  private samplerLoaded: boolean = false;
  
  // Volume controls
  private instrumentVolume: Tone.Volume;
  private metronomeVolume: Tone.Volume;
  private bassVolume: Tone.Volume;
  
  private chordEvents: ChordEvent[] = [];
  private currentKey: string = 'C';
  private tempo: number = 120;
  private strumFrequency: StrumFrequency = 4; // Default: strum every 4 beats (once per measure)
  private isPlaying: boolean = false;
  private currentChordIndex: number = 0;
  private currentBeat: number = 0;
  private totalBeats: number = 0;
  
  private onChordChange?: (nashville: NashvilleNumber, chordName: string, index: number) => void;
  private onBeatChange?: (beat: number) => void;
  private onProgressChange?: (progress: number) => void;

  constructor() {
    // Initialize Tone.js
    Tone.setContext(new Tone.Context({ latencyHint: 'interactive' }));

    // Create volume nodes
    this.instrumentVolume = new Tone.Volume(0).toDestination(); // 0 dB = full volume
    this.metronomeVolume = new Tone.Volume(-6).toDestination(); // -6 dB = slightly quieter
    this.bassVolume = new Tone.Volume(-6).toDestination(); // -6 dB for bass

    // Initialize with default synth instrument
    const defaultInst = this.createInstrument('synth');
    this.instrument = defaultInst.instrument;

    // Metronome - sharp click sound
    this.metronome = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.001,
        decay: 0.03,
        sustain: 0,
        release: 0.01,
      },
    }).connect(this.metronomeVolume);

    // Bass synth - deep, warm tone
    this.bass = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8,
      },
    }).connect(this.bassVolume);

    this.transport = Tone.Transport;
    this.transport.bpm.value = this.tempo;
  }

  // Volume control methods (0-100 scale)
  setInstrumentVolume(volume: number) {
    // Convert 0-100 to decibels (-60 to 0)
    const db = volume === 0 ? -Infinity : (volume / 100) * 60 - 60;
    this.instrumentVolume.volume.value = db;
  }

  setMetronomeVolume(volume: number) {
    // Convert 0-100 to decibels (-60 to 0)
    const db = volume === 0 ? -Infinity : (volume / 100) * 60 - 60;
    this.metronomeVolume.volume.value = db;
  }

  setBassVolume(volume: number) {
    // Convert 0-100 to decibels (-60 to 0)
    const db = volume === 0 ? -Infinity : (volume / 100) * 60 - 60;
    this.bassVolume.volume.value = db;
  }

  setChordChangeCallback(callback: (nashville: NashvilleNumber, chordName: string, index: number) => void) {
    this.onChordChange = (nashville, chordName) => {
      callback(nashville, chordName, this.currentChordIndex);
    };
  }

  setBeatChangeCallback(callback: (beat: number) => void) {
    this.onBeatChange = callback;
  }

  setProgressChangeCallback(callback: (progress: number) => void) {
    this.onProgressChange = callback;
  }

  async start() {
    if (this.isPlaying) return;
    
    await Tone.start();
    console.warn('[AudioEngine] Tone.start() called, AudioContext state:', Tone.context.state);
    
    this.isPlaying = true;
    this.currentChordIndex = 0;
    this.currentBeat = 0;
    
    // Calculate total duration in measures (bars)
    const totalMeasures = this.chordEvents.reduce((sum, chord) => sum + chord.bars, 0);
    const extraBeats = this.chordEvents.reduce((sum, chord) => sum + chord.beats, 0);
    const totalBars = totalMeasures + Math.ceil(extraBeats / 4);
    
    console.warn('[AudioEngine] Total measures:', totalMeasures, 'Extra beats:', extraBeats, 'Total bars:', totalBars);
    
    if (totalBars === 0) {
      console.warn('[AudioEngine] No bars to play, returning');
      return;
    }
    
    // Cancel any previous events
    this.transport.cancel();
    
    // Reset transport position
    this.transport.position = 0;
    
    // Set up loop using numeric values for reliability
    this.transport.loopStart = 0;
    this.transport.loopEnd = `${totalBars}m`;
    this.transport.loop = true;
    
    console.warn('[AudioEngine] Loop setup - loopEnd:', this.transport.loopEnd, 'loop:', this.transport.loop);
    
    this.scheduleEvents();
    
    // Trigger first chord callback immediately for UI update
    if (this.chordEvents.length > 0 && this.onChordChange) {
      const firstChord = this.chordEvents[0];
      const chordName = this.getChordName(firstChord.nashville);
      this.onChordChange(firstChord.nashville, chordName, 0);
    }
    
    this.transport.start();
    console.warn('[AudioEngine] Transport started, state:', this.transport.state);
  }

  stop() {
    if (!this.isPlaying) return;
    
    this.transport.stop();
    this.transport.cancel();
    this.transport.loop = false;
    this.isPlaying = false;
    this.currentChordIndex = 0;
    this.currentBeat = 0;
  }

  setTempo(bpm: number) {
    this.tempo = bpm;
    this.transport.bpm.value = bpm;
  }

  setKey(key: string) {
    this.currentKey = key;
  }

  setStrumFrequency(frequency: StrumFrequency) {
    this.strumFrequency = frequency;
    // Reschedule if playing
    if (this.isPlaying) {
      this.transport.cancel();
      this.scheduleEvents();
    }
  }

  setInstrument(instrumentType: Instrument) {
    if (this.currentInstrumentType === instrumentType) return;
    
    // Dispose old instrument and effects
    this.instrument.dispose();
    if (this.instrumentEffects) {
      if (this.instrumentEffects instanceof Tone.Chorus) {
        this.instrumentEffects.dispose();
      } else if (this.instrumentEffects instanceof Tone.Reverb) {
        this.instrumentEffects.dispose();
      }
      this.instrumentEffects = null;
    }
    
    // Create new instrument
    this.currentInstrumentType = instrumentType;
    const result = this.createInstrument(instrumentType);
    this.instrument = result.instrument;
    this.instrumentEffects = result.effects || null;
  }

  private createInstrument(type: Instrument): { instrument: Tone.PolySynth | Tone.Sampler; effects?: Tone.Chorus | Tone.Reverb } {
    switch (type) {
      case 'clean-guitar':
        // Use real guitar samples from tonejs-instruments library
        // Samples are hosted on GitHub Pages
        const baseUrl = 'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/';
        
        this.samplerLoaded = false;
        
        // Create sampler with electric guitar samples
        // We only need a few samples - Tone.js will interpolate the rest
        const guitar = new Tone.Sampler({
          urls: {
            'A2': 'A2.mp3',
            'A3': 'A3.mp3',
            'A4': 'A4.mp3',
            'C3': 'C3.mp3',
            'C4': 'C4.mp3',
            'C5': 'C5.mp3',
            'D#3': 'Ds3.mp3',
            'D#4': 'Ds4.mp3',
            'F#2': 'Fs2.mp3',
            'F#3': 'Fs3.mp3',
            'F#4': 'Fs4.mp3',
          },
          baseUrl: baseUrl,
          attack: 0, // Instant attack - no fade in
          release: 6, // Long release for sustained ringing
          onload: () => {
            console.log('Electric guitar samples loaded');
            this.samplerLoaded = true;
          },
        });
        
        // Add chorus for richer, fuller sound
        const chorus = new Tone.Chorus({
          frequency: 1.2,
          delayTime: 4,
          depth: 0.5,
          wet: 0.4,
        }).start();
        
        // Add longer reverb for sustained resonance like real guitar
        const reverb = new Tone.Reverb({
          decay: 4, // Long decay for sustained ring
          wet: 0.4,
        });
        reverb.generate().then(() => {
          // Reverb is ready
        });
        
        // Connect: guitar -> chorus -> reverb -> volume -> output
        guitar.connect(chorus);
        chorus.connect(reverb);
        reverb.connect(this.instrumentVolume);
        
        return { instrument: guitar, effects: chorus };
        
      case 'pluck':
        // Use acoustic guitar samples for a different sound
        const acousticBaseUrl = 'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/';
        
        this.samplerLoaded = false;
        
        const acoustic = new Tone.Sampler({
          urls: {
            'A2': 'A2.mp3',
            'A3': 'A3.mp3',
            'A4': 'A4.mp3',
            'C3': 'C3.mp3',
            'C4': 'C4.mp3',
            'D3': 'D3.mp3',
            'D4': 'D4.mp3',
            'E2': 'E2.mp3',
            'E3': 'E3.mp3',
            'E4': 'E4.mp3',
            'G2': 'G2.mp3',
            'G3': 'G3.mp3',
            'G4': 'G4.mp3',
          },
          baseUrl: acousticBaseUrl,
          attack: 0, // Instant attack - no fade in
          release: 6, // Long release for sustained ringing
          onload: () => {
            console.log('Acoustic guitar samples loaded');
            this.samplerLoaded = true;
          },
        });
        
        // Add reverb for natural acoustic resonance
        const acousticReverb = new Tone.Reverb({
          decay: 3.5,
          wet: 0.35,
        });
        acousticReverb.generate().then(() => {});
        
        acoustic.connect(acousticReverb);
        acousticReverb.connect(this.instrumentVolume);
        return { instrument: acoustic };
        
      case 'synth':
      default:
        this.samplerLoaded = true; // Synth doesn't need sample loading
        
        // Rich synth sound with sawtooth and filter
        const synth = new Tone.PolySynth({
          maxPolyphony: 6,
          voice: Tone.Synth,
        });
        synth.set({
          oscillator: {
            type: 'sawtooth',
          },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.5,
            release: 0.8,
          },
        });
        synth.connect(this.instrumentVolume);
        return { instrument: synth };
    }
  }

  setChordProgression(chords: ChordEvent[]) {
    this.chordEvents = chords;
    this.totalBeats = chords.reduce((sum, chord) => sum + (chord.bars * 4) + chord.beats, 0);
    
    // Update loop end if playing
    if (this.isPlaying) {
      const totalMeasures = chords.reduce((sum, chord) => sum + chord.bars, 0);
      const extraBeats = chords.reduce((sum, chord) => sum + chord.beats, 0);
      const totalBars = totalMeasures + Math.ceil(extraBeats / 4);
      
      if (totalBars > 0) {
        this.transport.loopEnd = `${totalBars}m`;
        this.transport.cancel();
        this.scheduleEvents();
      }
    }
  }

  private scheduleEvents() {
    console.warn('[AudioEngine] scheduleEvents() called, chordEvents:', this.chordEvents.length);
    let beatOffset = 0;
    
    for (let i = 0; i < this.chordEvents.length; i++) {
      const chord = this.chordEvents[i];
      const chordBeats = (chord.bars * 4) + chord.beats;
      const chordBars = chord.bars + (chord.beats > 0 ? 1 : 0);
      
      // Use measures notation for chord scheduling
      const measureOffset = beatOffset / 4; // Convert beats to measures (4/4 time)
      const startTime = `${measureOffset}m`;
      
      console.warn(`[AudioEngine] Scheduling chord ${i} (nashville: ${chord.nashville}) at ${startTime}`);
      
      // Capture loop variable for closure
      const chordIndex = i;
      const nashville = chord.nashville;
      
      // Schedule chord change callback (UI update)
      this.transport.schedule((time) => {
        console.warn(`[AudioEngine] Chord change ${chordIndex} at time ${time}`);
        this.currentChordIndex = chordIndex;
        
        setTimeout(() => {
          if (this.onChordChange) {
            const chordName = this.getChordName(nashville);
            this.onChordChange(nashville, chordName, chordIndex);
          }
        }, 0);
      }, startTime);
      
      // Schedule strums based on strumFrequency setting
      // strumFrequency: 1 = every beat, 2 = every 2 beats, 4 = every measure
      for (let beat = 0; beat < chordBeats; beat += this.strumFrequency) {
        const strumBeatOffset = beatOffset + beat;
        const strumTime = this.beatsToTime(strumBeatOffset);
        const remainingBeats = chordBeats - beat;
        const durationBeats = Math.min(this.strumFrequency, remainingBeats);
        
        this.transport.schedule((time) => {
          console.warn(`[AudioEngine] Strumming chord ${chordIndex} at beat ${strumBeatOffset}`);
          this.playChord(nashville, time, durationBeats / 4); // Convert beats to bars for duration
        }, strumTime);
      }
      
      // Schedule beats within this chord (for metronome and progress)
      for (let beat = 0; beat < chordBeats; beat++) {
        const absoluteBeat = beatOffset + beat;
        const beatTime = this.beatsToTime(absoluteBeat);
        const beatNum = beat;
        const progress = absoluteBeat / this.totalBeats;
        
        // Schedule main beat (metronome click + progress update)
        this.transport.schedule((time) => {
          this.currentBeat = beatNum;
          this.playBeat(beatNum, time);
          
          setTimeout(() => {
            if (this.onBeatChange) {
              this.onBeatChange(beatNum);
            }
            if (this.onProgressChange) {
              this.onProgressChange(progress);
            }
          }, 0);
        }, beatTime);
      }
      
      beatOffset += chordBeats;
    }
    console.warn('[AudioEngine] Finished scheduling, total beatOffset:', beatOffset);
  }

  private beatsToTime(beats: number): string {
    // Convert beats to Tone time notation using bars:beats:sixteenths format
    // This is more reliable than building long "4n + 4n + ..." strings
    // In 4/4 time: 4 beats = 1 bar
    if (beats === 0) return '0:0:0';
    
    const bars = Math.floor(beats / 4);
    const remainingBeats = beats % 4;
    
    // Format: "bars:beats:sixteenths"
    return `${bars}:${remainingBeats}:0`;
  }

  private playChord(nashville: NashvilleNumber, time: number, durationBars: number = 1) {
    const chord = nashvilleToChord(nashville, this.currentKey as Key);
    const midiNotes = chordToMidiNotes(chord, 3); // Lower octave for guitar
    
    // Convert MIDI notes to frequencies
    const frequencies = midiNotes.map(note => Tone.Frequency(note, 'midi').toFrequency());
    
    // Duration based on remaining bars - sustain for the full duration
    const chordDuration = `${durationBars}m`;
    
    // Compensate for sample attack/latency - trigger 100ms early
    // Samples often have ~50-100ms of attack time before the main sound
    const adjustedTime = Math.max(0, time - 0.1);
    
    // Play bass - root note in low octave
    const bassNote = `${chord.root}1`; // Octave 1 for deep bass
    this.bass.triggerAttackRelease(bassNote, chordDuration, adjustedTime);
    
    // Play chord with strummed effect for guitar
    if (this.currentInstrumentType === 'clean-guitar') {
      // Quick strum - tight arpeggio
      frequencies.forEach((freq, index) => {
        const strumDelay = index * 0.002; // Ultra-tight strum
        if (this.instrument instanceof Tone.Sampler) {
          const noteName = Tone.Frequency(midiNotes[index], 'midi').toNote();
          this.instrument.triggerAttackRelease(noteName, chordDuration, adjustedTime + strumDelay);
        } else {
          this.instrument.triggerAttackRelease(freq, chordDuration, adjustedTime + strumDelay);
        }
      });
    } else if (this.instrument instanceof Tone.Sampler) {
      // If using sampler, use note names
      const noteNames = midiNotes.map(note => Tone.Frequency(note, 'midi').toNote());
      noteNames.forEach((note, index) => {
        this.instrument.triggerAttackRelease(note, chordDuration, adjustedTime + (index * 0.002));
      });
    } else {
      // Regular synth
      frequencies.forEach((freq, index) => {
        this.instrument.triggerAttackRelease(freq, chordDuration, adjustedTime + (index * 0.002));
      });
    }
  }

  private playBeat(beat: number, time: number) {
    const beatInMeasure = beat % 4;
    
    // Metronome - higher frequencies for sharp tick, accent on beat 1
    const metronomeFreq = beatInMeasure === 0 ? 'G6' : 'G5';
    this.metronome.triggerAttackRelease(metronomeFreq, '64n', time);
  }

  private getChordName(nashville: NashvilleNumber): string {
    const chord = nashvilleToChord(nashville, this.currentKey as Key);
    return chord.name;
  }

  getCurrentChordIndex(): number {
    return this.currentChordIndex;
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
