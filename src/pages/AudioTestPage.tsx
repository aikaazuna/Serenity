import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Volume2, Play, Square, Activity, Waves, Headphones, Radio } from 'lucide-react';
import { EQEngine } from '@/lib/eq-engine';

export const AudioTestPage: React.FC = () => {
  const t = useI18n();
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [toneFreq, setToneFreq] = useState(440);
  const [toneWave, setToneWave] = useState<OscillatorType>('sine');
  const [toneVolume, setToneVolume] = useState(0.2);

  const [isPlayingNoise, setIsPlayingNoise] = useState<string | null>(null);
  const [noiseVolume, setNoiseVolume] = useState(0.15);

  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepFreq, setSweepFreq] = useState(20);
  const sweepDuration = 10;

  const [playingStereoChannel, setPlayingStereoChannel] = useState<'left' | 'right' | 'both' | 'out_of_phase' | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const sweepIntervalRef = useRef<any>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    return () => {
      stopTone();
      stopNoise();
      stopSweep();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startTone = () => {
    stopNoise();
    stopSweep();
    const ctx = getAudioContext();

    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = toneWave;
    osc.frequency.setValueAtTime(toneFreq, ctx.currentTime);

    gainNode.gain.setValueAtTime(toneVolume, ctx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    oscRef.current = osc;
    toneGainRef.current = gainNode;
    setIsPlayingTone(true);
  };

  const stopTone = () => {
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      oscRef.current = null;
    }
    setIsPlayingTone(false);
  };

  const handleFreqChange = (freq: number) => {
    setToneFreq(freq);
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    }
  };

  const handleWaveChange = (wave: OscillatorType) => {
    setToneWave(wave);
    if (oscRef.current) {
      oscRef.current.type = wave;
    }
  };

  const handleToneVolumeChange = (vol: number) => {
    setToneVolume(vol);
    if (toneGainRef.current && audioCtxRef.current) {
      toneGainRef.current.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    }
  };

  const startNoise = (type: 'white' | 'pink' | 'brown') => {
    stopTone();
    stopSweep();
    const ctx = getAudioContext();

    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch {}
    }

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i] as number;
        data[i] = (data[i] as number) * 3.5;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(noiseVolume, ctx.currentTime);

    noiseSource.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
    noiseSourceRef.current = noiseSource;
    noiseGainRef.current = gainNode;
    setIsPlayingNoise(type);
  };

  const stopNoise = () => {
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch {}
      noiseSourceRef.current = null;
    }
    setIsPlayingNoise(null);
  };

  const startSweep = () => {
    stopTone();
    stopNoise();
    const ctx = getAudioContext();

    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(20, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20000, ctx.currentTime + sweepDuration);

    gainNode.gain.setValueAtTime(toneVolume, ctx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + sweepDuration);

    oscRef.current = osc;
    setIsSweeping(true);

    const startTime = Date.now();
    sweepIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= sweepDuration) {
        stopSweep();
      } else {
        const p = elapsed / sweepDuration;
        const currentF = 20 * Math.pow(1000, p);
        setSweepFreq(Math.round(currentF));
      }
    }, 50);

    osc.onended = () => {
      stopSweep();
    };
  };

  const stopSweep = () => {
    if (sweepIntervalRef.current) {
      clearInterval(sweepIntervalRef.current);
      sweepIntervalRef.current = null;
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      oscRef.current = null;
    }
    setIsSweeping(false);
  };

  const playStereoTest = (channelType: 'left' | 'right' | 'both' | 'out_of_phase') => {
    stopTone();
    stopNoise();
    stopSweep();
    const ctx = getAudioContext();

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const merger = ctx.createChannelMerger(2);
    const gainL = ctx.createGain();
    const gainR = ctx.createGain();

    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.setValueAtTime(440, ctx.currentTime);
    oscR.frequency.setValueAtTime(440, ctx.currentTime);

    const vol = 0.25;

    if (channelType === 'left') {
      gainL.gain.setValueAtTime(vol, ctx.currentTime);
      gainR.gain.setValueAtTime(0, ctx.currentTime);
    } else if (channelType === 'right') {
      gainL.gain.setValueAtTime(0, ctx.currentTime);
      gainR.gain.setValueAtTime(vol, ctx.currentTime);
    } else if (channelType === 'both') {
      gainL.gain.setValueAtTime(vol, ctx.currentTime);
      gainR.gain.setValueAtTime(vol, ctx.currentTime);
    } else if (channelType === 'out_of_phase') {
      gainL.gain.setValueAtTime(vol, ctx.currentTime);
      gainR.gain.setValueAtTime(-vol, ctx.currentTime);
    }

    oscL.connect(gainL);
    oscR.connect(gainR);

    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    merger.connect(ctx.destination);

    oscL.start();
    oscR.start();
    oscL.stop(ctx.currentTime + 3);
    oscR.stop(ctx.currentTime + 3);

    setPlayingStereoChannel(channelType);
    setTimeout(() => {
      setPlayingStereoChannel(null);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
          {t.audioTest.title}
        </h2>
        <p className="text-xs text-secondary mt-1">
          {t.audioTest.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tone Generator Card */}
        <div className="apple-card flex flex-col justify-between p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A84FF]" />
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                {t.audioTest.toneGen}
              </h3>
            </div>
            <button
              onClick={isPlayingTone ? stopTone : startTone}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition ${
                isPlayingTone
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#0A84FF] hover:bg-[#0071E3] text-white'
              }`}
            >
              {isPlayingTone ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingTone ? t.audioTest.stop : t.audioTest.playTone}</span>
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-medium text-tertiary">{t.audioTest.waveform}</span>
            <div className="grid grid-cols-4 gap-2">
              {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map((wave) => (
                <button
                  key={wave}
                  onClick={() => handleWaveChange(wave)}
                  className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition ${
                    toneWave === wave
                      ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                      : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  {wave === 'sine' ? t.audioTest.sine : wave === 'square' ? t.audioTest.square : wave === 'sawtooth' ? t.audioTest.sawtooth : t.audioTest.triangle}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-secondary">{t.audioTest.freq}</span>
              <span className="text-sm font-mono mono-tabular text-[color:var(--text-primary)] font-bold">
                {toneFreq} Hz ({EQEngine.formatFrequency(toneFreq)})
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="20000"
              step="1"
              value={toneFreq}
              onChange={(e) => handleFreqChange(parseInt(e.target.value))}
              className="w-full h-2 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '30 Hz (Sub)', f: 30 },
                { label: '60 Hz (Kick)', f: 60 },
                { label: '120 Hz (Basses)', f: 120 },
                { label: '440 Hz (La 440)', f: 440 },
                { label: '1 kHz (Médium)', f: 1000 },
                { label: '3.5 kHz (Voix)', f: 3500 },
                { label: '10 kHz (Air)', f: 10000 },
                { label: '16 kHz (Aigus)', f: 16000 },
              ].map((p) => (
                <button
                  key={p.f}
                  onClick={() => handleFreqChange(p.f)}
                  className={`px-2.5 py-1 text-[10.5px] rounded-md border font-mono transition ${
                    toneFreq === p.f
                      ? 'bg-[#0A84FF] border-[#0A84FF] text-white font-bold'
                      : 'apple-inner-box text-tertiary hover:text-secondary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Volume2 className="w-4 h-4 text-tertiary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={toneVolume}
              onChange={(e) => handleToneVolumeChange(parseFloat(e.target.value))}
              className="w-36 h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
            />
            <span className="text-xs font-mono text-tertiary">{Math.round(toneVolume * 100)}%</span>
          </div>
        </div>

        {/* Acoustic Noise Generator Card */}
        <div className="apple-card flex flex-col justify-between p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-3">
            <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
              {t.audioTest.noiseGen}
            </h3>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            {t.audioTest.noiseDesc}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="apple-inner-box flex flex-col justify-between p-3.5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.audioTest.whiteNoise}</h4>
                <p className="text-[10.5px] text-tertiary mt-1">{t.audioTest.whiteNoiseDesc}</p>
              </div>
              <button
                onClick={() => (isPlayingNoise === 'white' ? stopNoise() : startNoise('white'))}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg transition ${
                  isPlayingNoise === 'white'
                    ? 'bg-red-500 text-white'
                    : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[color:var(--text-primary)]'
                }`}
              >
                {isPlayingNoise === 'white' ? t.audioTest.stop : t.audioTest.listen}
              </button>
            </div>

            <div className="apple-inner-box flex flex-col justify-between p-3.5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.audioTest.pinkNoise}</h4>
                <p className="text-[10.5px] text-tertiary mt-1">{t.audioTest.pinkNoiseDesc}</p>
              </div>
              <button
                onClick={() => (isPlayingNoise === 'pink' ? stopNoise() : startNoise('pink'))}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg transition ${
                  isPlayingNoise === 'pink'
                    ? 'bg-red-500 text-white'
                    : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-500 dark:text-pink-300 border border-pink-500/30'
                }`}
              >
                {isPlayingNoise === 'pink' ? t.audioTest.stop : t.audioTest.listen}
              </button>
            </div>

            <div className="apple-inner-box flex flex-col justify-between p-3.5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.audioTest.brownNoise}</h4>
                <p className="text-[10.5px] text-tertiary mt-1">{t.audioTest.brownNoiseDesc}</p>
              </div>
              <button
                onClick={() => (isPlayingNoise === 'brown' ? stopNoise() : startNoise('brown'))}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg transition ${
                  isPlayingNoise === 'brown'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPlayingNoise === 'brown' ? t.audioTest.stop : t.audioTest.listen}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Volume2 className="w-4 h-4 text-tertiary" />
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={noiseVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setNoiseVolume(vol);
                if (noiseGainRef.current && audioCtxRef.current) {
                  noiseGainRef.current.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
                }
              }}
              className="w-36 h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono text-tertiary">{Math.round(noiseVolume * 200)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sweep Test Card */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                {t.audioTest.sweepTest}
              </h3>
            </div>
            <button
              onClick={isSweeping ? stopSweep : startSweep}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition ${
                isSweeping
                  ? 'bg-red-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSweeping ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSweeping ? t.audioTest.stop : t.audioTest.startSweep}</span>
            </button>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            {t.audioTest.sweepDesc}
          </p>

          <div className="apple-inner-box flex items-center justify-between p-4">
            <span className="text-xs text-secondary">{t.audioTest.currentFreq}</span>
            <span className="text-lg font-mono mono-tabular text-purple-500 dark:text-purple-400 font-bold">
              {isSweeping ? `${sweepFreq} Hz` : t.audioTest.waiting}
            </span>
          </div>
        </div>

        {/* Stereo & Phase Test Card */}
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-3">
            <Headphones className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
              {t.audioTest.stereoTest}
            </h3>
          </div>

          <p className="text-xs text-secondary leading-relaxed">
            {t.audioTest.stereoDesc}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => playStereoTest('left')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition ${
                playingStereoChannel === 'left'
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'apple-inner-box text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)]'
              }`}
            >
              {t.audioTest.leftEar}
            </button>

            <button
              onClick={() => playStereoTest('right')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition ${
                playingStereoChannel === 'right'
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'apple-inner-box text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)]'
              }`}
            >
              {t.audioTest.rightEar}
            </button>

            <button
              onClick={() => playStereoTest('both')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition ${
                playingStereoChannel === 'both'
                  ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                  : 'apple-inner-box text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)]'
              }`}
            >
              {t.audioTest.inPhase}
            </button>

            <button
              onClick={() => playStereoTest('out_of_phase')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition ${
                playingStereoChannel === 'out_of_phase'
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'apple-inner-box text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)]'
              }`}
              title="Doit sonner creux / à l'extérieur de la tête"
            >
              {t.audioTest.outOfPhase}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
