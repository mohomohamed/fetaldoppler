# Doppler PWA

> **Fetal Doppler Signal Capture, Visualization & Research Platform**  
> *Experimental Research Prototype — Not for Clinical Diagnosis or Fetal Wellbeing Determination.*

A high-fidelity Progressive Web App designed to capture real-time audio from conventional handheld fetal Doppler devices via USB audio interfaces. Features lock-free PCM audio capture, real-time waveform & spectrogram visualization, non-destructive incremental OPFS recording, signal quality scoring, and experimental autocorrelation FHR estimation.

---

## 🎯 Key Features

- **Reliable USB Audio Capture**: Direct Web Audio + `AudioWorklet` streaming with active `MediaStreamTrack.getSettings()` verification and internal microphone guard.
- **Real-Time Signal Monitoring**: 60 FPS Canvas 2D waveform, RMS, peak, and clipping detection.
- **Incremental OPFS Storage**: Stream-to-disk recording using the Origin Private File System with crash recovery and standard 16-bit PCM WAV export.
- **DSP & Experimental FHR Engine**: Real-time DC blocking, bandpass filtering, envelope extraction, autocorrelation BPM estimation with harmonic and maternal-rate guards.
- **Research Lab**: Real-time & offline STFT spectrograms, time-series annotations, and non-destructive parameter reprocessing.
- **100% Client-Side & Offline Ready**: Zero backend required; works fully offline as an installed PWA.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Restrained instrumentation dark theme)
- **Audio & DSP**: Web Audio API, `AudioWorklet`, Web Workers
- **Storage**: Origin Private File System (OPFS) + IndexedDB (`idb`)
- **PWA**: `vite-plugin-pwa` + Workbox
- **Testing**: Vitest

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit & DSP tests
npm run test

# Build production PWA bundle
npm run build
```

---

## 🔒 Safety & Disclaimer

This software is strictly an experimental research and signal-monitoring tool. It is **not** a medical device, does not provide clinical diagnoses, and does not determine fetal wellbeing. "Signal Quality" refers solely to audio capture fidelity.
