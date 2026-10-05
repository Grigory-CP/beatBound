import { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

// This demo uses two audio tools:
// 1. The browser's Web Audio API creates sounds and reads microphone samples.
// 2. Pitchy examines those samples and estimates their fundamental frequency.
// Everything runs locally in the browser. Audio is not sent to a server.

// MIDI notes repeat these 12 names in every octave.
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export default function AudioDemo() {
  // Refs hold browser audio objects without causing a React render when they
  // change. Keeping the objects here also lets us stop and clean them up later.
  const audioContext = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const animationFrame = useRef(0);

  // State contains the small amount of information displayed by the page.
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Microphone is off.");
  const [frequency, setFrequency] = useState<number | null>(null);

  // AudioContext is the main Web Audio API object. Browsers require audio to be
  // created or resumed after a user action, so this runs from button handlers.
  const getAudioContext = () => {
    audioContext.current ??= new AudioContext();
    void audioContext.current.resume();
    return audioContext.current;
  };

  // Convert a MIDI note to hertz. MIDI 69 is A4 (440 Hz), and increasing the
  // MIDI number by 12 doubles the frequency by moving up one octave.
  const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

  // Play one musical note. The audio path is:
  // OscillatorNode (sound source) -> GainNode (volume) -> speakers.
  const playMidiNote = (
    midi: number,
    delay = 0,
    duration = 0.45,
    volume = 0.2
  ) => {
    const context = getAudioContext();
    const startTime = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = midiToFrequency(midi);

    // Fade in and out quickly to avoid an audible pop at the note's edges.
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  };

  // A short square-wave sound works like a simple metronome click. The
  // accented version uses a higher frequency so it is easy to distinguish.
  const playClick = (accented: boolean) => {
    const context = getAudioContext();
    const startTime = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = accented ? 1200 : 700;
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  };

  // Stop the detection loop and release the physical microphone. Stopping each
  // MediaStream track also turns off the browser's microphone indicator.
  const stopMicrophone = () => {
    cancelAnimationFrame(animationFrame.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setListening(false);
    setFrequency(null);
    setMessage("Microphone is off.");
  };

  const startMicrophone = async () => {
    try {
      setMessage("Waiting for microphone permission...");

      // MediaDevices is the browser service that asks the user for permission
      // and returns a live MediaStream from the computer's microphone.
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const context = getAudioContext();

      // Turn the microphone stream into a Web Audio source. An AnalyserNode lets
      // JavaScript copy the current waveform into an array without playing it.
      const source = context.createMediaStreamSource(stream.current);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      // Pitchy is configured for arrays with the same length as the analyser.
      // This array is reused on each frame instead of allocating a new one.
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const samples = new Float32Array(detector.inputLength);

      const detectPitch = () => {
        // Copy the latest waveform, then ask Pitchy for the estimated frequency
        // in hertz and a clarity value describing its confidence in that pitch.
        analyser.getFloatTimeDomainData(samples);
        const [pitch, clarity] = detector.findPitch(
          samples,
          context.sampleRate
        );

        // Ignore weak results so random background noise is not displayed.
        setFrequency(
          clarity > 0.9 && pitch > 65 && pitch < 1100 ? pitch : null
        );

        // Repeat detection about once per screen frame while the mic is active.
        animationFrame.current = requestAnimationFrame(detectPitch);
      };

      setListening(true);
      setMessage("Listening... sing or hum a steady note.");
      detectPitch();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not access the microphone."
      );
    }
  };

  // React runs this cleanup when the user leaves the page. It prevents the
  // detection loop, microphone, and AudioContext from running in the background.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrame.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      void audioContext.current?.close();
    };
  }, []);

  // Convert frequency to a MIDI note number using equal temperament:
  // - MIDI note 69 is A4 at 440 Hz.
  // - One octave doubles the frequency and contains 12 semitones.
  // - log2(frequency / 440) gives the distance from A4 in octaves.
  // - Multiplying by 12 converts octaves to semitones.
  // - Rounding selects the nearest note.
  const midi =
    frequency === null
      ? null
      : Math.round(69 + 12 * Math.log2(frequency / 440));
  // Modulo 12 selects a name from NOTE_NAMES. Dividing by 12 finds the octave;
  // MIDI octave numbering requires subtracting 1. For example, MIDI 69 is A4.
  // Adding 12 before the second modulo also makes the index safe for negatives.
  const note =
    midi === null
      ? "--"
      : `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Audio Demo</h1>

      <h2>Musical notes</h2>
      <p>Each button creates a Web Audio oscillator at the note's frequency.</p>
      <p>
        <button onClick={() => playMidiNote(60)}>Play C4 (261.6 Hz)</button>{" "}
        <button onClick={() => playMidiNote(64)}>Play E4 (329.6 Hz)</button>{" "}
        <button onClick={() => playMidiNote(67)}>Play G4 (392.0 Hz)</button>
      </p>

      <h2>Rhythm clicks</h2>
      <p>A square oscillator creates short regular and accented clicks.</p>
      <p>
        <button onClick={() => playClick(false)}>Play regular click</button>{" "}
        <button onClick={() => playClick(true)}>Play accented click</button>
      </p>

      <h2>Pitch detection</h2>
      <p>
        Reads microphone samples with the Web Audio API and detects their pitch
        with Pitchy.
      </p>
      <button onClick={listening ? stopMicrophone : startMicrophone}>
        {listening ? "Stop microphone" : "Start microphone"}
      </button>

      <p>{message}</p>
      <p>
        Frequency: {frequency === null ? "--" : `${frequency.toFixed(1)} Hz`}
      </p>
      <p>Note: {note}</p>
    </main>
  );
}
