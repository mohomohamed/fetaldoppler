# Software Requirements Specification (SRS)
## Doppler PWA — Fetal Doppler Signal Capture, Visualization & Research Platform

**Document version:** 1.0  
**Date:** 28 August 2026  
**Product type:** Progressive Web App (PWA)  
**Primary target:** Android + Chromium-based browsers  
**Secondary target:** Desktop Chromium browsers  
**Status:** Prototype / research software — not for diagnosis  

---

# 1. Purpose

This document defines the complete software requirements for a Progressive Web App that receives the **audio output of an external handheld fetal Doppler** through a USB audio-input interface connected to a phone, tablet, or computer.

The application will:

1. Detect and select an external audio input.
2. Capture Doppler audio through browser media APIs.
3. Verify the actual browser-selected audio track and its settings.
4. Visualize the live Doppler waveform.
5. Measure signal level and capture quality.
6. Record the captured PCM stream locally.
7. Derive an experimental fetal-heart-rate estimate from the captured signal.
8. Provide signal-quality and confidence information independently from FHR.
9. Store, replay, annotate, reprocess, compare, and export sessions.
10. Provide an advanced Research Lab for DSP development and algorithm validation.
11. Operate offline after installation where browser/PWA capabilities permit.
12. Never present experimental output as a diagnosis or fetal-wellbeing determination.

The application does **not** create an anatomical ultrasound image.

---

# 2. Product Vision

The product should turn a conventional fetal Doppler with audio output into a modern signal-monitoring and research platform.

Hardware:

```text
Fetal Doppler
      │
      │ 3.5 mm headphone/audio output
      ▼
USB Audio Input Interface
      │
      │ USB-C / USB
      ▼
Phone / Tablet / Computer
      │
      ▼
Chromium Browser / Installed PWA
      │
      ▼
Doppler PWA
```

The product has five conceptual layers:

```text
1. CAPTURE ENGINE
   Reliable browser audio capture

2. SIGNAL MONITOR
   Waveform, level, quality, recording

3. FHR ENGINE
   Experimental fetal heart-rate estimation

4. RESEARCH LAB
   DSP, spectrogram, annotation, algorithm analysis

5. DATASET PLATFORM
   Validation, benchmarking, A/B testing, reprocessing
```

The **captured original signal is the source of truth**. All derived measurements must be reproducible from the stored source recording.

---

# 3. Product Classification and Safety Position

The initial product is an **experimental signal-processing and research prototype**.

It must not claim to:

- diagnose fetal distress;
- determine fetal wellbeing;
- determine whether an FHR is clinically normal or abnormal;
- replace professional fetal monitoring;
- determine fetal position;
- identify fetal sex;
- generate an anatomical ultrasound image;
- estimate fetal size or weight;
- determine placental position;
- measure fetal oxygen saturation;
- measure blood pressure;
- measure contraction strength;
- provide treatment advice;
- recommend induction, delivery, or medical intervention.

Development builds must visibly state:

> **Experimental — not for diagnosis**

Signal-quality labels describe **capture quality only**.

For example:

> Strong signal

means the captured audio is suitable for analysis. It does not mean the fetus is healthy.

Any future commercial medical use requires separate clinical validation, risk management, regulatory review, and jurisdiction-specific approval.

---

# 4. Scope

## 4.1 In Scope

### Capture
- Browser microphone/audio-input permission.
- Enumeration of available audio inputs.
- Selection of external USB audio input.
- Reading actual media-track settings.
- Capture through Web Audio.
- AudioWorklet-based streaming.
- PCM buffering.
- Channel inspection.
- Input-level measurement.
- Dropout/interruption detection.

### Recording
- Local PCM/WAV recording.
- Incremental storage.
- Crash/interruption recovery.
- Session metadata.
- Recording timeline.
- Export.

### DSP
- DC removal.
- spike/transient handling.
- configurable filtering.
- optional downsampling.
- envelope extraction.
- FFT/STFT.
- spectrogram.
- autocorrelation.
- spectral periodicity.
- beat timing.
- signal-quality analysis.
- experimental FHR estimation.
- harmonic handling.
- stabilization.

### UX
- connection setup;
- acquisition guidance;
- live monitoring;
- session recording;
- session summary;
- playback;
- sessions library;
- device profiles;
- Research Lab;
- Engineering Mode;
- settings.

### Research
- WAV import.
- reprocessing.
- annotations.
- dataset organization.
- reference FHR entry.
- algorithm comparison.
- batch analysis.
- metric generation.
- diagnostic bundles.

## 4.2 Out of Scope for V1

- Anatomical ultrasound imaging.
- Direct control of the Doppler transducer.
- WebUSB control of standard USB audio interfaces.
- Clinical CTG interpretation.
- automated fetal-wellbeing classification.
- reliable twin discrimination.
- Health Connect integration from the PWA.
- cloud accounts.
- cloud synchronization.
- advertising.
- analytics tracking.
- automatic upload of recordings.
- medical professional portal.
- remote monitoring.
- background capture guaranteed while browser/PWA is hidden or device is locked.

---

# 5. Critical Web Platform Constraint

The browser is not equivalent to a native Android audio stack.

The PWA must assume:

1. `getUserMedia()` provides audio through the browser/operating-system capture stack.
2. Requested constraints such as echo cancellation, noise suppression, automatic gain control, sample rate, and channel count are **requests**, not guarantees.
3. The app must inspect `MediaStreamTrack.getSettings()` after capture starts.
4. The stored stream is the **captured PCM available to the web application**, not guaranteed raw ADC/RF data.
5. The application cannot guarantee continuous processing after it becomes hidden, the screen locks, the browser suspends the audio context, or the OS kills the PWA.
6. Screen Wake Lock should be used during monitoring, but it can be released by the browser/OS.
7. Supported monitoring mode is therefore primarily **foreground + visible + screen awake**.
8. If visibility, audio-context state, device routing, or track state changes unexpectedly, the session must record the interruption and never silently fabricate continuity.

---

# 6. Primary Platform Requirements

## 6.1 Primary Platform

- Android phone/tablet.
- Current stable Google Chrome or compatible Chromium browser.
- Installed PWA preferred.
- USB-C audio-input interface recognized by Android as an input device.
- HTTPS production origin.

## 6.2 Secondary Platforms

Best-effort support:

- Chrome on Windows.
- Chrome on macOS.
- Microsoft Edge desktop.
- other Chromium-based browsers after compatibility testing.

## 6.3 Non-Primary Platforms

Safari/iOS/iPadOS and Firefox may be evaluated later but are not release-blocking for V1.

The app must use feature detection rather than user-agent assumptions.

---

# 7. Web APIs and Browser Capabilities

The application should use standards-based browser capabilities where available:

- `navigator.mediaDevices.getUserMedia()`
- `navigator.mediaDevices.enumerateDevices()`
- `MediaStreamTrack.getSettings()`
- `MediaStreamTrack.getCapabilities()` where supported
- `MediaStreamTrack.getConstraints()`
- `AudioContext`
- `AudioWorklet`
- `AudioWorkletNode`
- `Web Workers`
- `WebAssembly` as an optional DSP acceleration layer
- `IndexedDB`
- Origin Private File System (OPFS)
- Storage API
- `navigator.storage.estimate()`
- `navigator.storage.persist()`
- Service Worker
- Web App Manifest
- Screen Wake Lock API
- Page Visibility API
- Web Share API where appropriate
- File input / File System APIs where supported
- Canvas 2D
- optional OffscreenCanvas
- optional WebGL for advanced spectrogram rendering

WebUSB is **not required** for standard USB audio input.

---

# 8. Recommended Technology Stack

## 8.1 Application

- TypeScript
- React
- Vite
- PWA manifest
- service worker
- modern CSS
- semantic HTML
- no server dependency for normal use after installation

## 8.2 Core Architecture

Core signal-processing code must be framework-independent TypeScript.

React must be restricted to presentation, navigation, and UI state.

Recommended structure:

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes/
│   └── providers/
│
├── audio/
│   ├── AudioDeviceManager.ts
│   ├── AudioCaptureEngine.ts
│   ├── AudioTrackVerifier.ts
│   ├── AudioRingBuffer.ts
│   ├── ChannelAnalyzer.ts
│   └── CaptureDiagnostics.ts
│
├── worklets/
│   └── DopplerCaptureProcessor.ts
│
├── workers/
│   ├── RecordingWorker.ts
│   ├── DspWorker.ts
│   └── ExportWorker.ts
│
├── dsp/
│   ├── DcBlocker.ts
│   ├── Filters.ts
│   ├── SpikeSuppressor.ts
│   ├── Resampler.ts
│   ├── Downsampler.ts
│   ├── Envelope.ts
│   ├── Fft.ts
│   ├── Stft.ts
│   ├── Spectrogram.ts
│   ├── Autocorrelation.ts
│   ├── SpectralMetrics.ts
│   └── SignalMetrics.ts
│
├── fhr/
│   ├── FhrEstimator.ts
│   ├── AutocorrelationEstimator.ts
│   ├── PeakIntervalEstimator.ts
│   ├── SpectralEstimator.ts
│   ├── CandidateTracker.ts
│   ├── HarmonicGuard.ts
│   ├── MaternalGuard.ts
│   ├── FhrStabilizer.ts
│   └── SignalQualityAnalyzer.ts
│
├── recording/
│   ├── SessionRecorder.ts
│   ├── PcmWriter.ts
│   ├── WavFinalizer.ts
│   ├── RecoveryManager.ts
│   └── RecordingManifest.ts
│
├── storage/
│   ├── Database.ts
│   ├── OpfsRepository.ts
│   ├── SessionRepository.ts
│   ├── DeviceProfileRepository.ts
│   └── SettingsRepository.ts
│
├── research/
│   ├── AnnotationEngine.ts
│   ├── ReprocessingEngine.ts
│   ├── DatasetEngine.ts
│   ├── BenchmarkEngine.ts
│   └── AlgorithmComparison.ts
│
├── ui/
│   ├── design/
│   ├── components/
│   ├── monitor/
│   ├── sessions/
│   ├── playback/
│   ├── devices/
│   ├── research/
│   ├── engineering/
│   └── settings/
│
├── pwa/
│   ├── serviceWorker.ts
│   └── install.ts
│
├── domain/
│   ├── models/
│   ├── events/
│   └── state/
│
└── tests/
```

---

# 9. Mandatory UI Design Workflow

Before implementing or redesigning the interface, the coding agent must install and use the supplied Apple design skill.

Run:

```bash
claude install-skill /path/to/apple-design-skill
```

Replace the placeholder path with the real local path.

The coding agent must:

1. read the complete installed skill instructions;
2. follow those instructions before producing UI code;
3. treat the skill as the primary design reference;
4. adapt its principles to a PWA rather than blindly copying iOS;
5. preserve browser accessibility and native web interaction conventions.

Design direction:

- clean;
- calm;
- premium;
- restrained;
- information-first;
- excellent hierarchy;
- generous spacing;
- strong typography;
- subtle depth;
- minimal visual noise;
- few unnecessary cards;
- no generic admin-dashboard appearance;
- no neon-green medical-monitor cliché;
- no excessive gradients;
- no glassmorphism used purely decoratively;
- no fake Apple system chrome;
- no copied Apple trademark assets.

The target feel is:

> Apple-quality clarity + modern health instrumentation + web-native usability.

---

# 10. Information Architecture

Primary destinations:

1. Monitor
2. Sessions
3. Research
4. Devices
5. Settings

During an active monitoring session, navigation must become visually secondary.

Primary workflow:

```text
Launch
  ↓
Permission / Device Setup
  ↓
Audio Input Verification
  ↓
Signal Search
  ↓
Signal Acquisition
  ↓
Monitoring
  ↓
Stop
  ↓
Session Summary
  ↓
Playback / Research
```

---

# 11. Audio Device Requirements

## FR-AUDIO-001 — Permission

The app shall request audio-input permission only when needed.

Before requesting browser permission, explain:

> Audio access is required to receive the signal from the connected Doppler audio interface. Audio is processed locally on this device.

## FR-AUDIO-002 — Enumeration

After permission is available, the app shall enumerate `audioinput` devices.

Display:

- device label;
- device ID internally;
- group ID when available;
- whether it is the current selection.

## FR-AUDIO-003 — External Input Selection

The user shall be able to choose an available audio input.

The app shall not silently claim a USB device is selected merely because a USB peripheral exists.

## FR-AUDIO-004 — Capture Request

Initial constraints should request:

```ts
{
  audio: {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 }
  }
}
```

Constraints are preferences where the browser allows them.

## FR-AUDIO-005 — Actual Settings Verification

After acquiring the track, inspect:

```ts
track.getSettings()
```

Display actual available values, including where returned:

- deviceId;
- sampleRate;
- sampleSize;
- channelCount;
- latency;
- echoCancellation;
- noiseSuppression;
- autoGainControl.

The app must distinguish:

> Requested

from:

> Actual

## FR-AUDIO-006 — No Silent Internal-Microphone Fallback

If the selected external input disappears or changes:

- do not silently continue and present the session as USB Doppler capture;
- clearly mark the interruption;
- pause FHR interpretation;
- notify the user;
- require re-verification before resuming a validated session.

## FR-AUDIO-007 — Device Change Events

Listen for:

```ts
navigator.mediaDevices.addEventListener("devicechange", ...)
```

Re-enumerate inputs when device availability changes.

## FR-AUDIO-008 — Track State

Monitor:

- `ended`;
- `mute`;
- `unmute`;
- AudioContext state;
- Page Visibility state.

Record these as session events.

---

# 12. Audio Capture Engine

## FR-CAP-001

Use `AudioWorklet`, not deprecated `ScriptProcessorNode`, for real-time capture.

## FR-CAP-002

The AudioWorklet processor shall do the minimum possible work.

Its responsibilities:

- receive input frames;
- copy/accumulate samples;
- maintain sequence/timing information;
- optionally calculate lightweight peak values;
- emit larger chunks to a worker.

Heavy FFT, storage, FHR estimation, compression, and UI rendering must not run in the AudioWorklet.

## FR-CAP-003 — Chunking

Do not send a browser message for every 128-frame render quantum.

Accumulate frames into larger chunks, e.g.:

- 2048 samples;
- 4096 samples;
- configurable.

Transfer buffers to a Worker.

## FR-CAP-004 — Capture Representation

Internally preserve samples as floating-point values supplied by Web Audio.

For long-term storage, V1 may quantize to signed PCM16 WAV provided:

- conversion is deterministic;
- clipping is measured before conversion;
- the conversion algorithm is documented.

Optional research mode may support Float32 WAV later.

## FR-CAP-005 — Sequence Numbers

Each emitted audio chunk shall include:

```ts
interface AudioChunk {
  sequence: number;
  contextTime: number;
  frames: number;
  sampleRate: number;
  channelCount: number;
  channels: Float32Array[];
}
```

The system shall detect missing sequence numbers.

## FR-CAP-006 — Timing

Use monotonic audio timing for signal processing.

Store wall-clock UTC separately for session metadata.

Do not use wall-clock time as the primary DSP timeline.

---

# 13. Channel Analysis

## FR-CHAN-001

Initially preserve every channel supplied by the browser.

## FR-CHAN-002

Analyze:

- RMS per channel;
- peak per channel;
- correlation;
- silence;
- clipping;
- relative level.

## FR-CHAN-003

Determine whether channels are:

- independent;
- duplicated mono;
- one active / one silent;
- polarity inverted;
- substantially imbalanced.

## FR-CHAN-004

Normal processing may choose:

- left;
- right;
- average;
- best-quality channel.

The original captured channel information should remain available where storage policy permits.

---

# 14. Capture-Level Metrics

The engine shall calculate:

- peak dBFS;
- RMS dBFS;
- clipping percentage;
- silence percentage;
- estimated noise floor;
- crest factor;
- approximate SNR;
- DC offset;
- channel correlation;
- periodicity;
- dropped-chunk count.

Normal UI translates these to simple guidance.

Engineering Mode shows numeric values.

---

# 15. Hardware Setup Wizard

The PWA shall provide guided setup.

## Step 1 — Connect USB Interface

```text
Connect your USB audio interface.
Waiting for audio input…
```

## Step 2 — Select Input

List available browser audio inputs.

## Step 3 — Connect Doppler Output

Illustrate:

```text
Doppler 3.5 mm output
        ↓
USB audio INPUT
        ↓
Phone
```

## Step 4 — Signal Test

Display:

- live level;
- clipping;
- waveform;
- channel status.

## Step 5 — Adjust Doppler Volume

User-facing messages:

- Input too low
- Good input level
- Input too high
- Clipping — reduce Doppler volume

## Step 6 — Save Device Profile

Save configuration for later sessions.

---

# 16. Device Profiles

A device profile should include:

```ts
interface DeviceProfile {
  id: string;
  name: string;
  browserDeviceLabel?: string;
  rememberedDeviceId?: string;
  groupId?: string;

  dopplerModel?: string;
  adapterName?: string;

  preferredChannel: "left" | "right" | "mix" | "auto";
  expectedSampleRate?: number;

  gainGuidance?: string;

  dspProfileId: string;

  createdAt: string;
  updatedAt: string;
}
```

Browser device IDs must not be assumed permanently stable.

If identification changes, allow user to re-associate the current audio input with an existing profile.

---

# 17. Calibration

Calibration shall be divided into:

## 17.1 Electronic Noise Baseline

With no useful Doppler signal:

- measure RMS noise;
- spectral distribution;
- narrowband interference;
- DC offset.

## 17.2 Active Signal Calibration

With a Doppler signal:

- determine safe input level;
- identify clipping;
- identify active channel;
- estimate frequency distribution;
- save profile.

The app must not automatically modify the hardware volume.

It should give guidance.

---

# 18. Monitor State Machine

Required states:

```ts
type MonitorState =
  | "NO_PERMISSION"
  | "NO_DEVICE"
  | "DEVICE_SELECTED"
  | "INITIALIZING"
  | "READY"
  | "SEARCHING"
  | "ACQUIRING"
  | "TRACKING"
  | "WEAK_SIGNAL"
  | "SIGNAL_LOST"
  | "INPUT_CLIPPING"
  | "INPUT_DISCONNECTED"
  | "BACKGROUND_UNSUPPORTED"
  | "CAPTURE_ERROR"
  | "STOPPING"
  | "COMPLETE";
```

State transitions must be centralized.

UI components must not independently infer monitoring state from unrelated booleans.

---

# 19. Live Monitor UI

Primary hierarchy:

1. recording status / timer;
2. estimated FHR;
3. signal status;
4. waveform;
5. primary action;
6. marker control.

Example:

```text
● Recording                     02:41

               148
               BPM

           Strong signal
          █████████░

     ╭╮    ╭╮     ╭╮     ╭╮
─────╯╰────╯╰─────╯╰─────╯╰────

              MARK

           Stop Session
```

Requirements:

- no fake ECG terminology;
- call the signal a Doppler waveform;
- no fake heartbeat animation;
- large tabular digits;
- stable number width;
- no excessive decimal precision;
- no health-status color coding;
- large touch targets;
- one-handed use;
- accessible semantics.

---

# 20. Signal Search UX

Before the system has enough evidence to estimate FHR:

```text
Searching for a stable signal…

Signal
████░░░░░░

Move the probe slowly.
```

No fabricated BPM.

---

# 21. Acquisition UX

When periodic signal is present but not yet validated:

```text
Signal found

Establishing rhythm…
███████░░░

Hold position.
```

The app should not display a confident FHR until acquisition criteria are met.

---

# 22. Tracking UX

When tracking is valid:

```text
148 BPM

Strong signal
```

If confidence drops:

```text
--
Reacquiring signal
```

Do not freeze the last valid FHR indefinitely.

---

# 23. Signal Quality Engine

Signal quality is independent from physiological interpretation.

Inputs may include:

- RMS;
- peak;
- clipping;
- silence;
- noise-floor estimate;
- SNR;
- autocorrelation peak strength;
- spectral periodicity;
- estimator agreement;
- temporal consistency;
- movement-like transients.

Required states:

```ts
enum SignalState {
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  NO_SIGNAL = "NO_SIGNAL",
  CLIPPED = "CLIPPED",
  UNSTABLE = "UNSTABLE",
  AMBIGUOUS = "AMBIGUOUS"
}
```

Confidence:

```text
0.0 – 1.0
```

If confidence is insufficient:

```ts
stableBpm = null
```

UI displays:

```text
--
```

rather than an unreliable number.

---

# 24. Signal Quality Hysteresis

State thresholds must use hysteresis to prevent rapid oscillation.

Example concept:

```text
Enter GOOD: > 0.85
Leave GOOD: < 0.72
```

Exact thresholds remain experimental and configurable.

---

# 25. DSP Pipeline

Initial processing pipeline:

```text
Captured Web Audio PCM
        ↓
Channel selection
        ↓
DC removal
        ↓
Spike/transient handling
        ↓
Optional filtering
        ↓
Optional resampling/downsampling
        ↓
Envelope extraction
        ↓
Periodicity analysis
        ↓
Estimator ensemble
        ↓
Harmonic guard
        ↓
Source ambiguity / maternal guard
        ↓
Signal quality
        ↓
Temporal stabilization
        ↓
Displayed estimate
```

All DSP modules must be independently unit-testable.

---

# 26. Resampling

Do not assume the browser delivers exactly 48 kHz.

The system shall record:

- MediaStreamTrack reported sample rate where available;
- AudioContext sample rate;
- DSP internal sample rate.

If downsampling:

1. low-pass filter first;
2. use a documented resampling/downsampling implementation;
3. never simply discard samples without anti-alias filtering.

---

# 27. Envelope Extraction

Provide at least:

## Simple Mode
- absolute-value rectification;
- low-pass smoothing.

## Advanced Mode
- analytic/Hilbert-style envelope or equivalent.

Engineering Mode shall allow comparison.

---

# 28. Spectrogram

Research Lab shall provide a live and playback spectrogram.

Requirements:

- STFT;
- configurable FFT size;
- configurable hop size;
- Hann window default;
- frequency scale;
- time scale;
- optional log magnitude;
- no implication that the spectrogram is an anatomical ultrasound image.

Spectrogram calculation must occur away from the main UI thread.

---

# 29. FHR Estimation

FHR estimation is experimental.

## 29.1 Engineering Search Range

Initial configurable engineering search range:

```text
60–240 BPM
```

This is an algorithm search range, **not a definition of normal fetal physiology**.

## 29.2 Analysis Windows

Initial multi-window approach:

- ~2.0 s short window;
- ~3.75 s primary window;
- ~6.0 s stability window.

Update interval:

```text
~0.5–1.0 seconds
```

Configurable in Engineering Mode.

## 29.3 Estimators

Implement separate estimators:

1. autocorrelation;
2. beat/peak interval;
3. spectral periodicity.

Each returns:

```ts
interface EstimatorResult {
  bpm: number | null;
  confidence: number;
  diagnostics: Record<string, number | string | boolean>;
}
```

## 29.4 Consensus

Fuse estimators using confidence.

If estimators disagree beyond configurable tolerance:

```text
AMBIGUOUS
```

and do not force a displayed BPM.

---

# 30. Autocorrelation Estimator

The autocorrelation estimator shall:

1. operate on a suitable processed/envelope signal;
2. search lags corresponding to the configured engineering BPM range;
3. identify the strongest candidates;
4. preserve second-best candidates;
5. calculate peak-to-background strength;
6. expose diagnostic values.

Example diagnostic output:

```text
Best candidate      148.2 BPM
Second candidate     74.1 BPM
Primary peak         0.91
Second peak          0.54
```

---

# 31. Harmonic Guard

The system must explicitly detect probable:

- x2;
- /2;
- other strong harmonic ambiguity.

Use:

- estimator history;
- relative autocorrelation peak strengths;
- agreement across windows;
- previous stable lock;
- spectral evidence.

Never choose a harmonic purely because it is numerically closer to the previous value.

---

# 32. Candidate Tracker

Track multiple candidates through time.

Example:

```ts
interface FhrCandidate {
  bpm: number;
  confidence: number;
  ageMs: number;
  supportingEstimators: string[];
  harmonicRelationship?: "NONE" | "HALF" | "DOUBLE" | "OTHER";
}
```

This permits smoother acquisition and better ambiguity handling.

---

# 33. FHR Stabilization

Maintain:

1. instantaneous estimate;
2. validated estimate;
3. displayed estimate.

Normal monitor shows only the displayed estimate.

Research Mode shows all.

Stabilization should use:

- median/robust filtering;
- candidate persistence;
- confidence;
- estimator consensus;
- jump rejection;
- lock/reacquisition state.

Do not use a simple arithmetic average as the only stabilization method.

---

# 34. Maternal-Rate Guard

The PWA cannot rely on Android Health Connect.

V1 supports:

- manual maternal-heart-rate entry;
- optional manually updated reference timeline.

Future experimental capability may add a supported Bluetooth heart-rate device via Web Bluetooth on compatible browsers, but it is not a V1 dependency.

If Doppler candidate is close to maternal reference:

```text
Possible maternal-rate match.
FHR estimate withheld.
```

Store maternal reference separately from FHR.

If no maternal reference exists:

```text
Maternal comparison unavailable
```

Do not pretend source discrimination occurred.

---

# 35. Beat Event Detection

The research engine may produce beat events:

```ts
interface DetectedBeat {
  timestampSeconds: number;
  confidence: number;
  source: "PEAK" | "AUTOCORR" | "CONSENSUS";
}
```

Beat events may support:

- visualization;
- interval analysis;
- template matching;
- future algorithm development.

They are not equivalent to ECG R-waves.

---

# 36. Movement and Artifact Detection

V1:

- detect large broadband/transient artifacts;
- identify probable probe movement/noise;
- temporarily suppress FHR confidence.

User-facing terminology:

> Probe/audio movement artifact detected

Do not automatically label fetal movement unless explicitly marked manually.

Automatic fetal-movement detection is Research Mode only and must remain experimental.

---

# 37. Manual Markers

During monitoring, provide one large:

```text
MARK
```

button.

Single tap stores a generic timestamp.

Optional long press / secondary action:

- Movement felt
- Probe moved
- Signal changed
- Note
- Other

Marker creation must not interrupt capture.

---

# 38. Pre-Roll Recording

Maintain a short circular audio buffer while monitoring.

Configurable pre-roll:

```text
10–20 seconds
```

If recording is started after a good signal is found, include the pre-roll where technically feasible.

---

# 39. Recording Architecture

The recording path must be independent from DSP.

```text
AudioWorklet
   ├── Recording Worker
   ├── DSP Worker
   └── Visualization
```

Priority:

1. preserve audio;
2. preserve timing;
3. detect data loss;
4. run DSP;
5. update UI;
6. animate.

If CPU pressure occurs, drop visualization frames before dropping recording data.

---

# 40. Browser Storage Architecture

Use:

### OPFS
For large binary recording data and temporary capture files.

### IndexedDB
For:

- session indexes;
- device profiles;
- settings;
- processing metadata;
- annotations;
- references;
- export history.

Recommended session directory:

```text
/sessions/<session-id>/
├── capture.pcm
├── checkpoint.json
├── raw.wav
├── session.json
├── fhr.json
├── quality.json
├── markers.json
├── annotations.json
└── processing/
    ├── run-001.json
    └── run-002.json
```

---

# 41. Incremental Recording

Do not keep an entire session in JavaScript memory.

The Recording Worker shall incrementally write chunks to OPFS.

During active capture:

```text
capture.pcm
checkpoint.json
```

On clean completion:

1. finalize WAV;
2. write session metadata;
3. verify sizes;
4. mark session complete.

---

# 42. WAV Format

V1 preferred export:

- RIFF/WAVE;
- PCM16;
- mono where selected processing channel is mono;
- source sample rate as captured/defined.

If original capture is multi-channel and preserving multi-channel source is enabled, export a multichannel WAV.

The app must document that this WAV represents the browser-delivered audio stream, not ultrasound RF data.

For very long recordings, avoid RIFF size overflow by:

- limiting V1 session length;
- segmenting recordings;
- or introducing RF64 in a later version.

---

# 43. Crash Recovery

If a session is interrupted:

On next launch:

```text
An unfinished recording was found.

Duration recovered: 03:18

[ Recover ] [ Discard ]
```

Recovery should reconstruct a playable/exportable WAV from valid stored PCM chunks.

Do not silently delete interrupted recordings.

---

# 44. Storage Management

Before recording:

- call `navigator.storage.estimate()` where available;
- show estimated available quota;
- calculate approximate recording capacity;
- warn if space is low.

Request persistent storage using:

```ts
navigator.storage.persist()
```

where available.

The user must be informed that browser storage may still be affected by browser/site-data actions.

---

# 45. Storage Estimate Guidance

Approximate PCM16 mono storage at 48 kHz:

```text
~5.8 MB/minute
~346 MB/hour
```

Actual storage differs with sample rate, channel count, metadata, and browser implementation.

The application shall calculate using actual active configuration rather than hard-coded values.

---

# 46. Session Model

```ts
interface DopplerSession {
  id: string;

  startedAtUtc: string;
  endedAtUtc?: string;

  durationSeconds: number;

  status:
    | "ACTIVE"
    | "COMPLETE"
    | "INTERRUPTED"
    | "RECOVERED";

  deviceProfileId?: string;

  capture: CaptureConfiguration;

  sourceFile: {
    path: string;
    sha256?: string;
    bytes?: number;
  };

  qualitySummary?: SessionQualitySummary;

  notes?: string;
  gestationalAgeText?: string;

  createdWithAppVersion: string;
}
```

Do not require personally identifiable patient information.

Anonymous session should be the default.

---

# 47. Capture Configuration Model

```ts
interface CaptureConfiguration {
  requestedDeviceId?: string;
  actualDeviceId?: string;
  deviceLabel?: string;

  requestedSampleRate?: number;
  trackSampleRate?: number;
  audioContextSampleRate: number;

  channelCount?: number;
  sampleSize?: number;

  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;

  appCaptureFormat: "FLOAT32";
  storageFormat: "PCM16" | "FLOAT32";
}
```

---

# 48. FHR Timeline Model

```ts
interface FhrPoint {
  timeSeconds: number;

  rawBpm: number | null;
  validatedBpm: number | null;
  stableBpm: number | null;

  confidence: number;
  state: SignalState;

  estimatorResults: {
    autocorrelation?: number | null;
    peakInterval?: number | null;
    spectral?: number | null;
  };

  processingRunId: string;
}
```

---

# 49. Quality Timeline Model

```ts
interface QualityPoint {
  timeSeconds: number;

  state: SignalState;
  confidence: number;

  rmsDbfs?: number;
  peakDbfs?: number;
  clippingPercent?: number;
  silencePercent?: number;
  snrDb?: number;
  periodicity?: number;

  droppedChunks?: number;
}
```

---

# 50. Session Events

Unified event model:

```ts
type SessionEventType =
  | "SIGNAL_ACQUIRED"
  | "SIGNAL_LOST"
  | "CLIPPING_STARTED"
  | "CLIPPING_ENDED"
  | "USER_MARKER"
  | "MOVEMENT_MARKER"
  | "PROBE_MOVED"
  | "POSSIBLE_MATERNAL_MATCH"
  | "DEVICE_CHANGED"
  | "TRACK_MUTED"
  | "TRACK_ENDED"
  | "AUDIO_CONTEXT_SUSPENDED"
  | "PAGE_HIDDEN"
  | "PAGE_VISIBLE"
  | "WAKE_LOCK_RELEASED"
  | "CAPTURE_INTERRUPTED";

interface SessionEvent {
  timeSeconds: number;
  type: SessionEventType;
  confidence?: number;
  metadata?: Record<string, string | number | boolean>;
}
```

---

# 51. Wake Lock

During active monitoring:

- request Screen Wake Lock where supported;
- show whether it is active;
- listen for automatic release;
- re-request when the page becomes visible again if the session is still active.

User shall have an option:

```text
Keep screen awake during monitoring
```

The app must not imply wake lock guarantees background recording.

---

# 52. Visibility Handling

When `document.visibilityState` becomes hidden:

1. record a `PAGE_HIDDEN` event;
2. keep capture running if the browser continues it;
3. detect AudioContext suspension;
4. warn when the user returns if continuity was lost;
5. never fabricate data across the gap.

Normal monitoring instructions shall state:

> Keep the app open and the screen awake during monitoring.

---

# 53. Audio Context Handling

Monitor:

```ts
audioContext.state
```

States such as suspended/closed must affect capture status.

If suspended unexpectedly:

- mark analysis unavailable;
- attempt safe recovery after user interaction if required;
- preserve stored capture data already written;
- record the interruption.

---

# 54. Recording Indicator

During recording:

```text
● Recording     02:41
```

No full-screen flashing.

Reduced-motion preferences must disable pulsing animation.

---

# 55. Session Stop

Stopping shall:

1. stop accepting new AudioWorklet data;
2. drain pending worker buffers;
3. finalize recording;
4. persist metadata;
5. write hashes if enabled;
6. release wake lock;
7. close/release media tracks if session is ending;
8. transition to Session Summary.

Confirmation is required to avoid accidental stopping.

---

# 56. Session Summary

Example:

```text
Session Saved

04:38

Usable capture           91%
Estimated FHR available  83%
Markers                   3

Raw recording            Saved

[ Review Session ]
[ Done ]
```

No medical conclusion.

---

# 57. Sessions Library

Group by date.

Each item may show:

- date/time;
- duration;
- capture-quality label;
- markers;
- interrupted/recovered status.

Do not make the default library a dense table.

---

# 58. Playback

Playback shall synchronize:

- audio;
- waveform;
- FHR timeline;
- signal quality;
- markers;
- annotations;
- spectrogram cursor.

Provide:

- play;
- pause;
- seek;
- time display;
- speed control for research if desired;
- loop selection.

---

# 59. Loop Selection

Research playback shall allow:

```text
IN  01:42.20
OUT 01:48.80

[ LOOP ]
```

Useful for algorithm debugging.

---

# 60. WAV Import

Research Lab shall allow importing a compatible WAV.

Imported files shall:

- remain unmodified;
- receive a new session/import ID;
- be analyzed through the same offline DSP pipeline;
- retain source-file metadata;
- allow annotations and processing runs.

---

# 61. Non-Destructive Processing

Never overwrite the source recording.

Architecture:

```text
raw.wav
   ├── processing run 001
   ├── processing run 002
   └── processing run 003
```

Every result shall reference a processing run.

---

# 62. Processing Manifest

```ts
interface ProcessingRun {
  id: string;
  sessionId: string;

  algorithmVersion: string;
  createdAtUtc: string;

  configuration: DspConfiguration;

  sourceFileHash?: string;

  resultFiles: string[];
}
```

---

# 63. DSP Configuration

Configuration shall be serializable.

Example:

```ts
interface DspConfiguration {
  internalSampleRate: number;

  dcRemoval: boolean;

  envelope:
    | "RECTIFIED_LOWPASS"
    | "ANALYTIC";

  analysisWindowsSeconds: number[];

  updateIntervalSeconds: number;

  searchBpmMin: number;
  searchBpmMax: number;

  confidenceThreshold: number;

  harmonicGuardEnabled: boolean;

  estimatorWeights: {
    autocorrelation: number;
    peakInterval: number;
    spectral: number;
  };
}
```

---

# 64. Research Lab

Modules:

## Signal
- raw waveform;
- selected channel;
- processed waveform;
- envelope.

## Time-Frequency
- spectrogram;
- spectral bands;
- FFT diagnostics.

## FHR
- autocorrelation;
- candidate lags;
- estimator values;
- consensus;
- raw FHR;
- validated FHR;
- stabilized FHR;
- harmonic decisions.

## Quality
- RMS;
- peak;
- SNR;
- clipping;
- periodicity;
- estimator agreement.

## Events
- markers;
- artifacts;
- signal acquired/lost;
- browser interruptions.

## Processing
- algorithm version;
- parameters;
- reprocess;
- compare.

---

# 65. Engineering Mode

Engineering Mode shall expose:

- browser information;
- PWA installation state;
- selected input;
- actual track settings;
- AudioContext sample rate/state;
- AudioWorklet chunk size;
- chunk sequence;
- dropped chunks;
- worker queue depth;
- storage write latency;
- OPFS availability;
- storage quota;
- wake-lock state;
- page visibility;
- raw channel RMS;
- peak;
- clipping;
- DC offset;
- noise floor;
- current DSP configuration;
- estimator diagnostics;
- logs.

Engineering controls must not appear on the normal monitor screen.

---

# 66. Live Spectrogram Performance

Do not compute/render a full-resolution spectrogram on the main thread.

Recommended architecture:

```text
AudioWorklet
    ↓
DSP Worker
    ↓
STFT
    ↓
decimated spectrogram data
    ↓
Canvas/WebGL UI
```

If performance is insufficient:

1. reduce visual frame rate;
2. reduce spectrogram update frequency;
3. reduce visual resolution;

before reducing audio-capture reliability.

---

# 67. Visualization Requirements

Target:

- waveform ~30 fps where practical;
- FHR value updates ~1–2 Hz;
- quality updates ~2–5 Hz;
- trend updates on new validated estimates;
- spectrogram update based on DSP configuration.

Never render all 48,000 samples each second directly.

Use min/max decimation or equivalent visualization sampling.

---

# 68. Trend Graph

FHR trend:

- timestamped;
- gaps where data is unavailable;
- no interpolation across invalid signal periods by default;
- scalable timescale;
- synchronized playback cursor.

Normal-mode graphs must not use clinical alarm zones.

---

# 69. Recording Quality Summary

At session end calculate capture metrics such as:

- total duration;
- signal-present percentage;
- high/medium/poor quality percentage;
- clipping percentage;
- signal-loss duration;
- FHR-estimate-available percentage.

Any numeric score must be labelled:

> Recording Quality

not fetal health.

---

# 70. Data Annotations

Annotations may represent:

- good signal;
- weak signal;
- lost signal;
- clipping;
- probe movement;
- external noise;
- possible maternal-rate match;
- manual reference;
- user note;
- unknown artifact.

Support:

- point annotations;
- time-range annotations;
- comments;
- confidence;
- optional reviewer ID;
- annotation version history.

---

# 71. Reference FHR

For algorithm validation, allow manual reference entry.

Example:

```text
Timestamp: 01:42
Reference FHR: 149 BPM
Reference source: Doppler display
```

Keep reference values separate from algorithm output.

Never use reference input to overwrite calculated results.

---

# 72. Blind Validation Mode

Research option:

1. hide reference data;
2. run algorithm;
3. freeze result;
4. reveal reference;
5. calculate error.

Purpose: reduce tuning bias.

---

# 73. Dataset Management

Research Lab may organize sessions into datasets.

Example:

```text
Clean signals
Movement artifacts
Possible maternal-rate samples
Weak signal
Device A
Adapter B
```

Dataset membership must be metadata only; source recordings remain unchanged.

---

# 74. Batch Reprocessing

Allow:

```text
Algorithm: autocorr-v7
Sessions: 214

[ Reprocess Dataset ]
```

Execute sequentially or with bounded concurrency.

Do not freeze the UI.

Progress must be visible.

---

# 75. Algorithm Comparison

Compare two processing runs:

- FHR availability;
- agreement with reference;
- MAE where reference exists;
- median absolute error;
- high-confidence error;
- false-lock rate;
- dropout;
- reacquisition time;
- estimator disagreement.

These metrics are research metrics only.

---

# 76. Golden WAV Test Suite

Maintain controlled test fixtures:

```text
clean-periodic.wav
weak-signal.wav
clipping.wav
dropout.wav
movement-artifact.wav
possible-maternal-rate.wav
harmonic-half-rate.wav
harmonic-double-rate.wav
```

Expected behavior must be encoded in automated tests.

---

# 77. Synthetic DSP Tests

Generate deterministic synthetic test signals for software correctness.

Examples:

- 120 BPM;
- 140 BPM;
- 160 BPM;
- noise;
- clipping;
- dropouts;
- half/double harmonics;
- abrupt transition;
- no signal.

Synthetic tests are not clinical validation.

---

# 78. Privacy

V1 shall be local-first.

Default:

- no account;
- no cloud;
- no analytics SDK;
- no advertising SDK;
- no automatic upload;
- no remote telemetry;
- no third-party recording access.

Sessions are stored in browser application storage until explicitly exported or deleted.

---

# 79. Local Storage Warning

Users must be told:

- browser/site-data clearing can remove local sessions;
- uninstalling/resetting browser data may remove app data;
- persistent storage requests reduce but do not universally eliminate storage risk;
- important recordings should be exported.

---

# 80. Optional App Lock

Future capability:

- PIN;
- device credential via platform capability where available;
- local privacy lock.

Do not block MVP on this feature.

---

# 81. Data Retention

Settings:

- Never auto-delete
- 30 days
- 90 days
- 1 year

Default:

```text
Never auto-delete
```

unless product policy later changes.

Explicit:

```text
Delete all local data
```

shall be available with confirmation.

---

# 82. Export Package

Export a session as a ZIP where feasible:

```text
session-<id>.zip
├── raw.wav
├── session.json
├── fhr.csv
├── quality.csv
├── events.csv
├── markers.csv
├── annotations.json
└── processing-manifest.json
```

Optional:

```text
spectrogram.png
technical-report.pdf
```

later.

---

# 83. CSV Export

Minimum FHR CSV:

```csv
time_seconds,raw_bpm,validated_bpm,stable_bpm,confidence,state,processing_run
```

Quality CSV:

```csv
time_seconds,rms_dbfs,peak_dbfs,clipping_percent,snr_db,periodicity,state
```

---

# 84. Source Integrity

After finalization, optionally calculate SHA-256 for source WAV.

Store hash in session metadata.

Processing runs may record the source hash they used.

---

# 85. PWA Requirements

The app shall include:

- Web App Manifest;
- installable icons;
- standalone display mode;
- theme metadata;
- service worker;
- app-shell caching;
- offline startup;
- offline access to existing sessions;
- offline DSP/research functions.

No network should be required during an active local monitoring session after the application is installed and cached.

---

# 86. Service Worker Policy

The service worker shall cache:

- application shell;
- JavaScript bundles;
- styles;
- icons;
- static fonts if licensed for web embedding;
- DSP/WASM assets;
- offline fallback.

Do not route live audio through the service worker.

Do not rely on Background Sync for continuous monitoring.

---

# 87. Version Management

Every session stores:

- app version;
- DSP version;
- FHR algorithm version;
- device profile version.

When application code updates:

- old source sessions remain readable;
- old processing runs remain preserved;
- migrations must be explicit and tested.

---

# 88. Update UX

Do not force-refresh while monitoring.

If a new PWA version becomes available during an active session:

```text
Update available.
It will be applied after this session.
```

Activate new service worker only when safe.

---

# 89. UI Design System

Create semantic tokens.

Example:

```text
ui/design/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radius.ts
├── motion.ts
├── shadows.ts
└── charts.ts
```

Avoid scattered hard-coded visual values.

Semantic signal states:

```text
signalStrong
signalGood
signalWeak
signalLost
recording
warning
```

Do not encode meaning by color alone.

---

# 90. Typography

FHR number:

- large;
- tabular numerals where font supports them;
- stable layout;
- excellent distance readability;
- no decorative typeface.

Normal mode:

```text
148 BPM
```

Research:

```text
148.37 BPM
```

only where meaningful.

---

# 91. Accessibility

Requirements:

- semantic labels;
- keyboard usability on desktop;
- visible focus states;
- 44–48 px minimum touch targets;
- large primary monitoring controls;
- screen-reader descriptions;
- no color-only state;
- high contrast;
- reduced-motion support;
- text scaling;
- portrait and landscape support.

Example screen-reader text:

> Estimated fetal heart rate, 148 beats per minute. Signal quality strong.

---

# 92. Responsive Layout

Phone:

```text
FHR
Signal
Waveform
Controls
```

Tablet/desktop:

```text
┌──────────────┬──────────────────────────┐
│ FHR          │ Waveform                 │
│ Signal       ├──────────────────────────┤
│ Recording    │ FHR Trend                │
│ Controls     ├──────────────────────────┤
│              │ Spectrogram / Research   │
└──────────────┴──────────────────────────┘
```

Research tools may use wider multi-column layouts.

---

# 93. Dark Mode

Support:

- system;
- light;
- dark.

Dark mode must use neutral low-glare surfaces, not a neon monitor theme.

---

# 94. Low-Light Mode

Optional monitoring preference:

- reduce visual intensity;
- reduce decorative contrast;
- preserve measurement readability.

Do not manipulate device brightness without clear user intent and supported APIs.

---

# 95. Motion

Motion should explain state changes.

Allowed:

- subtle state transitions;
- recording indicator;
- acquisition progress;
- smooth graph updates.

Avoid:

- bouncing BPM;
- decorative looping gradients;
- excessive card motion;
- glow effects.

Respect `prefers-reduced-motion`.

---

# 96. Haptic Feedback

PWAs may have limited vibration support depending on platform.

Where supported and user-enabled:

- marker confirmation;
- signal acquired;
- disconnect warning.

Do not vibrate on every heartbeat.

This must be optional and feature-detected.

---

# 97. Error Handling

Normal UI errors must explain:

1. what happened;
2. what the user can do.

Example:

```text
Unable to use the selected audio input.

Reconnect the USB audio adapter and try again.

[ Try Again ]
```

Engineering Mode may show browser exception details.

---

# 98. Required Error States

- Permission denied
- No audio input
- Selected input unavailable
- Device changed
- Track ended
- Track muted
- AudioContext suspended
- AudioContext closed
- Page hidden
- Wake lock unavailable
- Wake lock released
- OPFS unavailable
- Storage quota low
- Storage write failed
- recording finalization failed
- corrupted recovery data
- AudioWorklet load failure
- DSP worker failure
- algorithm failure
- export failure

Analysis failure must not automatically terminate capture if recording can safely continue.

---

# 99. Safe Degradation

If FHR analysis crashes:

```text
Analysis unavailable.
Recording continues.
```

If spectrogram rendering fails:

- disable spectrogram;
- continue waveform/FHR if available.

If Research Lab fails:

- normal monitoring should remain usable.

---

# 100. Performance Requirements

## NFR-PERF-001

AudioWorklet processing must remain minimal.

## NFR-PERF-002

No routine DSP work on the React rendering thread.

## NFR-PERF-003

Recording must not depend on UI frame rate.

## NFR-PERF-004

Visualization may reduce to 15 fps under load before capture is compromised.

## NFR-PERF-005

Bound all worker queues.

If a non-recording analytics queue falls behind, drop stale visualization/analysis work rather than unbounded memory growth.

## NFR-PERF-006

Recording queue overflow is a critical error and must be logged and surfaced.

---

# 101. Memory Requirements

Do not retain full sessions in RAM.

Maintain bounded:

- AudioWorklet accumulation buffer;
- visualization buffer;
- DSP rolling windows;
- pre-roll ring buffer;
- recording worker queue.

Long-term audio goes directly to storage.

---

# 102. Offline Requirements

After successful PWA installation/cache:

- app shall launch without internet;
- existing sessions shall open;
- live capture shall operate without a server;
- recording shall operate locally;
- DSP shall operate locally;
- export shall operate locally.

First-time installation and microphone permission require normal browser security conditions.

---

# 103. Security Headers

Production hosting should use appropriate HTTPS and security headers.

If future optimization uses `SharedArrayBuffer`, enable cross-origin isolation through suitable COOP/COEP configuration after confirming all app dependencies are compatible.

V1 does not require SharedArrayBuffer.

---

# 104. Logging

Maintain a bounded local developer log.

Example:

```text
20:41:02 media permission granted
20:41:03 input selected: USB Audio CODEC
20:41:03 track sample rate: 48000
20:41:03 AudioContext: running
20:41:04 capture started
20:41:07 signal acquired
20:41:11 FHR lock: 148
```

Do not include personally identifying information by default.

---

# 105. Diagnostic Bundle

Engineering Mode:

```text
Generate Diagnostic Bundle
```

Package may contain:

```text
app-info.json
browser-info.json
capture-settings.json
dsp-settings.json
storage-info.json
logs.txt
optional-selected-audio-sample.wav
```

Audio inclusion must be explicit.

---

# 106. Feature Flags

Experimental capabilities shall be feature-flagged.

Example:

```ts
const featureFlags = {
  spectrogram: true,
  advancedEnvelope: true,
  maternalGuard: true,
  movementClassifier: false,
  experimentalMlClassifier: false,
  webBluetoothMaternalHr: false
};
```

---

# 107. Demo Mode

Simulation shall exist only behind explicit:

```text
Demo Mode
```

Never intermingle simulated values with real capture without clear visual indication.

Production monitoring screen must not fabricate data.

---

# 108. Data Source Abstraction

Use a common source interface:

```ts
interface DopplerSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly chunks: AsyncIterable<AudioChunk>;
}
```

Implementations:

```text
LiveMediaStreamSource
WavFileSource
SimulatedSource
```

DSP should not care whether data came from USB capture or a saved WAV.

---

# 109. Browser Capability Check

At startup evaluate:

- secure context;
- mediaDevices;
- getUserMedia;
- enumerateDevices;
- AudioContext;
- AudioWorklet;
- IndexedDB;
- OPFS;
- service worker;
- Wake Lock;
- storage APIs.

Display a compatibility report.

Critical missing capability:

```text
AudioWorklet
```

should block live monitoring if no safe fallback exists.

---

# 110. Compatibility Screen

Example:

```text
Browser Compatibility

Audio input          ✓
AudioWorklet         ✓
Local recording      ✓
Persistent storage   ✓
Screen wake lock     ✓
Offline PWA          ✓

Ready
```

Feature-detected, not hard-coded.

---

# 111. Session Quality Metrics

Store:

```ts
interface SessionQualitySummary {
  signalPresentPercent: number;
  goodSignalPercent: number;
  fairSignalPercent: number;
  poorSignalPercent: number;
  clippedPercent: number;
  fhrAvailablePercent: number;
  interruptions: number;
  droppedAudioChunks: number;
}
```

Do not call this a fetal-health score.

---

# 112. Browser Interruption Events

The app must preserve a timeline of periods where:

- page hidden;
- screen wake lock lost;
- AudioContext suspended;
- input muted;
- input ended;
- device changed.

Playback should show gaps/markers.

---

# 113. No Fake Continuity

Never interpolate FHR across unsupported capture gaps by default.

If visualization smoothing is used, it must not create data in sections marked invalid.

---

# 114. Measurement Age

Engineering Mode shall expose:

```text
Last valid estimate: 0.7 s ago
```

Normal UI automatically removes the FHR after the configured stale threshold.

---

# 115. Monitoring Instructions

The app shall explain:

- use a USB audio **input** interface, not an output-only headphone dongle;
- keep the PWA visible;
- keep the screen awake;
- avoid clipping;
- verify the selected input before monitoring;
- the app is experimental.

---

# 116. No Automatic USB Assumptions

A device label containing `USB` may help UX but must not be treated as definitive proof of Doppler source.

The source is user-selected and verified through signal testing.

---

# 117. Research Metrics

When reference data exists, calculate:

- absolute error;
- mean absolute error;
- median absolute error;
- percentile error;
- FHR availability;
- high-confidence availability;
- false-lock events;
- harmonic errors;
- reacquisition time;
- signal-quality-conditioned performance.

Do not present these as clinical validation unless a proper validation study has occurred.

---

# 118. Algorithm Provenance

Every FHR result must be traceable to:

- source session;
- processing run;
- algorithm version;
- parameter configuration;
- source file hash where available.

---

# 119. Test Strategy

## Unit Tests
- DC blocker;
- filter;
- resampler;
- envelope;
- autocorrelation;
- spectral estimator;
- candidate tracker;
- harmonic guard;
- stabilizer;
- quality engine;
- WAV writer;
- recovery finalizer;
- CSV export.

## Integration Tests
- MediaStream → AudioWorklet → worker.
- AudioWorklet → OPFS.
- OPFS → WAV finalization.
- WAV playback → DSP.
- session metadata round trip.
- service worker update behavior.

## UI Tests
Critical states:

- permission;
- no device;
- ready;
- searching;
- acquiring;
- tracking;
- weak signal;
- signal lost;
- clipping;
- recording;
- disconnect;
- background interruption;
- session saved;
- dark mode;
- large text.

## Device Tests
At minimum test:

- one Android phone + one known USB audio interface;
- a second Android model;
- desktop Chromium;
- unplug/replug;
- device change;
- low battery/power-save;
- long session;
- offline installed PWA.

---

# 120. Validation Development Strategy

Before trusting FHR estimation:

1. Capture known Doppler recordings.
2. Save source audio.
3. Manually record Doppler display reference values.
4. Annotate signal quality.
5. Run algorithm offline.
6. Compare app output to reference.
7. track error and failure modes.
8. preserve all algorithm versions.

Never tune only by visually observing a few sessions.

---

# 121. Development Milestones

## Milestone 0 — Project Foundation

Deliver:

- PWA scaffold;
- HTTPS development workflow;
- manifest;
- service worker;
- React/TypeScript structure;
- Apple design skill installed and reviewed;
- design tokens;
- capability-check screen;
- automated tests.

Acceptance:

- installable PWA;
- offline app shell;
- no simulated medical data on production screen.

## Milestone 1 — Real Audio Input

Deliver:

- audio permission;
- enumerate inputs;
- select input;
- `getUserMedia`;
- actual settings display;
- AudioContext;
- AudioWorklet;
- live waveform;
- RMS;
- peak;
- clipping;
- channel inspection.

Acceptance:

- connect fetal Doppler through USB audio input;
- selected input can be identified;
- live waveform reflects actual Doppler audio;
- no FHR algorithm yet.

## Milestone 2 — Reliable Recording

Deliver:

- Recording Worker;
- OPFS;
- incremental PCM storage;
- checkpoints;
- WAV finalization;
- 30-second test recording;
- playback;
- download/export WAV.

Acceptance:

- recorded WAV audibly matches live Doppler signal;
- app does not retain entire file in memory;
- interrupted recording is recoverable.

## Milestone 3 — Session System

Deliver:

- session database;
- sessions library;
- metadata;
- events;
- markers;
- session summary;
- playback timeline;
- source integrity metadata.

Acceptance:

- create, close, reopen, play and export sessions offline.

## Milestone 4 — Signal Processing

Deliver:

- DC removal;
- filtering;
- downsampling;
- envelopes;
- quality metrics;
- waveform comparison;
- Engineering Mode.

Acceptance:

- offline WAV produces deterministic processed output;
- poor/clipped/no-signal segments are identifiable.

## Milestone 5 — Experimental FHR V1

Deliver:

- autocorrelation estimator;
- engineering search range;
- rolling windows;
- raw FHR;
- confidence;
- no-result behavior.

Acceptance:

- estimator can process known test WAVs;
- low-confidence windows output null rather than invented BPM.

## Milestone 6 — FHR Robustness

Deliver:

- peak interval estimator;
- spectral estimator;
- consensus;
- candidate tracker;
- harmonic guard;
- stabilizer;
- acquisition lock;
- stale measurement handling.

Acceptance:

- synthetic half/double-rate fixtures do not trivially fool the displayed result;
- ambiguous cases return no result.

## Milestone 7 — Research Lab

Deliver:

- spectrogram;
- autocorrelation view;
- estimator diagnostics;
- annotations;
- loop selection;
- processing runs;
- reprocessing.

Acceptance:

- one WAV can be reprocessed with multiple configurations without modifying source.

## Milestone 8 — Calibration & Device Profiles

Deliver:

- setup wizard;
- noise baseline;
- channel auto-selection;
- device profiles;
- input-level guidance;
- compatibility report.

Acceptance:

- a saved device combination can be quickly reconfigured on a later session.

## Milestone 9 — Dataset & Validation

Deliver:

- datasets;
- manual reference FHR;
- blind mode;
- batch reprocessing;
- algorithm comparison;
- research metrics.

Acceptance:

- multiple sessions can be benchmarked against manually entered references.

## Milestone 10 — Production Polish

Deliver:

- accessibility;
- responsive tablet/desktop UI;
- dark mode;
- low-light mode;
- safe PWA updates;
- diagnostic bundle;
- storage warnings;
- robust error handling;
- export package.

---

# 122. MVP Definition

The minimum useful real-world MVP is complete when:

1. PWA installs on target Android device.
2. App can request audio permission.
3. User can select the USB audio input.
4. App displays actual track settings.
5. Real Doppler audio produces a live waveform.
6. Input level/clipping can be assessed.
7. User can record at least a 30-minute session without unbounded memory growth.
8. Recording is stored incrementally.
9. Session can be stopped and reopened.
10. WAV can be exported.
11. App can operate offline after installation.
12. Device disconnect is detected.
13. App does not silently substitute another input.
14. Audio interruptions are marked.
15. No diagnosis is generated.

**FHR estimation is not required for the first hardware-proven MVP.**

---

# 123. FHR Release Gate

Experimental FHR should appear in normal Monitor Mode only after:

- source recordings are available;
- test fixtures exist;
- algorithm has been evaluated against reference Doppler readings;
- harmonic failure modes are tested;
- signal-quality gating exists;
- stale values disappear correctly;
- ambiguous/no-signal conditions produce `--`;
- results are labelled `Estimated FHR`;
- prototype disclaimer remains visible in appropriate app areas.

Before that, FHR remains an Engineering/Research feature.

---

# 124. Browser-Specific Acceptance Criteria

On the primary Android + Chromium target:

### AC-WEB-001
`getUserMedia()` works from HTTPS/PWA context.

### AC-WEB-002
Permission denial is handled without crash.

### AC-WEB-003
Audio inputs are enumerated after permission.

### AC-WEB-004
Selected input can be requested via device ID.

### AC-WEB-005
Actual track settings are recorded.

### AC-WEB-006
AudioWorklet runs while app is visible.

### AC-WEB-007
Screen Wake Lock is requested where supported.

### AC-WEB-008
Wake-lock release is detected.

### AC-WEB-009
Page visibility changes are recorded.

### AC-WEB-010
OPFS or supported fallback storage can persist session data.

### AC-WEB-011
Storage quota can be estimated where API is available.

### AC-WEB-012
PWA app shell loads offline.

---

# 125. Audio Acceptance Criteria

### AC-AUDIO-001
No processing is performed on the React main rendering path that can block audio capture.

### AC-AUDIO-002
AudioWorklet uses bounded buffers.

### AC-AUDIO-003
Recording detects sequence discontinuities.

### AC-AUDIO-004
Clipping is detectable.

### AC-AUDIO-005
Per-channel RMS is available.

### AC-AUDIO-006
Selected channel can be changed in Engineering Mode.

### AC-AUDIO-007
Audio recording survives visualization slowdown.

### AC-AUDIO-008
Recording finalization produces a valid WAV.

---

# 126. DSP Acceptance Criteria

### AC-DSP-001
Every DSP module accepts arrays independently of live browser capture.

### AC-DSP-002
Processing is deterministic for identical input + configuration.

### AC-DSP-003
Downsampling uses anti-alias filtering.

### AC-DSP-004
FHR estimator exposes diagnostics.

### AC-DSP-005
Signal quality is independent from FHR.

### AC-DSP-006
Low confidence produces no displayed FHR.

### AC-DSP-007
Harmonic candidates are explicitly represented.

### AC-DSP-008
Algorithm version is stored with output.

---

# 127. UI Acceptance Criteria

### AC-UI-001
Main monitoring screen can be understood within seconds.

### AC-UI-002
FHR is the dominant numeric element when available.

### AC-UI-003
No advanced DSP controls appear in normal Monitor Mode.

### AC-UI-004
Every state has an empty/error/unsupported representation.

### AC-UI-005
Signal status is not represented by color alone.

### AC-UI-006
Large-text layout remains usable.

### AC-UI-007
Dark mode remains readable.

### AC-UI-008
Research Mode is clearly separated.

### AC-UI-009
Apple Design Skill guidance has been reviewed before screen sign-off.

---

# 128. Data Acceptance Criteria

### AC-DATA-001
Source recording is immutable after finalization.

### AC-DATA-002
Reprocessing creates new result data.

### AC-DATA-003
Deleting a processing run does not delete source audio.

### AC-DATA-004
Deleting a session requires confirmation.

### AC-DATA-005
Exported CSV/JSON uses documented schema.

### AC-DATA-006
Processing run records algorithm provenance.

---

# 129. Future Capabilities

Possible later work:

- WebAssembly DSP core;
- SharedArrayBuffer optimization;
- Bluetooth maternal-heart-rate reference;
- machine-learning artifact classifier;
- experimental fetal-movement classification;
- desktop research companion;
- EDF/EDF+ export;
- RF64 long-session recording;
- encrypted local database;
- optional end-to-end encrypted cloud backup;
- clinician/researcher export workflow;
- formal clinical-validation tooling.

These must not complicate the first reliable capture implementation.

---

# 130. Explicit Coding Rules

The implementation agent must obey:

1. Do not simulate real measurement in production mode.
2. Do not calculate FHR in UI components.
3. Do not perform file writing on the main thread.
4. Do not run heavy DSP in AudioWorklet.
5. Do not silently switch audio input.
6. Do not trust requested audio constraints without reading actual settings.
7. Do not call browser-delivered audio "raw RF ultrasound".
8. Do not alter source recordings during processing.
9. Do not interpolate across capture gaps.
10. Do not retain stale BPM indefinitely.
11. Do not label BPM as clinically normal/abnormal.
12. Do not infer fetal health.
13. Do not make cloud/network access mandatory.
14. Do not add analytics/telemetry without explicit approval.
15. Do not place Research/Engineering complexity on the main Monitor screen.
16. Drop visual frames before audio data.
17. Persist recording incrementally.
18. Preserve algorithm version and parameters.
19. Feature-detect browser APIs.
20. Keep the app functional offline after installation.

---

# 131. Master Coding-Agent Prompt

Copy the following into the coding agent after providing this SRS:

```text
You are implementing the Doppler PWA defined in the supplied SRS.

Treat the SRS as the source of truth.

Before implementing ANY user interface, install and read the Apple design
skill using:

claude install-skill /path/to/apple-design-skill

Replace the placeholder with the actual local skill path.

Do not begin by building the FHR dashboard.

The first objective is proving reliable REAL browser audio capture from a
USB audio-input interface connected to a fetal Doppler.

Use:
- TypeScript
- React
- Vite
- PWA
- AudioWorklet
- Web Workers
- OPFS
- IndexedDB

Keep the signal-processing core independent from React.

Development order:

M0:
PWA scaffold, design system, capability detection.

M1:
Real getUserMedia audio input selection, actual MediaStreamTrack settings,
AudioWorklet, real waveform, RMS, peak and clipping.

M2:
Incremental OPFS recording, crash recovery, WAV export and playback.

M3:
Session library and timeline.

M4:
DSP processing and signal-quality engine.

M5:
Experimental autocorrelation FHR estimator.

M6:
Multiple estimators, harmonic guard, confidence and stabilization.

M7:
Research Lab.

M8:
Calibration/device profiles.

M9:
Dataset and validation tooling.

M10:
Polish, offline robustness and accessibility.

At the end of every milestone:

1. run TypeScript checks;
2. run lint;
3. run unit tests;
4. build production bundle;
5. fix all errors;
6. manually test the milestone;
7. document what works and what remains;
8. commit only after the milestone is stable.

Important browser rules:

- getUserMedia constraints are not guaranteed.
- Always read track.getSettings().
- Never silently fall back to a different microphone.
- AudioWorklet must remain lightweight.
- Never block the capture path with visualization or DSP.
- Keep the application visible and use Screen Wake Lock during monitoring.
- Background/locked-screen capture is not guaranteed in a PWA.
- Mark any interruption in the session timeline.
- Store source audio incrementally and never modify it after finalization.

Medical/safety rules:

- This is an experimental prototype.
- Always use "Estimated FHR".
- Never output fetal health, normal/abnormal, distress, diagnosis or treatment.
- Signal quality refers only to captured audio quality.
- When confidence is inadequate, output no BPM.
- Never fabricate or interpolate measurement through signal loss.

Do not implement fake/simulated signal outside explicit Demo Mode.

Start with Milestone 0, then Milestone 1.
Do not skip ahead.
```

---

# 132. Standards and Platform References

Use current browser documentation during implementation and re-check compatibility before production release.

Core references:

- MediaDevices.getUserMedia  
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

- MediaDevices.enumerateDevices  
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices

- MediaStreamTrack.getSettings  
  https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings

- MediaTrackSettings  
  https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings

- AudioWorklet  
  https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet

- AudioWorkletProcessor  
  https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor

- Screen Wake Lock API  
  https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API

- Origin Private File System  
  https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system

- StorageManager.estimate  
  https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate

- StorageManager.persist  
  https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist

- Progressive Web Apps  
  https://web.dev/learn/pwa/

---

# 133. Final Product Principle

The architecture must always preserve this priority:

```text
1. CAPTURE THE REAL SIGNAL RELIABLY
2. PRESERVE THE SOURCE RECORDING
3. KNOW WHETHER THE SIGNAL IS TRUSTWORTHY
4. ANALYZE THE SIGNAL
5. ESTIMATE FHR
6. PRESENT THE RESULT
```

Never reverse this order.

A visually impressive BPM screen is worthless if the PWA cannot prove which audio input it captured, preserve the recording, detect interruptions, and identify low-confidence signal.

The source audio, capture metadata, processing configuration, and algorithm provenance together form the foundation of the entire system.
